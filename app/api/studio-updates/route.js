/**
 * GET /api/studio-updates
 * Public endpoint — returns published Studio Updates, newest first.
 */

import { kvGet, kvZRange } from '../../../lib/kv';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const INDEX_KEY = 'studioupdates:index';

export async function GET() {
  try {
    const ids = await kvZRange(INDEX_KEY, 0, -1, { rev: true });
    const updates = [];
    for (const id of ids) {
      const u = await kvGet(`studioupdates:post:${id}`);
      if (!u || u.status !== 'published') continue;
      updates.push(u);
    }
    return Response.json({ found: true, updates });
  } catch (err) {
    console.error('[studio-updates] GET error:', err.message);
    return Response.json({ found: false, error: err.message }, { status: 500 });
  }
}
