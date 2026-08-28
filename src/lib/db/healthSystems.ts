import { createHash } from "node:crypto";
import { getHealthSystemsPool } from "./client";
import {
  HEALTH_SYSTEM_DISCLAIMER_TEXT,
  type HealthSystemRequest,
} from "@/lib/schemas/healthSystem";

export interface HealthSystemMeta {
  ip?: string;
  userAgent?: string;
}

function hashIp(ip: string): string {
  return createHash("sha256").update(ip).digest("hex");
}

export async function saveHealthSystemRequest(
  data: HealthSystemRequest,
  meta: HealthSystemMeta
): Promise<string> {
  const id = crypto.randomUUID();
  const pool = await getHealthSystemsPool();

  await pool.query(
    `INSERT INTO health_system_requests (
       id, first_name, last_name, organization, email, phone, job_title,
       disclaimer_text, source_page, raw_payload, ip_hash, user_agent
     ) VALUES (
       $1, $2, $3, $4, $5, $6, $7,
       $8, $9, $10, $11, $12
     )`,
    [
      id,
      data.firstName ?? "",
      data.lastName ?? "",
      data.organization,
      data.email,
      data.phone || "",
      data.jobTitle ?? "",
      // Store the server's canonical wording, not the client's claim.
      HEALTH_SYSTEM_DISCLAIMER_TEXT,
      data.sourcePage ?? null,
      JSON.stringify(data),
      meta.ip ? hashIp(meta.ip) : null,
      meta.userAgent ?? null,
    ]
  );

  return id;
}
