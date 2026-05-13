/**
 * Admin CRUD for Studio Updates.
 * All methods require header: x-admin-token matching ADMIN_PUBLISH_TOKEN.
 *
 * GET    /api/studio-updates/admin  — list all (drafts + published)
 * POST   /api/studio-updates/admin  — create or update
 * PUT    /api/studio-updates/admin  — toggle status  { id, status }
 * DELETE /api/studio-updates/admin  — delete         { id }
 */

import { getSupabase, authCheck, authResponse } from '../../../../lib/supabase';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const VALID_STATUSES = new Set(['published', 'draft']);

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

export async function GET(req) {
  const check = authCheck(req);
  if (check !== 'ok') return authResponse(check);

  try {
    const { data, error } = await getSupabase()
      .from('studio_updates')
      .select('*')
      .order('date', { ascending: false });

    if (error) throw error;
    return Response.json({ found: true, updates: (data || []).map(fromRow) });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req) {
  const check = authCheck(req);
  if (check !== 'ok') return authResponse(check);

  try {
    const body = await req.json();
    if (body.status && !VALID_STATUSES.has(body.status))
      return Response.json({ error: 'status must be "published" or "draft"' }, { status: 400 });

    const now = new Date().toISOString();
    const sb  = getSupabase();

    let existing = null;
    if (body.id) {
      const { data } = await sb.from('studio_updates').select('*').eq('id', body.id).single();
      existing = data;
    }

    const status      = body.status ?? existing?.status ?? 'published';
    const publishedAt = status === 'published'
      ? (existing?.published_at || now)
      : null;

    const row = {
      ...(body.id ? { id: body.id } : {}),
      title:        body.title ?? existing?.title ?? 'Untitled',
      body:         body.body  ?? existing?.body  ?? '',
      date:         body.date  ?? existing?.date  ?? now.slice(0, 10),
      status,
      published_at: publishedAt,
      updated_at:   now,
      created_at:   existing?.created_at ?? now,
    };

    const { data, error } = await sb
      .from('studio_updates')
      .upsert(row, { onConflict: 'id' })
      .select()
      .single();

    if (error) throw error;
    return Response.json({ found: true, update: fromRow(data) });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req) {
  const check = authCheck(req);
  if (check !== 'ok') return authResponse(check);

  try {
    const { id, status } = await req.json();
    if (!id) return Response.json({ error: 'id required' }, { status: 400 });
    if (status && !VALID_STATUSES.has(status))
      return Response.json({ error: 'status must be "published" or "draft"' }, { status: 400 });

    const sb  = getSupabase();
    const now = new Date().toISOString();

    const { data: existing, error: fetchErr } = await sb
      .from('studio_updates').select('*').eq('id', id).single();
    if (fetchErr || !existing) return Response.json({ error: 'Not found' }, { status: 404 });

    const publishedAt = status === 'published'
      ? (existing.published_at || now)
      : existing.published_at;

    const { data, error } = await sb
      .from('studio_updates')
      .update({ status, published_at: publishedAt, updated_at: now })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return Response.json({ found: true, update: fromRow(data) });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req) {
  const check = authCheck(req);
  if (check !== 'ok') return authResponse(check);

  try {
    const { id } = await req.json();
    if (!id) return Response.json({ error: 'id required' }, { status: 400 });

    const { error } = await getSupabase()
      .from('studio_updates')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return Response.json({ found: true, deleted: id });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
