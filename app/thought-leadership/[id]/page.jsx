import { kvGet } from '../../../lib/kv';
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

export async function generateMetadata({ params }) {
  const post = await kvGet(`thoughtleadership:post:${params.id}`);
  if (!post || post.status !== 'published') {
    return { title: 'Article Not Found | STINT Studio' };
  }
  const base = getBaseUrl();
  const url  = `${base}/thought-leadership/${params.id}`;
  const desc = (post.dek || post.excerpt || '').slice(0, 200);
  return {
    title: `${post.title} | STINT Studio`,
    description: desc,
    openGraph: {
      title: post.title,
      description: desc,
      url,
      type: 'article',
      siteName: 'STINT Studio',
      publishedTime: post.publishedAt,
      ...(post.heroImageUrl ? { images: [{ url: post.heroImageUrl, width: 1200, height: 630, alt: post.title }] } : {}),
    },
    twitter: {
      card: post.heroImageUrl ? 'summary_large_image' : 'summary',
      title: post.title,
      description: desc,
      ...(post.heroImageUrl ? { images: [post.heroImageUrl] } : {}),
    },
  };
}

export default async function ThoughtLeadershipPostPage({ params }) {
  const post = await kvGet(`thoughtleadership:post:${params.id}`);
  if (!post || post.status !== 'published') notFound();
  return <PostPageView post={post} />;
}
