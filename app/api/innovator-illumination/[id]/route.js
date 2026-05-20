import { getSupabase } from '../../../../lib/supabase';

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

export async function GET(_req, { params }) {
  try {
    const { id } = params;
    if (!id) return Response.json({ error: 'id required' }, { status: 400 });

    const sb = getSupabase();
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

    let row = null;
    if (isUuid) {
      const { data, error } = await sb
        .from('innovator_illumination')
        .select('*')
        .eq('id', id)
        .eq('status', 'published')
        .single();
      if (!error) row = data;
    } else {
      // Slug lookup: use limit(1) so duplicate slugs never cause a .single() error
      const { data } = await sb
        .from('innovator_illumination')
        .select('*')
        .eq('slug', id)
        .eq('status', 'published')
        .order('published_at', { ascending: false })
        .limit(1);
      row = data?.[0] ?? null;
    }

    if (!row) return Response.json({ error: 'Not found' }, { status: 404 });
    return Response.json({ found: true, ...fromRow(row) });
  } catch (err) {
    console.error('[innovator-illumination/[id]]', err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
