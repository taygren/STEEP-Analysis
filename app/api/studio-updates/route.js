/**
 * GET /api/studio-updates
 * Public — returns published Studio Updates, newest first.
 */

import { getSupabase } from '../../../lib/supabase';

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

export async function GET() {
  try {
    const { data, error } = await getSupabase()
      .from('studio_updates')
      .select('*')
      .eq('status', 'published')
      .order('date', { ascending: false });

    if (error) throw error;
    return Response.json({ found: true, updates: (data || []).map(fromRow) });
  } catch (err) {
    console.error('[studio-updates] GET error:', err.message);
    return Response.json({ found: false, error: err.message }, { status: 500 });
  }
}
