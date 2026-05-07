'use client';
import { useEffect, useState } from 'react';
import StandaloneMarkdown from '../../components/StandaloneMarkdown';

function XIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.261 5.636 5.903-5.636zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
    </svg>
  );
}

function LinkedInIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
    </svg>
  );
}

function LinkIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
    </svg>
  );
}

function PrintIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 6 2 18 2 18 9"/>
      <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
      <rect x="6" y="14" width="12" height="8"/>
    </svg>
  );
}

function BackIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M9 2L4 7l5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

export default function ProfilePageView({ profile }) {
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'auto';
    return () => { document.body.style.overflow = prev; };
  }, []);

  const [copied, setCopied] = useState(false);

  const getUrl = () => (typeof window !== 'undefined' ? window.location.href : '');

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(getUrl());
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch { /* ignore */ }
  };

  const shareX = () =>
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(profile.title)}&url=${encodeURIComponent(getUrl())}`, '_blank', 'noopener');

  const shareLinkedIn = () =>
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(getUrl())}`, '_blank', 'noopener');

  const exportPDF = () => window.print();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">

      {/* ── Top nav (hidden on print) ── */}
      <nav className="print-hide sticky top-0 z-20 bg-slate-950/95 backdrop-blur-sm border-b border-slate-800/60">
        <div className="max-w-3xl mx-auto px-6 py-3 flex items-center justify-between gap-4">
          <a href="/" className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm flex-shrink-0">
            <BackIcon />
            <span className="font-semibold text-slate-300">STINT Studio</span>
          </a>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button onClick={shareX} title="Share on X"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white transition-colors">
              <XIcon /> <span className="hidden sm:inline">X</span>
            </button>
            <button onClick={shareLinkedIn} title="Share on LinkedIn"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white transition-colors">
              <LinkedInIcon /> <span className="hidden sm:inline">LinkedIn</span>
            </button>
            <button onClick={copyLink} title="Copy link"
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs border transition-colors ${copied ? 'bg-emerald-900 border-emerald-700 text-emerald-300' : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white'}`}>
              <LinkIcon />
              <span className="hidden sm:inline">{copied ? 'Copied!' : 'Copy link'}</span>
            </button>
            <button onClick={exportPDF} title="Export as PDF"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white transition-colors">
              <PrintIcon /> <span className="hidden sm:inline">PDF</span>
            </button>
          </div>
        </div>
      </nav>

      {/* ── Profile ── */}
      <main className="max-w-3xl mx-auto px-6 py-10">

        {profile.heroImageUrl && (
          <div className="mb-8 rounded-2xl overflow-hidden shadow-2xl" style={{ maxHeight: 280 }}>
            <img
              src={profile.heroImageUrl}
              alt={profile.title}
              className="w-full object-cover"
              style={{ maxHeight: 280 }}
              onError={e => { e.currentTarget.parentElement.style.display = 'none'; }}
            />
          </div>
        )}

        {/* Logo + name + segment */}
        <div className="flex items-start gap-5 mb-6">
          <div className="w-16 h-16 rounded-xl border border-slate-700 bg-slate-900 flex-shrink-0 overflow-hidden flex items-center justify-center shadow-lg">
            {profile.logoUrl ? (
              <img src={profile.logoUrl} alt={profile.title} className="w-full h-full object-contain p-1.5"
                onError={e => { e.currentTarget.style.display = 'none'; }} />
            ) : (
              <span className="text-white text-2xl font-black">{(profile.title || '?')[0].toUpperCase()}</span>
            )}
          </div>
          <div className="flex-1 min-w-0 pt-1">
            {profile.techSegment && (
              <span className="inline-block text-xs px-2.5 py-0.5 rounded-full font-semibold mb-2"
                style={{ background: '#0891b220', color: '#22d3ee', border: '1px solid #0891b240' }}>
                {profile.techSegment}
              </span>
            )}
            <h1 className="sa-title text-3xl font-black text-white leading-tight">{profile.title}</h1>
            {profile.solutionOverview && (
              <p className="sa-dek text-slate-400 text-base leading-relaxed mt-2">{profile.solutionOverview}</p>
            )}
          </div>
        </div>

        {profile.geoKeywords?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-7 print-hide">
            {profile.geoKeywords.map(t => (
              <span key={t} className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">{t}</span>
            ))}
          </div>
        )}

        <div className="border-t border-slate-800 pt-8 pb-12 print-article">
          <StandaloneMarkdown md={profile.contentMarkdown || profile.excerpt || ''} />
        </div>

        {/* ── Bottom share strip (hidden on print) ── */}
        <div className="print-hide border-t border-slate-800 pt-10 pb-16 flex flex-col items-center gap-5">
          <p className="text-slate-500 text-sm font-medium">Share this innovator profile</p>
          <div className="flex items-center gap-3 flex-wrap justify-center">
            <button onClick={shareX}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white transition-colors">
              <XIcon /> Share on X
            </button>
            <button onClick={shareLinkedIn}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white transition-colors">
              <LinkedInIcon /> Share on LinkedIn
            </button>
            <button onClick={copyLink}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm border transition-colors ${copied ? 'bg-emerald-900 border-emerald-700 text-emerald-300' : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white'}`}>
              <LinkIcon /> {copied ? 'Link copied!' : 'Copy link'}
            </button>
            <button onClick={exportPDF}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white transition-colors">
              <PrintIcon /> Export PDF
            </button>
          </div>
          <a href="/" className="mt-2 text-xs text-slate-600 hover:text-slate-400 transition-colors">
            ← Back to STINT Studio
          </a>
        </div>
      </main>
    </div>
  );
}
