/**
 * GET /api/thought-leadership
 * Public — returns published posts, newest first.
 * Query params: ?limit=10  ?tag=tagname  ?q=search
 */

import { getSupabase } from '../../../lib/supabase';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const MAX_LIMIT = 50;

function fromRow(r) {
  return {
    id:              r.id,
    slug:            r.slug,
    title:           r.title,
    dek:             r.dek,
    contentMarkdown: r.content_markdown,
    heroImageUrl:    r.hero_image_url,
    geoKeywords:     r.geo_keywords  ?? [],
    regions:         r.regions       ?? [],
    instruments:     r.instruments   ?? [],
    companies:       r.companies     ?? [],
    status:          r.status,
    publishedAt:     r.published_at,
    updatedAt:       r.updated_at,
    createdAt:       r.created_at,
  };
}

export async function GET(req) {
  try {
    const { searchParams } = req.nextUrl;
    const limit = Math.min(parseInt(searchParams.get('limit') || '10', 10), MAX_LIMIT);
    const tag   = searchParams.get('tag')?.toLowerCase() || null;
    const query = searchParams.get('q')?.toLowerCase()  || null;

    const sb = getSupabase();
    let q = sb
      .from('thought_leadership')
      .select('*')
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .limit(limit);

    if (tag) q = q.or(`geo_keywords.cs.{"${tag}"},instruments.cs.{"${tag}"}`);

    const { data, error } = await q;
    if (error) throw error;

    // Deduplicate by slug — keeps the most-recent record when multiple share the same slug
    const seenSlugs = new Set();
    let posts = (data || []).map(fromRow).filter(p => {
      const key = p.slug || p.id;
      if (seenSlugs.has(key)) return false;
      seenSlugs.add(key);
      return true;
    });

    if (query) {
      posts = posts.filter(p =>
        [p.title, p.dek, p.contentMarkdown].join(' ').toLowerCase().includes(query)
      );
    }

    posts = posts.map(p => ({ ...p, excerpt: (p.contentMarkdown || '').slice(0, 280) }));

    return Response.json({ found: true, posts, total: posts.length });
  } catch (err) {
    console.error('[thought-leadership] GET error:', err.message);
    return Response.json({ found: false, error: err.message }, { status: 500 });
  }
}
