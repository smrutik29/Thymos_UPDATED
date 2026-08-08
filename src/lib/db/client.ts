import { Pool } from "pg";
import { Connector, IpAddressTypes } from "@google-cloud/cloud-sql-connector";

declare global {
  var __thymosDbPoolPromise: Promise<Pool> | undefined;
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

/**
 * Cloud Run sets K_SERVICE on every deployed revision, so its presence is a
 * reliable signal to use the Cloud SQL connector instead of a plain TCP
 * connection to the local Auth Proxy.
 */
function isCloudRun(): boolean {
  return Boolean(process.env.K_SERVICE);
}

async function createPool(): Promise<Pool> {
  const database = requireEnv("DB_NAME");
  const user = requireEnv("DB_USER");
  const password = requireEnv("DB_PASSWORD");

  if (isCloudRun()) {
    const instanceConnectionName = requireEnv("INSTANCE_CONNECTION_NAME");
    const connector = new Connector();
    const clientOpts = await connector.getOptions({
      instanceConnectionName,
      ipType: IpAddressTypes.PUBLIC,
    });
    return new Pool({
      ...clientOpts,
      database,
      user,
      password,
      max: 5,
    });
  }

  // Local development: the Cloud SQL Auth Proxy listens as a plain TCP
  // endpoint (127.0.0.1:5433 by convention here) and handles the secure
  // tunnel to Cloud SQL itself, so a standard pg connection is all that's
  // needed on this side.
  const host = requireEnv("DB_HOST");
  const port = Number(requireEnv("DB_PORT"));
  return new Pool({
    host,
    port,
    database,
    user,
    password,
    max: 5,
  });
}

/**
 * Returns a shared connection pool, created lazily on first use. Caches the
 * in-flight promise (not just the resolved pool) so concurrent callers
 * during cold start don't race and create multiple pools, and caches it on
 * `globalThis` so Next.js dev-mode hot reloads reuse the same pool instead
 * of leaking a new one per reload.
 */
export function getPool(): Promise<Pool> {
  if (!globalThis.__thymosDbPoolPromise) {
    globalThis.__thymosDbPoolPromise = createPool();
  }
  return globalThis.__thymosDbPoolPromise;
}
