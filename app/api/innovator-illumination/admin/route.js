/**
 * Admin CRUD for Innovator Illumination posts.
 * All methods require header: x-admin-token matching ADMIN_PUBLISH_TOKEN.
 *
 * GET    /api/innovator-illumination/admin  — list all (drafts + published)
 * POST   /api/innovator-illumination/admin  — create or update
 * PUT    /api/innovator-illumination/admin  — publish / unpublish  { id, status }
 * DELETE /api/innovator-illumination/admin  — delete               { id }
 */

import { getSupabase, slugify, authCheck, authResponse } from '../../../../lib/supabase';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function fromRow(r) {
  return {
    id:               r.id,
    slug:             r.slug,
    title:            r.title,
    dek:              r.dek,
    logoUrl:          r.logo_url,
    techSegment:      r.tech_segment,
    solutionOverview: r.solution_overview,
    contentMarkdown:  r.content_markdown,
    heroImageUrl:     r.hero_image_url,
    geoKeywords:      r.geo_keywords ?? [],
    status:           r.status,
    publishedAt:      r.published_at,
    updatedAt:        r.updated_at,
    createdAt:        r.created_at,
  };
}

export async function GET(req) {
  const check = authCheck(req);
  if (check !== 'ok') return authResponse(check);

  try {
    const { data, error } = await getSupabase()
      .from('innovator_illumination')
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

    let existing = null;
    if (body.id) {
      const { data } = await sb.from('innovator_illumination').select('*').eq('id', body.id).single();
      existing = data;
    }

    const isPublished = (body.status ?? existing?.status ?? 'draft') === 'published';
    const publishedAt = isPublished
      ? (existing?.published_at || body.publishedAt || now)
      : null;

    const row = {
      ...(body.id ? { id: body.id } : {}),
      slug:             body.slug             || slugify(body.title) || existing?.slug || '',
      title:            body.title            ?? existing?.title            ?? 'Untitled',
      dek:              body.dek              ?? existing?.dek              ?? '',
      logo_url:         body.logoUrl          ?? existing?.logo_url         ?? '',
      tech_segment:     body.techSegment      ?? existing?.tech_segment     ?? '',
      solution_overview: body.solutionOverview ?? existing?.solution_overview ?? '',
      content_markdown: body.contentMarkdown  ?? existing?.content_markdown ?? '',
      hero_image_url:   body.heroImageUrl     ?? existing?.hero_image_url   ?? '',
      geo_keywords:     body.geoKeywords      ?? existing?.geo_keywords     ?? [],
      status:           body.status           ?? existing?.status           ?? 'draft',
      published_at:     publishedAt,
      updated_at:       now,
      created_at:       existing?.created_at  ?? body.createdAt             ?? now,
    };

    const { data, error } = await sb
      .from('innovator_illumination')
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
      .from('innovator_illumination').select('*').eq('id', id).single();
    if (fetchErr || !existing) return Response.json({ error: 'Not found' }, { status: 404 });

    const publishedAt = status === 'published'
      ? (existing.published_at || now)
      : existing.published_at;

    const { data, error } = await sb
      .from('innovator_illumination')
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
      .from('innovator_illumination')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return Response.json({ found: true, deleted: id });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
