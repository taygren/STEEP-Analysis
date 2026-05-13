/**
 * Admin CRUD for Thought Leadership posts.
 * All methods require header: x-admin-token matching ADMIN_PUBLISH_TOKEN.
 *
 * GET    /api/thought-leadership/admin  — list all (drafts + published)
 * POST   /api/thought-leadership/admin  — create or update
 * PUT    /api/thought-leadership/admin  — publish / unpublish  { id, status }
 * DELETE /api/thought-leadership/admin  — delete               { id }
 */

import { getSupabase, slugify, authCheck, authResponse } from '../../../../lib/supabase';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function fromRow(r) {
  return {
    id:              r.id,
    slug:            r.slug,
    title:           r.title,
    dek:             r.dek,
    contentMarkdown: r.content_markdown,
    heroImageUrl:    r.hero_image_url,
    geoKeywords:     r.geo_keywords ?? [],
    regions:         r.regions      ?? [],
    instruments:     r.instruments  ?? [],
    companies:       r.companies    ?? [],
    status:          r.status,
    publishedAt:     r.published_at,
    updatedAt:       r.updated_at,
    createdAt:       r.created_at,
  };
}

export async function GET(req) {
  const check = authCheck(req);
  if (check !== 'ok') return authResponse(check);

  try {
    const { data, error } = await getSupabase()
      .from('thought_leadership')
      .select('*')
      .order('updated_at', { ascending: false });

    if (error) throw error;
    return Response.json({ found: true, posts: (data || []).map(fromRow) });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req) {
  const check = authCheck(req);
  if (check !== 'ok') return authResponse(check);

  try {
    const body = await req.json();
    const now  = new Date().toISOString();
    const sb   = getSupabase();

    // Fetch existing if updating
    let existing = null;
    if (body.id) {
      const { data } = await sb.from('thought_leadership').select('*').eq('id', body.id).single();
      existing = data;
    }

    const isPublished = (body.status ?? existing?.status ?? 'draft') === 'published';
    const publishedAt = isPublished
      ? (existing?.published_at || body.publishedAt || now)
      : null;

    const row = {
      ...(body.id ? { id: body.id } : {}),
      slug:             body.slug || slugify(body.title) || existing?.slug || '',
      title:            body.title            ?? existing?.title            ?? 'Untitled',
      dek:              body.dek              ?? existing?.dek              ?? '',
      content_markdown: body.contentMarkdown  ?? existing?.content_markdown ?? '',
      hero_image_url:   body.heroImageUrl     ?? existing?.hero_image_url   ?? '',
      geo_keywords:     body.geoKeywords      ?? existing?.geo_keywords     ?? [],
      regions:          body.regions          ?? existing?.regions          ?? [],
      instruments:      body.instruments      ?? existing?.instruments      ?? [],
      companies:        body.companies        ?? existing?.companies        ?? [],
      status:           body.status           ?? existing?.status           ?? 'draft',
      published_at:     publishedAt,
      updated_at:       now,
      created_at:       existing?.created_at  ?? body.createdAt             ?? now,
    };

    const { data, error } = await sb
      .from('thought_leadership')
      .upsert(row, { onConflict: 'id' })
      .select()
      .single();

    if (error) throw error;
    return Response.json({ found: true, post: fromRow(data) });
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

    const sb  = getSupabase();
    const now = new Date().toISOString();

    const { data: existing, error: fetchErr } = await sb
      .from('thought_leadership').select('*').eq('id', id).single();
    if (fetchErr || !existing) return Response.json({ error: 'Not found' }, { status: 404 });

    const publishedAt = status === 'published' ? (existing.published_at || now) : existing.published_at;

    const { data, error } = await sb
      .from('thought_leadership')
      .update({ status, published_at: publishedAt, updated_at: now })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return Response.json({ found: true, post: fromRow(data) });
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
      .from('thought_leadership')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return Response.json({ found: true, deleted: id });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
