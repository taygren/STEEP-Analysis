'use client';

function tlInlineHtml(raw) {
  return raw
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/__(.+?)__/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/_(.+?)_/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code class="sa-code">$1</code>')
    .replace(/!\[([^\]]*)\]\(([^)\s"]+)[^)]*\)/g,
      (_, alt, url) => `<img src="${url}" alt="${alt || 'Image'}" style="max-width:100%;border-radius:8px;display:block;margin:10px auto" />`)
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g,
      '<a href="$2" target="_blank" rel="noopener noreferrer" class="sa-link">$1</a>');
}

export default function StandaloneMarkdown({ md }) {
  if (!md) return null;
  const normalised = md.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const lines = normalised.split('\n');
  const out = [];
  let i = 0, k = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();
    if (!trimmed) { i++; continue; }

    if (trimmed.startsWith('```')) {
      const codeLines = []; i++;
      while (i < lines.length && !lines[i].trim().startsWith('```')) { codeLines.push(lines[i]); i++; }
      i++;
      out.push(
        <pre key={k++} className="sa-pre bg-slate-900 border border-slate-800 rounded-xl px-5 py-4 text-xs text-slate-300 font-mono overflow-x-auto my-5 leading-relaxed">
          <code>{codeLines.join('\n')}</code>
        </pre>
      );
      continue;
    }

    const imgM = trimmed.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
    if (imgM) {
      const [, alt, url] = imgM;
      out.push(
        <figure key={k++} className="my-7">
          <img src={url} alt={alt || ''} className="w-full rounded-2xl object-cover shadow-lg" style={{ maxHeight: 420 }} onError={e => { e.currentTarget.style.display = 'none'; }} />
          {alt && <figcaption className="text-center text-xs text-slate-500 mt-2 italic">{alt}</figcaption>}
        </figure>
      );
      i++; continue;
    }

    if (/^(-{3,}|\*{3,}|_{3,})$/.test(trimmed)) {
      out.push(<hr key={k++} className="sa-hr border-slate-800 my-8" />);
      i++; continue;
    }

    if (trimmed.startsWith('|')) {
      const tableLines = [];
      while (i < lines.length && lines[i].trim().startsWith('|')) { tableLines.push(lines[i].trim()); i++; }
      const isSep = (row) => /^\|[\s|:-]+\|$/.test(row);
      const parseRow = (row) => row.replace(/^\||\|$/g, '').split('|').map(c => c.trim());
      const dataRows = tableLines.filter(r => !isSep(r));
      if (dataRows.length > 0) {
        const hdrs = parseRow(dataRows[0]);
        const bodyRows = dataRows.slice(1).map(parseRow);
        out.push(
          <div key={k++} className="my-6 overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-slate-800/70">
                  {hdrs.map((h, idx) => (
                    <th key={idx} className="sa-th text-left px-4 py-2.5 text-slate-300 font-semibold text-xs uppercase tracking-wider border-b border-slate-700"
                      dangerouslySetInnerHTML={{ __html: tlInlineHtml(h) }} />
                  ))}
                </tr>
              </thead>
              <tbody>
                {bodyRows.map((row, ridx) => (
                  <tr key={ridx} className={ridx % 2 === 0 ? 'bg-slate-900/40' : 'bg-slate-900/20'}>
                    {hdrs.map((_, cidx) => (
                      <td key={cidx} className="sa-td px-4 py-2 text-slate-300 text-xs border-b border-slate-800/60"
                        dangerouslySetInnerHTML={{ __html: tlInlineHtml(row[cidx] ?? '') }} />
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      }
      continue;
    }

    if (trimmed.startsWith('#### ')) { out.push(<h4 key={k++} className="sa-h4 text-slate-300 text-sm font-bold mt-5 mb-1.5" dangerouslySetInnerHTML={{ __html: tlInlineHtml(trimmed.slice(5)) }} />); i++; continue; }
    if (trimmed.startsWith('### '))  { out.push(<h3 key={k++} className="sa-h3 text-slate-200 text-base font-bold mt-6 mb-2" dangerouslySetInnerHTML={{ __html: tlInlineHtml(trimmed.slice(4)) }} />); i++; continue; }
    if (trimmed.startsWith('## '))   { out.push(<h2 key={k++} className="sa-h2 text-white text-xl font-bold mt-8 mb-3 leading-snug pb-2 border-b border-slate-800" dangerouslySetInnerHTML={{ __html: tlInlineHtml(trimmed.slice(3)) }} />); i++; continue; }
    if (trimmed.startsWith('# '))    { out.push(<h1 key={k++} className="sa-h1 text-white text-2xl font-black mt-8 mb-3 leading-tight" dangerouslySetInnerHTML={{ __html: tlInlineHtml(trimmed.slice(2)) }} />); i++; continue; }

    if (trimmed.startsWith('> ')) {
      const ql = [];
      while (i < lines.length && lines[i].trim().startsWith('> ')) { ql.push(lines[i].trim().slice(2)); i++; }
      out.push(
        <blockquote key={k++} className="border-l-4 border-blue-500 pl-5 py-0.5 my-5">
          <p className="sa-p text-slate-300 italic text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: tlInlineHtml(ql.join(' ')) }} />
        </blockquote>
      );
      continue;
    }

    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      const items = [];
      while (i < lines.length && (lines[i].trim().startsWith('- ') || lines[i].trim().startsWith('* '))) {
        const t = lines[i].trim();
        items.push(<li key={i} className="sa-li text-slate-300 text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: tlInlineHtml(t.slice(2)) }} />);
        i++;
      }
      out.push(<ul key={k++} className="my-4 pl-5 space-y-1.5 list-disc marker:text-slate-600">{items}</ul>);
      continue;
    }

    if (/^\d+\.\s/.test(trimmed)) {
      const items = [];
      while (i < lines.length && /^\d+\.\s/.test(lines[i].trim())) {
        items.push(<li key={i} className="sa-li text-slate-300 text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: tlInlineHtml(lines[i].trim().replace(/^\d+\.\s/, '')) }} />);
        i++;
      }
      out.push(<ol key={k++} className="my-4 pl-5 space-y-1.5 list-decimal marker:text-slate-500">{items}</ol>);
      continue;
    }

    const para = [];
    while (i < lines.length) {
      const t = lines[i].trim();
      if (!t) break;
      if (t.startsWith('#') || t.startsWith('- ') || t.startsWith('* ') || /^\d+\.\s/.test(t) || t.startsWith('> ') || t.startsWith('```') || t.startsWith('|') || /^!\[/.test(t) || /^(-{3,}|\*{3,}|_{3,})$/.test(t)) break;
      para.push(lines[i]);
      i++;
    }
    if (para.length) {
      out.push(<p key={k++} className="sa-p text-slate-300 text-sm leading-relaxed mb-4" dangerouslySetInnerHTML={{ __html: tlInlineHtml(para.join('\n')) }} />);
    }
  }
  return <>{out}</>;
}
