/**
 * GET /api/studio-updates/[id]
 * Public single-update fetch.
 */

import { getSupabase } from '../../../../lib/supabase';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function fromRow(r) {
  return {
    id:          r.id,
    title:       r.title,
    body:        r.body,
    date:        r.date,
    status:      r.status,
    publishedAt: r.published_at,
    updatedAt:   r.updated_at,
    createdAt:   r.created_at,
  };
}

export async function GET(_req, { params }) {
  try {
    const { data, error } = await getSupabase()
      .from('studio_updates')
      .select('*')
      .eq('id', params.id)
      .eq('status', 'published')
      .single();

    if (error || !data) return Response.json({ found: false }, { status: 404 });
    return Response.json({ found: true, update: fromRow(data) });
  } catch (err) {
    return Response.json({ found: false, error: err.message }, { status: 500 });
  }
}
