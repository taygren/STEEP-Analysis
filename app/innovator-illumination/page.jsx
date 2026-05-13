import { getSupabase } from '../../lib/supabase';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Innovator Illumination | STINT Studio',
  description: 'Deep-dive profiles on emerging technology innovators shaping the next wave of enterprise infrastructure.',
};

function ArrowIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M5 2l5 5-5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

async function getProfiles() {
  try {
    const { data } = await getSupabase()
      .from('innovator_illumination')
      .select('id, slug, title, dek, tech_segment, solution_overview, logo_url, hero_image_url, geo_keywords, published_at')
      .eq('status', 'published')
      .order('published_at', { ascending: false });
    return data || [];
  } catch {
    return [];
  }
}

export default async function InnovatorIlluminationListPage() {
  const profiles = await getProfiles();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <nav className="sticky top-0 z-20 bg-slate-950/95 backdrop-blur-sm border-b border-slate-800/60">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-3">
          <Link href="/" className="flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors text-sm">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M9 2L4 7l5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span className="font-semibold text-slate-300">STINT Studio</span>
          </Link>
          <span className="text-slate-700">/</span>
          <span className="text-slate-400 text-sm">Innovator Illumination</span>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
        <header className="mb-10">
          <div className="inline-flex items-center gap-2 text-xs font-semibold tracking-widest uppercase text-cyan-400 mb-3">
            <span className="w-4 h-px bg-cyan-600 inline-block"/>
            Innovator Profiles
          </div>
          <h1 className="text-4xl font-black text-white leading-tight">Innovator Illumination</h1>
          <p className="mt-2 text-slate-400 text-lg max-w-xl">
            Deep-dive profiles on emerging technology companies shaping enterprise infrastructure.
          </p>
        </header>

        {profiles.length === 0 ? (
          <div className="py-24 text-center text-slate-600 text-sm">No published profiles yet.</div>
        ) : (
          <div className="grid gap-5">
            {profiles.map(profile => {
              const href = `/innovator-illumination/${profile.slug || profile.id}`;
              const date = profile.published_at
                ? new Date(profile.published_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
                : null;

              return (
                <Link
                  key={profile.id}
                  href={href}
                  className="group block bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden hover:border-slate-600 transition-colors"
                >
                  <div className="flex flex-col sm:flex-row gap-0">
                    {profile.hero_image_url && (
                      <div className="sm:w-52 sm:flex-shrink-0 h-40 sm:h-auto overflow-hidden">
                        <img
                          src={profile.hero_image_url}
                          alt={profile.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    )}
                    <div className="flex flex-col justify-between p-6 flex-1 min-w-0">
                      <div>
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-10 h-10 rounded-lg border border-slate-700 bg-slate-800 flex-shrink-0 overflow-hidden flex items-center justify-center">
                            {profile.logo_url ? (
                              <img src={profile.logo_url} alt={profile.title} className="w-full h-full object-contain p-1" />
                            ) : (
                              <span className="text-white text-base font-black">{(profile.title || '?')[0].toUpperCase()}</span>
                            )}
                          </div>
                          {profile.tech_segment && (
                            <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold"
                              style={{ background: '#0891b220', color: '#22d3ee', border: '1px solid #0891b240' }}>
                              {profile.tech_segment}
                            </span>
                          )}
                        </div>
                        <h2 className="text-lg font-bold text-white leading-snug group-hover:text-cyan-300 transition-colors mb-2">
                          {profile.title}
                        </h2>
                        {(profile.solution_overview || profile.dek) && (
                          <p className="text-slate-400 text-sm leading-relaxed line-clamp-2">
                            {profile.solution_overview || profile.dek}
                          </p>
                        )}
                        {(profile.geo_keywords || []).length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-3">
                            {profile.geo_keywords.slice(0, 3).map(k => (
                              <span key={k} className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                                {k}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center justify-between mt-4">
                        <div className="text-xs text-slate-600">
                          {date && <span>{date}</span>}
                        </div>
                        <span className="text-cyan-500 group-hover:text-cyan-300 transition-colors">
                          <ArrowIcon />
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
