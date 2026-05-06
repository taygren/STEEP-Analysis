'use client';
import { useState, useEffect, useCallback, useRef } from 'react';

const POSTURE_COLORS = {
  published: 'bg-emerald-900 text-emerald-300 border-emerald-700',
  draft: 'bg-slate-700 text-slate-400 border-slate-600',
};

function Spinner() {
  return (
    <svg className="animate-spin h-4 w-4 text-blue-400" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
    </svg>
  );
}

// ── Markdown preview (simple, no dependency) ──────────────────────
function mdInline(raw) {
  return raw
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/__(.+?)__/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/_(.+?)_/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code style="background:#1e293b;padding:.15em .4em;border-radius:4px;font-size:.82em;color:#94a3b8;font-family:monospace">$1</code>')
    .replace(/!\[([^\]]*)\]\(([^)\s"]+)[^)]*\)/g,
      (_, alt, url) => `<img src="${url}" alt="${alt || 'Image'}" style="max-width:100%;border-radius:8px;display:block;margin:10px auto" />`)
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" style="color:#60a5fa;text-decoration:underline">$1</a>');
}

function MarkdownPreview({ md }) {
  if (!md) return null;
  const lines = md.split('\n');
  const out = [];
  let i = 0;

  const isSep  = r => /^\|[\s|:-]+\|$/.test(r);
  const parseRow = r => r.replace(/^\||\|$/g, '').split('|').map(c => c.trim());

  while (i < lines.length) {
    const line = lines[i];
    const tr   = line.trim();
    if (!tr) { i++; continue; }

    if (tr.startsWith('```')) {
      const code = []; i++;
      while (i < lines.length && !lines[i].trim().startsWith('```')) { code.push(lines[i]); i++; }
      i++;
      out.push(<pre key={i} style={{background:'#0f172a',border:'1px solid #1e293b',borderRadius:10,padding:'12px 16px',fontSize:'0.78rem',color:'#94a3b8',fontFamily:'monospace',overflowX:'auto',margin:'14px 0',lineHeight:1.6}}><code>{code.join('\n')}</code></pre>);
      continue;
    }

    const imgM = tr.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
    if (imgM) {
      out.push(<figure key={i} style={{margin:'20px 0',textAlign:'center'}}><img src={imgM[2]} alt={imgM[1]} style={{maxWidth:'100%',borderRadius:10,boxShadow:'0 2px 16px #0005'}} />{imgM[1] && <figcaption style={{color:'#64748b',fontSize:'0.75rem',marginTop:6,fontStyle:'italic'}}>{imgM[1]}</figcaption>}</figure>);
      i++; continue;
    }

    if (/^(-{3,}|\*{3,})$/.test(tr)) {
      out.push(<hr key={i} style={{border:'none',borderTop:'1px solid #1e293b',margin:'24px 0'}} />);
      i++; continue;
    }

    if (tr.startsWith('|')) {
      const rows = [];
      while (i < lines.length && lines[i].trim().startsWith('|')) { rows.push(lines[i].trim()); i++; }
      const data = rows.filter(r => !isSep(r));
      if (data.length > 0) {
        const heads = parseRow(data[0]);
        const body  = data.slice(1).map(parseRow);
        out.push(
          <div key={i} style={{overflowX:'auto',margin:'20px 0',borderRadius:10,border:'1px solid #1e293b'}}>
            <table style={{width:'100%',borderCollapse:'collapse',fontSize:'0.82rem'}}>
              <thead><tr style={{background:'#1e293b'}}>{heads.map((h,ci) => <th key={ci} style={{textAlign:'left',padding:'8px 14px',color:'#cbd5e1',fontWeight:600,fontSize:'0.75rem',textTransform:'uppercase',letterSpacing:'0.05em',borderBottom:'1px solid #334155'}} dangerouslySetInnerHTML={{__html:mdInline(h)}} />)}</tr></thead>
              <tbody>{body.map((r,ri) => <tr key={ri} style={{borderBottom:'1px solid #1e293b',background: ri%2===1?'#0f172a':'transparent'}}>{heads.map((_,ci) => <td key={ci} style={{padding:'8px 14px',color:'#94a3b8'}} dangerouslySetInnerHTML={{__html:mdInline(r[ci]??'')}} />)}</tr>)}</tbody>
            </table>
          </div>
        );
      }
      continue;
    }

    if (tr.startsWith('#### ')) { out.push(<h4 key={i} style={{fontSize:'0.875rem',fontWeight:700,color:'#e2e8f0',margin:'18px 0 6px'}} dangerouslySetInnerHTML={{__html:mdInline(tr.slice(5))}} />); i++; continue; }
    if (tr.startsWith('### '))  { out.push(<h3 key={i} style={{fontSize:'1rem',    fontWeight:700,color:'#f1f5f9',margin:'22px 0 8px'}}  dangerouslySetInnerHTML={{__html:mdInline(tr.slice(4))}} />); i++; continue; }
    if (tr.startsWith('## '))   { out.push(<h2 key={i} style={{fontSize:'1.1rem',  fontWeight:700,color:'#f8fafc',margin:'28px 0 10px',borderBottom:'1px solid #1e293b',paddingBottom:6}} dangerouslySetInnerHTML={{__html:mdInline(tr.slice(3))}} />); i++; continue; }
    if (tr.startsWith('# '))    { out.push(<h1 key={i} style={{fontSize:'1.25rem', fontWeight:800,color:'#ffffff',margin:'32px 0 12px'}} dangerouslySetInnerHTML={{__html:mdInline(tr.slice(2))}} />); i++; continue; }

    if (tr.startsWith('> ')) {
      out.push(<blockquote key={i} style={{borderLeft:'3px solid #3b82f6',padding:'6px 14px',margin:'14px 0',color:'#94a3b8',background:'#0f172a',borderRadius:'0 8px 8px 0'}} dangerouslySetInnerHTML={{__html:mdInline(tr.slice(2))}} />);
      i++; continue;
    }

    if (tr.startsWith('- ') || tr.startsWith('* ')) {
      const items = [];
      while (i < lines.length && (lines[i].trim().startsWith('- ') || lines[i].trim().startsWith('* '))) {
        items.push(<li key={i} style={{margin:'4px 0 4px 18px',listStyle:'disc',color:'#cbd5e1'}} dangerouslySetInnerHTML={{__html:mdInline(lines[i].trim().slice(2))}} />);
        i++;
      }
      out.push(<ul key={i} style={{margin:'12px 0'}}>{items}</ul>);
      continue;
    }

    if (/^\d+\. /.test(tr)) {
      const items = [];
      while (i < lines.length && /^\d+\. /.test(lines[i].trim())) {
        items.push(<li key={i} style={{margin:'4px 0 4px 18px',listStyle:'decimal',color:'#cbd5e1'}} dangerouslySetInnerHTML={{__html:mdInline(lines[i].trim().replace(/^\d+\.\s/,''))}} />);
        i++;
      }
      out.push(<ol key={i} style={{margin:'12px 0'}}>{items}</ol>);
      continue;
    }

    const para = [tr]; i++;
    while (i < lines.length && lines[i].trim() && !lines[i].trim().startsWith('#') && !lines[i].trim().startsWith('|') && !lines[i].trim().startsWith('```') && !lines[i].trim().startsWith('- ') && !lines[i].trim().startsWith('> ') && !/^\d+\. /.test(lines[i].trim()) && !/^!\[/.test(lines[i].trim())) {
      para.push(lines[i].trim()); i++;
    }
    out.push(<p key={i} style={{margin:'12px 0',color:'#cbd5e1',fontSize:'0.875rem',lineHeight:1.7}} dangerouslySetInnerHTML={{__html:mdInline(para.join(' '))}} />);
  }
  return <div style={{padding:'4px 0'}}>{out}</div>;
}

// ── Login screen ──────────────────────────────────────────────────
function LoginScreen({ onLogin }) {
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const tryLogin = async () => {
    if (!token.trim()) return;
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/thought-leadership/admin', {
        headers: { 'x-admin-token': token.trim() },
      });
      if (res.ok) {
        sessionStorage.setItem('steep_admin_token', token.trim());
        onLogin(token.trim());
      } else if (res.status === 401) {
        setError('Incorrect token — must match ADMIN_PUBLISH_TOKEN environment variable.');
      } else if (res.status === 403) {
        setError('ADMIN_PUBLISH_TOKEN is not set. Add it to your environment variables first.');
      } else {
        setError(`Unexpected error (${res.status}). Check the server logs.`);
      }
    } catch {
      setError('Could not reach the server. Is the app running?');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <a href="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-base font-black text-white">S</div>
          </a>
          <h1 className="text-white font-bold text-xl mb-1">Admin Portal</h1>
          <p className="text-slate-500 text-sm">Thought Leadership · STEEP Platform</p>
        </div>

        <form
          onSubmit={e => { e.preventDefault(); if (!loading && token.trim()) tryLogin(); }}
          className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl"
        >
          <label className="block text-xs text-slate-400 font-semibold uppercase tracking-widest mb-2">
            Admin Token
          </label>
          <input type="text" name="username" autoComplete="username" className="sr-only" aria-hidden="true" defaultValue="admin" readOnly tabIndex={-1} />
          <input
            type="password"
            value={token}
            onChange={e => setToken(e.target.value)}
            placeholder="Paste your ADMIN_PUBLISH_TOKEN…"
            autoFocus
            autoComplete="current-password"
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder-slate-600 focus:border-blue-500 focus:outline-none mb-3 transition-colors"
          />
          {error && (
            <div className="mb-3 p-3 rounded-lg bg-red-950 border border-red-800">
              <p className="text-red-300 text-xs leading-relaxed">{error}</p>
            </div>
          )}
          <button
            type="submit"
            disabled={loading || !token.trim()}
            className="w-full py-2.5 rounded-lg text-sm font-bold text-white disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-opacity"
            style={{ background: 'linear-gradient(135deg,#2563eb,#7c3aed)' }}
          >
            {loading ? <><Spinner /> Checking…</> : 'Sign In'}
          </button>
        </form>

        <p className="text-center text-slate-600 text-xs mt-5 leading-relaxed">
          Set <code className="bg-slate-800 px-1.5 py-0.5 rounded text-slate-400">ADMIN_PUBLISH_TOKEN</code> in your
          environment variables, then enter that same value here.
        </p>

        <div className="text-center mt-4">
          <a href="/" className="text-slate-600 hover:text-slate-400 text-xs transition-colors">← Back to platform</a>
        </div>
      </div>
    </div>
  );
}

