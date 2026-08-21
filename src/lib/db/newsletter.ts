import { createHash } from "node:crypto";
import { getPool } from "./client";
import type { NewsletterSignup } from "@/lib/schemas/newsletter";

export interface NewsletterSignupMeta {
  ip?: string;
  userAgent?: string;
}

function hashIp(ip: string): string {
  return createHash("sha256").update(ip).digest("hex");
}

export async function saveNewsletterSignup(
  data: NewsletterSignup,
  meta: NewsletterSignupMeta
): Promise<string> {
  const id = crypto.randomUUID();
  const pool = await getPool();

  // ON CONFLICT DO NOTHING: re-submitting an already-subscribed address is a
  // silent no-op, not an error — the footer form always shows success either
  // way so it can't be used to enumerate which emails are already signed up.
  const result = await pool.query(
    `INSERT INTO newsletter_signups (id, email, source_page, ip_hash, user_agent)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (lower(email)) DO NOTHING
     RETURNING id`,
    [
      id,
      data.email,
      data.sourcePage ?? null,
      meta.ip ? hashIp(meta.ip) : null,
      meta.userAgent ?? null,
    ]
  );

  return result.rows[0]?.id ?? id;
}
