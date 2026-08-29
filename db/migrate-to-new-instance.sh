#!/usr/bin/env bash
#
# One-time migration off the (permanently trial-flagged) `thymos-quiz-dev`
# Cloud SQL instance onto a fresh non-trial instance.
#
# PREREQ: the new instance already exists (see the `gcloud sql instances
# create thymos-db ...` command in DEPLOY.md / chat). This script does the
# rest: users, databases, isolation bootstrap, schema, and the (tiny) data copy.
#
#   QUIZ_APP_PASSWORD=... APP_PASSWORD=... bash db/migrate-to-new-instance.sh
#
#   QUIZ_APP_PASSWORD  password currently in use for quiz_app on the OLD
#                      instance (needed to read the 5 rows to copy).
#   APP_PASSWORD       password to set for ALL FOUR app roles on the NEW
#                      instance (keep it the same as today unless you're
#                      rotating — the isolation is at the role level).
#
# Idempotent-ish: safe to re-run; gcloud "already exists" is tolerated and
# the data copy is INSERT ... ON CONFLICT DO NOTHING.

set -euo pipefail

PROJECT="thymos-health"
REGION="us-west2"
OLD_INSTANCE="thymos-quiz-dev"
NEW_INSTANCE="thymos-db"
OLD_PORT=5433
NEW_PORT=5434

: "${QUIZ_APP_PASSWORD:?export QUIZ_APP_PASSWORD (old instance quiz_app pw)}"
: "${APP_PASSWORD:?export APP_PASSWORD (new instance pw for all *_app roles)}"

cd "$(dirname "$0")/.."

# db name : role : schema file
MAP=(
  "thymos_quiz:quiz_app:db/schema.sql"
  "thymos_waitlist:waitlist_app:db/waitlist-schema.sql"
  "thymos_referrals:referrals_app:db/referrals-schema.sql"
  "thymos_health_systems:health_systems_app:db/health-systems-schema.sql"
)
# db name : role : table (for the data copy)
TABLES=(
  "thymos_quiz:quiz_app:quiz_submissions"
  "thymos_waitlist:waitlist_app:waitlist_submissions"
  "thymos_referrals:referrals_app:referral_submissions"
  "thymos_health_systems:health_systems_app:health_system_requests"
)

echo "==> 1/6  Create the four app users on $NEW_INSTANCE"
for entry in "${MAP[@]}"; do
  role="${entry#*:}"; role="${role%%:*}"
  if gcloud sql users list --instance="$NEW_INSTANCE" --project="$PROJECT" \
       --format="value(name)" | grep -qx "$role"; then
    gcloud sql users set-password "$role" --instance="$NEW_INSTANCE" \
      --project="$PROJECT" --password="$APP_PASSWORD"
    echo "    $role: password set"
  else
    gcloud sql users create "$role" --instance="$NEW_INSTANCE" \
      --project="$PROJECT" --password="$APP_PASSWORD"
    echo "    $role: created"
  fi
done

echo "==> 2/6  Create the four databases on $NEW_INSTANCE"
for entry in "${MAP[@]}"; do
  db="${entry%%:*}"
  gcloud sql databases create "$db" --instance="$NEW_INSTANCE" \
    --project="$PROJECT" 2>/dev/null && echo "    $db: created" \
    || echo "    $db: exists"
done

echo "==> 3/6  Start Auth Proxy for $NEW_INSTANCE on :$NEW_PORT"
NEW_PROXY=""; OLD_PROXY=""
trap 'kill $NEW_PROXY $OLD_PROXY 2>/dev/null || true' EXIT
# clear a stale proxy left by a previous failed run
pkill -f "cloud-sql-proxy.*$NEW_INSTANCE" 2>/dev/null && sleep 2 || true
./cloud-sql-proxy --gcloud-auth --port "$NEW_PORT" \
  "$PROJECT:$REGION:$NEW_INSTANCE" &
NEW_PROXY=$!
for _ in $(seq 1 40); do
  (echo > "/dev/tcp/127.0.0.1/$NEW_PORT") 2>/dev/null && break; sleep 0.5
done
echo "    up (pid $NEW_PROXY)"

