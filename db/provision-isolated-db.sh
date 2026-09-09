#!/usr/bin/env bash
#
# Provision an ISOLATED database + de-privileged login role on the shared
# Cloud SQL instance (default `thymos-db` — the live instance since the
# 2026-08-29 migration off the trial-flagged `thymos-quiz-dev`), then apply
# a schema file.
#
# Generalised from db/provision-waitlist.sh. Used for every "marketing-site
# form -> its own database" store (waitlist, provider referrals, ...).
#
#   NEW_DB=thymos_guide NEW_USER=guide_app SCHEMA_FILE=db/guide-schema.sql \
#   NEW_USER_PASSWORD=... \
#   bash db/provision-isolated-db.sh
#
# Override INSTANCE=... to target a different Cloud SQL instance.
#
# Prereqs:
#   - `gcloud auth login` (interactive; token must be fresh)
#   - ./cloud-sql-proxy at repo root
#   - psql on PATH
#   - NEW_USER_PASSWORD  — password to set on the new role (also goes into
#                          the <role>-db-password Secret Manager entry)
#
# Idempotent: safe to re-run.

set -euo pipefail

PROJECT="thymos-health"
INSTANCE="${INSTANCE:-thymos-db}"
REGION="${REGION:-us-west2}"
CONN="${PROJECT}:${REGION}:${INSTANCE}"
PROXY_PORT="${PROXY_PORT:-5433}"

: "${NEW_DB:?set NEW_DB (e.g. thymos_guide)}"
: "${NEW_USER:?set NEW_USER (e.g. guide_app)}"
: "${SCHEMA_FILE:?set SCHEMA_FILE (e.g. db/guide-schema.sql)}"
: "${NEW_USER_PASSWORD:?export NEW_USER_PASSWORD first}"

cd "$(dirname "$0")/.."
[ -f "$SCHEMA_FILE" ] || { echo "schema file not found: $SCHEMA_FILE" >&2; exit 1; }

echo "==> 1/5  Create database $NEW_DB (if absent)"
gcloud sql databases create "$NEW_DB" \
  --instance="$INSTANCE" --project="$PROJECT" 2>/dev/null \
  && echo "    created" || echo "    already exists"

echo "==> 2/5  Create user $NEW_USER / set its password"
if gcloud sql users list --instance="$INSTANCE" --project="$PROJECT" \
     --format="value(name)" | grep -qx "$NEW_USER"; then
  gcloud sql users set-password "$NEW_USER" \
    --instance="$INSTANCE" --project="$PROJECT" --password="$NEW_USER_PASSWORD"
  echo "    password reset on existing user"
else
  gcloud sql users create "$NEW_USER" \
    --instance="$INSTANCE" --project="$PROJECT" --password="$NEW_USER_PASSWORD"
  echo "    created"
fi

echo "==> 3/5  Start Auth Proxy on :$PROXY_PORT"
./cloud-sql-proxy --gcloud-auth --port "$PROXY_PORT" "$CONN" &
PROXY_PID=$!
trap 'kill $PROXY_PID 2>/dev/null || true' EXIT
for _ in $(seq 1 30); do
  (echo > "/dev/tcp/127.0.0.1/$PROXY_PORT") 2>/dev/null && break
  sleep 0.5
done
echo "    proxy up (pid $PROXY_PID)"

echo "==> 4/5  Bootstrap ownership + isolation (connect AS \$NEW_USER)"
# A freshly gcloud-created user is a member of cloudsqlsuperuser and has
# CREATEROLE/CREATEDB, so it can hand its own DB + schema to itself, wall
# everyone else out of schema public, then SET ROLE cloudsqlsuperuser (it's a
# member) to strip that group + CREATEROLE/CREATEDB off itself. No quiz_app /
# transient-GRANT dance needed. (Mirrors db/migrate-to-new-instance.sh step 4.)
PGPASSWORD="$NEW_USER_PASSWORD" psql \
  "host=127.0.0.1 port=$PROXY_PORT dbname=$NEW_DB user=$NEW_USER sslmode=disable" \
  -v ON_ERROR_STOP=1 -v r="$NEW_USER" -v d="$NEW_DB" <<'SQL'
ALTER DATABASE :"d" OWNER TO :"r";
ALTER SCHEMA public OWNER TO :"r";
REVOKE ALL ON SCHEMA public FROM PUBLIC;
REVOKE ALL ON SCHEMA public FROM cloudsqlsuperuser;
GRANT ALL ON SCHEMA public TO :"r";
SET ROLE cloudsqlsuperuser;
REVOKE cloudsqlsuperuser FROM :"r";
ALTER ROLE :"r" NOCREATEROLE NOCREATEDB;
RESET ROLE;
SQL
echo "    $NEW_DB owned by $NEW_USER, schema public locked down, $NEW_USER de-privileged"

echo "==> 5/5  Apply $SCHEMA_FILE (as $NEW_USER)"
PGPASSWORD="$NEW_USER_PASSWORD" psql \
  "host=127.0.0.1 port=$PROXY_PORT dbname=$NEW_DB user=$NEW_USER sslmode=disable" \
  -v ON_ERROR_STOP=1 -f "$SCHEMA_FILE"
echo "    schema applied"

echo
echo "Done. Verify with:"
echo "  PGPASSWORD=\$NEW_USER_PASSWORD psql \"host=127.0.0.1 port=$PROXY_PORT dbname=$NEW_DB user=$NEW_USER sslmode=disable\" -c '\\dt'"
