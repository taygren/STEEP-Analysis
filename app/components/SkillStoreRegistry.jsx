'use client';

import { useState } from 'react';

export default function SkillStoreRegistry() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');
  const [copiedId, setCopiedId] = useState(null);

  const skills = [
    {
      id: 'doc-parser',
      name: 'Mammoth Document Extractor',
      category: 'Data Utility',
      desc: 'Parses raw Microsoft Word (.docx) files into clean, semantic Markdown layout structures. Preserves layout tables and structural headers without inventing new content.',
      inputs: 'file (.docx), options',
      outputs: 'markdown (string)',
      model: 'System CPU / JS Parser',
      prompt: 'Clean and format the extracted string into plain Markdown. Fix whitespace and table formats while keeping exact verbatim quotes.'
    },
    {
      id: 'steep-synthesis',
      name: 'STEEP Synthesis Orchestration',
      category: 'Agent Synthesis',
      desc: 'Fuses five separate dimension briefings (Social, Tech, Econ, Env, Political) into a unified executive report containing overall posture verdicts and roadmap timeline items.',
      inputs: 'dimensionBriefings (json)',
      outputs: 'executiveReport (json)',
      model: 'Llama-3.3-70B',
      prompt: 'Do not restate dimension summaries. Find the cross-dimension story. Identify dominant causal vectors. Strategic implications must start with a verb.'
    },
    {
      id: 'dalio-debt-sustainability',
      name: 'Dalio Debt Scorer',
      category: 'Geoecon Scorer',
      desc: 'Sequential scoring system mapping interest rate-growth differentials (i-g) and classifying central bank monetary policy stages (MP1/MP2/MP3) to trace sovereign debt solvency.',
      inputs: 'sovereignBalanceSheet (json), gdpGrowth (float)',
      outputs: 'ponziFinanceAlert (boolean), mpStage (string)',
      model: 'Llama-3.3-70B / Cerebras Qwen',
      prompt: 'Classify sovereign debt. Check bubble conditions: price compared to history, purchase leverage levels, capacity to print money. Output Spider\'s Move vector.'
    },
    {
      id: 'geo-gate-auditor',
      name: 'GEO Live Quality Auditor',
      category: 'Compliance',
      desc: 'Audits draft text against strict Generative Engine Optimization (GEO) standards. Scans for confidence hedges, prohibited filler phrases, em-dashes, and checks statistics count.',
      inputs: 'content (string), keywords (array)',
      outputs: 'warnings (array), hedgeCount (int)',
      model: 'Client-side RegEx Engine',
      prompt: 'Regex queries monitoring target terms: [could potentially, may indicate, delve into, key takeaways]. Ensure quantitative density target >= 4.'
    },
    {
      id: 'correlation-loop',
      name: 'Semantic Correlation Engine',
      category: 'Agent Synthesis',
      desc: 'Indexes new thought leadership drafts and maps them against active sector feeds to trace overlapping nodes and establish narrative continuity.',
      inputs: 'draft (string), activeSignals (array)',
      outputs: 'linkedNodes (array), continuityContext (string)',
      model: 'Embedding Model Llama-3.3',
      prompt: 'Analyze semantic coordinates. Connect draft topics to CISA cybersecurity reports or Crunchbase funding indicators to generate topic link maps.'
    }
  ];

  const handleCopy = (id, text) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredSkills = skills.filter(s => {
    if (filter !== 'All' && s.category !== filter) return false;
    if (search.trim()) {
      const hay = [s.name, s.desc, s.category].join(' ').toLowerCase();
      if (!hay.includes(search.toLowerCase())) return false;
    }
    return true;
  });

  const categories = ['All', 'Data Utility', 'Agent Synthesis', 'Geoecon Scorer', 'Compliance'];

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-6 fade-in space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <span>⚙️</span>
            Agent Skill Store
          </h1>
          <p className="text-slate-500 text-xs mt-0.5">Registry of active capabilities, system prompts &amp; schemas</p>
        </div>
        
        {/* Search */}
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search skills..."
          className="bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-1.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-slate-700 min-w-[200px]"
        />
      </div>

      {/* Categories nav */}
      <div className="flex flex-wrap gap-1.5">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`text-xs px-3.5 py-1.5 rounded-full font-medium transition-colors ${filter === cat ? 'bg-indigo-900 text-indigo-200 border border-indigo-700' : 'bg-slate-900 text-slate-500 hover:text-white border border-slate-800'}`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filteredSkills.map(skill => (
          <div key={skill.id} className="glass-panel border border-slate-850 rounded-2xl p-5 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-white font-bold text-sm leading-tight">{skill.name}</h3>
                <span className="text-[9px] px-2 py-0.5 rounded-full bg-slate-900 text-slate-500 border border-slate-800 font-mono font-bold uppercase tracking-wider">{skill.category}</span>
              </div>
              
              <p className="text-slate-400 text-xs leading-relaxed">{skill.desc}</p>
              
              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-900 text-[11px] font-mono">
                <div>
                  <span className="text-slate-600 block uppercase tracking-wider text-[9px] font-bold">Input schema</span>
                  <span className="text-slate-400 truncate block mt-0.5">{skill.inputs}</span>
                </div>
                <div>
                  <span className="text-slate-600 block uppercase tracking-wider text-[9px] font-bold">Inference Engine</span>
                  <span className="text-indigo-400 truncate block mt-0.5">{skill.model}</span>
                </div>
              </div>
            </div>

            <div className="pt-4 mt-4 border-t border-slate-900 flex items-center justify-between">
              <span className="text-[10px] text-slate-500 truncate max-w-[200px]">Prompt seed integrated</span>
              <button
                onClick={() => handleCopy(skill.id, skill.prompt)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${copiedId === skill.id ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700 hover:text-white'}`}
              >
                {copiedId === skill.id ? '✓ Copied' : 'Copy Prompt Seed'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
