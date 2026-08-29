import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * A quiz submission's id is a v4 UUID returned to the browser on POST and
 * then used to PATCH the final_choice. On its own the id is weak authz
 * (possession == permission). This HMAC binds "you are allowed to update
 * this row" to a server secret: the POST response includes a token, and the
 * PATCH must present a matching one.
 *
 * If SUBMISSION_TOKEN_SECRET is unset the token is empty and the PATCH route
 * skips the check — same ship-before-config rollout model as Turnstile.
 */

function secret(): string | null {
  return process.env.SUBMISSION_TOKEN_SECRET || null;
}

export function signSubmissionId(id: string): string {
  const key = secret();
  if (!key) return "";
  return createHmac("sha256", key).update(id).digest("hex");
}

export function verifySubmissionToken(id: string, token: unknown): boolean {
  const key = secret();
  if (!key) return true; // check disabled until the secret is provisioned
  if (typeof token !== "string" || token.length !== 64) return false;
  const expected = createHmac("sha256", key).update(id).digest();
  let provided: Buffer;
  try {
    provided = Buffer.from(token, "hex");
  } catch {
    return false;
  }
  return provided.length === expected.length && timingSafeEqual(provided, expected);
}
