import { NextRequest, NextResponse } from "next/server";
import { NewsletterSignupSchema } from "@/lib/schemas/newsletter";
import { saveNewsletterSignup } from "@/lib/db/newsletter";
import { verifyTurnstile } from "@/lib/security/turnstile";

// Logs shape/outcome only — never the email address itself — so submitted
// addresses never hit server logs.
function logOutcome(status: number, detail?: string) {
  const entry = { status, ...(detail ? { detail } : {}) };
  if (status >= 500) {
    console.error("[newsletter-signup] POST", entry);
  } else {
    console.log("[newsletter-signup] POST", entry);
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body) {
    logOutcome(400, "invalid_json");
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  // Honeypot — real visitors never fill this hidden field in.
  if (typeof body.companyWebsite === "string" && body.companyWebsite.trim() !== "") {
    logOutcome(200, "honeypot_discarded");
    return NextResponse.json({ ok: true }, { status: 200 });
  }

  // Verify only when the footer form actually sent a token — the newsletter
  // widget isn't on every page yet, and honeypot + rate-limit still apply.
  if (typeof body.turnstileToken === "string" && body.turnstileToken !== "") {
    const captcha = await verifyTurnstile(
      body.turnstileToken,
      req.headers.get("x-forwarded-for") ?? undefined
    );
    if (!captcha.ok) {
      logOutcome(403, `captcha_${captcha.reason}`);
      return NextResponse.json(
        { ok: false, error: "captcha_failed" },
        { status: 403 }
      );
    }
  }

  const parsed = NewsletterSignupSchema.safeParse(body);
  if (!parsed.success) {
    logOutcome(400, "validation_failed");
    return NextResponse.json(
      { ok: false, errors: parsed.error.flatten() },
      { status: 400 }
    );
  }

  try {
    await saveNewsletterSignup(parsed.data, {
      ip: req.headers.get("x-forwarded-for") ?? undefined,
      userAgent: req.headers.get("user-agent") ?? undefined,
    });
    logOutcome(201);
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown_error";
    logOutcome(500, message);
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
  }
}
