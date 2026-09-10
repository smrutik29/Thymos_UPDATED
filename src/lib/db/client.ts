import { Pool } from "pg";
import { Connector, IpAddressTypes } from "@google-cloud/cloud-sql-connector";

declare global {
  var __thymosDbPoolPromise: Promise<Pool> | undefined;
  var __thymosWaitlistPoolPromise: Promise<Pool> | undefined;
  var __thymosReferralsPoolPromise: Promise<Pool> | undefined;
  var __thymosHealthSystemsPoolPromise: Promise<Pool> | undefined;
  var __thymosGuidePoolPromise: Promise<Pool> | undefined;
  var __thymosResourcePoolPromise: Promise<Pool> | undefined;
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

/**
 * Reads an env var by trying each name in order, returning the first set.
 * Lets the waitlist pool fall back to the quiz pool's shared settings
 * (e.g. INSTANCE_CONNECTION_NAME, DB_HOST) when a WAITLIST_-prefixed
 * override isn't provided.
 */
function firstEnv(...names: string[]): string {
  for (const name of names) {
    const value = process.env[name];
    if (value) return value;
  }
  throw new Error(
    `Missing required environment variable: one of ${names.join(", ")}`
  );
}

/**
 * Cloud Run sets K_SERVICE on every deployed revision, so its presence is a
 * reliable signal to use the Cloud SQL connector instead of a plain TCP
 * connection to the local Auth Proxy.
 */
function isCloudRun(): boolean {
  return Boolean(process.env.K_SERVICE);
}

interface PoolEnv {
  instanceConnectionName: string;
  database: string;
  user: string;
  password: string;
  host: string;
  port: number;
}

async function createPoolFrom(env: PoolEnv): Promise<Pool> {
  const { database, user, password } = env;

  if (isCloudRun()) {
    const connector = new Connector();
    const clientOpts = await connector.getOptions({
      instanceConnectionName: env.instanceConnectionName,
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
  return new Pool({
    host: env.host,
    port: env.port,
    database,
    user,
    password,
    max: 5,
  });
}

async function createPool(): Promise<Pool> {
  return createPoolFrom({
    instanceConnectionName: process.env.INSTANCE_CONNECTION_NAME ?? "",
    database: requireEnv("DB_NAME"),
    user: requireEnv("DB_USER"),
    password: requireEnv("DB_PASSWORD"),
    host: process.env.DB_HOST ?? "127.0.0.1",
    port: Number(process.env.DB_PORT ?? "5433"),
  });
}

/**
 * Builds a pool for an isolated per-form database that lives on the SAME
 * Cloud SQL instance as the quiz DB. Driven by `<PREFIX>_DB_NAME` /
 * `<PREFIX>_DB_USER` / `<PREFIX>_DB_PASSWORD`; host/port/instance fall back
 * to the quiz DB's settings when a prefixed override isn't given.
 */
async function createPrefixedPool(prefix: string): Promise<Pool> {
  return createPoolFrom({
    instanceConnectionName: firstEnv(
      `${prefix}_INSTANCE_CONNECTION_NAME`,
      "INSTANCE_CONNECTION_NAME"
    ),
    database: requireEnv(`${prefix}_DB_NAME`),
    user: requireEnv(`${prefix}_DB_USER`),
    password: requireEnv(`${prefix}_DB_PASSWORD`),
    host:
      process.env[`${prefix}_DB_HOST`] ?? process.env.DB_HOST ?? "127.0.0.1",
    port: Number(
      process.env[`${prefix}_DB_PORT`] ?? process.env.DB_PORT ?? "5433"
    ),
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

/**
 * Same lazy/cached contract as {@link getPool}, but for the isolated
 * `thymos_waitlist` database (dedicated `waitlist_app` user). Kept as a
 * separate pool so waitlist PII and quiz data never share a connection.
 */
export function getWaitlistPool(): Promise<Pool> {
  if (!globalThis.__thymosWaitlistPoolPromise) {
    globalThis.__thymosWaitlistPoolPromise = createPrefixedPool("WAITLIST");
  }
  return globalThis.__thymosWaitlistPoolPromise;
}

/**
 * Same lazy/cached contract as {@link getPool}, but for the isolated
 * `thymos_referrals` database (dedicated `referrals_app` user). Holds
 * provider-referral PHI, so it never shares a connection with quiz or
 * waitlist data.
 */
export function getReferralsPool(): Promise<Pool> {
  if (!globalThis.__thymosReferralsPoolPromise) {
    globalThis.__thymosReferralsPoolPromise = createPrefixedPool("REFERRALS");
  }
  return globalThis.__thymosReferralsPoolPromise;
}

/**
 * Same lazy/cached contract as {@link getPool}, but for the isolated
 * `thymos_health_systems` database (dedicated `health_systems_app` user) —
 * the "Request a Health System Analysis" B2B lead form.
 */
export function getHealthSystemsPool(): Promise<Pool> {
  if (!globalThis.__thymosHealthSystemsPoolPromise) {
    globalThis.__thymosHealthSystemsPoolPromise =
      createPrefixedPool("HEALTH_SYSTEMS");
  }
  return globalThis.__thymosHealthSystemsPoolPromise;
}

/**
 * Same lazy/cached contract as {@link getPool}, but for the isolated
 * `thymos_guide` database (dedicated `guide_app` user) — the "Send Me the
 * Guide" lead-capture form on the Membership page.
 */
export function getGuidePool(): Promise<Pool> {
  if (!globalThis.__thymosGuidePoolPromise) {
    globalThis.__thymosGuidePoolPromise = createPrefixedPool("GUIDE");
  }
  return globalThis.__thymosGuidePoolPromise;
}

/**
 * Same lazy/cached contract as {@link getPool}, but for the isolated
 * `thymos_resources` database (dedicated `resource_app` user) — the
 * "Get instant access" lead form behind both Featured Resources on the
 * public Resources page.
 */
export function getResourcePool(): Promise<Pool> {
  if (!globalThis.__thymosResourcePoolPromise) {
    globalThis.__thymosResourcePoolPromise = createPrefixedPool("RESOURCE");
  }
  return globalThis.__thymosResourcePoolPromise;
}
