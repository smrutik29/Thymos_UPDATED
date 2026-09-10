import { promises as dns } from "node:dns";

/**
 * Best-effort "can this address actually receive mail?" check for lead forms.
 *
 * True mailbox verification isn't possible without sending mail, so this only
 * does what can be done synchronously and reliably: confirm the domain part
 * exists and has *some* route for email (an MX record, or — per RFC 5321
 * §5.1 — an A/AAAA record that acts as an implicit MX). That catches the
 * common cases the client wants surfaced immediately: typos like
 * `name@gmial.comm` or `name@example.con`.
 *
 * It deliberately FAILS OPEN: if the lookup itself errors for any reason
 * other than "domain/records don't exist" (timeout, SERVFAIL, resolver
 * hiccup), the address is allowed through rather than blocking a real signup
 * on a flaky network.
 */

export type EmailDeliverability =
  | { ok: true }
  | { ok: false; reason: "malformed" | "no_mail_exchange" };

/** DNS error codes that mean "this domain has no such records", definitively. */
const NX_CODES = new Set(["ENOTFOUND", "ENODATA", "NXDOMAIN"]);

function domainOf(email: string): string | null {
  const at = email.lastIndexOf("@");
  if (at <= 0 || at === email.length - 1) return null;
  const domain = email.slice(at + 1).trim().toLowerCase().replace(/\.$/, "");
  // Must look like a real hostname with a TLD.
  if (!/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(domain)) return null;
  return domain;
}

function isNxError(err: unknown): boolean {
  const code = (err as NodeJS.ErrnoException | undefined)?.code;
  return code !== undefined && NX_CODES.has(code);
}

export async function checkEmailDeliverability(
  email: string
): Promise<EmailDeliverability> {
  const domain = domainOf(email);
  if (!domain) return { ok: false, reason: "malformed" };

  // 1. MX record — the normal case.
  try {
    const mx = await dns.resolveMx(domain);
    if (mx.length > 0) return { ok: true };
    // Empty array → fall through to the implicit-MX (A/AAAA) check.
  } catch (err) {
    if (!isNxError(err)) return { ok: true }; // resolver problem → fail open
    // NX here just means "no MX" — a domain can still take mail via its A record.
  }

  // 2. Implicit MX: any A or AAAA record for the domain itself.
  try {
    const addrs = await dns.resolve(domain); // A records
    if (addrs.length > 0) return { ok: true };
  } catch (err) {
    if (!isNxError(err)) return { ok: true }; // fail open
  }
  try {
    const addrs6 = await dns.resolve6(domain);
    if (addrs6.length > 0) return { ok: true };
  } catch (err) {
    if (!isNxError(err)) return { ok: true }; // fail open
  }

  // No MX, no A, no AAAA — nothing can deliver mail to this domain.
  return { ok: false, reason: "no_mail_exchange" };
}
