# Deploying to Cloud Run

The app is one Next.js project that serves both the marketing website (`/`
and its sub-pages) and the quiz (`/quiz`), backed by the `thymos-quiz-dev`
Cloud SQL Postgres instance. It's already deployment-ready: `Dockerfile`
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
  --set-env-vars DB_NAME=thymos_quiz,DB_USER=quiz_app,INSTANCE_CONNECTION_NAME=thymos-health:us-west2:thymos-quiz-dev \
  --set-secrets DB_PASSWORD=quiz-db-password:latest
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
| Env vars needed | `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` (in `.env.local`, gitignored) | `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `INSTANCE_CONNECTION_NAME` (`DB_HOST`/`DB_PORT` unused) |

## After deploying

`gcloud run deploy` prints the service URL. That's your live site — `/` is
the marketing homepage, `/quiz` is the quiz, `/api/quiz-submissions` is the
backing API. Sanity-check with:
```sh
curl -s -o /dev/null -w '%{http_code}\n' https://<service-url>/
curl -s -o /dev/null -w '%{http_code}\n' https://<service-url>/quiz
```

## Making changes later

- **Website content**: edit the relevant `public/*.dc.html` / `public/Patient
  Journey - *.html` file directly (they're plain HTML/CSS, self-contained,
  linked to each other by relative filename) and redeploy.
- **Quiz**: edit under `src/components/quiz/` and `src/app/quiz/` as usual;
  redeploy the same way.
- **Redeploying**: re-run the `gcloud run deploy` command above from the repo
  root — it always builds fresh from the current source.
