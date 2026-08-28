-- Thymos Health provider-referral submissions schema.
--
-- Lives in its OWN database (`thymos_referrals`) on the shared
-- `thymos-quiz-dev` Cloud SQL instance, reached by a dedicated, de-privileged
-- `referrals_app` user — isolated from the quiz and waitlist databases.
--
-- ⚠  This table holds PATIENT PHI (name, DOB, address, contact details,
--    referred for autoimmune care). Cloud SQL encrypts at rest by default and
--    all connections are TLS; the app never logs these fields. Formal HIPAA
--    coverage additionally requires a signed BAA with Google Cloud.
--
-- Not executed automatically. Apply via psql through the Auth Proxy:
--   psql "host=127.0.0.1 port=5433 dbname=thymos_referrals user=referrals_app" -f db/referrals-schema.sql
--
-- Safe to re-run: IF NOT EXISTS throughout.

CREATE TABLE IF NOT EXISTS referral_submissions (
    id                   UUID PRIMARY KEY,
    created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- Referring provider
    provider_name        TEXT NOT NULL,
    practice_name        TEXT NOT NULL,
    provider_phone       TEXT NOT NULL,
    provider_fax         TEXT,                       -- optional on the form
    provider_email       TEXT NOT NULL,

    -- Patient (PHI)
    patient_first_name   TEXT NOT NULL,
    patient_last_name    TEXT NOT NULL,
    patient_dob          DATE NOT NULL,
    patient_phone        TEXT NOT NULL,
    patient_email        TEXT NOT NULL,
    patient_language     TEXT NOT NULL DEFAULT '',   -- optional on the form

    -- Patient address (PHI). state / state_of_residence are stored as the
    -- form's combobox strings, e.g. "California (CA)".
    address_line1        TEXT NOT NULL,
    address_line2        TEXT NOT NULL DEFAULT '',
    address_city         TEXT NOT NULL,
    address_state        TEXT NOT NULL,
    address_zip          TEXT NOT NULL,
    state_of_residence   TEXT NOT NULL,

    -- Which page the form was submitted from (document.title). Informational.
    source_page          TEXT,

    -- Forward-compatible audit trail + anti-spam metadata
    raw_payload          JSONB NOT NULL,
    ip_hash              TEXT,
    user_agent           TEXT
);

CREATE INDEX IF NOT EXISTS idx_referral_submissions_created_at
    ON referral_submissions (created_at);

-- Case-insensitive lookup by the patient's email / the provider's email.
CREATE INDEX IF NOT EXISTS idx_referral_submissions_patient_email_lower
    ON referral_submissions (lower(patient_email));
CREATE INDEX IF NOT EXISTS idx_referral_submissions_provider_email_lower
    ON referral_submissions (lower(provider_email));
