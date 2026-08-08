import { NextRequest, NextResponse } from "next/server";
import { QuizSubmissionSchema } from "@/lib/schemas/submission";
import { saveSubmission } from "@/lib/db/submissions";

// Logs shape/outcome only — never field values (name, email, dob, phone,
// symptom answers, etc.) — so quiz answers and PII never hit server logs.
function logOutcome(status: number, fieldNames: string[], detail?: string) {
  const entry = { status, fields: fieldNames, ...(detail ? { detail } : {}) };
  if (status >= 500) {
    console.error("[quiz-submissions] POST", entry);
  } else {
    console.log("[quiz-submissions] POST", entry);
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body) {
    logOutcome(400, [], "invalid_json");
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const fieldNames = Object.keys(body);

  // Honeypot — real users never fill this hidden field in.
  if (typeof body.companyWebsite === "string" && body.companyWebsite.trim() !== "") {
    logOutcome(200, fieldNames, "honeypot_discarded");
    return NextResponse.json({ ok: true, id: "discarded" }, { status: 200 });
  }

  const parsed = QuizSubmissionSchema.safeParse(body);
  if (!parsed.success) {
    logOutcome(400, fieldNames, "validation_failed");
    return NextResponse.json(
      { ok: false, errors: parsed.error.flatten() },
      { status: 400 }
    );
  }

  try {
    const id = await saveSubmission(parsed.data, {
      ip: req.headers.get("x-forwarded-for") ?? undefined,
      userAgent: req.headers.get("user-agent") ?? undefined,
    });
    logOutcome(201, fieldNames);
    return NextResponse.json({ ok: true, id }, { status: 201 });
  } catch (err) {
    // err.message only — never err.detail, which for constraint violations
    // can echo back the offending row's values.
    const message = err instanceof Error ? err.message : "unknown_error";
    logOutcome(500, fieldNames, message);
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
  }
}
