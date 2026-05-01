/**
 * lib/kv.js — Persistent KV store.
 *
 * Priority order:
 *   1. @vercel/kv  — when KV_REST_API_URL + KV_REST_API_TOKEN are set
 *   2. File-backed JSON store  — dev / Replit (survives restarts & route isolation)
 *
 * The in-memory-Map fallback was removed because Next.js compiles each API route
 * as an isolated module bundle, so every route got its own empty Map.
 * Data is now written to .steep-data/kv.json and cached in globalThis so the
 * file is only read once per process even if modules are re-imported.
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import path from 'path';

// ── File store helpers ────────────────────────────────────────────
const DATA_DIR   = path.join(process.cwd(), '.steep-data');
const STORE_FILE = path.join(DATA_DIR, 'kv.json');

function ensureDir() {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
}

function loadFromDisk() {
  try {
    ensureDir();
    if (existsSync(STORE_FILE)) {
      return JSON.parse(readFileSync(STORE_FILE, 'utf8'));
    }
  } catch (e) {
    console.warn('[kv] could not read store file, starting fresh:', e.message);
  }
  return { keys: {}, sorted: {} };
}

function saveToDisk() {
  try {
    ensureDir();
    writeFileSync(STORE_FILE, JSON.stringify(globalThis.__steep_kv_data));
  } catch (e) {
    console.error('[kv] save failed:', e.message);
  }
}

/** Returns the shared in-memory data object (loaded from disk once). */
function store() {
  if (!globalThis.__steep_kv_data) {
    globalThis.__steep_kv_data = loadFromDisk();
  }
  return globalThis.__steep_kv_data;
}

// ── File-backed KV implementation ─────────────────────────────────
const fileKv = {
  async get(key) {
    return store().keys[key] ?? null;
  },

  async set(key, value) {
    store().keys[key] = value;
    saveToDisk();
    return 'OK';
  },

  async del(key) {
    const s = store();
    const existed = key in s.keys;
    delete s.keys[key];
    saveToDisk();
    return existed ? 1 : 0;
  },

  async keys(pattern) {
    const re = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
    return Object.keys(store().keys).filter(k => re.test(k));
  },

  async zadd(k, score, member) {
    const s = store();
    if (!s.sorted[k]) s.sorted[k] = [];
    const arr = s.sorted[k];
    const idx = arr.findIndex(e => e.member === member);
    if (idx >= 0) arr[idx].score = score;
    else arr.push({ score, member });
    arr.sort((a, b) => a.score - b.score);
    saveToDisk();
    return 1;
  },

  async zrange(k, start, stop, opts = {}) {
    const arr = (store().sorted[k] ?? []).slice();
    const slice = arr.slice(start, stop === -1 ? undefined : stop + 1);
    if (opts.rev) slice.reverse();
    return slice.map(e => e.member);
  },

  async zrem(k, member) {
    const s = store();
    if (!s.sorted[k]) return 0;
    const before = s.sorted[k].length;
    s.sorted[k] = s.sorted[k].filter(e => e.member !== member);
    saveToDisk();
    return before - (s.sorted[k].length);
  },
};

// ── Public API ────────────────────────────────────────────────────
let _kv = null;

async function getKv() {
  if (_kv) return _kv;

  if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
    try {
      const { kv } = await import('@vercel/kv');
      _kv = kv;
      return _kv;
    } catch {
      // fall through to file store
    }
  }

  _kv = fileKv;
  return _kv;
}

export async function kvGet(key)                   { return (await getKv()).get(key); }
export async function kvSet(key, value)            { return (await getKv()).set(key, value); }
export async function kvDel(key)                   { return (await getKv()).del(key); }
export async function kvKeys(pattern)              { return (await getKv()).keys(pattern); }
export async function kvZAdd(key, score, member)   { return (await getKv()).zadd(key, score, member); }
export async function kvZRange(key, s, e, opts)    { return (await getKv()).zrange(key, s, e, opts); }
export async function kvZRem(key, member)          { return (await getKv()).zrem(key, member); }
export const kvAvailable = () =>
  Boolean(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
