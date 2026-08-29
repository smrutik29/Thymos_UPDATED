import { NextRequest, NextResponse } from "next/server";
import { ReferralSubmissionSchema } from "@/lib/schemas/referral";
import { saveReferralSubmission } from "@/lib/db/referrals";
import { verifyTurnstile } from "@/lib/security/turnstile";

// Logs shape/outcome ONLY. This form carries patient PHI — no field values,
// and not even which validation keys failed, ever reach the logs.
function logOutcome(status: number, detail?: string) {
  const entry = { status, ...(detail ? { detail } : {}) };
  if (status >= 500) {
    console.error("[referrals] POST", entry);
  } else {
    console.log("[referrals] POST", entry);
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

  // Honeypot — respond 200 so a bot can't tell it was caught.
  if (
    typeof body.companyWebsite === "string" &&
    body.companyWebsite.trim() !== ""
  ) {
    logOutcome(200, "honeypot_discarded");
    return NextResponse.json({ ok: true }, { status: 200 });
  }

  const ip = req.headers.get("x-forwarded-for") ?? undefined;

  const captcha = await verifyTurnstile(body.turnstileToken, ip);
  if (!captcha.ok) {
    logOutcome(403, `captcha_${captcha.reason}`);
    return NextResponse.json(
      { ok: false, error: "captcha_failed" },
      { status: 403 }
    );
  }

  const parsed = ReferralSubmissionSchema.safeParse(body);
  if (!parsed.success) {
    logOutcome(400, "validation_failed");
    return NextResponse.json({ ok: false, error: "validation_failed" }, {
      status: 400,
    });
  }

  try {
    await saveReferralSubmission(parsed.data, {
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
