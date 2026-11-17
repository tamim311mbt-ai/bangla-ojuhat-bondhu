import { toBanglaNumber } from "@/lib/excuses";

export const BASE_VISITORS = 1250;
export const BASE_EXCUSES = 3420;

const STORAGE_VISITORS_KEY = "ojuhat_stats_visitors_v1";
const STORAGE_EXCUSES_KEY = "ojuhat_stats_excuses_v1";

const COUNTER_API_BASE = "https://countapi.mileshilliard.com/api/v1";
const VISITOR_COUNTER_KEY = "ojuhat_factory_mbt_visitors_v1";
const EXCUSE_COUNTER_KEY = "ojuhat_factory_mbt_excuses_v1";

export function formatBanglaCount(count: number): string {
  return toBanglaNumber(Math.max(0, Math.floor(count)).toLocaleString("en-US"));
}

function readStoredCount(key: string, fallback: number): number {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    const parsed = raw ? Number(raw) : NaN;
    return Number.isFinite(parsed) && parsed >= fallback ? parsed : fallback;
  } catch {
    return fallback;
  }
}

function writeStoredCount(key: string, value: number): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, String(value));
  } catch {
    // Ignore storage errors in restricted browsing contexts.
  }
}

async function fetchCounter(action: "get" | "hit", counterKey: string): Promise<number | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4500);
    const response = await fetch(`${COUNTER_API_BASE}/${action}/${counterKey}`, {
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!response.ok) return null;
    const data = (await response.json()) as { value?: unknown };
    const parsed = Number(data?.value);
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
  } catch {
    return null;
  }
}

export function getInitialStats(): { visitors: number; excuses: number } {
  return {
    visitors: readStoredCount(STORAGE_VISITORS_KEY, BASE_VISITORS),
    excuses: readStoredCount(STORAGE_EXCUSES_KEY, BASE_EXCUSES),
  };
}

export async function recordPageVisit(): Promise<number> {
  const localNext = readStoredCount(STORAGE_VISITORS_KEY, BASE_VISITORS) + 1;
  writeStoredCount(STORAGE_VISITORS_KEY, localNext);

  const remoteHits = await fetchCounter("hit", VISITOR_COUNTER_KEY);
  if (remoteHits !== null) {
    const synced = Math.max(localNext, BASE_VISITORS + remoteHits);
    writeStoredCount(STORAGE_VISITORS_KEY, synced);
    return synced;
  }

  return localNext;
}

export async function fetchExcuseCount(): Promise<number> {
  const localCurrent = readStoredCount(STORAGE_EXCUSES_KEY, BASE_EXCUSES);
  const remoteHits = await fetchCounter("get", EXCUSE_COUNTER_KEY);
  if (remoteHits !== null) {
    const synced = Math.max(localCurrent, BASE_EXCUSES + remoteHits);
    writeStoredCount(STORAGE_EXCUSES_KEY, synced);
    return synced;
  }

  return localCurrent;
}

export async function recordExcuseGenerated(): Promise<number> {
  const localNext = readStoredCount(STORAGE_EXCUSES_KEY, BASE_EXCUSES) + 1;
  writeStoredCount(STORAGE_EXCUSES_KEY, localNext);

  const remoteHits = await fetchCounter("hit", EXCUSE_COUNTER_KEY);
  if (remoteHits !== null) {
    const synced = Math.max(localNext, BASE_EXCUSES + remoteHits);
    writeStoredCount(STORAGE_EXCUSES_KEY, synced);
    return synced;
  }

  return localNext;
}
