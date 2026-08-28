import { createHash } from "node:crypto";
import { getReferralsPool } from "./client";
import type { ReferralSubmission } from "@/lib/schemas/referral";

export interface ReferralMeta {
  ip?: string;
  userAgent?: string;
}

function hashIp(ip: string): string {
  return createHash("sha256").update(ip).digest("hex");
}

export async function saveReferralSubmission(
  data: ReferralSubmission,
  meta: ReferralMeta
): Promise<string> {
  const id = crypto.randomUUID();
  const pool = await getReferralsPool();

  await pool.query(
    `INSERT INTO referral_submissions (
       id,
       provider_name, practice_name, provider_phone, provider_fax, provider_email,
       patient_first_name, patient_last_name, patient_dob, patient_phone,
       patient_email, patient_language,
       address_line1, address_line2, address_city, address_state, address_zip,
       state_of_residence,
       source_page, raw_payload, ip_hash, user_agent
     ) VALUES (
       $1,
       $2, $3, $4, $5, $6,
       $7, $8, $9, $10,
       $11, $12,
       $13, $14, $15, $16, $17,
       $18,
       $19, $20, $21, $22
     )`,
    [
      id,
      data.providerName,
      data.practiceName,
      data.providerPhone,
      data.providerFax || null,
      data.providerEmail,
      data.patientFirstName,
      data.patientLastName,
      data.patientDob,
      data.patientPhone,
      data.patientEmail,
      data.patientLanguage ?? "",
      data.addressLine1,
      data.addressLine2 ?? "",
      data.addressCity,
      data.addressState,
      data.addressZip,
      data.stateOfResidence,
      data.sourcePage ?? null,
      JSON.stringify(data),
      meta.ip ? hashIp(meta.ip) : null,
      meta.userAgent ?? null,
    ]
  );

  return id;
}
