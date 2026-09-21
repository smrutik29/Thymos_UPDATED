# Deploying to Cloud Run

> **Migrated off `thymos-quiz-dev` on 2026-08-29.** That instance was a
> permanently trial-flagged Cloud SQL "Free Trial Instance" — Google refuses
> to enable automated backups / PITR / storage auto-increase on it and it
> cannot be converted. The live DB is now **`thymos-db`** (POSTGRES_18,
> us-west2, same tier, with backups + PITR + `ssl-mode=ENCRYPTED_ONLY` +
> deletion protection + storage auto-increase). 4 databases + 4 de-privileged
> roles re-provisioned and the 3 real `quiz_submissions` rows copied.
> `thymos-quiz-dev` is kept as a fallback — delete it once `thymos-db` is
> proven in production (`gcloud sql instances patch thymos-quiz-dev
> --no-deletion-protection && gcloud sql instances delete thymos-quiz-dev`).
>
> To redo this on another instance, the steps were:
>
> ```sh
> # 1. Create the non-trial instance (root password lands in /tmp/thymos-db-rootpw)
> gcloud sql instances create thymos-db \
>   --project=thymos-health --database-version=POSTGRES_18 --region=us-west2 \
>   --edition=ENTERPRISE_PLUS --tier=db-perf-optimized-N-8 \
>   --storage-type=SSD --storage-size=100 --storage-auto-increase \
>   --availability-type=ZONAL \
>   --backup-start-time=09:00 --enable-point-in-time-recovery --retained-transaction-log-days=7 \
>   --database-flags=cloudsql.iam_authentication=on \
>   --ssl-mode=ENCRYPTED_ONLY --deletion-protection \
>   --root-password="$(openssl rand -base64 30 | tr -dc 'A-Za-z0-9' | head -c 32 | tee /tmp/thymos-db-rootpw)"
>
> # 2. Users + databases + isolation + schema + data copy
> QUIZ_APP_PASSWORD='<old quiz_app pw>' APP_PASSWORD='<new pw for all *_app roles>' \
>   bash db/migrate-to-new-instance.sh
>
> # 3. Repoint: set INSTANCE_CONNECTION_NAME=thymos-health:us-west2:thymos-db
> #    in .env.local, .env.example, and the deploy command below.
> # 4. After the new instance is proven in prod, delete the old one:
> gcloud sql instances patch  thymos-quiz-dev --no-deletion-protection --project thymos-health
> gcloud sql instances delete thymos-quiz-dev --project thymos-health
> ```

The app is one Next.js project that serves both the marketing website (`/`
and its sub-pages) and the quiz (`/quiz`), backed by a Cloud SQL Postgres
instance (`thymos-quiz-dev` today; `thymos-db` after the migration above). It's already deployment-ready: `Dockerfile`
builds a standalone production image, and `src/lib/db/client.ts` auto-detects
Cloud Run (via the `K_SERVICE` env var Cloud Run sets automatically) and
switches from the local TCP proxy connection to the
`@google-cloud/cloud-sql-connector` package.

## One-time setup (per GCP project)

This project (`thymos-health`, number `174778170354`) has never used Cloud
Run, Cloud Build, Artifact Registry, or Compute Engine before (it's been
Firebase/BigQuery-only) — none of those APIs are enabled yet, and there's no
default Compute service account. The steps below cover all of that; skip any
step that's already done on a later deploy.

1. Enable the required APIs:
   ```sh
   gcloud services enable run.googleapis.com sqladmin.googleapis.com \
     artifactregistry.googleapis.com cloudbuild.googleapis.com \
     --project thymos-health
   ```
2. Create a dedicated runtime service account for the service (cleaner than
   relying on the project's default compute SA, which doesn't exist here):
   ```sh
   gcloud iam service-accounts create thymos-quiz-app \
     --project thymos-health \
     --display-name="Thymos quiz app (Cloud Run runtime)"
   ```
