import { getSupabase } from '../../lib/supabase';
import { unstable_noStore as noStore } from 'next/cache';
import Link from 'next/link';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata = {
  title: 'Thought Leadership | STINT Studio',
  description: 'Strategic intelligence briefs — macro, geopolitical & sector analysis from STINT Studio.',
};

function ArrowIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M5 2l5 5-5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

async function getPosts() {
  noStore();
  try {
    const { data, error } = await getSupabase()
      .from('thought_leadership')
      .select('id, slug, title, dek, geo_keywords, published_at, hero_image_url, content_markdown')
      .eq('status', 'published')
      .order('published_at', { ascending: false });
    if (error) console.error('[tl-list] Supabase error:', error.message);
    return data || [];
  } catch (err) {
    console.error('[tl-list] Exception:', err.message);
    return [];
  }
}

function readingTime(md) {
  return Math.max(1, Math.ceil((md || '').split(/\s+/).filter(Boolean).length / 200));
}

export default async function ThoughtLeadershipListPage() {
  const rawPosts = await getPosts();
  // Deduplicate by slug — keep only the first (most-recent) record per slug
  const seenSlugs = new Set();
  const posts = rawPosts.filter(p => {
    const key = p.slug || p.id;
    if (seenSlugs.has(key)) return false;
    seenSlugs.add(key);
    return true;
  });

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
          <span className="text-slate-400 text-sm">Thought Leadership</span>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
        <header className="mb-10">
          <div className="inline-flex items-center gap-2 text-xs font-semibold tracking-widest uppercase text-violet-400 mb-3">
            <span className="w-4 h-px bg-violet-600 inline-block"/>
            Intelligence Briefs
          </div>
          <h1 className="text-4xl font-black text-white leading-tight">Thought Leadership</h1>
          <p className="mt-2 text-slate-400 text-lg max-w-xl">
            Macro, geopolitical, and sector analysis for enterprise decision-makers.
          </p>
        </header>

        {posts.length === 0 ? (
          <div className="py-24 text-center text-slate-600 text-sm">No published articles yet.</div>
        ) : (
          <div className="grid gap-5">
            {posts.map(post => {
              const href = `/thought-leadership/${post.slug || post.id}`;
              const mins = readingTime(post.content_markdown);
              const date = post.published_at
                ? new Date(post.published_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
                : null;

              return (
                <Link
                  key={post.id}
                  href={href}
                  className="group block bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden hover:border-slate-600 transition-colors"
                >
                  <div className="flex flex-col sm:flex-row gap-0">
                    {post.hero_image_url && (
                      <div className="sm:w-52 sm:flex-shrink-0 h-40 sm:h-auto overflow-hidden">
                        <img
                          src={post.hero_image_url}
                          alt={post.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    )}
                    <div className="flex flex-col justify-between p-6 flex-1 min-w-0">
                      <div>
                        {(post.geo_keywords || []).length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mb-3">
                            {post.geo_keywords.slice(0, 3).map(k => (
                              <span key={k} className="text-xs px-2 py-0.5 rounded-full bg-blue-950 text-blue-300 border border-blue-800/60">
                                {k}
                              </span>
                            ))}
                          </div>
                        )}
                        <h2 className="text-lg font-bold text-white leading-snug group-hover:text-violet-300 transition-colors mb-2">
                          {post.title}
                        </h2>
                        {post.dek && (
                          <p className="text-slate-400 text-sm leading-relaxed line-clamp-2">{post.dek}</p>
                        )}
                      </div>
                      <div className="flex items-center justify-between mt-4">
                        <div className="flex items-center gap-2 text-xs text-slate-600">
                          {date && <span>{date}</span>}
                          {date && <span>·</span>}
                          <span>{mins} min read</span>
                        </div>
                        <span className="text-violet-500 group-hover:text-violet-300 transition-colors">
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