// ── Upload zone sub-component ─────────────────────────────────────
function UploadZone({ label, accept, icon, file, onFile, hint }) {
  const [drag, setDrag] = useState(false);
  const inputRef = useRef(null);

  const handleDrop = (e) => {
    e.preventDefault();
    setDrag(false);
    const f = e.dataTransfer.files[0];
    if (f) onFile(f);
  };

  return (
    <label
      className={`block border-2 border-dashed rounded-xl p-4 cursor-pointer transition-colors text-center ${
        drag ? 'border-blue-500 bg-blue-950/30' : file ? 'border-emerald-700 bg-emerald-950/20' : 'border-slate-700 hover:border-slate-500 bg-slate-900/50'
      }`}
      onDragOver={e => { e.preventDefault(); setDrag(true); }}
      onDragLeave={() => setDrag(false)}
      onDrop={handleDrop}
    >
      <input type="file" accept={accept} className="sr-only" onChange={e => e.target.files[0] && onFile(e.target.files[0])} />
      <div className="text-2xl mb-1.5">{file ? '✅' : icon}</div>
      {file ? (
        <div>
          <p className="text-emerald-400 text-xs font-semibold truncate max-w-full">{file.name}</p>
          <p className="text-slate-600 text-xs mt-0.5">{(file.size / 1024).toFixed(0)} KB — click to replace</p>
        </div>
      ) : (
        <div>
          <p className="text-slate-300 text-xs font-semibold mb-0.5">{label}</p>
          <p className="text-slate-600 text-xs">{hint}</p>
        </div>
      )}
    </label>
  );
}

