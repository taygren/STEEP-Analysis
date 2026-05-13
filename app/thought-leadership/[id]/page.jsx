import { getSupabase } from '../../../lib/supabase';
import { notFound } from 'next/navigation';
import { headers } from 'next/headers';
import PostPageView from './PostPageView';

export const dynamic = 'force-dynamic';

function getBaseUrl() {
  try {
    const h = headers();
    const host = h.get('x-forwarded-host') || h.get('host') || 'localhost:5000';
    const proto = h.get('x-forwarded-proto') || 'https';
    return `${proto}://${host}`;
  } catch { return ''; }
}

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

async function getPost(id) {
  const sb = getSupabase();
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
  const { data } = isUuid
    ? await sb.from('thought_leadership').select('*').eq('id', id).single()
    : await sb.from('thought_leadership').select('*').eq('slug', id).single();
  return data ? fromRow(data) : null;
}

export async function generateMetadata({ params }) {
  const post = await getPost(params.id);
  if (!post || post.status !== 'published') {
    return { title: 'Article Not Found | STINT Studio' };
  }
  const base = getBaseUrl();
  const url  = `${base}/thought-leadership/${params.id}`;
  const desc = (post.dek || '').slice(0, 200);
  return {
    title:       `${post.title} | STINT Studio`,
    description: desc,
    openGraph: {
      title:         post.title,
      description:   desc,
      url,
      type:          'article',
      siteName:      'STINT Studio',
      publishedTime: post.publishedAt,
      ...(post.heroImageUrl ? { images: [{ url: post.heroImageUrl, width: 1200, height: 630, alt: post.title }] } : {}),
    },
    twitter: {
      card:  post.heroImageUrl ? 'summary_large_image' : 'summary',
      title: post.title,
      description: desc,
      ...(post.heroImageUrl ? { images: [post.heroImageUrl] } : {}),
    },
  };
}

export default async function ThoughtLeadershipPostPage({ params }) {
  const post = await getPost(params.id);
  if (!post || post.status !== 'published') notFound();
  return <PostPageView post={post} />;
}
