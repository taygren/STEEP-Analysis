/**
 * GET /api/innovator-illumination
 *
 * Returns published Innovator Illumination posts (public).
 * Query params:
 *   ?limit=10       Max posts to return (default 10, max 50)
 *   ?tag=tagname    Filter by geo keyword
 *   ?q=search term  Full-text search
 */

import { kvGet, kvZRange } from '../../../lib/kv';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const INDEX_KEY = 'innovatorillumination:index';
const MAX_LIMIT  = 50;

export async function GET(req) {
  try {
    const { searchParams } = req.nextUrl;
    const limit = Math.min(parseInt(searchParams.get('limit') || '10', 10), MAX_LIMIT);
    const tag   = searchParams.get('tag')?.toLowerCase() || null;
    const query = searchParams.get('q')?.toLowerCase()  || null;

    const ids = await kvZRange(INDEX_KEY, 0, -1, { rev: true });

    const posts = [];
    for (const id of ids) {
      if (posts.length >= limit) break;
      const post = await kvGet(`innovatorillumination:post:${id}`);
      if (!post || post.status !== 'published') continue;

      if (tag && !(post.geoKeywords || []).some(t => t.toLowerCase() === tag)) continue;

      if (query) {
        const hay = [post.title, post.dek, post.techSegment, post.solutionOverview, post.contentMarkdown].join(' ').toLowerCase();
        if (!hay.includes(query)) continue;
      }

      posts.push({
        ...post,
        excerpt: (post.contentMarkdown || '').slice(0, 280),
      });
    }

    return Response.json({ found: true, posts, total: posts.length });

  } catch (err) {
    console.error('[innovator-illumination] GET error:', err.message);
    return Response.json({ found: false, error: err.message }, { status: 500 });
  }
}