// ── Post editor ───────────────────────────────────────────────────
function PostEditor({ token, post, onBack, onSaved }) {
  const isNew = !post?.id;
  const [form, setForm] = useState({
    title: post?.title || '',
    dek: post?.dek || '',
    contentMarkdown: post?.contentMarkdown || '',
    heroImageUrl: post?.heroImageUrl || '',
    geoKeywords: (post?.geoKeywords || []).join(', '),
    status: post?.status || 'draft',
  });
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');
  const [saveMsgType, setSaveMsgType] = useState('success');
  const [preview, setPreview] = useState(false);
  const [postId, setPostId] = useState(post?.id || null);

  // ── Textarea ref for cursor-position image insertion ───────────
  const contentRef = useRef(null);

  // ── Inline image upload state ──────────────────────────────────
  const [imgUploading, setImgUploading] = useState(false);
  const [imgUploadErr, setImgUploadErr] = useState('');
  const imgInputRef = useRef(null);

  const uploadImage = async (file) => {
    if (!file) return;
    setImgUploading(true);
    setImgUploadErr('');
    try {
      const fd = new FormData();
      fd.append('image', file);
      const res = await fetch('/api/upload-image', { method: 'POST', headers: { 'x-admin-token': token }, body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');
      const md = `\n\n![${file.name.replace(/\.[^.]+$/, '')}](${data.url})\n\n`;
      const ta = contentRef.current;
      if (ta) {
        const start = ta.selectionStart ?? ta.value.length;
        const before = ta.value.slice(0, start);
        const after  = ta.value.slice(start);
        setForm(f => ({ ...f, contentMarkdown: before + md + after }));
        setTimeout(() => { ta.selectionStart = ta.selectionEnd = start + md.length; ta.focus(); }, 50);
      } else {
        setForm(f => ({ ...f, contentMarkdown: f.contentMarkdown + md }));
      }
    } catch (e) { setImgUploadErr(e.message); }
    setImgUploading(false);
  };

  const uploadHeroImage = async (file) => {
    if (!file) return;
    setImgUploading(true);
    setImgUploadErr('');
    try {
      const fd = new FormData();
      fd.append('image', file);
      const res = await fetch('/api/upload-image', { method: 'POST', headers: { 'x-admin-token': token }, body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');
      setForm(f => ({ ...f, heroImageUrl: data.url }));
    } catch (e) { setImgUploadErr(e.message); }
    setImgUploading(false);
  };

  // ── Document import state ──────────────────────────────────────
  const [showDocs, setShowDocs] = useState(true);
  const [wordFile, setWordFile] = useState(null);
  const [reportFile, setReportFile] = useState(null);
  const [extractedWord, setExtractedWord] = useState('');
  const [extractedReport, setExtractedReport] = useState('');
  const [extracting, setExtracting] = useState(null); // 'word' | 'report' | null
  const [extractErr, setExtractErr] = useState('');
  const [refining, setRefining] = useState(false);
  const [refineMsg, setRefineMsg] = useState('');
  const [refineMsgType, setRefineMsgType] = useState('success');

  // ── Extract document text ──────────────────────────────────────
  const extractFile = async (file, key) => {
    setExtracting(key);
    setExtractErr('');
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/extract-document', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Extraction failed');
      if (key === 'word') setExtractedWord(data.text);
      else setExtractedReport(data.text);
    } catch (e) {
      setExtractErr(e.message);
    }
    setExtracting(null);
  };

  // ── AI refinement ──────────────────────────────────────────────
  const refineContent = async (mode) => {
    const articleText = mode === 'refine' ? (extractedWord || form.contentMarkdown) : form.contentMarkdown;
    if (!articleText && !extractedReport) { setRefineMsg('No content to refine'); setRefineMsgType('error'); return; }
    setRefining(true);
    setRefineMsg('');
    try {
      const res = await fetch('/api/refine-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: articleText,
          reportText: mode === 'integrate' ? extractedReport : undefined,
          mode,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Refinement failed');
      setForm(f => ({ ...f, contentMarkdown: data.refined }));
      setRefineMsg(mode === 'integrate' ? `STEEP data integrated — ${data.tokens?.toLocaleString() || '—'} tokens used` : `Article optimized — ${data.tokens?.toLocaleString() || '—'} tokens used`);
      setRefineMsgType('success');
    } catch (e) {
      setRefineMsg(e.message);
      setRefineMsgType('error');
    }
    setRefining(false);
  };

  // Handle word file change: auto-extract
  const handleWordFile = async (f) => {
    setWordFile(f);
    setExtractedWord('');
    await extractFile(f, 'word');
  };

  // Handle report file change: auto-extract
  const handleReportFile = async (f) => {
    setReportFile(f);
    setExtractedReport('');
    await extractFile(f, 'report');
  };

  const save = async (publish = false) => {
    if (!form.title.trim()) { setSaveMsg('Title is required'); setSaveMsgType('error'); return; }
    setSaving(true);
    setSaveMsg('');
    const payload = {
      ...(postId ? { id: postId } : {}),
      title: form.title.trim(),
      dek: form.dek.trim(),
      contentMarkdown: form.contentMarkdown,
      heroImageUrl: form.heroImageUrl || '',
      geoKeywords: form.geoKeywords.split(',').map(s => s.trim()).filter(Boolean),
      status: publish ? 'published' : 'draft',
    };
    try {
      const res = await fetch('/api/thought-leadership/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-token': token },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const data = await res.json();
        setPostId(data.post.id);
        setForm(f => ({ ...f, status: data.post.status }));
        setSaveMsg(publish ? 'Published!' : 'Saved as draft');
        setSaveMsgType('success');
        onSaved();
      } else {
        setSaveMsg('Error saving — check server logs');
        setSaveMsgType('error');
      }
    } catch {
      setSaveMsg('Network error');
      setSaveMsgType('error');
    }
    setSaving(false);
  };

  const isPublished = form.status === 'published';

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Sticky header */}
      <div className="sticky top-0 z-10 bg-slate-950/95 backdrop-blur border-b border-slate-800">
        <div className="max-w-5xl mx-auto px-4 md:px-6 py-3 flex items-center gap-3 flex-wrap">
          <button
            onClick={onBack}
            className="text-slate-400 hover:text-white text-sm flex items-center gap-1.5 transition-colors flex-shrink-0"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M9 2L4 7l5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            All posts
          </button>

          <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${isPublished ? POSTURE_COLORS.published : POSTURE_COLORS.draft}`}>
            {isPublished ? 'Published' : 'Draft'}
          </span>

          <div className="flex-1" />

          {/* Preview toggle */}
          <div className="flex bg-slate-800 rounded-lg p-0.5 border border-slate-700">
            <button onClick={() => setPreview(false)} className={`px-3 py-1 rounded text-xs font-medium transition-colors ${!preview ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'}`}>Write</button>
            <button onClick={() => setPreview(true)} className={`px-3 py-1 rounded text-xs font-medium transition-colors ${preview ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'}`}>Preview</button>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {saveMsg && (
              <span className={`text-xs font-medium ${saveMsgType === 'error' ? 'text-red-400' : 'text-emerald-400'}`}>
                {saveMsg}
              </span>
            )}
            <button
              onClick={() => save(false)}
              disabled={saving}
              className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-slate-700 text-white hover:bg-slate-600 disabled:opacity-40 transition-colors"
            >
              {saving ? 'Saving…' : 'Save Draft'}
            </button>
            <button
              onClick={() => save(true)}
              disabled={saving}
              className="px-4 py-1.5 rounded-lg text-xs font-bold text-white disabled:opacity-40 transition-opacity"
              style={{ background: 'linear-gradient(135deg,#2563eb,#7c3aed)' }}
            >
              {isPublished ? 'Update' : 'Publish'}
            </button>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="max-w-5xl mx-auto px-4 md:px-6 py-8">
        {preview ? (
          /* ── Preview ── */
          <div className="max-w-3xl">
            {form.heroImageUrl && (
              <div className="mb-8 rounded-2xl overflow-hidden">
                <img src={form.heroImageUrl} alt={form.title} className="w-full object-cover" style={{ maxHeight: 360 }} />
              </div>
            )}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-white mb-3 leading-tight">{form.title || <span className="text-slate-700">Untitled</span>}</h1>
              {form.dek && <p className="text-lg text-slate-400 leading-relaxed mb-4">{form.dek}</p>}
              {form.geoKeywords && (
                <div className="flex flex-wrap gap-1.5">
                  {form.geoKeywords.split(',').map(k => k.trim()).filter(Boolean).map(k => (
                    <span key={k} className="text-xs px-2.5 py-0.5 rounded-full bg-blue-950 text-blue-300 border border-blue-800">{k}</span>
                  ))}
                </div>
              )}
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
              {form.contentMarkdown ? (
                <MarkdownPreview md={form.contentMarkdown} />
              ) : (
                <p className="text-slate-700 text-sm italic">No content yet.</p>
              )}
            </div>
          </div>
        ) : (
          /* ── Write ── */
          <div className="space-y-5">
            {/* Title */}
            <input
              type="text"
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder="Article title…"
              className="w-full bg-transparent text-2xl md:text-3xl font-bold text-white placeholder-slate-700 focus:outline-none border-b border-slate-800 pb-4"
            />

            {/* Dek */}
            <input
              type="text"
              value={form.dek}
              onChange={e => setForm(f => ({ ...f, dek: e.target.value }))}
              placeholder="Subtitle — a short sentence that hooks the reader…"
              className="w-full bg-transparent text-base md:text-lg text-slate-400 placeholder-slate-700 focus:outline-none border-b border-slate-800 pb-4"
            />

            {/* Cover image */}
            <div className="flex items-start gap-3">
              <span className="text-xs text-slate-500 font-semibold uppercase tracking-widest mt-2 flex-shrink-0 w-20">Cover</span>
              <div className="flex-1 space-y-2">
                {form.heroImageUrl ? (
                  <div className="relative group">
                    <img src={form.heroImageUrl} alt="Cover" className="w-full rounded-xl object-cover" style={{ maxHeight: 200 }} />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center gap-3">
                      <label className="cursor-pointer px-3 py-1.5 bg-slate-800 text-white text-xs rounded-lg font-semibold hover:bg-slate-700 transition-colors">
                        Replace
                        <input type="file" accept="image/*" className="hidden" onChange={e => { if (e.target.files?.[0]) uploadHeroImage(e.target.files[0]); e.target.value = ''; }} />
                      </label>
                      <button onClick={() => setForm(f => ({ ...f, heroImageUrl: '' }))} className="px-3 py-1.5 bg-red-900 text-red-200 text-xs rounded-lg font-semibold hover:bg-red-800 transition-colors">Remove</button>
                    </div>
                    {imgUploading && <div className="absolute inset-0 bg-black/60 rounded-xl flex items-center justify-center"><Spinner /></div>}
                  </div>
                ) : (
                  <label className={`flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-xl py-6 cursor-pointer transition-colors ${imgUploading ? 'border-blue-700 bg-blue-950/20' : 'border-slate-700 hover:border-slate-600 bg-slate-900/50'}`}>
                    {imgUploading ? <Spinner /> : <span className="text-2xl">🖼️</span>}
                    <span className="text-xs text-slate-500">{imgUploading ? 'Uploading…' : 'Upload cover image · JPEG, PNG, WebP, GIF'}</span>
                    <input type="file" accept="image/*" className="hidden" disabled={imgUploading} onChange={e => { if (e.target.files?.[0]) uploadHeroImage(e.target.files[0]); e.target.value = ''; }} />
                  </label>
                )}
                {imgUploadErr && <p className="text-xs text-red-400">{imgUploadErr}</p>}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-600">or paste URL:</span>
                  <input
                    type="url"
                    value={form.heroImageUrl.startsWith('/uploads/') ? '' : form.heroImageUrl}
                    onChange={e => setForm(f => ({ ...f, heroImageUrl: e.target.value }))}
                    placeholder="https://…"
                    className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1 text-xs text-white placeholder-slate-700 focus:outline-none focus:border-slate-600"
                  />
                </div>
              </div>
            </div>

            {/* Tags */}
            <div className="flex items-start gap-3">
              <span className="text-xs text-slate-500 font-semibold uppercase tracking-widest mt-2 flex-shrink-0 w-20">GEO Tags</span>
              <input
                type="text"
                value={form.geoKeywords}
                onChange={e => setForm(f => ({ ...f, geoKeywords: e.target.value }))}
                placeholder="e.g. tariffs, China, supply chain (comma-separated)"
                className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-600 focus:border-blue-500 focus:outline-none"
              />
            </div>

            {/* Status toggle */}
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-500 font-semibold uppercase tracking-widest flex-shrink-0 w-20">Status</span>
              <div className="flex bg-slate-800 rounded-lg p-0.5 border border-slate-700">
                <button
                  onClick={() => setForm(f => ({ ...f, status: 'draft' }))}
                  className={`px-4 py-1 rounded text-xs font-semibold transition-colors ${form.status !== 'published' ? 'bg-slate-600 text-white' : 'text-slate-400 hover:text-white'}`}
                >Draft</button>
                <button
                  onClick={() => setForm(f => ({ ...f, status: 'published' }))}
                  className={`px-4 py-1 rounded text-xs font-semibold transition-colors ${form.status === 'published' ? 'bg-emerald-700 text-white' : 'text-slate-400 hover:text-white'}`}
                >Published</button>
              </div>
            </div>

            {/* ── Document Import Panel ── */}
            <div className="border border-slate-800 rounded-2xl overflow-hidden">
              {/* Panel header */}
              <button
                onClick={() => setShowDocs(v => !v)}
                className="w-full flex items-center justify-between px-5 py-3.5 bg-slate-900 hover:bg-slate-800/80 transition-colors text-left"
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-base">📎</span>
                  <span className="text-xs font-semibold text-slate-300 uppercase tracking-widest">Document Import & AI Optimization</span>
                  {(extractedWord || extractedReport) && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-900 text-emerald-300 border border-emerald-700 font-semibold">
                      {[extractedWord && 'Article', extractedReport && 'STEEP'].filter(Boolean).join(' + ')} ready
                    </span>
                  )}
                </div>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className={`text-slate-500 transition-transform ${showDocs ? 'rotate-180' : ''}`}>
                  <path d="M2 4l5 5 5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>

              {showDocs && (
                <div className="px-5 py-5 space-y-5 bg-slate-950">

                  {/* Upload row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Word document */}
                    <div>
                      <p className="text-xs text-slate-500 font-semibold uppercase tracking-widest mb-2">Word Document</p>
                      <UploadZone
                        label="Upload .docx article"
                        accept=".docx,.doc"
                        icon="📄"
                        file={wordFile}
                        onFile={handleWordFile}
                        hint="Drop or click · .docx / .doc"
                      />
                      {extracting === 'word' && (
                        <div className="mt-2 flex items-center gap-2 text-xs text-blue-400">
                          <Spinner /> Extracting text…
                        </div>
                      )}
                      {extractedWord && extracting !== 'word' && (
                        <div className="mt-2">
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-xs text-emerald-400 font-semibold">
                              ✓ {extractedWord.split(/\s+/).filter(Boolean).length.toLocaleString()} words extracted
                            </p>
                          </div>
                          <div className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 max-h-24 overflow-y-auto">
                            <p className="text-xs text-slate-500 font-mono leading-relaxed line-clamp-4 whitespace-pre-wrap">{extractedWord.slice(0, 300)}…</p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* STEEP report */}
                    <div>
                      <p className="text-xs text-slate-500 font-semibold uppercase tracking-widest mb-2">STEEP Report PDF</p>
                      <UploadZone
                        label="Upload exported STEEP report"
                        accept=".pdf"
                        icon="📊"
                        file={reportFile}
                        onFile={handleReportFile}
                        hint="Drop or click · .pdf"
                      />
                      {extracting === 'report' && (
                        <div className="mt-2 flex items-center gap-2 text-xs text-blue-400">
                          <Spinner /> Reading report…
                        </div>
                      )}
                      {extractedReport && extracting !== 'report' && (
                        <div className="mt-2">
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-xs text-emerald-400 font-semibold">
                              ✓ STEEP report loaded · {reportFile?.name}
                            </p>
                          </div>
                          <div className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 max-h-24 overflow-y-auto">
                            <p className="text-xs text-slate-500 font-mono leading-relaxed line-clamp-4 whitespace-pre-wrap">{extractedReport.slice(0, 300)}…</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Error */}
                  {extractErr && (
                    <div className="p-3 rounded-xl bg-red-950 border border-red-800">
                      <p className="text-red-300 text-xs">{extractErr}</p>
                    </div>
                  )}

                  {/* AI action row */}
                  <div className="border-t border-slate-800 pt-4">
                    <p className="text-xs text-slate-500 mb-3 leading-relaxed">
                      Use AI to transform your documents into a polished, publication-ready article.
                    </p>
                    <div className="flex flex-wrap items-center gap-3">

                      {/* Refine Word doc */}
                      <button
                        onClick={() => refineContent('refine')}
                        disabled={refining || (!extractedWord && !form.contentMarkdown) || !!extracting}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
                        style={{ background: 'linear-gradient(135deg,#1d4ed8,#4f46e5)' }}
                        title="Optimize structure, tone, and format of the Word document content"
                      >
                        {refining ? <><Spinner /> Optimizing…</> : (
                          <>
                            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M1 6h10M6 1l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                            Optimize Article Format
                          </>
                        )}
                      </button>

                      {/* Integrate STEEP */}
                      <button
                        onClick={() => refineContent('integrate')}
                        disabled={refining || !extractedReport || !!extracting}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
                        style={{ background: 'linear-gradient(135deg,#065f46,#1e3a5f)' }}
                        title="Weave STEEP report data and visuals into the article content"
                      >
                        {refining ? <><Spinner /> Integrating…</> : (
                          <>
                            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1.5"/><path d="M4 6h4M6 4v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                            Integrate STEEP Data
                          </>
                        )}
                      </button>

                      {/* Status */}
                      {refining && (
                        <span className="text-xs text-blue-400 flex items-center gap-1.5">
                          <Spinner /> AI is writing…
                        </span>
                      )}
                      {refineMsg && !refining && (
                        <span className={`text-xs font-medium ${refineMsgType === 'error' ? 'text-red-400' : 'text-emerald-400'}`}>
                          {refineMsgType === 'success' ? '✓ ' : '✗ '}{refineMsg}
                        </span>
                      )}
                    </div>

                    {/* Helper hints */}
                    <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div className="bg-slate-900 rounded-xl px-4 py-3 border border-slate-800">
                        <p className="text-xs font-semibold text-blue-300 mb-1">Optimize Article Format</p>
                        <p className="text-xs text-slate-500 leading-relaxed">Polishes structure, tone, and markdown layout of your Word doc or existing draft. Preserves all insights — no content is invented.</p>
                      </div>
                      <div className="bg-slate-900 rounded-xl px-4 py-3 border border-slate-800">
                        <p className="text-xs font-semibold text-emerald-300 mb-1">Integrate STEEP Data</p>
                        <p className="text-xs text-slate-500 leading-relaxed">Weaves your STEEP report's findings — drivers, signals, roadmap milestones, posture — into the article. Requires a STEEP PDF upload.</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Markdown editor */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-slate-500 font-semibold uppercase tracking-widest">Content (Markdown)</p>
                <div className="flex flex-wrap gap-3 text-xs text-slate-600">
                  {[
                    ['# H1', '# '],['## H2','## '],['**Bold**','**bold**'],['*Italic*','*italic*'],
                    ['`Code`','`code`'],['- List','- item'],['> Quote','> '],
                  ].map(([label, insert]) => (
                    <button
                      key={label}
                      onClick={() => {
                        const ta = contentRef.current;
                        if (ta) {
                          const start = ta.selectionStart ?? ta.value.length;
                          const before = ta.value.slice(0, start);
                          const after  = ta.value.slice(start);
                          const newVal = before + insert + after;
                          setForm(f => ({ ...f, contentMarkdown: newVal }));
                          setTimeout(() => { ta.selectionStart = ta.selectionEnd = start + insert.length; ta.focus(); }, 20);
                        } else {
                          setForm(f => ({ ...f, contentMarkdown: f.contentMarkdown + insert }));
                        }
                      }}
                      className="hover:text-slate-300 transition-colors font-mono"
                    >{label}</button>
                  ))}
                  <label className={`cursor-pointer flex items-center gap-1 hover:text-slate-300 transition-colors ${imgUploading ? 'opacity-50 pointer-events-none' : ''}`}>
                    {imgUploading ? <Spinner /> : '🖼'}
                    <span className="font-mono">Insert Image</span>
                    <input ref={imgInputRef} type="file" accept="image/*" className="hidden" disabled={imgUploading} onChange={e => { if (e.target.files?.[0]) uploadImage(e.target.files[0]); e.target.value = ''; }} />
                  </label>
                </div>
              </div>
              <textarea
                ref={contentRef}
                value={form.contentMarkdown}
                onChange={e => setForm(f => ({ ...f, contentMarkdown: e.target.value }))}
                placeholder={`Write your article in Markdown…\n\n## Introduction\n\nStart with a strong opening paragraph that sets the geopolitical context.\n\n## Key Findings\n\n- First finding\n- Second finding\n\n## Conclusion\n\nEnd with a strategic implication or call to action.`}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-5 py-4 text-sm text-slate-200 placeholder-slate-700 focus:outline-none focus:border-slate-600 font-mono leading-loose resize-none transition-colors"
                style={{ minHeight: 520 }}
              />
              <div className="mt-1.5 flex justify-between text-xs text-slate-600">
                <span>{form.contentMarkdown.split(/\s+/).filter(Boolean).length} words</span>
                <span>{form.contentMarkdown.length.toLocaleString()} chars</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Innovator Illumination post editor ────────────────────────────
function IIPostEditor({ token, post, onBack, onSaved }) {
  const isNew = !post?.id;
  const [form, setForm] = useState({
    title:           post?.title           || '',
    logoUrl:         post?.logoUrl         || '',
    techSegment:     post?.techSegment     || '',
    solutionOverview: post?.solutionOverview || '',
    contentMarkdown: post?.contentMarkdown || '',
    heroImageUrl:    post?.heroImageUrl    || '',
    geoKeywords:     (post?.geoKeywords || []).join(', '),
    status:          post?.status          || 'draft',
  });
  const [saving, setSaving]     = useState(false);
  const [saveMsg, setSaveMsg]   = useState('');
  const [saveMsgType, setSaveMsgType] = useState('success');
  const [preview, setPreview]   = useState(false);
  const [postId, setPostId]     = useState(post?.id || null);

  const contentRef = useRef(null);
  const [imgUploading, setImgUploading] = useState(false);
  const [imgUploadErr, setImgUploadErr] = useState('');
  const logoInputRef = useRef(null);
  const heroInputRef = useRef(null);

  const uploadFile = async (file, field) => {
    setImgUploading(true); setImgUploadErr('');
    try {
      const fd = new FormData();
      fd.append('image', file);
      const res = await fetch('/api/upload-image', { method: 'POST', headers: { 'x-admin-token': token }, body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');
      setForm(f => ({ ...f, [field]: data.url }));
    } catch (e) { setImgUploadErr(e.message); }
    setImgUploading(false);
  };

  const uploadInlineImage = async (file) => {
    setImgUploading(true); setImgUploadErr('');
    try {
      const fd = new FormData();
      fd.append('image', file);
      const res = await fetch('/api/upload-image', { method: 'POST', headers: { 'x-admin-token': token }, body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');
      const md = `\n\n![${file.name.replace(/\.[^.]+$/, '')}](${data.url})\n\n`;
      const ta = contentRef.current;
      if (ta) {
        const start = ta.selectionStart ?? ta.value.length;
        setForm(f => ({ ...f, contentMarkdown: f.contentMarkdown.slice(0, start) + md + f.contentMarkdown.slice(start) }));
        setTimeout(() => { ta.selectionStart = ta.selectionEnd = start + md.length; ta.focus(); }, 50);
      } else {
        setForm(f => ({ ...f, contentMarkdown: f.contentMarkdown + md }));
      }
    } catch (e) { setImgUploadErr(e.message); }
    setImgUploading(false);
  };

  const save = async (publish = false) => {
    if (!form.title.trim()) { setSaveMsg('Company name is required'); setSaveMsgType('error'); return; }
    setSaving(true); setSaveMsg('');
    const payload = {
      ...(postId ? { id: postId } : {}),
      title:           form.title.trim(),
      logoUrl:         form.logoUrl.trim(),
      techSegment:     form.techSegment.trim(),
      solutionOverview: form.solutionOverview.trim(),
      contentMarkdown: form.contentMarkdown,
      heroImageUrl:    form.heroImageUrl || '',
      geoKeywords:     form.geoKeywords.split(',').map(s => s.trim()).filter(Boolean),
      status: publish ? 'published' : 'draft',
    };
    try {
      const res = await fetch('/api/innovator-illumination/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-token': token },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const data = await res.json();
        setPostId(data.post.id);
        setForm(f => ({ ...f, status: data.post.status }));
        setSaveMsg(publish ? 'Published!' : 'Saved as draft');
        setSaveMsgType('success');
        onSaved();
      } else {
        setSaveMsg('Error saving — check server logs');
        setSaveMsgType('error');
      }
    } catch { setSaveMsg('Network error'); setSaveMsgType('error'); }
    setSaving(false);
  };

  const isPublished = form.status === 'published';

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="sticky top-0 z-10 bg-slate-950/95 backdrop-blur border-b border-slate-800">
        <div className="max-w-5xl mx-auto px-4 md:px-6 py-3 flex items-center gap-3 flex-wrap">
          <button onClick={onBack} className="text-slate-400 hover:text-white text-sm flex items-center gap-1.5 transition-colors flex-shrink-0">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M9 2L4 7l5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            All innovators
          </button>
          <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${isPublished ? POSTURE_COLORS.published : POSTURE_COLORS.draft}`}>
            {isPublished ? 'Published' : 'Draft'}
          </span>
          <div className="flex-1" />
          <div className="flex bg-slate-800 rounded-lg p-0.5 border border-slate-700">
            <button onClick={() => setPreview(false)} className={`px-3 py-1 rounded text-xs font-medium transition-colors ${!preview ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'}`}>Edit</button>
            <button onClick={() => setPreview(true)} className={`px-3 py-1 rounded text-xs font-medium transition-colors ${preview ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'}`}>Card Preview</button>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {saveMsg && <span className={`text-xs font-medium ${saveMsgType === 'error' ? 'text-red-400' : 'text-emerald-400'}`}>{saveMsg}</span>}
            <button onClick={() => save(false)} disabled={saving} className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-slate-700 text-white hover:bg-slate-600 disabled:opacity-40 transition-colors">{saving ? 'Saving…' : 'Save Draft'}</button>
            <button onClick={() => save(true)} disabled={saving} className="px-4 py-1.5 rounded-lg text-xs font-bold text-white disabled:opacity-40 transition-opacity" style={{ background: 'linear-gradient(135deg,#0891b2,#6d28d9)' }}>
              {isPublished ? 'Update' : 'Publish'}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 md:px-6 py-8">
        {preview ? (
          /* Card preview */
          <div className="max-w-sm">
            <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold mb-4">Card preview</p>
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
              {form.heroImageUrl && (
                <div className="h-28 overflow-hidden bg-slate-800">
                  <img src={form.heroImageUrl} alt={form.title} className="w-full h-full object-cover" onError={e => { e.currentTarget.parentElement.style.display='none'; }} />
                </div>
              )}
              <div className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg border border-slate-700 bg-slate-800 flex-shrink-0 overflow-hidden flex items-center justify-center">
                    {form.logoUrl ? <img src={form.logoUrl} alt={form.title} className="w-full h-full object-contain p-1" onError={e => { e.currentTarget.style.display='none'; }} />
                      : <span className="text-white text-sm font-black">{(form.title||'?')[0].toUpperCase()}</span>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-white font-bold text-sm leading-tight truncate">{form.title || 'Company Name'}</h3>
                    {form.techSegment && <span className="text-xs px-1.5 py-0.5 rounded-full font-medium mt-0.5 inline-block" style={{ background: '#0891b215', color: '#22d3ee' }}>{form.techSegment}</span>}
                  </div>
                </div>
                {form.solutionOverview && <p className="text-slate-400 text-xs leading-relaxed mb-3 line-clamp-2">{form.solutionOverview}</p>}
                {form.geoKeywords && (
                  <div className="flex flex-wrap gap-1">
                    {form.geoKeywords.split(',').map(t => t.trim()).filter(Boolean).slice(0, 3).map((t, i) => (
                      <span key={i} className="text-xs px-1.5 py-0.5 rounded bg-slate-800 text-slate-500">{t}</span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* Edit form */
          <div className="space-y-5 max-w-3xl">
            {/* Logo */}
            <div>
              <p className="text-xs text-slate-500 font-semibold uppercase tracking-widest mb-2">Company Logo</p>
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-xl border border-slate-700 bg-slate-900 flex-shrink-0 overflow-hidden flex items-center justify-center">
                  {form.logoUrl ? <img src={form.logoUrl} alt="" className="w-full h-full object-contain p-1" onError={e => { e.currentTarget.style.display='none'; }} />
                    : <span className="text-slate-600 text-xl font-black">{form.title ? form.title[0].toUpperCase() : '?'}</span>}
                </div>
                <div className="flex-1 space-y-2">
                  <input value={form.logoUrl} onChange={e => setForm(f => ({ ...f, logoUrl: e.target.value }))}
                    placeholder="https://example.com/logo.png"
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white text-xs placeholder-slate-600 focus:outline-none focus:border-slate-600" />
                  <label className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-dashed border-slate-700 hover:border-slate-500 text-slate-500 hover:text-slate-300 text-xs cursor-pointer ${imgUploading ? 'opacity-40 pointer-events-none' : ''}`}>
                    {imgUploading ? <Spinner /> : '⬆'} Upload logo
                    <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={e => { if (e.target.files?.[0]) uploadFile(e.target.files[0], 'logoUrl'); e.target.value = ''; }} />
                  </label>
                </div>
              </div>
            </div>

            {/* Company name */}
            <input type="text" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder="Company name…"
              className="w-full bg-transparent text-2xl md:text-3xl font-bold text-white placeholder-slate-700 focus:outline-none border-b border-slate-800 pb-4" />

            {/* Tech segment */}
            <div className="flex items-start gap-3">
              <span className="text-xs text-slate-500 font-semibold uppercase tracking-widest mt-2 flex-shrink-0 w-24">Segment</span>
              <input type="text" value={form.techSegment} onChange={e => setForm(f => ({ ...f, techSegment: e.target.value }))}
                placeholder="e.g. AI Infrastructure, Quantum, Climate Tech…"
                className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-600 focus:border-blue-500 focus:outline-none" />
            </div>

            {/* Solution overview */}
            <div className="flex items-start gap-3">
              <span className="text-xs text-slate-500 font-semibold uppercase tracking-widest mt-2 flex-shrink-0 w-24">Tagline</span>
              <input type="text" value={form.solutionOverview} onChange={e => setForm(f => ({ ...f, solutionOverview: e.target.value }))}
                placeholder="One-line description of what this company does…"
                className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-600 focus:border-blue-500 focus:outline-none" />
            </div>

            {/* Cover image */}
            <div className="flex items-start gap-3">
              <span className="text-xs text-slate-500 font-semibold uppercase tracking-widest mt-2 flex-shrink-0 w-24">Cover</span>
              <div className="flex-1 space-y-2">
                {form.heroImageUrl ? (
                  <div className="relative group">
                    <img src={form.heroImageUrl} alt="Cover" className="w-full rounded-xl object-cover" style={{ maxHeight: 160 }} />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center gap-3">
                      <label className="cursor-pointer px-3 py-1.5 bg-slate-800 text-white text-xs rounded-lg font-semibold hover:bg-slate-700">
                        Replace<input type="file" accept="image/*" className="hidden" onChange={e => { if (e.target.files?.[0]) uploadFile(e.target.files[0], 'heroImageUrl'); e.target.value = ''; }} />
                      </label>
                      <button onClick={() => setForm(f => ({ ...f, heroImageUrl: '' }))} className="px-3 py-1.5 bg-red-900 text-red-200 text-xs rounded-lg font-semibold hover:bg-red-800">Remove</button>
                    </div>
                  </div>
                ) : (
                  <label className={`flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-xl py-5 cursor-pointer transition-colors ${imgUploading ? 'border-blue-700' : 'border-slate-700 hover:border-slate-600 bg-slate-900/50'}`}>
                    {imgUploading ? <Spinner /> : <span className="text-2xl">🖼️</span>}
                    <span className="text-xs text-slate-500">{imgUploading ? 'Uploading…' : 'Upload cover image'}</span>
                    <input ref={heroInputRef} type="file" accept="image/*" className="hidden" disabled={imgUploading} onChange={e => { if (e.target.files?.[0]) uploadFile(e.target.files[0], 'heroImageUrl'); e.target.value = ''; }} />
                  </label>
                )}
                {imgUploadErr && <p className="text-xs text-red-400">{imgUploadErr}</p>}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-600">or paste URL:</span>
                  <input type="url" value={form.heroImageUrl.startsWith('/uploads/') ? '' : form.heroImageUrl}
                    onChange={e => setForm(f => ({ ...f, heroImageUrl: e.target.value }))}
                    placeholder="https://…"
                    className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1 text-xs text-white placeholder-slate-700 focus:outline-none focus:border-slate-600" />
                </div>
              </div>
            </div>

            {/* GEO Tags */}
            <div className="flex items-start gap-3">
              <span className="text-xs text-slate-500 font-semibold uppercase tracking-widest mt-2 flex-shrink-0 w-24">GEO Tags</span>
              <input type="text" value={form.geoKeywords} onChange={e => setForm(f => ({ ...f, geoKeywords: e.target.value }))}
                placeholder="e.g. AI, defence tech, semiconductor (comma-separated)"
                className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-600 focus:border-blue-500 focus:outline-none" />
            </div>

            {/* Markdown editor */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-slate-500 font-semibold uppercase tracking-widest">Full Profile (Markdown)</p>
                <label className={`cursor-pointer flex items-center gap-1 text-xs text-slate-600 hover:text-slate-300 transition-colors ${imgUploading ? 'opacity-50 pointer-events-none' : ''}`}>
                  {imgUploading ? <Spinner /> : '🖼'}
                  <span className="font-mono">Insert Image</span>
                  <input type="file" accept="image/*" className="hidden" disabled={imgUploading} onChange={e => { if (e.target.files?.[0]) uploadInlineImage(e.target.files[0]); e.target.value = ''; }} />
                </label>
              </div>
              <textarea ref={contentRef} value={form.contentMarkdown} onChange={e => setForm(f => ({ ...f, contentMarkdown: e.target.value }))}
                placeholder={`Write the company profile in Markdown…\n\n## Overview\n\nWhat the company does and why it matters.\n\n## Key Capabilities\n\n- Capability 1\n- Capability 2\n\n## Strategic Relevance\n\nWhy this innovator matters geopolitically.`}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-5 py-4 text-sm text-slate-200 placeholder-slate-700 focus:outline-none focus:border-slate-600 font-mono leading-loose resize-none transition-colors"
                style={{ minHeight: 400 }} />
              <div className="mt-1.5 flex justify-between text-xs text-slate-600">
                <span>{form.contentMarkdown.split(/\s+/).filter(Boolean).length} words</span>
                <span>{form.contentMarkdown.length.toLocaleString()} chars</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Innovator Illumination post list ──────────────────────────────
function IIPostList({ token, posts, loading, onNew, onEdit, onRefresh, onLogout, onSwitchSection }) {
  const [actionId, setActionId] = useState(null);

  const togglePublish = async (post) => {
    setActionId(post.id);
    const newStatus = post.status === 'published' ? 'draft' : 'published';
    await fetch('/api/innovator-illumination/admin', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'x-admin-token': token },
      body: JSON.stringify({ id: post.id, status: newStatus }),
    });
    await onRefresh();
    setActionId(null);
  };

  const deletePost = async (post) => {
    if (!confirm(`Delete "${post.title || 'this innovator'}"? This cannot be undone.`)) return;
    setActionId(post.id);
    await fetch('/api/innovator-illumination/admin', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', 'x-admin-token': token },
      body: JSON.stringify({ id: post.id }),
    });
    await onRefresh();
    setActionId(null);
  };

  const published = posts.filter(p => p.status === 'published');
  const drafts    = posts.filter(p => p.status !== 'published');

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="sticky top-0 z-10 bg-slate-950/95 backdrop-blur border-b border-slate-800">
        <div className="max-w-5xl mx-auto px-4 md:px-6 py-4 flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black text-white" style={{ background: 'linear-gradient(135deg,#0891b2,#6d28d9)' }}>💡</div>
            <span className="font-bold text-white text-sm">Innovator Illumination</span>
          </div>
          <a href="/" className="text-slate-600 hover:text-slate-400 text-xs transition-colors">← Platform</a>

          {/* Section tabs */}
          <div className="flex bg-slate-800 rounded-lg p-0.5 border border-slate-700">
            <button onClick={onSwitchSection} className="px-3 py-1 rounded text-xs font-medium text-slate-400 hover:text-white transition-colors">Thought Leadership</button>
            <button className="px-3 py-1 rounded text-xs font-medium bg-slate-700 text-white">Innovators</button>
          </div>

          <div className="flex-1" />
          <div className="text-xs text-slate-600">
            <span className="text-emerald-400 font-semibold">{published.length}</span> published
            <span className="mx-1.5">·</span>
            <span className="text-slate-500 font-semibold">{drafts.length}</span> drafts
          </div>
          <button onClick={onNew} className="px-4 py-1.5 rounded-lg text-xs font-bold text-white" style={{ background: 'linear-gradient(135deg,#0891b2,#6d28d9)' }}>+ Add Innovator</button>
          <button onClick={onLogout} className="text-xs text-slate-600 hover:text-slate-400 transition-colors">Sign out</button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 md:px-6 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-20"><Spinner /><span className="text-slate-500 text-sm ml-3">Loading…</span></div>
        ) : posts.length === 0 ? (
          <div className="text-center py-24">
            <div className="text-5xl mb-4">💡</div>
            <p className="text-white font-semibold mb-1">No innovator profiles yet</p>
            <p className="text-slate-500 text-sm mb-6">Add the first solution provider spotlight.</p>
            <button onClick={onNew} className="px-6 py-2.5 rounded-xl text-sm font-bold text-white" style={{ background: 'linear-gradient(135deg,#0891b2,#6d28d9)' }}>Add first innovator</button>
          </div>
        ) : (
          <div className="space-y-3">
            {posts.map(post => {
              const isActing    = actionId === post.id;
              const isPublished = post.status === 'published';
              return (
                <div key={post.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-start gap-4 hover:border-slate-700 transition-colors">
                  {/* Logo */}
                  <div className="w-10 h-10 rounded-lg border border-slate-700 bg-slate-800 flex-shrink-0 overflow-hidden flex items-center justify-center">
                    {post.logoUrl ? <img src={post.logoUrl} alt={post.title} className="w-full h-full object-contain p-1" onError={e => { e.currentTarget.style.display='none'; }} />
                      : <span className="text-white text-sm font-black">{(post.title||'?')[0].toUpperCase()}</span>}
                  </div>
                  <div className="flex-1 min-w-0 cursor-pointer" onClick={() => onEdit(post)}>
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${isPublished ? POSTURE_COLORS.published : POSTURE_COLORS.draft}`}>
                        {isPublished ? 'Published' : 'Draft'}
                      </span>
                      {post.techSegment && <span className="text-xs px-2 py-0.5 rounded font-medium" style={{ background: '#0891b215', color: '#22d3ee' }}>{post.techSegment}</span>}
                      {(post.geoKeywords || []).slice(0, 3).map(k => (
                        <span key={k} className="text-xs px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-900">{k}</span>
                      ))}
                      <span className="text-xs text-slate-600 sm:ml-auto">
                        {post.updatedAt ? new Date(post.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                      </span>
                    </div>
                    <h3 className="text-white font-semibold text-sm leading-snug mb-0.5">{post.title || <span className="text-slate-600 italic">Untitled</span>}</h3>
                    {post.solutionOverview && <p className="text-slate-500 text-xs leading-relaxed line-clamp-2">{post.solutionOverview}</p>}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button onClick={() => onEdit(post)} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white transition-colors">Edit</button>
                    <button onClick={() => togglePublish(post)} disabled={isActing}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-40 ${isPublished ? 'bg-amber-950 text-amber-300 hover:bg-amber-900 border border-amber-900' : 'bg-emerald-950 text-emerald-300 hover:bg-emerald-900 border border-emerald-900'}`}>
                      {isActing ? '…' : isPublished ? 'Unpublish' : 'Publish'}
                    </button>
                    <button onClick={() => deletePost(post)} disabled={isActing} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-red-950 text-red-400 hover:bg-red-900 border border-red-900 transition-colors disabled:opacity-40">Delete</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Post list ─────────────────────────────────────────────────────
function PostList({ token, posts, loading, onNew, onEdit, onRefresh, onLogout, onSwitchSection }) {
  const [actionId, setActionId] = useState(null);

  const togglePublish = async (post) => {
    setActionId(post.id);
    const newStatus = post.status === 'published' ? 'draft' : 'published';
    await fetch('/api/thought-leadership/admin', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'x-admin-token': token },
      body: JSON.stringify({ id: post.id, status: newStatus }),
    });
    await onRefresh();
    setActionId(null);
  };

  const deletePost = async (post) => {
    if (!confirm(`Delete "${post.title || 'this post'}"? This cannot be undone.`)) return;
    setActionId(post.id);
    await fetch('/api/thought-leadership/admin', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', 'x-admin-token': token },
      body: JSON.stringify({ id: post.id }),
    });
    await onRefresh();
    setActionId(null);
  };

  const published = posts.filter(p => p.status === 'published');
  const drafts = posts.filter(p => p.status !== 'published');

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-slate-950/95 backdrop-blur border-b border-slate-800">
        <div className="max-w-5xl mx-auto px-4 md:px-6 py-4 flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-xs font-black text-white">S</div>
            <span className="font-bold text-white text-sm">Thought Leadership</span>
          </div>
          <a href="/" className="text-slate-600 hover:text-slate-400 text-xs transition-colors">← Platform</a>

          {/* Section tabs */}
          <div className="flex bg-slate-800 rounded-lg p-0.5 border border-slate-700">
            <button className="px-3 py-1 rounded text-xs font-medium bg-slate-700 text-white">Thought Leadership</button>
            <button onClick={onSwitchSection} className="px-3 py-1 rounded text-xs font-medium text-slate-400 hover:text-white transition-colors">Innovators</button>
          </div>

          <div className="flex-1" />
          <div className="text-xs text-slate-600">
            <span className="text-emerald-400 font-semibold">{published.length}</span> published
            <span className="mx-1.5">·</span>
            <span className="text-slate-500 font-semibold">{drafts.length}</span> drafts
          </div>
          <button
            onClick={onNew}
            className="px-4 py-1.5 rounded-lg text-xs font-bold text-white"
            style={{ background: 'linear-gradient(135deg,#2563eb,#7c3aed)' }}
          >
            + New Post
          </button>
          <button onClick={onLogout} className="text-xs text-slate-600 hover:text-slate-400 transition-colors">Sign out</button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 md:px-6 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Spinner />
            <span className="text-slate-500 text-sm ml-3">Loading posts…</span>
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-24">
            <div className="w-14 h-14 rounded-2xl bg-slate-800 flex items-center justify-center text-2xl mx-auto mb-4">✍</div>
            <p className="text-white font-semibold mb-1">No posts yet</p>
            <p className="text-slate-500 text-sm mb-6">Create your first GEO intelligence brief.</p>
            <button onClick={onNew} className="px-6 py-2.5 rounded-xl text-sm font-bold text-white" style={{ background: 'linear-gradient(135deg,#2563eb,#7c3aed)' }}>
              Create first post
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {posts.map(post => {
              const isActing = actionId === post.id;
              const isPublished = post.status === 'published';
              return (
                <div
                  key={post.id}
                  className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-start gap-4 hover:border-slate-700 transition-colors"
                >
                  <div className="flex-1 min-w-0 cursor-pointer" onClick={() => onEdit(post)}>
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${isPublished ? POSTURE_COLORS.published : POSTURE_COLORS.draft}`}>
                        {isPublished ? 'Published' : 'Draft'}
                      </span>
                      {(post.geoKeywords || []).slice(0, 4).map(k => (
                        <span key={k} className="text-xs px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-900">{k}</span>
                      ))}
                      <span className="text-xs text-slate-600 sm:ml-auto">
                        {post.updatedAt
                          ? new Date(post.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                          : '—'}
                      </span>
                    </div>
                    <h3 className="text-white font-semibold text-sm leading-snug mb-1">
                      {post.title || <span className="text-slate-600 italic">Untitled</span>}
                    </h3>
                    {post.dek && (
                      <p className="text-slate-500 text-xs leading-relaxed line-clamp-2">{post.dek}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => onEdit(post)}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
                    >Edit</button>
                    <button
                      onClick={() => togglePublish(post)}
                      disabled={isActing}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-40 ${
                        isPublished
                          ? 'bg-amber-950 text-amber-300 hover:bg-amber-900 border border-amber-900'
                          : 'bg-emerald-950 text-emerald-300 hover:bg-emerald-900 border border-emerald-900'
                      }`}
                    >
                      {isActing ? '…' : isPublished ? 'Unpublish' : 'Publish'}
                    </button>
                    <button
                      onClick={() => deletePost(post)}
                      disabled={isActing}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium bg-red-950 text-red-400 hover:bg-red-900 border border-red-900 transition-colors disabled:opacity-40"
                    >Delete</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Root admin page ───────────────────────────────────────────────
export default function AdminPage() {
  const [token, setToken]             = useState(null);
  const [section, setSection]         = useState('tl'); // 'tl' | 'ii'
  const [posts, setPosts]             = useState([]);
  const [iiPosts, setIIPosts]         = useState([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [iiLoading, setIILoading]     = useState(false);
  const [view, setView]               = useState('list'); // 'list' | 'editor'
  const [editPost, setEditPost]       = useState(null);

  useEffect(() => {
    const stored = sessionStorage.getItem('steep_admin_token');
    if (stored) setToken(stored);
  }, []);

  const fetchPosts = useCallback(async (tok) => {
    const t = tok || token;
    if (!t) return;
    setPostsLoading(true);
    try {
      const res = await fetch('/api/thought-leadership/admin', { headers: { 'x-admin-token': t } });
      if (res.ok) {
        const data = await res.json();
        const loadedPosts = data.posts || [];
        setPosts(loadedPosts);
        const autoId = new URLSearchParams(window.location.search).get('postId');
        if (autoId) {
          const target = loadedPosts.find(p => p.id === autoId);
          if (target) { setEditPost(target); setView('editor'); }
        }
      }
    } catch {}
    setPostsLoading(false);
  }, [token]);

  const fetchIIPosts = useCallback(async (tok) => {
    const t = tok || token;
    if (!t) return;
    setIILoading(true);
    try {
      const res = await fetch('/api/innovator-illumination/admin', { headers: { 'x-admin-token': t } });
      if (res.ok) {
        const data = await res.json();
        setIIPosts(data.posts || []);
      }
    } catch {}
    setIILoading(false);
  }, [token]);

  useEffect(() => {
    if (token) { fetchPosts(token); fetchIIPosts(token); }
  }, [token, fetchPosts, fetchIIPosts]);

  const handleLogin = (tok) => {
    setToken(tok);
    fetchPosts(tok);
    fetchIIPosts(tok);
  };

  const logout = () => {
    sessionStorage.removeItem('steep_admin_token');
    setToken(null);
    setPosts([]);
    setIIPosts([]);
  };

  const openEditor = (post = null) => { setEditPost(post); setView('editor'); };
  const backToList = () => { setView('list'); setEditPost(null); };

  if (!token) return <LoginScreen onLogin={handleLogin} />;

  // II section
  if (section === 'ii') {
    if (view === 'editor') {
      return (
        <IIPostEditor
          token={token}
          post={editPost}
          onBack={backToList}
          onSaved={() => fetchIIPosts(token)}
        />
      );
    }
    return (
      <IIPostList
        token={token}
        posts={iiPosts}
        loading={iiLoading}
        onNew={() => openEditor(null)}
        onEdit={(post) => openEditor(post)}
        onRefresh={() => fetchIIPosts(token)}
        onLogout={logout}
        onSwitchSection={() => { setSection('tl'); setView('list'); setEditPost(null); }}
      />
    );
  }

  // TL section (default)
  if (view === 'editor') {
    return (
      <PostEditor
        token={token}
        post={editPost}
        onBack={backToList}
        onSaved={() => fetchPosts(token)}
      />
    );
  }

  return (
    <PostList
      token={token}
      posts={posts}
      loading={postsLoading}
      onNew={() => openEditor(null)}
      onEdit={(post) => openEditor(post)}
      onRefresh={() => fetchPosts(token)}
      onLogout={logout}
      onSwitchSection={() => { setSection('ii'); setView('list'); setEditPost(null); }}
    />
  );
}