echo "==> 4/6  Bootstrap ownership + isolation on each new database"
# Fresh gcloud-created users are members of cloudsqlsuperuser and have
# CREATEROLE/CREATEDB. Connect AS the role itself:
#  - it can reassign its DB + schema ownership to itself (member of self,
#    has createdb, and the DB's current owner is cloudsqlsuperuser which it
#    belongs to);
#  - dropping its own CREATEROLE/CREATEDB needs the cloudsqlsuperuser group,
#    reached via SET ROLE (no GRANT dance — that would cycle).
for entry in "${MAP[@]}"; do
  db="${entry%%:*}"; role="${entry#*:}"; role="${role%%:*}"
  PGPASSWORD="$APP_PASSWORD" psql \
    "host=127.0.0.1 port=$NEW_PORT dbname=$db user=$role sslmode=disable" \
    -v ON_ERROR_STOP=1 -v r="$role" -v d="$db" <<'SQL'
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
  echo "    $db owned by $role, locked down, $role de-privileged"
done

echo "==> 5/6  Apply schema files (as each role)"
for entry in "${MAP[@]}"; do
  db="${entry%%:*}"; role="${entry#*:}"; sf="${entry##*:}"; role="${role%%:*}"
  PGPASSWORD="$APP_PASSWORD" psql \
    "host=127.0.0.1 port=$NEW_PORT dbname=$db user=$role sslmode=disable" \
    -v ON_ERROR_STOP=1 -f "$sf" >/dev/null
  echo "    $db <- $sf"
done

echo "==> 6/6  Copy data from $OLD_INSTANCE (start its proxy on :$OLD_PORT)"
if ! (echo > "/dev/tcp/127.0.0.1/$OLD_PORT") 2>/dev/null; then
  ./cloud-sql-proxy --gcloud-auth --port "$OLD_PORT" \
    "$PROJECT:$REGION:$OLD_INSTANCE" &
  OLD_PROXY=$!
  for _ in $(seq 1 40); do
    (echo > "/dev/tcp/127.0.0.1/$OLD_PORT") 2>/dev/null && break; sleep 0.5
  done
else
  OLD_PROXY=""
  echo "    (a proxy is already listening on :$OLD_PORT — reusing it)"
fi

# Column-explicit CSV \copy (not pg_dump — a v16 client refuses a v18 server,
# and the live quiz_submissions column order has drifted from db/schema.sql).
for entry in "${TABLES[@]}"; do
  db="${entry%%:*}"; rest="${entry#*:}"; role="${rest%%:*}"; tbl="${rest##*:}"
  src="host=127.0.0.1 port=$OLD_PORT dbname=$db user=$role sslmode=disable"
  dst="host=127.0.0.1 port=$NEW_PORT dbname=$db user=$role sslmode=disable"
  before=$(PGPASSWORD="$QUIZ_APP_PASSWORD" psql "$src" -Atc "select count(*) from $tbl")
  if [ "$before" -gt 0 ]; then
    # NEW table's column order is canonical (matches the schema file).
    cols=$(PGPASSWORD="$APP_PASSWORD" psql "$dst" -Atc \
      "select string_agg(column_name, ', ' order by ordinal_position) \
       from information_schema.columns where table_name='$tbl'")
    PGPASSWORD="$QUIZ_APP_PASSWORD" psql "$src" \
      -c "\copy (SELECT $cols FROM $tbl) TO STDOUT WITH (FORMAT csv)" \
      | PGPASSWORD="$APP_PASSWORD" psql "$dst" -v ON_ERROR_STOP=1 \
        -c "\copy $tbl ($cols) FROM STDIN WITH (FORMAT csv)"
  fi
  after=$(PGPASSWORD="$APP_PASSWORD" psql "$dst" -Atc "select count(*) from $tbl")
  printf '    %-28s old=%s  new=%s  %s\n' "$db.$tbl" "$before" "$after" \
    "$([ "$before" = "$after" ] && echo OK || echo '!! MISMATCH')"
done

echo
echo "Done. Next:"
echo "  1. In .env.local / .env.example / DEPLOY.md set"
echo "     INSTANCE_CONNECTION_NAME=$PROJECT:$REGION:$NEW_INSTANCE"
echo "  2. Restart the local proxy against $NEW_INSTANCE and 'npm run dev'."
echo "  3. Redeploy Cloud Run with the new INSTANCE_CONNECTION_NAME."
echo "  4. After a few days of the new instance working, delete the old one:"
echo "     gcloud sql instances patch $OLD_INSTANCE --no-deletion-protection --project $PROJECT"
echo "     gcloud sql instances delete $OLD_INSTANCE --project $PROJECT"