3. Give it the Cloud SQL Client role so it can connect through the connector:
   ```sh
   gcloud projects add-iam-policy-binding thymos-health \
     --member="serviceAccount:thymos-quiz-app@thymos-health.iam.gserviceaccount.com" \
     --role="roles/cloudsql.client"
   ```

## Deploy

From the repo root:

```sh
gcloud run deploy thymos-quiz-app \
  --source . \
  --project thymos-health \
  --region us-west2 \
  --service-account thymos-quiz-app@thymos-health.iam.gserviceaccount.com \
  --allow-unauthenticated \
  --set-env-vars DB_NAME=thymos_quiz,DB_USER=quiz_app,INSTANCE_CONNECTION_NAME=thymos-health:us-west2:thymos-db,WAITLIST_DB_NAME=thymos_waitlist,WAITLIST_DB_USER=waitlist_app,REFERRALS_DB_NAME=thymos_referrals,REFERRALS_DB_USER=referrals_app,HEALTH_SYSTEMS_DB_NAME=thymos_health_systems,HEALTH_SYSTEMS_DB_USER=health_systems_app,GUIDE_DB_NAME=thymos_guide,GUIDE_DB_USER=guide_app,RESOURCE_DB_NAME=thymos_resources,RESOURCE_DB_USER=resource_app,NEXT_PUBLIC_TURNSTILE_SITE_KEY=0x4AAAAAAEgd99jX8gK0sp_v \
  --set-secrets DB_PASSWORD=quiz-db-password:latest,WAITLIST_DB_PASSWORD=waitlist-db-password:latest,REFERRALS_DB_PASSWORD=referrals-db-password:latest,HEALTH_SYSTEMS_DB_PASSWORD=health-systems-db-password:latest,GUIDE_DB_PASSWORD=guide-db-password:latest,RESOURCE_DB_PASSWORD=resource-db-password:latest,TURNSTILE_SECRET_KEY=turnstile-secret-key:latest,SUBMISSION_TOKEN_SECRET=submission-token-secret:latest
```

**Turnstile (CAPTCHA) + submission token** — create the two secrets before the
deploy (values from dash.cloudflare.com > Turnstile, and any long random string):

```sh
printf '%s' '<turnstile secret>' | gcloud secrets create turnstile-secret-key \
  --project thymos-health --data-file=-
printf '%s' "$(openssl rand -hex 32)" | gcloud secrets create submission-token-secret \
  --project thymos-health --data-file=-
for s in turnstile-secret-key submission-token-secret; do
  gcloud secrets add-iam-policy-binding "$s" --project thymos-health \
    --member="serviceAccount:thymos-quiz-app@thymos-health.iam.gserviceaccount.com" \
    --role="roles/secretmanager.secretAccessor"
done
```

`NEXT_PUBLIC_TURNSTILE_SITE_KEY` is baked into the client bundle at build time,
so it must be passed as a plain `--set-env-vars` value (above), not a secret,
and the deploy that sets it must rebuild (`--source .` always does).
The real "Thymos forms" Turnstile **site key** `0x4AAAAAAEgd99jX8gK0sp_v` is
already baked into `public/waitlist-modal.js`, the two form `.dc.html` pages,
and `ContactScreen.tsx`; the **secret key** is in the `turnstile-secret-key`
Secret Manager entry. Until `TURNSTILE_SECRET_KEY` reaches the running service,
verification is skipped server-side (honeypot + rate-limit still apply) — the
`--set-secrets` line above wires it in.

