/**
 * lib/kv.js — KV store wrapper.
 *
 * In production (Vercel), uses @vercel/kv (requires KV_REST_API_URL + KV_REST_API_TOKEN).
 * In development / Replit, falls back to a simple in-memory Map so the app stays runnable
 * without KV credentials.
 */

let _kv = null;

async function getKv() {
  if (_kv) return _kv;

  if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
    try {
      const { kv } = await import('@vercel/kv');
      _kv = kv;
      return _kv;
    } catch {
      // fall through to in-memory
    }
  }

  // In-memory fallback (dev / no KV creds)
  const store = new Map();
  _kv = {
    get:    async (k)    => store.get(k) ?? null,
    set:    async (k, v) => { store.set(k, v); return 'OK'; },
    del:    async (k)    => { store.delete(k); return 1; },
    keys:   async (pat)  => {
      const re = new RegExp('^' + pat.replace(/\*/g, '.*') + '$');
      return [...store.keys()].filter(k => re.test(k));
    },
    zadd:   async (k, ...args) => {
      const sorted = store.get(k) ?? [];
      for (let i = 0; i < args.length; i += 2) {
        const score = args[i], member = args[i + 1];
        const idx = sorted.findIndex(e => e.member === member);
        if (idx >= 0) sorted[idx].score = score;
        else sorted.push({ score, member });
      }
      sorted.sort((a, b) => a.score - b.score);
      store.set(k, sorted);
      return args.length / 2;
    },
    zrange: async (k, start, stop, opts = {}) => {
      const sorted = store.get(k) ?? [];
      const slice = sorted.slice(start, stop === -1 ? undefined : stop + 1);
      if (opts.rev) slice.reverse();
      return slice.map(e => e.member);
    },
    zrem:   async (k, member) => {
      const sorted = store.get(k) ?? [];
      const before = sorted.length;
      const filtered = sorted.filter(e => e.member !== member);
      store.set(k, filtered);
      return before - filtered.length;
    },
  };
  return _kv;
}

export async function kvGet(key) {
  const kv = await getKv();
  return kv.get(key);
}

export async function kvSet(key, value) {
  const kv = await getKv();
  return kv.set(key, value);
}

export async function kvDel(key) {
  const kv = await getKv();
  return kv.del(key);
}

export async function kvKeys(pattern) {
  const kv = await getKv();
  return kv.keys(pattern);
}

export async function kvZAdd(key, score, member) {
  const kv = await getKv();
  return kv.zadd(key, score, member);
}

export async function kvZRange(key, start, stop, opts = {}) {
  const kv = await getKv();
  return kv.zrange(key, start, stop, opts);
}

export async function kvZRem(key, member) {
  const kv = await getKv();
  return kv.zrem(key, member);
}

export const kvAvailable = () =>
  Boolean(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
