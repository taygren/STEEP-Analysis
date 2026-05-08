'use client';
import { useState, useEffect } from 'react';
import StandaloneMarkdown from './StandaloneMarkdown';

const BIO_PARAGRAPHS = [
  "Taylor Grenawalt is a strategist, applied researcher, and framework designer with a career built at the intersection of intelligence, innovation, and organizational decision-making. He currently serves as Director of Research & Insights at Vation Ventures, a growth and innovation consulting firm where he leads market, technology, and enterprise research, synthesizing quantitative and qualitative analysis with strategic foresight to help organizations navigate digital transformation, competitive differentiation, and AI adoption.",
  "Prior to Vation, Taylor spent several years at Pathway Capital Management, where his work was rooted in private investment, macroeconomic analysis, and strategic research. Evaluating risk, opportunity, and value creation across markets sharpened a disciplined, analytical orientation that continues to define how he approaches complex problems. Knowing how to separate signal from noise is a skill that translates cleanly from investment analysis to strategy consulting.",
  "Taylor holds a B.A. from Brown University, where he designed his own Public Affairs curriculum centered on policy, geopolitics, macroeconomics, and philosophy. He was also a member of Brown's wrestling team, a sport he began at age four, and credits that pairing of intellectual rigor and competitive discipline with instilling the resilience and curiosity that continue to drive his work.",
  "Outside the office, Taylor is based in Michigan, where he reads voraciously and stays physically active. Two habits that reflect the same underlying disposition: always learning, always testing limits, never satisfied with standing still.",
];

const emptyForm = () => ({
  date: new Date().toISOString().slice(0, 10),
  title: '',
  body: '',
  status: 'published',
});

