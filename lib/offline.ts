import { get, set, del, keys } from "idb-keyval";

const DRAFT_PREFIX = "draft:";
const CACHE_PREFIX = "cache:";
const QUEUE_KEY = "offline-queue";

export type OfflineJob = {
  id: string;
  kind: "note" | "journal";
  payload: unknown;
  createdAt: string;
};

export async function saveDraft(id: string, data: unknown) {
  await set(`${DRAFT_PREFIX}${id}`, data);
}

export async function loadDraft<T>(id: string) {
  return (await get(`${DRAFT_PREFIX}${id}`)) as T | undefined;
}

export async function clearDraft(id: string) {
  await del(`${DRAFT_PREFIX}${id}`);
}

export async function cacheDocument(id: string, data: unknown) {
  await set(`${CACHE_PREFIX}${id}`, {
    data,
    cachedAt: new Date().toISOString(),
  });
}

export async function loadCachedDocument<T>(id: string) {
  const value = (await get(`${CACHE_PREFIX}${id}`)) as
    | { data: T; cachedAt: string }
    | undefined;
  return value?.data;
}

export async function listCachedIds() {
  const all = await keys();
  return all
    .filter((key) => typeof key === "string" && key.startsWith(CACHE_PREFIX))
    .map((key) => String(key).slice(CACHE_PREFIX.length));
}

export async function enqueueJob(job: OfflineJob) {
  const current = ((await get(QUEUE_KEY)) as OfflineJob[] | undefined) ?? [];
  await set(QUEUE_KEY, [...current.filter((item) => item.id !== job.id), job]);
}

export async function readQueue() {
  return ((await get(QUEUE_KEY)) as OfflineJob[] | undefined) ?? [];
}

export async function writeQueue(jobs: OfflineJob[]) {
  await set(QUEUE_KEY, jobs);
}

export async function removeJob(id: string) {
  const current = await readQueue();
  await writeQueue(current.filter((job) => job.id !== id));
}
