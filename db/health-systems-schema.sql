-- Thymos Health — "Request a Health System Analysis" submissions schema.
--
-- Lives in its OWN database (`thymos_health_systems`) on the shared
-- `thymos-quiz-dev` Cloud SQL instance, reached by a dedicated, de-privileged
-- `health_systems_app` user — isolated from the quiz, waitlist, and
-- referrals databases.
--
-- This is a B2B partnership lead form: business contact details only, no PHI.
--
-- Not executed automatically. Apply via psql through the Auth Proxy:
--   psql "host=127.0.0.1 port=5433 dbname=thymos_health_systems user=health_systems_app" -f db/health-systems-schema.sql
--
-- Safe to re-run: IF NOT EXISTS throughout.

CREATE TABLE IF NOT EXISTS health_system_requests (
    id                  UUID PRIMARY KEY,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- Form fields (names mirror the form's `name=` attributes)
    first_name          TEXT NOT NULL DEFAULT '',   -- optional on the form
    last_name           TEXT NOT NULL DEFAULT '',   -- optional on the form
    organization        TEXT NOT NULL,              -- required
    email               TEXT NOT NULL,              -- required
    phone               TEXT NOT NULL DEFAULT '',   -- optional on the form
    job_title           TEXT NOT NULL DEFAULT '',   -- optional on the form

    -- The exact disclaimer/consent wording shown beneath the form, stored per
    -- row so the CAN-SPAM notice the submitter agreed to stays on record even
    -- if the copy later changes.
    disclaimer_text     TEXT NOT NULL,

    -- Which page/title the form was submitted from. Informational.
    source_page         TEXT,

    -- Forward-compatible audit trail + anti-spam metadata
    raw_payload         JSONB NOT NULL,
    ip_hash             TEXT,
    user_agent          TEXT
);

CREATE INDEX IF NOT EXISTS idx_health_system_requests_created_at
    ON health_system_requests (created_at);

CREATE INDEX IF NOT EXISTS idx_health_system_requests_email_lower
    ON health_system_requests (lower(email));
