/**
 * Admin CRUD for Thought Leadership posts.
 *
 * All methods require header: x-admin-token matching ADMIN_PUBLISH_TOKEN env var.
 *
 * POST   /api/thought-leadership/admin   — create or update a post (body: post JSON)
 * PUT    /api/thought-leadership/admin   — publish / unpublish (body: { id, status })
 * DELETE /api/thought-leadership/admin   — delete a post (body: { id })
 * GET    /api/thought-leadership/admin   — list all posts (drafts + published)
 */

import { kvGet, kvSet, kvDel, kvZAdd, kvZRem, kvZRange } from '../../../../lib/kv';
import { randomUUID } from 'crypto';

const INDEX_KEY = 'thoughtleadership:index';

function authCheck(req) {
  const token = process.env.ADMIN_PUBLISH_TOKEN;
  if (!token) return false; // no token set = admin disabled
  return req.headers.get('x-admin-token') === token;
}

function slugify(str) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80);
}

export async function GET(req) {
  if (!authCheck(req)) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const ids = await kvZRange(INDEX_KEY, 0, -1, { rev: true });
    const allIds = new Set(ids);

    // Also scan for drafts not yet in the sorted index
    const posts = [];
    for (const id of allIds) {
      const post = await kvGet(`thoughtleadership:post:${id}`);
      if (post) posts.push(post);
    }

    posts.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    return Response.json({ found: true, posts });

  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req) {
  if (!authCheck(req)) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();
    const now  = new Date().toISOString();

    const id   = body.id || randomUUID();
    const slug = body.slug || slugify(body.title || id);

    const post = {
      id,
      slug,
      title:           body.title           || 'Untitled',
      dek:             body.dek             || '',
      contentMarkdown: body.contentMarkdown || '',
      geoKeywords:     body.geoKeywords     || [],
      regions:         body.regions         || [],
      instruments:     body.instruments     || [],
      companies:       body.companies       || [],
      status:          body.status          || 'draft',
      publishedAt:     body.status === 'published' ? (body.publishedAt || now) : null,
      updatedAt:       now,
      createdAt:       body.createdAt || now,
    };

    await kvSet(`thoughtleadership:post:${id}`, post);

    // Update sorted index for published posts
    if (post.status === 'published') {
      const score = new Date(post.publishedAt || now).getTime();
      await kvZAdd(INDEX_KEY, score, id);
    }

    return Response.json({ found: true, post });

  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req) {
  if (!authCheck(req)) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { id, status } = await req.json();
    if (!id) return Response.json({ error: 'id required' }, { status: 400 });

    const existing = await kvGet(`thoughtleadership:post:${id}`);
    if (!existing) return Response.json({ error: 'Post not found' }, { status: 404 });

    const now  = new Date().toISOString();
    const post = {
      ...existing,
      status,
      updatedAt:   now,
      publishedAt: status === 'published' ? (existing.publishedAt || now) : existing.publishedAt,
    };

    await kvSet(`thoughtleadership:post:${id}`, post);

    if (status === 'published') {
      await kvZAdd(INDEX_KEY, new Date(post.publishedAt).getTime(), id);
    } else {
      await kvZRem(INDEX_KEY, id);
    }

    return Response.json({ found: true, post });

  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req) {
  if (!authCheck(req)) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { id } = await req.json();
    if (!id) return Response.json({ error: 'id required' }, { status: 400 });

    await kvDel(`thoughtleadership:post:${id}`);
    await kvZRem(INDEX_KEY, id);

    return Response.json({ found: true, deleted: id });

  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
