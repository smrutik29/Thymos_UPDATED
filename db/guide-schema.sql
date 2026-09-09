-- Thymos Health — "Send Me the Guide" lead-capture submissions schema.
--
-- Lives in its OWN database (`thymos_guide`) on the shared `thymos-db`
-- Cloud SQL instance, reached by a dedicated, de-privileged `guide_app`
-- user — isolated from the quiz, waitlist, referrals, and health-systems
-- databases.
--
-- Consumer lead form for "The Root-Cause Autoimmune Care Guide"
-- (public/autoimmune-guide.html). Contact details only, no PHI.
--
-- Not executed automatically. Apply via psql through the Auth Proxy:
--   psql "host=127.0.0.1 port=5433 dbname=thymos_guide user=guide_app" -f db/guide-schema.sql
-- (db/provision-isolated-db.sh runs this as its last step.)
--
-- Safe to re-run: IF NOT EXISTS throughout.

CREATE TABLE IF NOT EXISTS guide_requests (
    id                  UUID PRIMARY KEY,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- Form fields (names mirror the modal form's `name=` attributes)
    first_name          TEXT NOT NULL,
    last_name           TEXT NOT NULL,
    email               TEXT NOT NULL,
    phone               TEXT NOT NULL,
    state               TEXT NOT NULL,

    -- Consent checkbox (required true) + the exact wording shown next to it,
    -- stored per row so the opt-in the submitter agreed to stays on record
    -- even if the copy later changes.
    consent             BOOLEAN NOT NULL,
    consent_text        TEXT NOT NULL,

    -- Which page/title the form was submitted from. Informational.
    source_page         TEXT,

    -- Forward-compatible audit trail + anti-spam metadata
    raw_payload         JSONB NOT NULL,
    ip_hash             TEXT,
    user_agent          TEXT
);

CREATE INDEX IF NOT EXISTS idx_guide_requests_created_at
    ON guide_requests (created_at);

CREATE INDEX IF NOT EXISTS idx_guide_requests_email_lower
    ON guide_requests (lower(email));
