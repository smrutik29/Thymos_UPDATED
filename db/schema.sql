-- Thymos Health quiz submissions schema.
--
-- Not executed automatically by the application — run manually against the
-- `thymos_quiz` database, e.g. via psql through the Cloud SQL Auth Proxy:
--
--   psql "host=127.0.0.1 port=5433 dbname=thymos_quiz user=quiz_app" -f db/schema.sql
--
-- Safe to re-run: uses IF NOT EXISTS throughout.

CREATE TABLE IF NOT EXISTS quiz_submissions (
    id                  UUID PRIMARY KEY,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- Contact info (collected on the contact screen)
    name                TEXT NOT NULL,
    dob                 DATE,
    state               TEXT,
    email               TEXT NOT NULL,
    phone               TEXT,

    -- Quiz answers
    q1_status           TEXT CHECK (q1_status IN ('diagnosed', 'none')),
    q1_rows             JSONB NOT NULL DEFAULT '[]',
    q2_rows             JSONB NOT NULL DEFAULT '[]',
    symptoms            JSONB NOT NULL DEFAULT '{}',
    other_symptom_text  TEXT NOT NULL DEFAULT '',
    q4_choice           TEXT,
    q4_other            TEXT NOT NULL DEFAULT '',
    q5_choice           TEXT CHECK (q5_choice IN ('Yes', 'Maybe', 'No')),

    -- Set later via PATCH /api/quiz-submissions/:id once the user picks a
    -- next step on the Final screen.
    final_choice        TEXT CHECK (final_choice IN ('yes', 'waitlist', 'no')),

    -- Forward-compatible audit trail + anti-spam metadata
    raw_payload         JSONB NOT NULL,
    ip_hash             TEXT,
    user_agent          TEXT
);

CREATE INDEX IF NOT EXISTS idx_quiz_submissions_created_at ON quiz_submissions (created_at);
CREATE INDEX IF NOT EXISTS idx_quiz_submissions_email ON quiz_submissions (email);
