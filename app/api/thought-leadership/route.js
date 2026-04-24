/**
 * GET /api/thought-leadership
 *
 * Returns published thought leadership posts (public).
 * Query params:
 *   ?limit=10        Max posts to return (default 10, max 50)
 *   ?tag=tagname     Filter by tag
 *   ?q=search term   Full-text search across title, dek, contentMarkdown
 */

import { kvGet, kvZRange } from '../../../lib/kv';

const INDEX_KEY = 'thoughtleadership:index';
const MAX_LIMIT  = 50;

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const limit  = Math.min(parseInt(searchParams.get('limit') || '10', 10), MAX_LIMIT);
    const tag    = searchParams.get('tag')?.toLowerCase() || null;
    const query  = searchParams.get('q')?.toLowerCase()  || null;

    // Index is a sorted set scored by publishedAt timestamp (newest first via rev)
    const ids = await kvZRange(INDEX_KEY, 0, -1, { rev: true });

    const posts = [];
    for (const id of ids) {
      if (posts.length >= limit) break;
      const post = await kvGet(`thoughtleadership:post:${id}`);
      if (!post || post.status !== 'published') continue;

      if (tag && !(post.geoKeywords || []).concat(post.instruments || []).some(t => t.toLowerCase() === tag)) continue;

      if (query) {
        const haystack = [post.title, post.dek, post.contentMarkdown].join(' ').toLowerCase();
        if (!haystack.includes(query)) continue;
      }

      // Strip heavy content for list view
      const { contentMarkdown: _, ...rest } = post;
      posts.push({ ...rest, excerpt: post.contentMarkdown?.slice(0, 280) });
    }

    return Response.json({ found: true, posts, total: posts.length });

  } catch (err) {
    console.error('[thought-leadership] GET error:', err.message);
    return Response.json({ found: false, error: err.message }, { status: 500 });
  }
}
