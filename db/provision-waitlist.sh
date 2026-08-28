#!/usr/bin/env bash
#
# One-time provisioning for the native waitlist form's backing store.
#
# Creates an ISOLATED database (`thymos_waitlist`) and a dedicated,
# de-privileged user (`waitlist_app`) on the existing `thymos-quiz-dev`
# Cloud SQL instance, then applies db/waitlist-schema.sql.
#
# Prereqs:
#   - `gcloud auth login`  (interactive; token must be fresh)
#   - the Cloud SQL Auth Proxy binary at repo root (./cloud-sql-proxy)
#   - psql on PATH
#   - the `quiz_app` password exported as QUIZ_APP_PASSWORD (used only to
#     run the bootstrap GRANTs as an existing cloudsqlsuperuser)
#   - the new password exported as WAITLIST_APP_PASSWORD
#
# Safe to re-run: every step is idempotent.

set -euo pipefail

PROJECT="thymos-health"
INSTANCE="thymos-quiz-dev"
REGION="us-west2"
CONN="${PROJECT}:${REGION}:${INSTANCE}"
PROXY_PORT="${PROXY_PORT:-5433}"

: "${WAITLIST_APP_PASSWORD:?export WAITLIST_APP_PASSWORD first}"
: "${QUIZ_APP_PASSWORD:?export QUIZ_APP_PASSWORD first}"

cd "$(dirname "$0")/.."

echo "==> 1/5  Create database thymos_waitlist (if absent)"
gcloud sql databases create thymos_waitlist \
  --instance="$INSTANCE" --project="$PROJECT" 2>/dev/null \
  && echo "    created" || echo "    already exists"

echo "==> 2/5  Create user waitlist_app / set its password"
if gcloud sql users list --instance="$INSTANCE" --project="$PROJECT" \
     --format="value(name)" | grep -qx waitlist_app; then
  gcloud sql users set-password waitlist_app \
    --instance="$INSTANCE" --project="$PROJECT" \
    --password="$WAITLIST_APP_PASSWORD"
  echo "    password reset on existing user"
else
  gcloud sql users create waitlist_app \
    --instance="$INSTANCE" --project="$PROJECT" \
    --password="$WAITLIST_APP_PASSWORD"
  echo "    created"
fi

echo "==> 3/5  Start Auth Proxy on :$PROXY_PORT"
./cloud-sql-proxy --gcloud-auth --port "$PROXY_PORT" "$CONN" &
PROXY_PID=$!
trap 'kill $PROXY_PID 2>/dev/null || true' EXIT
for i in $(seq 1 30); do
  (echo > "/dev/tcp/127.0.0.1/$PROXY_PORT") 2>/dev/null && break
  sleep 0.5
done
echo "    proxy up (pid $PROXY_PID)"

echo "==> 4/5  Bootstrap ownership + privileges"
# Step 4a — as quiz_app (a cloudsqlsuperuser member): hand thymos_waitlist to
# waitlist_app and strip the cloudsqlsuperuser group it was auto-granted, so
# it becomes a plain least-privilege role. Reassigning DB ownership requires
# the caller to be a member of the new owner, hence the transient GRANT.
PGPASSWORD="$QUIZ_APP_PASSWORD" psql \
  "host=127.0.0.1 port=$PROXY_PORT dbname=thymos_quiz user=quiz_app sslmode=disable" \
  -v ON_ERROR_STOP=1 <<'SQL'
GRANT waitlist_app TO quiz_app;
ALTER DATABASE thymos_waitlist OWNER TO waitlist_app;
REVOKE cloudsqlsuperuser FROM waitlist_app;
REVOKE waitlist_app FROM quiz_app;
SQL
# Step 4b — as waitlist_app (now the DB owner => implicitly pg_database_owner):
# take explicit ownership of schema public and wall everyone else out, so the
# quiz's quiz_app can't even see the waitlist tables.
PGPASSWORD="$WAITLIST_APP_PASSWORD" psql \
  "host=127.0.0.1 port=$PROXY_PORT dbname=thymos_waitlist user=waitlist_app sslmode=disable" \
  -v ON_ERROR_STOP=1 <<'SQL'
ALTER SCHEMA public OWNER TO waitlist_app;
REVOKE ALL ON SCHEMA public FROM cloudsqlsuperuser;
REVOKE ALL ON SCHEMA public FROM PUBLIC;
GRANT ALL ON SCHEMA public TO waitlist_app;
SQL
echo "    ownership set, waitlist_app de-privileged, schema public locked down"

echo "==> 5/5  Apply db/waitlist-schema.sql (as waitlist_app)"
PGPASSWORD="$WAITLIST_APP_PASSWORD" psql \
  "host=127.0.0.1 port=$PROXY_PORT dbname=thymos_waitlist user=waitlist_app sslmode=disable" \
  -v ON_ERROR_STOP=1 -f db/waitlist-schema.sql
echo "    schema applied"

echo
echo "Done. Verify with:"
echo "  PGPASSWORD=\$WAITLIST_APP_PASSWORD psql \"host=127.0.0.1 port=$PROXY_PORT dbname=thymos_waitlist user=waitlist_app sslmode=disable\" -c '\\d waitlist_submissions'"
