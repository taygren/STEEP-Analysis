import { kvGet } from '../../../../lib/kv';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(_req, { params }) {
  try {
    const { id } = params;
    if (!id) return Response.json({ error: 'id required' }, { status: 400 });

    const post = await kvGet(`thoughtleadership:post:${id}`);
    if (!post) return Response.json({ error: 'Not found' }, { status: 404 });

    if (post.status !== 'published') {
      return Response.json({ error: 'Not found' }, { status: 404 });
    }

    return Response.json({ found: true, ...post });

  } catch (err) {
    console.error('[thought-leadership/[id]]', err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
