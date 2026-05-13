import { createClient } from '@supabase/supabase-js';

let _client = null;

export function getSupabase() {
  if (_client) return _client;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required');
  _client = createClient(url, key, { auth: { persistSession: false } });
  return _client;
}

export const supabaseAvailable = () =>
  Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);

// ── Shared helpers ─────────────────────────────────────────────

export function slugify(str) {
  return (str || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80);
}

export function authCheck(req) {
  const token = process.env.ADMIN_PUBLISH_TOKEN;
  if (!token) return 'no_token';
  return req.headers.get('x-admin-token') === token ? 'ok' : 'unauthorized';
}

export function authResponse(check) {
  if (check === 'no_token')
    return Response.json({ error: 'ADMIN_PUBLISH_TOKEN is not configured.' }, { status: 403 });
  return Response.json({ error: 'Unauthorized' }, { status: 401 });
}
