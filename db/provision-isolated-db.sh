#!/usr/bin/env bash
#
# Provision an ISOLATED database + de-privileged login role on the shared
# `thymos-quiz-dev` Cloud SQL instance, then apply a schema file.
#
# Generalised from db/provision-waitlist.sh. Used for every "marketing-site
# form -> its own database" store (waitlist, provider referrals, ...).
#
#   NEW_DB=thymos_referrals NEW_USER=referrals_app SCHEMA_FILE=db/referrals-schema.sql \
#   QUIZ_APP_PASSWORD=... NEW_USER_PASSWORD=... \
#   bash db/provision-isolated-db.sh
#
# Prereqs:
#   - `gcloud auth login` (interactive; token must be fresh)
#   - ./cloud-sql-proxy at repo root
#   - psql on PATH
#   - QUIZ_APP_PASSWORD  — existing quiz_app password (a cloudsqlsuperuser,
#                          used only to run the bootstrap GRANTs)
#   - NEW_USER_PASSWORD  — password to set on the new role
#
# Idempotent: safe to re-run.

set -euo pipefail

PROJECT="thymos-health"
INSTANCE="thymos-quiz-dev"
REGION="us-west2"
CONN="${PROJECT}:${REGION}:${INSTANCE}"
PROXY_PORT="${PROXY_PORT:-5433}"

: "${NEW_DB:?set NEW_DB (e.g. thymos_referrals)}"
: "${NEW_USER:?set NEW_USER (e.g. referrals_app)}"
: "${SCHEMA_FILE:?set SCHEMA_FILE (e.g. db/referrals-schema.sql)}"
: "${NEW_USER_PASSWORD:?export NEW_USER_PASSWORD first}"
: "${QUIZ_APP_PASSWORD:?export QUIZ_APP_PASSWORD first}"

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

echo "==> 4/5  Bootstrap ownership + privileges"
# 4a — as quiz_app (a cloudsqlsuperuser member): hand $NEW_DB to $NEW_USER and
# strip the cloudsqlsuperuser group it was auto-granted, so it becomes a plain
# least-privilege role. Reassigning DB ownership requires the caller to be a
# member of the new owner, hence the transient GRANT.
PGPASSWORD="$QUIZ_APP_PASSWORD" psql \
  "host=127.0.0.1 port=$PROXY_PORT dbname=thymos_quiz user=quiz_app sslmode=disable" \
  -v ON_ERROR_STOP=1 -v nu="$NEW_USER" -v ndb="$NEW_DB" <<'SQL'
GRANT :"nu" TO quiz_app;
ALTER DATABASE :"ndb" OWNER TO :"nu";
REVOKE cloudsqlsuperuser FROM :"nu";
REVOKE :"nu" FROM quiz_app;
SQL
# 4b — as $NEW_USER (now DB owner => implicitly pg_database_owner): take
# explicit ownership of schema public and wall everyone else out.
PGPASSWORD="$NEW_USER_PASSWORD" psql \
  "host=127.0.0.1 port=$PROXY_PORT dbname=$NEW_DB user=$NEW_USER sslmode=disable" \
  -v ON_ERROR_STOP=1 -v nu="$NEW_USER" <<'SQL'
ALTER SCHEMA public OWNER TO :"nu";
REVOKE ALL ON SCHEMA public FROM cloudsqlsuperuser;
REVOKE ALL ON SCHEMA public FROM PUBLIC;
GRANT ALL ON SCHEMA public TO :"nu";
SQL
echo "    ownership set, $NEW_USER de-privileged, schema public locked down"

echo "==> 5/5  Apply $SCHEMA_FILE (as $NEW_USER)"
PGPASSWORD="$NEW_USER_PASSWORD" psql \
  "host=127.0.0.1 port=$PROXY_PORT dbname=$NEW_DB user=$NEW_USER sslmode=disable" \
  -v ON_ERROR_STOP=1 -f "$SCHEMA_FILE"
echo "    schema applied"

echo
echo "Done. Verify with:"
echo "  PGPASSWORD=\$NEW_USER_PASSWORD psql \"host=127.0.0.1 port=$PROXY_PORT dbname=$NEW_DB user=$NEW_USER sslmode=disable\" -c '\\dt'"
