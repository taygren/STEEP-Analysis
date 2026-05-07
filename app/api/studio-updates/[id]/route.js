/**
 * GET /api/studio-updates/[id]
 * Public single-update fetch.
 */

import { kvGet } from '../../../../lib/kv';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req, { params }) {
  try {
    const u = await kvGet(`studioupdates:post:${params.id}`);
    if (!u || u.status !== 'published') {
      return Response.json({ found: false }, { status: 404 });
    }
    return Response.json({ found: true, update: u });
  } catch (err) {
    return Response.json({ found: false, error: err.message }, { status: 500 });
  }
}
