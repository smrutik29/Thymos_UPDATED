import { createHash } from "node:crypto";
import { getGuidePool } from "./client";
import { GUIDE_CONSENT_TEXT, type GuideRequest } from "@/lib/schemas/guide";

export interface GuideRequestMeta {
  ip?: string;
  userAgent?: string;
}

function hashIp(ip: string): string {
  // One-way hash so we can dedupe/rate-limit later without storing raw IPs.
  return createHash("sha256").update(ip).digest("hex");
}

export async function saveGuideRequest(
  data: GuideRequest,
  meta: GuideRequestMeta
): Promise<string> {
  const id = crypto.randomUUID();
  const pool = await getGuidePool();

  await pool.query(
    `INSERT INTO guide_requests (
       id, first_name, last_name, email, phone, state,
       consent, consent_text, source_page,
       raw_payload, ip_hash, user_agent
     ) VALUES (
       $1, $2, $3, $4, $5, $6,
       $7, $8, $9,
       $10, $11, $12
     )`,
    [
      id,
      data.firstName,
      data.lastName,
      data.email,
      data.phone,
      data.state,
      true,
      // Store the server's canonical wording, not the client's claim.
      GUIDE_CONSENT_TEXT,
      data.sourcePage ?? null,
      JSON.stringify(data),
      meta.ip ? hashIp(meta.ip) : null,
      meta.userAgent ?? null,
    ]
  );

  return id;
}