The waitlist, provider-referral, health-system-analysis, "Send Me the
Guide", and Resources-page "Get instant access" forms each store to their
own isolated database (`thymos_waitlist`, `thymos_referrals`,
`thymos_health_systems`, `thymos_guide`, `thymos_resources`) on the **same**
Cloud SQL instance, each via a dedicated de-privileged user (`waitlist_app`,
`referrals_app`, `health_systems_app`, `guide_app`, `resource_app`), so no
extra `INSTANCE_CONNECTION_NAME` is needed — `src/lib/db/client.ts` reuses it.
Provision each once with `db/provision-isolated-db.sh`, e.g.:
`NEW_DB=thymos_guide NEW_USER=guide_app
SCHEMA_FILE=db/guide-schema.sql QUIZ_APP_PASSWORD=… NEW_USER_PASSWORD=…
bash db/provision-isolated-db.sh` (`db/provision-waitlist.sh` is the original
waitlist-specific version). `thymos_referrals` holds patient PHI — Cloud SQL
encrypts at rest and all connections are TLS, but formal HIPAA coverage also
needs a signed Google Cloud BAA.

The `guide-db-password` secret must exist before the deploy that wires it:
```sh
printf '%s' 'THE_GUIDE_APP_PASSWORD' | gcloud secrets create guide-db-password \
  --project thymos-health --data-file=-
gcloud secrets add-iam-policy-binding guide-db-password --project thymos-health \
  --member="serviceAccount:thymos-quiz-app@thymos-health.iam.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

Likewise `resource-db-password` for the `thymos_resources` store — provision it
with `NEW_DB=thymos_resources NEW_USER=resource_app
SCHEMA_FILE=db/resource-schema.sql NEW_USER_PASSWORD=… bash
db/provision-isolated-db.sh`, then:
```sh
printf '%s' 'THE_RESOURCE_APP_PASSWORD' | gcloud secrets create resource-db-password \
  --project thymos-health --data-file=-
gcloud secrets add-iam-policy-binding resource-db-password --project thymos-health \
  --member="serviceAccount:thymos-quiz-app@thymos-health.iam.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

`--source .` has Cloud Build build the `Dockerfile` and push it for you — no
manual `docker build`/`push` needed. Re-running the same command redeploys a
new revision; Cloud Run keeps the URL stable across deploys.

**`DB_PASSWORD` via Secret Manager** (the `--set-secrets` line above): this
project doesn't have Secret Manager enabled or the secret created yet.
One-time setup:
```sh
gcloud services enable secretmanager.googleapis.com --project thymos-health
printf '%s' 'THE_REAL_PASSWORD' | gcloud secrets create quiz-db-password \
  --project thymos-health --data-file=-
gcloud secrets add-iam-policy-binding quiz-db-password \
  --project thymos-health \
  --member="serviceAccount:thymos-quiz-app@thymos-health.iam.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"

# ...and the same for the waitlist + referrals DB passwords:
printf '%s' 'THE_WAITLIST_APP_PASSWORD' | gcloud secrets create waitlist-db-password \
  --project thymos-health --data-file=-
gcloud secrets add-iam-policy-binding waitlist-db-password \
  --project thymos-health \
  --member="serviceAccount:thymos-quiz-app@thymos-health.iam.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"

printf '%s' 'THE_REFERRALS_APP_PASSWORD' | gcloud secrets create referrals-db-password \
  --project thymos-health --data-file=-
gcloud secrets add-iam-policy-binding referrals-db-password \
  --project thymos-health \
  --member="serviceAccount:thymos-quiz-app@thymos-health.iam.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"

printf '%s' 'THE_HEALTH_SYSTEMS_APP_PASSWORD' | gcloud secrets create health-systems-db-password \
  --project thymos-health --data-file=-
gcloud secrets add-iam-policy-binding health-systems-db-password \
  --project thymos-health \
  --member="serviceAccount:thymos-quiz-app@thymos-health.iam.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```
If you'd rather not set up Secret Manager right now, swap that line for
`--set-env-vars ...,DB_PASSWORD=...` alongside the others — works, just means
the password sits in the Cloud Run service's plaintext env config (visible to
anyone with read access to the service, e.g. via `gcloud run services
describe`).

