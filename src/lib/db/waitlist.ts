import { createHash } from "node:crypto";
import { getWaitlistPool } from "./client";
import { CONSENT_TEXT, type WaitlistSubmission } from "@/lib/schemas/waitlist";

export interface WaitlistMeta {
  ip?: string;
  userAgent?: string;
}

function hashIp(ip: string): string {
  // One-way hash so we can dedupe/rate-limit later without storing raw IPs.
  return createHash("sha256").update(ip).digest("hex");
}

export async function saveWaitlistSubmission(
  data: WaitlistSubmission,
  meta: WaitlistMeta
): Promise<string> {
  const id = crypto.randomUUID();
  const pool = await getWaitlistPool();

  await pool.query(
    `INSERT INTO waitlist_submissions (
       id, first_name, last_name, email, state, referral_source, questions,
       phone, consent, consent_text, source_page,
       raw_payload, ip_hash, user_agent
     ) VALUES (
       $1, $2, $3, $4, $5, $6, $7,
       $8, $9, $10, $11,
       $12, $13, $14
     )`,
    [
      id,
      data.firstName,
      data.lastName,
      data.email,
      data.state,
      data.referralSource,
      data.questions ?? "",
      data.phone || null,
      true,
      // Store the server's canonical wording, not the client's claim.
      CONSENT_TEXT,
      data.sourcePage ?? null,
      JSON.stringify(data),
      meta.ip ? hashIp(meta.ip) : null,
      meta.userAgent ?? null,
    ]
  );

  return id;
}
