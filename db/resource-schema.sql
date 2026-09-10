-- Thymos Health — Resources page "Get instant access" lead-capture schema.
--
-- Lives in its OWN database (`thymos_resources`) on the shared `thymos-db`
-- Cloud SQL instance, reached by a dedicated, de-privileged `resource_app`
-- user — isolated from the quiz, waitlist, referrals, health-systems, and
-- guide databases.
--
-- One form (public/resources.html → the shared #access-form modal) serves
-- both Featured Resources; `resource` records which document was requested:
--   'guide'      → The Root-Cause Autoimmune Care Guide
--   'whitepaper' → The Autoimmune and Inflammatory Disease Whitepaper
-- Contact details only, no PHI.
--
-- Not executed automatically. Apply via psql through the Auth Proxy:
--   psql "host=127.0.0.1 port=5433 dbname=thymos_resources user=resource_app" -f db/resource-schema.sql
-- (db/provision-isolated-db.sh runs this as its last step — invoke it as:
--    NEW_DB=thymos_resources NEW_USER=resource_app \
--    SCHEMA_FILE=db/resource-schema.sql NEW_USER_PASSWORD=... \
--    bash db/provision-isolated-db.sh)
--
-- Safe to re-run: IF NOT EXISTS throughout.

CREATE TABLE IF NOT EXISTS resource_requests (
    id                      UUID PRIMARY KEY,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- Form fields (names mirror the modal form's `name=` attributes)
    first_name              TEXT NOT NULL,
    last_name               TEXT NOT NULL,
    email                   TEXT NOT NULL,
    state                   TEXT NOT NULL,
    reason                  TEXT NOT NULL,

    -- Which document the visitor asked for: 'guide' or 'whitepaper'.
    resource                TEXT NOT NULL,

    -- Marketing opt-in checkbox (defaults checked, visitor may clear it) +
    -- the exact wording shown next to it, stored per row so the opt-in the
    -- submitter agreed to stays on record even if the copy later changes.
    marketing_opt_in        BOOLEAN NOT NULL,
    marketing_opt_in_text   TEXT NOT NULL,

    -- Which page/title the form was submitted from. Informational.
    source_page             TEXT,

    -- Forward-compatible audit trail + anti-spam metadata
    raw_payload             JSONB NOT NULL,
    ip_hash                 TEXT,
    user_agent              TEXT
);

CREATE INDEX IF NOT EXISTS idx_resource_requests_created_at
    ON resource_requests (created_at);

CREATE INDEX IF NOT EXISTS idx_resource_requests_email_lower
    ON resource_requests (lower(email));

CREATE INDEX IF NOT EXISTS idx_resource_requests_resource
    ON resource_requests (resource);