## Local dev vs. production, at a glance

| | Local (`npm run dev`) | Cloud Run |
|---|---|---|
| DB connection | TCP to Cloud SQL Auth Proxy on `127.0.0.1:5433` (see the "GCP DB local setup" project memory for starting the proxy) | `@google-cloud/cloud-sql-connector`, auto-selected via `K_SERVICE` |
| Env vars needed | `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` + `WAITLIST_DB_*` + `REFERRALS_DB_*` + `HEALTH_SYSTEMS_DB_*` (in `.env.local`, gitignored) | `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `INSTANCE_CONNECTION_NAME` + `WAITLIST_DB_*` + `REFERRALS_DB_*` + `HEALTH_SYSTEMS_DB_*` (name/user/password each; `DB_HOST`/`DB_PORT` unused; the extra DBs reuse `INSTANCE_CONNECTION_NAME`) |

## After deploying

`gcloud run deploy` prints the service URL. That's your live site — `/` is
the marketing homepage, `/quiz` is the quiz, `/api/quiz-submissions` is the
backing API. Sanity-check with:
```sh
curl -s -o /dev/null -w '%{http_code}\n' https://<service-url>/
curl -s -o /dev/null -w '%{http_code}\n' https://<service-url>/quiz
```

## Refer-a-friend landing page (`/r/<CODE>`)

The patient referral share link (`https://thymoshealth.com/r/<CODE>`, ADR-0006)
lands on `src/app/r/[code]/page.tsx`. It is a plain server-rendered page: no
database, no call to `thymos-backend`. Three things to know when deploying:

- **Amount copy.** The page shows "$50 off" by default. The real amounts live in
  the backend's `referral_programs` row; if Thymos changes the program, set
  `REFERRAL_RECIPIENT_DISCOUNT` / `REFERRAL_REFERRER_REWARD` (e.g. `$25`) on the
  service so the page agrees with the app:
  ```sh
  gcloud run services update thymos-quiz-app --project thymos-health --region us-west2 \
    --update-env-vars REFERRAL_RECIPIENT_DISCOUNT='$25',REFERRAL_REFERRER_REWARD='$25'
  ```
- **iOS Universal Links** — `public/.well-known/apple-app-site-association` lists
  the three app IDs (`BZ79WW8V27.com.thymos`, `.staging`, `.dev`) for `/r/*`.
  `next.config.ts` forces `Content-Type: application/json` on it (Apple rejects
  `application/octet-stream` and any redirect). Verify after a deploy:
  ```sh
  curl -sI https://thymoshealth.com/.well-known/apple-app-site-association | grep -i '^content-type'
  ```
  The mobile app needs `applinks:thymoshealth.com` in its entitlements for this
  to take effect; Apple's CDN re-fetches the file when the app is installed.
- **Android App Links** — `public/.well-known/assetlinks.json` currently verifies
  only `com.thymos.dev` with the repo's debug keystore fingerprint. **Before store
  launch, append entries for `com.thymos` and `com.thymos.staging`** using the
  SHA-256 of the certificate Google Play signs the app with (Play Console → Setup
  → App signing → "App signing key certificate"), not the upload key. Without
  them the https link opens in the browser on production builds (the page still
  works; the "Open in the Thymos app" button uses the `thymos://` scheme).
- **Store badges** are "Coming soon" tiles until the listings exist; put the
  store URLs into `STORE_BADGES` in `src/lib/referral-landing/content.ts`.

## Making changes later

- **Website content**: edit the relevant `public/*.dc.html` /
  `public/patient-journey-*.html` file directly (they're plain HTML/CSS,
  self-contained, linked to each other by relative filename) and redeploy.
- **Quiz**: edit under `src/components/quiz/` and `src/app/quiz/` as usual;
  redeploy the same way.
- **Redeploying**: re-run the `gcloud run deploy` command above from the repo
  root — it always builds fresh from the current source.
