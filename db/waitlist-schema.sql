-- Thymos Health waitlist submissions schema.
--
-- Lives in its OWN database (`thymos_waitlist`) on the shared
-- `thymos-quiz-dev` Cloud SQL instance, connected to by a dedicated
-- `waitlist_app` user — deliberately isolated from the quiz's
-- `thymos_quiz` database so waitlist PII and quiz data never share a
-- connection or a credential.
--
-- Not executed automatically by the application — run manually against the
-- `thymos_waitlist` database, e.g. via psql through the Cloud SQL Auth Proxy:
--
--   psql "host=127.0.0.1 port=5433 dbname=thymos_waitlist user=waitlist_app" -f db/waitlist-schema.sql
--
-- Safe to re-run: uses IF NOT EXISTS throughout.

CREATE TABLE IF NOT EXISTS waitlist_submissions (
    id                  UUID PRIMARY KEY,
    -- "Submission Date" in the old JotForm export. Defaults to insert time.
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- Contact fields (mirror the JotForm "Join Our Waitlist" form)
    first_name          TEXT NOT NULL,          -- JotForm "Name"
    last_name           TEXT NOT NULL,          -- JotForm "Last Name"
    email               TEXT NOT NULL,          -- JotForm "E-mail"
    state               TEXT NOT NULL,          -- JotForm "State of Residence"
    referral_source     TEXT NOT NULL,          -- JotForm "Where did you hear about us?"
    questions           TEXT NOT NULL DEFAULT '', -- JotForm "Any specific questions for us?"

    -- Not collected today, but the column exists so adding a phone input
    -- later is a no-op migration. Nullable on purpose.
    phone               TEXT,

    -- CAN-SPAM consent record. `consent` must be TRUE for every row the app
    -- writes (the checkbox is required); `consent_text` stores the exact
    -- wording the user agreed to, and `consent_at` when they did, so the
    -- opt-in is auditable years later even if the form copy changes.
    consent             BOOLEAN NOT NULL,
    consent_text        TEXT NOT NULL,
    consent_at          TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- Which marketing page the modal was opened from (document.title),
    -- e.g. "Thymos Health — ...". Informational only.
    source_page         TEXT,

    -- Forward-compatible audit trail + anti-spam metadata
    raw_payload         JSONB NOT NULL,
    ip_hash             TEXT,
    user_agent          TEXT
);

CREATE INDEX IF NOT EXISTS idx_waitlist_submissions_created_at
    ON waitlist_submissions (created_at);

-- Case-insensitive lookup by email (not unique — someone may legitimately
-- re-join, and we want every attempt on record).
CREATE INDEX IF NOT EXISTS idx_waitlist_submissions_email_lower
    ON waitlist_submissions (lower(email));
