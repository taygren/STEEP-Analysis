/**
 * Admin CRUD for Studio Updates.
 * All methods require header: x-admin-token matching ADMIN_PUBLISH_TOKEN.
 *
 * GET    /api/studio-updates/admin  — list all (drafts + published)
 * POST   /api/studio-updates/admin  — create or update (body: update JSON; include id to update)
 * PUT    /api/studio-updates/admin  — toggle publish status (body: { id, status })
 * DELETE /api/studio-updates/admin  — delete (body: { id })
 */

import { kvGet, kvSet, kvDel, kvZAdd, kvZRem, kvZRange } from '../../../../lib/kv';
import { randomUUID } from 'crypto';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const INDEX_KEY = 'studioupdates:index';
const ALL_KEY   = 'studioupdates:all';

function authCheck(req) {
  const token = process.env.ADMIN_PUBLISH_TOKEN;
  if (!token) return 'no_token';
  return req.headers.get('x-admin-token') === token ? 'ok' : 'unauthorized';
}

function authResponse(check) {
  if (check === 'no_token') return Response.json({ error: 'ADMIN_PUBLISH_TOKEN is not configured.' }, { status: 403 });
  return Response.json({ error: 'Unauthorized' }, { status: 401 });
}

export async function GET(req) {
  const check = authCheck(req);
  if (check !== 'ok') return authResponse(check);

  try {
    const [publishedIds, allIds] = await Promise.all([
      kvZRange(INDEX_KEY, 0, -1, { rev: true }),
      kvZRange(ALL_KEY,   0, -1, { rev: true }),
    ]);
    const ids = new Set([...publishedIds, ...allIds]);
    const updates = [];
    for (const id of ids) {
      const u = await kvGet(`studioupdates:post:${id}`);
      if (u) updates.push(u);
    }
    updates.sort((a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt));
    return Response.json({ found: true, updates });
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
    const id   = body.id || randomUUID();

    const existing = body.id ? await kvGet(`studioupdates:post:${id}`) : null;

    const update = {
      id,
      title:      body.title   ?? existing?.title  ?? 'Untitled',
      body:       body.body    ?? existing?.body   ?? '',
      date:       body.date    ?? existing?.date   ?? now.slice(0, 10),
      status:     body.status  ?? existing?.status ?? 'published',
      publishedAt: (body.status === 'published' || existing?.status === 'published')
                    ? (existing?.publishedAt || now)
                    : null,
      updatedAt:  now,
      createdAt:  existing?.createdAt || now,
    };

    await kvSet(`studioupdates:post:${id}`, update);

    await kvZAdd(ALL_KEY, new Date(update.updatedAt).getTime(), id);

    if (update.status === 'published') {
      const dateScore = new Date(update.date + 'T12:00:00').getTime();
      await kvZAdd(INDEX_KEY, dateScore, id);
    } else {
      await kvZRem(INDEX_KEY, id);
    }

    return Response.json({ found: true, update });
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

    const existing = await kvGet(`studioupdates:post:${id}`);
    if (!existing) return Response.json({ error: 'Update not found' }, { status: 404 });

    const now = new Date().toISOString();
    const update = {
      ...existing,
      status,
      updatedAt:   now,
      publishedAt: status === 'published' ? (existing.publishedAt || now) : existing.publishedAt,
    };

    await kvSet(`studioupdates:post:${id}`, update);
    await kvZAdd(ALL_KEY, new Date(update.updatedAt).getTime(), id);

    if (status === 'published') {
      const dateScore = new Date(update.date + 'T12:00:00').getTime();
      await kvZAdd(INDEX_KEY, dateScore, id);
    } else {
      await kvZRem(INDEX_KEY, id);
    }

    return Response.json({ found: true, update });
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

    await kvDel(`studioupdates:post:${id}`);
    await kvZRem(INDEX_KEY, id);
    await kvZRem(ALL_KEY, id);

    return Response.json({ found: true, deleted: id });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
