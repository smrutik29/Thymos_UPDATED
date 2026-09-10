import { NextRequest, NextResponse } from "next/server";
import { ResourceRequestSchema } from "@/lib/schemas/resource";
import { saveResourceRequest } from "@/lib/db/resource";
import { checkEmailDeliverability } from "@/lib/security/emailDeliverability";
import { verifyTurnstile } from "@/lib/security/turnstile";

// Logs shape/outcome only — never name, email, or state — so submitted
// contact details never hit server logs.
function logOutcome(status: number, detail?: string) {
  const entry = { status, ...(detail ? { detail } : {}) };
  if (status >= 500) {
    console.error("[resource-request] POST", entry);
  } else {
    console.log("[resource-request] POST", entry);
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body) {
    logOutcome(400, "invalid_json");
    return NextResponse.json(
      { ok: false, error: "invalid_json" },
      { status: 400 }
    );
  }

  // Honeypot — real visitors never fill this hidden field in. Respond 200 so
  // a bot can't tell it was caught.
  if (
    typeof body.companyWebsite === "string" &&
    body.companyWebsite.trim() !== ""
  ) {
    logOutcome(200, "honeypot_discarded");
    return NextResponse.json({ ok: true }, { status: 200 });
  }

  const ip = req.headers.get("x-forwarded-for") ?? undefined;

  // Verify only when the form actually sent a token — the resource modal has
  // no Turnstile widget yet, and honeypot + the MX check still apply.
  if (typeof body.turnstileToken === "string" && body.turnstileToken !== "") {
    const captcha = await verifyTurnstile(body.turnstileToken, ip);
    if (!captcha.ok) {
      logOutcome(403, `captcha_${captcha.reason}`);
      return NextResponse.json(
        { ok: false, error: "captcha_failed" },
        { status: 403 }
      );
    }
  }

  const parsed = ResourceRequestSchema.safeParse(body);
  if (!parsed.success) {
    logOutcome(400, "validation_failed");
    return NextResponse.json(
      { ok: false, errors: parsed.error.flatten() },
      { status: 400 }
    );
  }

  // "Immediate error" path the Resources page asks for: reject synchronously
  // if the email is malformed or its domain has no way to receive mail, so
  // the client can flag the field and reopen the form. Genuine bounces to
  // real domains still can't be caught here — no mail is actually sent.
  const deliverability = await checkEmailDeliverability(parsed.data.email);
  if (!deliverability.ok) {
    logOutcome(422, `email_${deliverability.reason}`);
    return NextResponse.json(
      { ok: false, error: "email_undeliverable" },
      { status: 422 }
    );
  }

  try {
    await saveResourceRequest(parsed.data, {
      ip,
      userAgent: req.headers.get("user-agent") ?? undefined,
    });
    logOutcome(201);
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown_error";
    logOutcome(500, message);
    return NextResponse.json(
      { ok: false, error: "server_error" },
      { status: 500 }
    );
  }
}
