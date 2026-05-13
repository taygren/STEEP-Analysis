import { getSupabase } from '../../../lib/supabase';
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

async function getProfile(id) {
  const sb = getSupabase();
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
  const { data } = isUuid
    ? await sb.from('innovator_illumination').select('*').eq('id', id).single()
    : await sb.from('innovator_illumination').select('*').eq('slug', id).single();
  return data ? fromRow(data) : null;
}

export async function generateMetadata({ params }) {
  const profile = await getProfile(params.id);
  if (!profile || profile.status !== 'published') {
    return { title: 'Innovator Not Found | STINT Studio' };
  }
  const base = getBaseUrl();
  const url  = `${base}/innovator-illumination/${params.id}`;
  const desc = (profile.solutionOverview || '').slice(0, 200);
  return {
    title:       `${profile.title} | Innovator Illumination | STINT Studio`,
    description: desc,
    openGraph: {
      title:       profile.title,
      description: desc,
      url,
      type:        'article',
      siteName:    'STINT Studio — Innovator Illumination',
      ...(profile.heroImageUrl ? { images: [{ url: profile.heroImageUrl, width: 1200, height: 630, alt: profile.title }] } : {}),
    },
    twitter: {
      card:  profile.heroImageUrl ? 'summary_large_image' : 'summary',
      title: profile.title,
      description: desc,
      ...(profile.heroImageUrl ? { images: [profile.heroImageUrl] } : {}),
    },
  };
}

export default async function InnovatorIlluminationProfilePage({ params }) {
  const profile = await getProfile(params.id);
  if (!profile || profile.status !== 'published') notFound();
  return <ProfilePageView profile={profile} />;
}