export default function AboutPanel() {
  const [activeSection, setActiveSection] = useState('studio');
  const [updates, setUpdates]             = useState([]);
  const [loadingUpdates, setLoadingUpdates] = useState(true);

  const [adminToken, setAdminToken]         = useState('');
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [adminInput, setAdminInput]         = useState('');
  const [adminErr, setAdminErr]             = useState('');
  const [adminChecking, setAdminChecking]   = useState(false);

  const [showForm, setShowForm]   = useState(false);
  const [form, setForm]           = useState(emptyForm());
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving]       = useState(false);
  const [saveErr, setSaveErr]     = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  useEffect(() => { fetchUpdates(); }, []);

  const fetchUpdates = async (tok) => {
    setLoadingUpdates(true);
    try {
      const effectiveTok = tok !== undefined ? tok : adminToken;
      const url  = effectiveTok ? '/api/studio-updates/admin' : '/api/studio-updates';
      const opts = effectiveTok ? { headers: { 'x-admin-token': effectiveTok } } : {};
      const res  = await fetch(url, opts);
      const data = await res.json();
      setUpdates(data.updates || []);
    } catch { /* silent */ } finally {
      setLoadingUpdates(false);
    }
  };

  const doAdminLogin = async () => {
    if (!adminInput.trim()) return;
    setAdminChecking(true); setAdminErr('');
    try {
      const tok = adminInput.trim();
      const res = await fetch('/api/studio-updates/admin', {
        headers: { 'x-admin-token': tok },
      });
      if (res.ok) {
        setAdminToken(tok);
        setShowAdminLogin(false);
        setAdminInput('');
        await fetchUpdates(tok);
      } else {
        setAdminErr('Invalid token.');
      }
    } catch { setAdminErr('Connection error.'); }
    finally { setAdminChecking(false); }
  };

  const openNew = () => { setForm(emptyForm()); setEditingId(null); setSaveErr(''); setShowForm(true); };
  const openEdit = (u) => {
    setForm({
      date:   u.date || new Date(u.publishedAt || u.createdAt).toISOString().slice(0, 10),
      title:  u.title || '',
      body:   u.body  || '',
      status: u.status || 'published',
    });
    setEditingId(u.id);
    setSaveErr('');
    setShowForm(true);
  };

  const doSave = async () => {
    if (!form.title.trim() || !form.body.trim()) { setSaveErr('Title and body are required.'); return; }
    setSaving(true); setSaveErr('');
    try {
      const payload = { ...(editingId ? { id: editingId } : {}), ...form };
      const res = await fetch('/api/studio-updates/admin', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-admin-token': adminToken },
        body: JSON.stringify(payload),
      });
      if (!res.ok) { const d = await res.json(); setSaveErr(d.error || 'Save failed.'); return; }
      setShowForm(false);
      await fetchUpdates();
    } catch (e) { setSaveErr(e.message); }
    finally { setSaving(false); }
  };

  const doDelete = async (id) => {
    try {
      await fetch('/api/studio-updates/admin', {
        method: 'DELETE',
        headers: { 'content-type': 'application/json', 'x-admin-token': adminToken },
        body: JSON.stringify({ id }),
      });
      setDeleteConfirm(null);
      await fetchUpdates();
    } catch {}
  };

  const navBtn = (key, label) => (
    <button
      key={key}
      onClick={() => setActiveSection(key)}
      className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors ${activeSection === key ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
    >
      {label}
    </button>
  );

  return (
    <div className="max-w-3xl mx-auto fade-in">

      {/* Header */}
      <div className="mb-7">
        <div className="flex items-center gap-4 mb-3">
          <img src="/stint-logo.png" alt="STINT Studio" className="h-11 w-auto object-contain flex-shrink-0 mix-blend-screen" />
          <div>
            <h1 className="text-2xl font-black text-white leading-tight">STINT Studio</h1>
            <p className="text-slate-500 text-xs font-medium mt-0.5">Applied Strategy & Intelligence</p>
          </div>
        </div>
      </div>

      {/* Section nav */}
      <div className="flex items-center gap-1 mb-7 border-b border-slate-800 pb-3 flex-wrap">
        {navBtn('studio', 'Studio')}
        {navBtn('about', 'About Taylor')}
        {navBtn('updates', 'Studio Updates')}
        {!adminToken
          ? <button onClick={() => setShowAdminLogin(true)} className="ml-auto text-xs text-slate-700 hover:text-slate-500 transition-colors">admin</button>
          : <span className="ml-auto text-xs text-emerald-600 font-medium select-none">● Admin</span>
        }
      </div>

      {/* ── Studio section ── */}
      {activeSection === 'studio' && (
        <div className="space-y-7 fade-in">
          <div>
            <h2 className="text-white font-bold text-base mb-3">About the Studio</h2>
            <p className="text-slate-300 text-sm leading-relaxed mb-4">
              Applied Strategy & Intelligence is a personal portfolio of practitioner instruments for strategic analysis, applied foresight, and organisational decision-making. Built by Taylor Grenawalt.
            </p>
            <p className="text-slate-400 text-sm leading-relaxed">
              STINT Studio develops and maintains AI-augmented analytical instruments designed for the serious work of strategy and intelligence. The tools here reflect a practitioner's perspective: rigorous in method, direct in output, built to support decisions rather than generate noise.
            </p>
          </div>

          <div className="border-t border-slate-800 pt-6">
            <h2 className="text-white font-bold text-base mb-4">The Instruments</h2>
            <div className="space-y-3">
              {[
                { name: 'STEEP Analysis', tag: 'Toolkit', tagColor: { bg: '#2563eb18', color: '#60a5fa', border: '#2563eb25' }, desc: 'Six-agent AI framework analysing any subject across Social, Technological, Economic, Environmental, and Political dimensions. Produces a 3D force map, forecast roadmap, geoeconomic Big Cycle assessment, and — for public companies — an AI-generated investment thesis with prediction market signals.' },
                { name: 'Big Cycle Engine', tag: 'Toolkit', tagColor: { bg: '#d9770618', color: '#fbbf24', border: '#d9770625' }, desc: 'Five-agent sequential pipeline based on the Dalio Big Cycle framework. Classifies empire stage, diagnoses debt sustainability, detects bubble conditions, architects a macro scenario with historical analogy, and produces an allocation matrix with a primary signal.' },
                { name: 'GeoEcon Instrument Assessment', tag: 'Toolkit', tagColor: { bg: '#0d948818', color: '#2dd4bf', border: '#0d948825' }, desc: 'Five-agent pipeline based on the Farrell & Newman Triangular Framework. Scores a geoeconomic instrument across five attributes, assesses bilateral leverage, classifies strategic utility, and translates the risk profile into portfolio signals.' },
                { name: 'Prompt Engineering Package', tag: 'Toolkit', tagColor: { bg: '#7c3aed18', color: '#a78bfa', border: '#7c3aed25' }, desc: 'Structured prompting toolkit comprising the RASCEF Generator, Adversarial Buddy (six AI challenge modes), Task Brief Builder, nine research-backed techniques, ten core principles, and copy-ready checkpoint prompts.' },
                { name: 'Game Theory Simulator', tag: 'Toolkit', tagColor: { bg: '#0d948818', color: '#2dd4bf', border: '#0d948825' }, desc: 'Interactive simulation environment for game-theoretic thinking. Twelve scenarios across cooperation, bargaining, competition, and signaling domains. Users make real decisions against AI opponents, receive outcome analysis, and build intuition through structured debrief.' },
                { name: 'Thought Leadership', tag: 'Insights', tagColor: { bg: '#0f766e18', color: '#2dd4bf', border: '#0f766e25' }, desc: 'Structured intelligence briefs on geopolitics, technology adoption, macroeconomic conditions, and organisational strategy.' },
                { name: 'Innovator Illumination', tag: 'Insights', tagColor: { bg: '#0891b218', color: '#22d3ee', border: '#0891b225' }, desc: 'Curated profiles of technology solution providers organised by segment, with solution overviews and geoeconomic context.' },
              ].map(({ name, tag, tagColor, desc }) => (
                <div key={name} className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-white font-semibold text-sm">{name}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: tagColor.bg, color: tagColor.color, border: `1px solid ${tagColor.border}` }}>{tag}</span>
                  </div>
                  <p className="text-slate-400 text-xs leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── About Taylor section ── */}
      {activeSection === 'about' && (
        <div className="fade-in">
          <div className="flex items-start gap-5 mb-7">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-slate-700 to-slate-600 border border-slate-600 flex-shrink-0 flex items-center justify-center text-xl font-black text-slate-300 shadow-lg">TG</div>
            <div className="min-w-0 pt-1">
              <h2 className="text-white font-black text-xl leading-tight">Taylor Grenawalt</h2>
              <p className="text-slate-400 text-sm mt-1">Strategist · Applied Researcher · Framework Designer</p>
              <p className="text-slate-500 text-xs mt-1">Director of Research & Insights, Vation Ventures</p>
            </div>
          </div>
          <div className="border-t border-slate-800 pt-6 space-y-4">
            {BIO_PARAGRAPHS.map((para, i) => (
              <p key={i} className="text-slate-300 text-sm leading-relaxed">{para}</p>
            ))}
          </div>
        </div>
      )}

      {/* ── Studio Updates section ── */}
      {activeSection === 'updates' && (
        <div className="fade-in">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-white font-bold text-base">Studio Updates</h2>
            {adminToken && (
              <button onClick={openNew}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-700 hover:bg-blue-600 text-white transition-colors">
                + Post Update
              </button>
            )}
          </div>

          {loadingUpdates && <div className="text-center py-12 text-slate-600 text-xs">Loading…</div>}

          {!loadingUpdates && updates.length === 0 && (
            <div className="text-center py-12">
              <p className="text-slate-600 text-sm">No updates posted yet.</p>
            </div>
          )}

          {!loadingUpdates && updates.length > 0 && (
            <div className="space-y-4">
              {updates.map(u => (
                <div key={u.id} className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-5">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      {u.date && (
                        <span className="text-xs px-2 py-0.5 rounded font-mono bg-slate-700 text-slate-400">
                          {new Date(u.date + 'T12:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      )}
                      {u.status === 'draft' && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-900/50 text-yellow-400 border border-yellow-800/50">Draft</span>
                      )}
                    </div>
                    {adminToken && (
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button onClick={() => openEdit(u)}
                          className="px-2 py-1 rounded text-xs text-slate-400 hover:text-white hover:bg-slate-700 transition-colors">Edit</button>
                        <button onClick={() => setDeleteConfirm(u.id)}
                          className="px-2 py-1 rounded text-xs text-red-500 hover:text-red-300 hover:bg-red-900/30 transition-colors">Delete</button>
                      </div>
                    )}
                  </div>
                  {u.title && <h3 className="text-white font-semibold text-sm mb-2">{u.title}</h3>}
                  <div className="prose-update text-sm leading-relaxed"><StandaloneMarkdown md={u.body || ''} /></div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Admin login modal ── */}
      {showAdminLogin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <h3 className="text-white font-bold text-base mb-4">Admin Access</h3>
            <input
              type="password"
              value={adminInput}
              onChange={e => setAdminInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && doAdminLogin()}
              placeholder="Admin token"
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:border-blue-500 mb-3"
              autoFocus
            />
            {adminErr && <p className="text-red-400 text-xs mb-3">{adminErr}</p>}
            <div className="flex gap-2">
              <button onClick={doAdminLogin} disabled={adminChecking || !adminInput.trim()}
                className="flex-1 py-2 rounded-lg text-sm font-semibold bg-blue-700 hover:bg-blue-600 text-white disabled:opacity-40 transition-colors">
                {adminChecking ? 'Checking…' : 'Unlock'}
              </button>
              <button onClick={() => { setShowAdminLogin(false); setAdminInput(''); setAdminErr(''); }}
                className="flex-1 py-2 rounded-lg text-sm bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Add / Edit form modal ── */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 bg-black/70 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-xl mt-10 shadow-2xl">
            <h3 className="text-white font-bold text-base mb-5">{editingId ? 'Edit Update' : 'Post Update'}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-slate-500 font-medium mb-1.5">Date</label>
                <input type="date" value={form.date}
                  onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-xs text-slate-500 font-medium mb-1.5">Title</label>
                <input type="text" value={form.title} placeholder="Update headline"
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-xs text-slate-500 font-medium mb-1.5">Body</label>
                <textarea value={form.body} placeholder="Update details (markdown supported)" rows={6}
                  onChange={e => setForm(f => ({ ...f, body: e.target.value }))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:border-blue-500 resize-y" />
              </div>
              <div>
                <label className="block text-xs text-slate-500 font-medium mb-1.5">Status</label>
                <div className="flex gap-2">
                  {['published', 'draft'].map(s => (
                    <button key={s} onClick={() => setForm(f => ({ ...f, status: s }))}
                      className={`px-4 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors ${form.status === s ? (s === 'published' ? 'bg-emerald-800 text-emerald-200 border border-emerald-600' : 'bg-yellow-900 text-yellow-300 border border-yellow-700') : 'bg-slate-800 text-slate-400 border border-slate-700 hover:border-slate-500'}`}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            {saveErr && <p className="text-red-400 text-xs mt-3">{saveErr}</p>}
            <div className="flex gap-2 mt-6">
              <button onClick={doSave} disabled={saving}
                className="flex-1 py-2 rounded-lg text-sm font-semibold bg-blue-700 hover:bg-blue-600 text-white disabled:opacity-40 transition-colors">
                {saving ? 'Saving…' : editingId ? 'Save Changes' : 'Publish Update'}
              </button>
              <button onClick={() => setShowForm(false)}
                className="flex-1 py-2 rounded-lg text-sm bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete confirmation ── */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <h3 className="text-white font-bold text-base mb-2">Delete this update?</h3>
            <p className="text-slate-400 text-sm mb-5">This action cannot be undone.</p>
            <div className="flex gap-2">
              <button onClick={() => doDelete(deleteConfirm)}
                className="flex-1 py-2 rounded-lg text-sm font-semibold bg-red-800 hover:bg-red-700 text-white transition-colors">
                Delete
              </button>
              <button onClick={() => setDeleteConfirm(null)}
                className="flex-1 py-2 rounded-lg text-sm bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
