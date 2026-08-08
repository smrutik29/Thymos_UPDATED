import { createHash } from "node:crypto";
import { getPool } from "./client";
import type { QuizSubmission } from "@/lib/schemas/submission";
import type { FinalChoice } from "@/lib/quiz/types";

export interface SubmissionMeta {
  ip?: string;
  userAgent?: string;
}

function hashIp(ip: string): string {
  // One-way hash so we can dedupe/rate-limit later without storing raw IPs.
  return createHash("sha256").update(ip).digest("hex");
}

export async function saveSubmission(
  data: QuizSubmission,
  meta: SubmissionMeta
): Promise<string> {
  const id = crypto.randomUUID();
  const pool = await getPool();

  await pool.query(
    `INSERT INTO quiz_submissions (
       id, name, dob, state, email, phone,
       q1_status, q1_rows, q2_rows, symptoms, other_symptom_text,
       q4_choice, q4_other, q5_choice, final_choice,
       raw_payload, ip_hash, user_agent
     ) VALUES (
       $1, $2, $3, $4, $5, $6,
       $7, $8, $9, $10, $11,
       $12, $13, $14, $15,
       $16, $17, $18
     )`,
    [
      id,
      data.contact.name,
      data.contact.dob || null,
      data.contact.state || null,
      data.contact.email,
      data.contact.phone || null,
      data.q1status,
      JSON.stringify(data.q1rows),
      JSON.stringify(data.q2rows),
      JSON.stringify(data.symptoms),
      data.otherSymptomText,
      data.q4choice,
      data.q4other,
      data.q5choice,
      data.finalChoice,
      JSON.stringify(data),
      meta.ip ? hashIp(meta.ip) : null,
      meta.userAgent ?? null,
    ]
  );

  return id;
}

export async function updateFinalChoice(
  id: string,
  finalChoice: FinalChoice
): Promise<boolean> {
  const pool = await getPool();
  const result = await pool.query(
    `UPDATE quiz_submissions
     SET final_choice = $1, updated_at = now()
     WHERE id = $2`,
    [finalChoice, id]
  );
  return (result.rowCount ?? 0) > 0;
}
