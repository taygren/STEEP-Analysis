import { kvGet } from '../../../lib/kv';
import { notFound } from 'next/navigation';
import { headers } from 'next/headers';
import ProfilePageView from './ProfilePageView';

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
  const profile = await kvGet(`innovatorillumination:post:${params.id}`);
  if (!profile || profile.status !== 'published') {
    return { title: 'Innovator Not Found | STEEP Platform' };
  }
  const base = getBaseUrl();
  const url  = `${base}/innovator-illumination/${params.id}`;
  const desc = (profile.solutionOverview || profile.excerpt || '').slice(0, 200);
  return {
    title: `${profile.title} | Innovator Illumination | STEEP Platform`,
    description: desc,
    openGraph: {
      title: profile.title,
      description: desc,
      url,
      type: 'article',
      siteName: 'STEEP Platform — Innovator Illumination',
      ...(profile.heroImageUrl ? { images: [{ url: profile.heroImageUrl, width: 1200, height: 630, alt: profile.title }] } : {}),
    },
    twitter: {
      card: profile.heroImageUrl ? 'summary_large_image' : 'summary',
      title: profile.title,
      description: desc,
      ...(profile.heroImageUrl ? { images: [profile.heroImageUrl] } : {}),
    },
  };
}

export default async function InnovatorIlluminationProfilePage({ params }) {
  const profile = await kvGet(`innovatorillumination:post:${params.id}`);
  if (!profile || profile.status !== 'published') notFound();
  return <ProfilePageView profile={profile} />;
}
