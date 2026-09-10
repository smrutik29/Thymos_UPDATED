import { createHash } from "node:crypto";
import { getResourcePool } from "./client";
import {
  RESOURCE_MARKETING_OPT_IN_TEXT,
  type ResourceRequest,
} from "@/lib/schemas/resource";

export interface ResourceRequestMeta {
  ip?: string;
  userAgent?: string;
}

function hashIp(ip: string): string {
  // One-way hash so we can dedupe/rate-limit later without storing raw IPs.
  return createHash("sha256").update(ip).digest("hex");
}

export async function saveResourceRequest(
  data: ResourceRequest,
  meta: ResourceRequestMeta
): Promise<string> {
  const id = crypto.randomUUID();
  const pool = await getResourcePool();

  await pool.query(
    `INSERT INTO resource_requests (
       id, first_name, last_name, email, state, reason,
       resource, marketing_opt_in, marketing_opt_in_text, source_page,
       raw_payload, ip_hash, user_agent
     ) VALUES (
       $1, $2, $3, $4, $5, $6,
       $7, $8, $9, $10,
       $11, $12, $13
     )`,
    [
      id,
      data.firstName,
      data.lastName,
      data.email,
      data.state,
      data.reason,
      data.resource,
      data.marketingOptIn,
      // Store the server's canonical wording, not the client's claim.
      RESOURCE_MARKETING_OPT_IN_TEXT,
      data.sourcePage ?? null,
      JSON.stringify(data),
      meta.ip ? hashIp(meta.ip) : null,
      meta.userAgent ?? null,
    ]
  );

  return id;
}
