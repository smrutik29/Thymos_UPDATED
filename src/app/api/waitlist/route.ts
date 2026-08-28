import { NextRequest, NextResponse } from "next/server";
import { WaitlistSubmissionSchema } from "@/lib/schemas/waitlist";
import { saveWaitlistSubmission } from "@/lib/db/waitlist";

// Logs shape/outcome only — never name or email — so submitted contact
// details never hit server logs.
function logOutcome(status: number, detail?: string) {
  const entry = { status, ...(detail ? { detail } : {}) };
  if (status >= 500) {
    console.error("[waitlist] POST", entry);
  } else {
    console.log("[waitlist] POST", entry);
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

  const parsed = WaitlistSubmissionSchema.safeParse(body);
  if (!parsed.success) {
    logOutcome(400, "validation_failed");
    return NextResponse.json(
      { ok: false, errors: parsed.error.flatten() },
      { status: 400 }
    );
  }

  try {
    await saveWaitlistSubmission(parsed.data, {
      ip: req.headers.get("x-forwarded-for") ?? undefined,
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
