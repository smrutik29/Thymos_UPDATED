import { NextRequest, NextResponse } from "next/server";
import { FinalChoiceUpdateSchema, SubmissionIdSchema } from "@/lib/schemas/submission";
import { updateFinalChoice } from "@/lib/db/submissions";
import { verifySubmissionToken } from "@/lib/security/submissionToken";

// Logs shape/outcome only — finalChoice is one of a fixed enum, not PII, but
// still keeps the same no-value-leak discipline as the POST route's logging.
function logOutcome(status: number, detail?: string) {
  const entry = { status, ...(detail ? { detail } : {}) };
  if (status >= 500) {
    console.error("[quiz-submissions] PATCH", entry);
  } else {
    console.log("[quiz-submissions] PATCH", entry);
  }
}

export async function PATCH(
  req: NextRequest,
  ctx: RouteContext<"/api/quiz-submissions/[id]">
) {
  const { id } = await ctx.params;

  const idResult = SubmissionIdSchema.safeParse(id);
  if (!idResult.success) {
    logOutcome(400, "invalid_id");
    return NextResponse.json({ ok: false, error: "invalid_id" }, { status: 400 });
  }

  const body = await req.json().catch(() => null);
  if (!body) {
    logOutcome(400, "invalid_json");
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const parsed = FinalChoiceUpdateSchema.safeParse(body);
  if (!parsed.success) {
    logOutcome(400, "validation_failed");
    return NextResponse.json(
      { ok: false, errors: parsed.error.flatten() },
      { status: 400 }
    );
  }

  // The row id alone is not authorization — require the HMAC issued with it.
  const token =
    req.headers.get("x-submission-token") ??
    (typeof body.token === "string" ? body.token : undefined);
  if (!verifySubmissionToken(idResult.data, token)) {
    logOutcome(403, "bad_token");
    return NextResponse.json(
      { ok: false, error: "forbidden" },
      { status: 403 }
    );
  }

  try {
    const updated = await updateFinalChoice(idResult.data, parsed.data.finalChoice);
    if (!updated) {
      logOutcome(404);
      return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
    }
    logOutcome(200);
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown_error";
    logOutcome(500, message);
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
  }
}
