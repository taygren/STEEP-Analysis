'use client';

import { useState, useReducer, useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';

// ═══════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════

const RECOMMENDED_MODEL = 'llama3.2:3b';

const CATALOG = [
  { id: 'llama3.2:3b',  label: 'Llama 3.2 3B',    size: '~2 GB', note: 'Recommended — pre-installed, CPU-friendly' },
  { id: 'llama3.1:8b',  label: 'Llama 3.1 8B',    size: '~5 GB', note: 'Best quality — pull to use' },
  { id: 'mistral:7b',   label: 'Mistral 7B',       size: '~4 GB', note: 'Fast, solid reasoning' },
  { id: 'qwen2.5:7b',   label: 'Qwen 2.5 7B',     size: '~5 GB', note: 'Excellent JSON adherence' },
  { id: 'phi4:14b',     label: 'Phi-4 14B',        size: '~9 GB', note: 'Highest quality, needs 16 GB VRAM' },
];

const COLORS = {
  Social:        '#3B82F6',
  Technological: '#8B5CF6',
  Economic:      '#10B981',
  Environmental: '#14B8A6',
  Political:     '#F97316',
};

const DIR_CLS = {
  ACCELERATING:  'bg-green-900  text-green-300  border border-green-700',
  EMERGING:      'bg-yellow-900 text-yellow-300 border border-yellow-700',
  STABLE:        'bg-blue-900   text-blue-300   border border-blue-700',
  DECELERATING:  'bg-red-900    text-red-300    border border-red-700',
  'net positive':'bg-green-900  text-green-300  border border-green-700',
  'net negative':'bg-red-900    text-red-300    border border-red-700',
  mixed:         'bg-yellow-900 text-yellow-300 border border-yellow-700',
  uncertain:     'bg-slate-700  text-slate-300  border border-slate-600',
  positive:      'bg-green-900  text-green-300  border border-green-700',
  negative:      'bg-red-900    text-red-300    border border-red-700',
};

const IMPACT_CLS = {
  high:   'bg-red-900    text-red-300',
  medium: 'bg-yellow-900 text-yellow-300',
  low:    'bg-slate-700  text-slate-400',
};

// ═══════════════════════════════════════════════════════════════════
// SYSTEM PROMPTS  (concise for 7-8B local models)
// ═══════════════════════════════════════════════════════════════════

const SOCIAL_PROMPT = (subj, type) => `You are a Social dimension STEEP analyst. Analyze social forces affecting "${subj}" (${type}).
Cover: demographics, consumer behavior, labor/work trends, cultural norms, public trust, digital literacy, social license.
Use your training knowledge through 2024. Return ONLY a valid JSON object — no prose, no markdown fences.

{
  "dimension":"Social","summary":"2-3 sentence directional assessment","dominant_direction":"ACCELERATING|STABLE|DECELERATING|EMERGING","dimension_confidence":0.75,
  "drivers":[{"name":"","direction":"positive|negative|mixed","impact":"high|medium|low","velocity":"HIGH|MEDIUM|LOW","description":"","evidence":["",""],"confidence":0.8}],
  "signals":[{"signal":"","confidence":0.7,"why_it_matters":""}],
  "opportunities":[""],"risks":[""],"disruption_paths":[""],
  "forecast":[{"time_horizon":"0-12 months","trigger":"","description":""},{"time_horizon":"1-3 years","trigger":"","description":""},{"time_horizon":"3-7 years","trigger":"","description":""}],
  "social_license_status":"strong|stable|at risk|contested|absent"
}
Provide exactly 3-5 drivers, 3 signals, 3 opportunities, 3 risks, 2 disruption_paths.`;

const TECH_PROMPT = (subj, type) => `You are a Technological dimension STEEP analyst. Analyze technology forces affecting "${subj}" (${type}).
Cover: tech maturity, AI/automation, infrastructure, platforms, standards, IP, cybersecurity, R&D pipeline, convergence effects.
Use your training knowledge through 2024. Return ONLY a valid JSON object — no prose, no markdown fences.

{
  "dimension":"Technological","summary":"2-3 sentence directional assessment","dominant_direction":"ACCELERATING|STABLE|DECELERATING|EMERGING","dimension_confidence":0.75,
  "technology_maturity_stage":"emerging|growth|mature|declining",
  "drivers":[{"name":"","direction":"positive|negative|mixed","impact":"high|medium|low","velocity":"HIGH|MEDIUM|LOW","description":"","evidence":["",""],"confidence":0.8,"nonlinearity_flag":"none|convergence jump|platform tipping point|commoditization collapse|substitution inflection"}],
  "signals":[{"signal":"","confidence":0.7,"why_it_matters":""}],
  "opportunities":[""],"risks":[""],"disruption_paths":[""],
  "forecast":[{"time_horizon":"0-12 months","trigger":"","description":""},{"time_horizon":"1-3 years","trigger":"","description":""},{"time_horizon":"3-7 years","trigger":"","description":""}],
  "ip_position":"strong|moderate|weak|unknown"
}
Provide exactly 3-5 drivers, 3 signals, 3 opportunities, 3 risks, 2 disruption_paths.`;

const ECON_PROMPT = (subj, type) => `You are an Economic dimension STEEP analyst. Analyze economic forces affecting "${subj}" (${type}).
Cover: macro conditions, capital markets, market structure, pricing/margins, demand elasticity, labor costs, supply chain, trade policy, FX.
Use your training knowledge through 2024. Return ONLY a valid JSON object — no prose, no markdown fences.

{
  "dimension":"Economic","summary":"2-3 sentence directional assessment","dominant_direction":"ACCELERATING|STABLE|DECELERATING|EMERGING","dimension_confidence":0.75,
  "macro_regime":"expansion|late cycle|contraction|recovery|uncertain",
  "drivers":[{"name":"","direction":"positive|negative|mixed","impact":"high|medium|low","velocity":"HIGH|MEDIUM|LOW","cyclicality":"cyclical|structural|cycle-amplified structural","description":"","evidence":["",""],"confidence":0.8}],
  "signals":[{"signal":"","confidence":0.7,"why_it_matters":""}],
  "opportunities":[""],"risks":[""],"disruption_paths":[""],
  "forecast":[{"time_horizon":"0-12 months","trigger":"","description":""},{"time_horizon":"1-3 years","trigger":"","description":""},{"time_horizon":"3-7 years","trigger":"","description":""}],
  "investment_attractiveness":"high|moderate|low|uncertain"
}
Provide exactly 3-5 drivers, 3 signals, 3 opportunities, 3 risks, 2 disruption_paths.`;

const ENV_PROMPT = (subj, type) => `You are an Environmental dimension STEEP analyst. Analyze environmental forces affecting "${subj}" (${type}).
Cover: climate risk, energy use/intensity, carbon/emissions, water/resource constraints, sustainability mandates, ESG compliance, circular economy.
Use your training knowledge through 2024. Return ONLY a valid JSON object — no prose, no markdown fences.

{
  "dimension":"Environmental","summary":"2-3 sentence directional assessment","dominant_direction":"ACCELERATING|STABLE|DECELERATING|EMERGING","dimension_confidence":0.75,
  "energy_intensity":"very high|high|moderate|low|minimal|unknown",
  "drivers":[{"name":"","direction":"positive|negative|mixed","impact":"high|medium|low","velocity":"HIGH|MEDIUM|LOW","risk_type":"physical|transition|regulatory|resource|reputational","description":"","evidence":["",""],"confidence":0.8}],
  "signals":[{"signal":"","confidence":0.7,"why_it_matters":""}],
  "opportunities":[""],"risks":[""],"disruption_paths":[""],
  "forecast":[{"time_horizon":"0-12 months","trigger":"","description":""},{"time_horizon":"1-3 years","trigger":"","description":""},{"time_horizon":"3-7 years","trigger":"","description":""}],
  "sustainability_commitment":"leading|on track|lagging|absent|unknown"
}
Provide exactly 3-5 drivers, 3 signals, 3 opportunities, 3 risks, 2 disruption_paths.`;

const POL_PROMPT = (subj, type) => `You are a Political dimension STEEP analyst. Analyze political forces affecting "${subj}" (${type}).
Cover: regulation/compliance, legislation/policy, antitrust, trade tariffs, sanctions/export controls, geopolitics, industrial policy, data sovereignty.
Use your training knowledge through 2024. Return ONLY a valid JSON object — no prose, no markdown fences.

{
  "dimension":"Political","summary":"2-3 sentence directional assessment","dominant_direction":"ACCELERATING|STABLE|DECELERATING|EMERGING","dimension_confidence":0.75,
  "regulatory_stability":"stable and predictable|evolving actively|volatile and uncertain|absent/nascent",
  "drivers":[{"name":"","direction":"positive|negative|mixed","impact":"high|medium|low","velocity":"HIGH|MEDIUM|LOW","political_risk_type":"regulatory|legislative|geopolitical|policy continuity|enforcement|reputational/political","jurisdiction":"","description":"","evidence":["",""],"confidence":0.8}],
  "signals":[{"signal":"","confidence":0.7,"why_it_matters":""}],
  "opportunities":[""],"risks":[""],"disruption_paths":[""],
  "forecast":[{"time_horizon":"0-12 months","trigger":"","description":""},{"time_horizon":"1-3 years","trigger":"","description":""},{"time_horizon":"3-7 years","trigger":"","description":""}],
  "geopolitical_exposure":"high|medium|low|none|unknown"
}
Provide exactly 3-5 drivers, 3 signals, 3 opportunities, 3 risks, 2 disruption_paths.`;

const SYNTHESIS_PROMPT = (subj, type, data) => {
  const s = (d) => d ? `${d.dominant_direction} — ${d.summary}` : 'unavailable';
  const drivers = (d) => (d?.drivers || []).slice(0, 3).map(dr => `${dr.name} (${dr.direction}, ${dr.impact})`).join('; ');
  return `You are a STEEP synthesis analyst. Produce an integrated executive intelligence report for "${subj}" (${type}).

Dimension summaries:
- Social:        ${s(data.social)}        | Top drivers: ${drivers(data.social)}
- Technological: ${s(data.technological)} | Top drivers: ${drivers(data.technological)}
- Economic:      ${s(data.economic)}      | Top drivers: ${drivers(data.economic)}
- Environmental: ${s(data.environmental)} | Top drivers: ${drivers(data.environmental)}
- Political:     ${s(data.political)}     | Top drivers: ${drivers(data.political)}

Return ONLY a valid JSON object — no prose, no markdown fences.

{
  "overall_posture":"net positive|net negative|mixed|uncertain",
  "posture_rationale":"2-3 sentences explaining the overall STEEP posture",
  "executive_summary":"5-6 sentence comprehensive strategic assessment covering all five dimensions",
  "macro_forces":[{"name":"","dimensions":["Social"],"description":"","composite_score":0.75,"direction":"positive|negative|mixed"}],
  "cross_dimension_insights":[{"insight":"","dimensions_involved":["Social","Political"],"type":"reinforcing|countervailing|emerging","strategic_implication":""}],
  "top_takeaways":[""],
  "roadmap":{
    "near":[{"id":"n1","title":"","dimension":"Social","trigger":"","description":"","direction":"positive|negative|mixed","confidence":0.7,"catalyst_type":""}],
    "mid":[],
    "long":[]
  },
  "matrix_items":[{"id":"m1","title":"","type":"risk|opportunity|disruption","dimension":"Social","impact_score":3,"likelihood_score":3,"time_sensitivity":"near","description":"","confidence":0.7,"reversibility":"partially reversible"}]
}
Requirements:
- macro_forces: 3-5 cross-dimension forces
- cross_dimension_insights: 3-5 insights that ONLY emerge from dimension interactions — not single-dimension findings
- top_takeaways: 5-7 items, each must name "${subj}" explicitly and be specific (non-generic)
- roadmap: 3+ milestones in EACH horizon (near, mid, long)
- matrix_items: at least 3 risks + 3 opportunities + 3 disruptions (9+ total)`;
};

// ═══════════════════════════════════════════════════════════════════
// STATE MANAGEMENT
// ═══════════════════════════════════════════════════════════════════

const blankDims  = () => ({ social: null, technological: null, economic: null, environmental: null, political: null });
const blankStats = () => ({ social: 'idle', technological: 'idle', economic: 'idle', environmental: 'idle', political: 'idle', synthesis: 'idle' });

const initialState = {
  subject: '',
  subjectType: null,
  status: 'idle',           // idle | classifying | researching | synthesizing | complete | error
  agentStatuses: blankStats(),
  steepData: blankDims(),
  synthesis: null,
  activeTab: 'overview',
  matrixFilter: 'risks',
  roadmapFilter: [],
  selectedMatrixItem: null,
  error: null,
  // Ollama
  ollamaStatus: 'checking', // checking | online | offline
  ollamaVersion: null,
  availableModels: [],
  selectedModel: RECOMMENDED_MODEL,
  isPulling: false,
  pullProgress: null,       // { status, pct }
};

function reducer(state, action) {
  switch (action.type) {
    case 'SET_SUBJECT':       return { ...state, subject: action.payload };
    case 'SET_SELECTED_MODEL':return { ...state, selectedModel: action.payload };
    case 'SET_OLLAMA_STATUS': return { ...state, ollamaStatus: action.status, ollamaVersion: action.version ?? state.ollamaVersion };
    case 'SET_MODELS':        return { ...state, availableModels: action.payload };
    case 'SET_PULL_STATUS':   return { ...state, isPulling: action.isPulling, pullProgress: action.progress ?? null };
    case 'START_ANALYSIS':    return { ...state, status: 'classifying', error: null, steepData: blankDims(), synthesis: null, agentStatuses: blankStats() };
    case 'SET_SUBJECT_TYPE':  return { ...state, subjectType: action.payload, status: 'researching' };
    case 'SET_AGENT_STATUS':  return { ...state, agentStatuses: { ...state.agentStatuses, [action.dimension]: action.status } };
    case 'SET_STEEP_DATA':    return { ...state, steepData: { ...state.steepData, [action.dimension]: action.data } };
    case 'SET_SYNTHESIS':     return { ...state, synthesis: action.data, status: 'complete' };
    case 'SET_STATUS':        return { ...state, status: action.payload };
    case 'SET_ACTIVE_TAB':    return { ...state, activeTab: action.payload };
    case 'SET_MATRIX_FILTER': return { ...state, matrixFilter: action.payload };
    case 'TOGGLE_ROADMAP_FILTER': {
      const f = state.roadmapFilter, d = action.payload;
      return { ...state, roadmapFilter: f.includes(d) ? f.filter(x => x !== d) : [...f, d] };
    }
    case 'SET_SELECTED_MATRIX_ITEM': return { ...state, selectedMatrixItem: action.payload };
    case 'SET_ERROR': return { ...state, status: 'error', error: action.payload };
    default: return state;
  }
}

// ═══════════════════════════════════════════════════════════════════
// OLLAMA API UTILITIES
// ═══════════════════════════════════════════════════════════════════

/** Read an NDJSON stream, accumulate message content tokens, return full string. */
async function readOllamaStream(response) {
  const reader  = response.body.getReader();
  const decoder = new TextDecoder();
  let content = '';
  let buffer  = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    const lines = buffer.split('\n');
    buffer = lines.pop(); // hold incomplete last line

    for (const line of lines) {
      if (!line.trim()) continue;
      try {
        const chunk = JSON.parse(line);
        if (chunk.message?.content) content += chunk.message.content;
        if (chunk.done) return content;
        if (chunk.error) throw new Error(chunk.error);
      } catch (e) {
        if (e.message && !e.message.includes('JSON')) throw e;
      }
    }
  }

  // Flush remaining buffer
  if (buffer.trim()) {
    try {
      const chunk = JSON.parse(buffer);
      if (chunk.message?.content) content += chunk.message.content;
    } catch {}
  }

  return content;
}

/** Robustly extract a JSON object from raw LLM text. */
function extractJSON(text) {
  // Strip markdown fences if present
  let clean = text.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
  // Find outermost JSON object
  const start = clean.indexOf('{');
  const end   = clean.lastIndexOf('}');
  if (start === -1 || end === -1) throw new Error('No JSON object found in model output');
  return JSON.parse(clean.slice(start, end + 1));
}

/**
 * Coerce any value the model might return into a plain string.
 * Handles objects like {name, description}, arrays, numbers, etc.
 */
function toStr(v) {
  if (v === null || v === undefined) return '';
  if (typeof v === 'string') return v;
  if (typeof v === 'number' || typeof v === 'boolean') return String(v);
  if (Array.isArray(v)) return v.map(toStr).filter(Boolean).join('; ');
  if (typeof v === 'object') {
    // Common model patterns: {name, description}, {title, description}, {text}, {value}
    const s = v.name || v.title || v.text || v.value || v.content || v.signal || v.description || '';
    if (s) return toStr(s);
    return Object.values(v).filter(x => x != null && typeof x !== 'object').join(': ') || JSON.stringify(v);
  }
  return String(v);
}

/** Ensure an array field contains only strings. */
function toStrArr(arr) {
  if (!Array.isArray(arr)) return arr == null ? [] : [toStr(arr)];
  return arr.map(item => (typeof item === 'string' ? item : toStr(item)));
}

/**
 * Normalize agent/synthesis JSON so all leaf fields that should be strings
 * actually are — regardless of what the model returns.
 */
function normalizeAgentData(data) {
  if (!data || typeof data !== 'object') return data;
  const d = { ...data };

  // Top-level string fields
  ['summary', 'executive_summary', 'posture_rationale', 'strategic_headline',
   'dominant_direction', 'overall_posture', 'macro_regime', 'technology_maturity_stage',
   'social_license_status', 'ip_position', 'investment_attractiveness'].forEach(k => {
    if (k in d) d[k] = toStr(d[k]);
  });

  // Top-level string-array fields
  ['opportunities', 'risks', 'disruption_paths', 'key_themes',
   'top_takeaways', 'cross_dimensional_risks', 'convergence_opportunities'].forEach(k => {
    if (k in d) d[k] = toStrArr(d[k]);
  });

  // Drivers
  if (Array.isArray(d.drivers)) {
    d.drivers = d.drivers.map(dr => ({
      ...dr,
      name:        toStr(dr.name),
      description: toStr(dr.description),
      evidence:    toStrArr(dr.evidence || []),
    }));
  }

  // Signals
  if (Array.isArray(d.signals)) {
    d.signals = d.signals.map(sig => ({
      ...sig,
      signal:         toStr(sig.signal),
      why_it_matters: toStr(sig.why_it_matters),
    }));
  }

  // Per-dimension forecasts
  if (Array.isArray(d.forecast)) {
    d.forecast = d.forecast.map(fc => ({
      ...fc,
      trigger:     toStr(fc.trigger),
      description: toStr(fc.description),
    }));
  }

  // Synthesis: cross-dimension insights
  if (Array.isArray(d.cross_dimension_insights)) {
    d.cross_dimension_insights = d.cross_dimension_insights.map(ins => ({
      ...ins,
      insight:               toStr(ins.insight),
      strategic_implication: toStr(ins.strategic_implication),
    }));
  }

  // Synthesis: macro forces
  if (Array.isArray(d.macro_forces)) {
    d.macro_forces = d.macro_forces.map(f => ({
      ...f,
      name:        toStr(f.name),
      description: toStr(f.description),
    }));
  }

  // Synthesis: roadmap
  if (d.roadmap && typeof d.roadmap === 'object') {
    ['near', 'mid', 'long'].forEach(horizon => {
      if (Array.isArray(d.roadmap[horizon])) {
        d.roadmap[horizon] = d.roadmap[horizon].map(m => ({
          ...m,
          title:       toStr(m.title),
          trigger:     toStr(m.trigger),
          description: toStr(m.description),
        }));
      }
    });
  }

  // Synthesis: matrix items
  if (Array.isArray(d.matrix_items)) {
    d.matrix_items = d.matrix_items.map(item => ({
      ...item,
      title:       toStr(item.title),
      description: toStr(item.description),
    }));
  }

  return d;
}

/** Call the /api/analyze proxy and return parsed JSON. */
async function callAgent(systemPrompt, userMessage, model, onStatus) {
  onStatus('researching');
  const res = await fetch('/api/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ systemPrompt, userMessage, model }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
    throw new Error(err.error || `Agent responded ${res.status}`);
  }

  const raw = await readOllamaStream(res);
  if (!raw.trim()) throw new Error('Model returned empty response');

  const parsed = normalizeAgentData(extractJSON(raw));
  onStatus('complete');
  return parsed;
}

/** Lightweight classification using Ollama. */
async function classifySubject(subject, model) {
  try {
    const res = await fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemPrompt: 'You classify inputs. Reply with ONLY the single word "trend" or "company". No other output.',
        userMessage:  `Is "${subject}" a technology trend / phenomenon / movement, or a company / brand / organization? Reply with one word: trend or company.`,
        model,
      }),
    });
    const raw  = await readOllamaStream(res);
    const text = raw.toLowerCase().trim();
    // The model is forced into json format so it might return {"answer":"trend"} etc.
    if (text.includes('company')) return 'company';
    return 'trend';
  } catch {
    // Heuristic fallback
    const corps = ['inc','corp','ltd','llc','apple','google','microsoft','amazon','meta','nvidia','tesla','anthropic','openai','samsung','boeing','walmart','jpmorgan','netflix','spotify','uber','airbnb','stripe','spacex'];
    return corps.some(w => subject.toLowerCase().includes(w)) ? 'company' : 'trend';
  }
}

// ═══════════════════════════════════════════════════════════════════
// SHARED UI PRIMITIVES
// ═══════════════════════════════════════════════════════════════════

function Spinner({ size = 16 }) {
  return (
    <span
      className="inline-block rounded-full border-2 border-slate-600 border-t-blue-400 animate-spin"
      style={{ width: size, height: size, flexShrink: 0 }}
    />
  );
}

function Badge({ children, className = '' }) {
  return <span className={`px-2 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap ${className}`}>{children}</span>;
}

function DirBadge({ direction }) {
  const cls = DIR_CLS[direction] || DIR_CLS.uncertain;
  return <Badge className={cls}>{direction}</Badge>;
}

function DimChip({ dim }) {
  const color = COLORS[dim] || '#94a3b8';
  return (
    <span
      className="px-2 py-0.5 rounded text-xs font-bold"
      style={{ backgroundColor: color + '28', color, border: `1px solid ${color}55` }}
    >
      {dim}
    </span>
  );
}

function SectionHdr({ children }) {
  return <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">{children}</h3>;
}

// ═══════════════════════════════════════════════════════════════════
// SIDEBAR: OLLAMA STATUS + MODEL SELECTOR
// ═══════════════════════════════════════════════════════════════════

function OllamaPanel({ state, dispatch }) {
  const { ollamaStatus, ollamaVersion, availableModels, selectedModel, isPulling, pullProgress } = state;

  const modelInstalled = availableModels.some(m => m.name === selectedModel || m.name.startsWith(selectedModel + ':'));

  const handlePull = async () => {
    dispatch({ type: 'SET_PULL_STATUS', isPulling: true, progress: { status: 'Starting download…', pct: 0 } });
    try {
      const res = await fetch('/api/pull', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: selectedModel }),
      });

      const reader  = res.body.getReader();
      const decoder = new TextDecoder();
      let   buf     = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split('\n');
        buf = lines.pop();
        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const chunk = JSON.parse(line);
            const pct   = chunk.total ? Math.round((chunk.completed / chunk.total) * 100) : null;
            dispatch({ type: 'SET_PULL_STATUS', isPulling: true, progress: { status: chunk.status, pct } });
            if (chunk.status === 'success') {
              // Refresh model list
              const mRes  = await fetch('/api/models');
              const mData = await mRes.json();
              dispatch({ type: 'SET_MODELS', payload: mData.models || [] });
            }
          } catch {}
        }
      }
    } catch (err) {
      console.error('Pull failed:', err);
    } finally {
      dispatch({ type: 'SET_PULL_STATUS', isPulling: false });
    }
  };

  return (
    <div className="px-4 py-4 border-b border-slate-800 space-y-3">
      {/* Status row */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-slate-400">Ollama</span>
        <div className="flex items-center gap-1.5">
          <div className={`w-2 h-2 rounded-full ${ollamaStatus === 'online' ? 'bg-green-400' : ollamaStatus === 'checking' ? 'bg-yellow-400 animate-pulse' : 'bg-red-500'}`} />
          <span className={`text-xs ${ollamaStatus === 'online' ? 'text-green-400' : ollamaStatus === 'checking' ? 'text-yellow-400' : 'text-red-400'}`}>
            {ollamaStatus === 'online' ? `v${ollamaVersion || '?'}` : ollamaStatus === 'checking' ? 'Checking…' : 'Offline'}
          </span>
        </div>
      </div>

      {ollamaStatus === 'offline' && (
        <div className="bg-red-950 border border-red-800 rounded-lg p-2">
          <p className="text-red-300 text-xs leading-relaxed">Run <code className="font-mono bg-red-900 px-1 rounded">ollama serve</code> or <code className="font-mono bg-red-900 px-1 rounded">npm run go</code></p>
        </div>
      )}

      {/* Model selector */}
      <div>
        <label className="block text-xs text-slate-500 mb-1">Model</label>
        <select
          value={selectedModel}
          onChange={e => dispatch({ type: 'SET_SELECTED_MODEL', payload: e.target.value })}
          className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-white focus:border-blue-500 transition-colors appearance-none"
        >
          {CATALOG.map(m => {
            const installed = availableModels.some(am => am.name === m.id || am.name.startsWith(m.id));
            return (
              <option key={m.id} value={m.id}>
                {installed ? '✓ ' : ''}{m.label} ({m.size})
              </option>
            );
          })}
          {/* Any extra installed models not in catalog */}
          {availableModels.filter(m => !CATALOG.find(c => m.name === c.id || m.name.startsWith(c.id + ':'))).map(m => (
            <option key={m.name} value={m.name}>✓ {m.name}</option>
          ))}
        </select>
        <p className="text-slate-600 text-xs mt-1">
          {CATALOG.find(m => m.id === selectedModel)?.note || 'Custom installed model'}
        </p>
      </div>

      {/* Pull button */}
      {!modelInstalled && !isPulling && ollamaStatus === 'online' && (
        <button
          onClick={handlePull}
          className="w-full py-2 rounded-lg text-xs font-semibold bg-blue-800 hover:bg-blue-700 text-white border border-blue-600 transition-colors"
        >
          ⬇ Pull {selectedModel}
        </button>
      )}

      {/* Pull progress */}
      {isPulling && pullProgress && (
        <div className="space-y-1">
          <p className="text-xs text-slate-400 truncate">{pullProgress.status}</p>
          <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-1.5 bg-blue-500 rounded-full transition-all duration-300"
              style={{ width: `${pullProgress.pct ?? 100}%` }}
            />
          </div>
          {pullProgress.pct != null && (
            <p className="text-xs text-slate-600 text-right">{pullProgress.pct}%</p>
          )}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// PROGRESS PANEL
// ═══════════════════════════════════════════════════════════════════

function ProgressPanel({ agentStatuses, status }) {
  const rows = [
    { key: 'social',        label: 'Social',        color: COLORS.Social },
    { key: 'technological', label: 'Technological',  color: COLORS.Technological },
    { key: 'economic',      label: 'Economic',       color: COLORS.Economic },
    { key: 'environmental', label: 'Environmental',  color: COLORS.Environmental },
    { key: 'political',     label: 'Political',      color: COLORS.Political },
    { key: 'synthesis',     label: 'Synthesis',      color: '#e2e8f0' },
  ];
  const done = Object.values(agentStatuses).filter(s => s === 'complete').length;

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
      <div className="flex justify-between items-center mb-2">
        <span className="text-xs font-semibold text-white">
          {status === 'synthesizing' ? 'Synthesizing…' : 'Analyzing…'}
        </span>
        <span className="text-xs text-slate-500">{done}/6</span>
      </div>
      <div className="w-full h-1.5 bg-slate-700 rounded-full mb-4">
        <div
          className="h-1.5 rounded-full transition-all duration-500"
          style={{ width: `${(done / 6) * 100}%`, background: 'linear-gradient(90deg,#3B82F6,#8B5CF6)' }}
        />
      </div>
      <div className="space-y-2">
        {rows.map(({ key, label, color }) => {
          const s = agentStatuses[key];
          return (
            <div key={key} className="flex items-center gap-2 text-xs">
              <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
              <span className="flex-1 text-slate-300">{label}</span>
              {s === 'idle'        && <span className="text-slate-600">Queued</span>}
              {s === 'researching' && <div className="flex items-center gap-1"><Spinner size={12} /><span className="text-blue-400">Running</span></div>}
              {s === 'complete'    && <span className="text-green-400">✓ Done</span>}
              {s === 'error'       && <span className="text-red-400">✗ Error</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// TAB 1 — EXECUTIVE OVERVIEW
// ═══════════════════════════════════════════════════════════════════

function OverviewTab({ state }) {
  const { steepData, synthesis, subject, subjectType } = state;
  if (!synthesis) return null;
  const dims = [
    { key: 'social', label: 'Social' }, { key: 'technological', label: 'Technological' },
    { key: 'economic', label: 'Economic' }, { key: 'environmental', label: 'Environmental' },
    { key: 'political', label: 'Political' },
  ];

  return (
    <div className="space-y-6 fade-in">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="text-2xl font-bold text-white">{subject}</h2>
        <Badge className={subjectType === 'company' ? 'bg-purple-900 text-purple-300 border border-purple-700' : 'bg-sky-900 text-sky-300 border border-sky-700'}>
          {(subjectType || '').toUpperCase()}
        </Badge>
        <DirBadge direction={synthesis.overall_posture} />
      </div>

      <p className="text-slate-400 text-sm leading-relaxed max-w-4xl">{synthesis.posture_rationale}</p>

      <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
        <SectionHdr>Executive Summary</SectionHdr>
        <p className="text-slate-200 leading-relaxed text-sm">{synthesis.executive_summary}</p>
      </div>

      <div>
        <SectionHdr>STEEP Dimension Assessments</SectionHdr>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {dims.map(({ key, label }) => {
            const d = steepData[key];
            if (!d) return (
              <div key={key} className="bg-slate-800 border border-slate-700 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[label] }} />
                  <span className="font-semibold text-white text-sm">{label}</span>
                  <Badge className="bg-red-900 text-red-400 border border-red-800">Error</Badge>
                </div>
                <p className="text-slate-600 text-xs">Data unavailable</p>
              </div>
            );
            return (
              <div key={key} className="bg-slate-800 border border-slate-700 rounded-xl p-4" style={{ borderLeft: `3px solid ${COLORS[label]}` }}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[label] }} />
                    <span className="font-semibold text-white text-sm">{label}</span>
                  </div>
                  <DirBadge direction={d.dominant_direction} />
                </div>
                <p className="text-slate-300 text-xs leading-relaxed mb-3">{d.summary}</p>
                <div className="flex flex-wrap gap-1 mb-3">
                  {(d.drivers || []).slice(0, 3).map((dr, i) => (
                    <span key={i} className="px-2 py-0.5 rounded-full text-xs" style={{ backgroundColor: COLORS[label] + '25', color: COLORS[label] }}>
                      {dr.name}
                    </span>
                  ))}
                </div>
                <div className="flex items-center gap-4 text-xs">
                  <span className="text-green-400">✓ {(d.opportunities || []).length} opp</span>
                  <span className="text-red-400">⚠ {(d.risks || []).length} risk</span>
                  {d.dimension_confidence != null && (
                    <span className="text-slate-600 ml-auto">{Math.round(d.dimension_confidence * 100)}% conf</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {(synthesis.cross_dimension_insights || []).length > 0 && (
        <div>
          <SectionHdr>Cross-Dimension Insights</SectionHdr>
          <div className="space-y-3">
            {synthesis.cross_dimension_insights.map((ins, i) => {
              const bc = ins.type === 'reinforcing' ? '#10B981' : ins.type === 'countervailing' ? '#EF4444' : '#F59E0B';
              return (
                <div key={i} className="bg-slate-800 border border-slate-700 rounded-xl p-4" style={{ borderLeft: `3px solid ${bc}` }}>
                  <div className="flex items-start gap-3">
                    <div className="flex flex-wrap gap-1 flex-shrink-0 mt-0.5">
                      {(ins.dimensions_involved || []).map(d => <DimChip key={d} dim={d} />)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-slate-200 text-sm">{ins.insight}</p>
                      {ins.strategic_implication && <p className="text-slate-500 text-xs mt-1">→ {ins.strategic_implication}</p>}
                    </div>
                    <Badge className={ins.type === 'reinforcing' ? 'bg-green-900 text-green-300 border border-green-700' : ins.type === 'countervailing' ? 'bg-red-900 text-red-300 border border-red-700' : 'bg-yellow-900 text-yellow-300 border border-yellow-700'}>
                      {ins.type}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {(synthesis.macro_forces || []).length > 0 && (
        <div>
          <SectionHdr>Top Macro Forces</SectionHdr>
          <div className="space-y-2">
            {synthesis.macro_forces.map((f, i) => (
              <div key={i} className="bg-slate-800 border border-slate-700 rounded-xl p-4">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-600 font-mono w-5">#{i + 1}</span>
                    <span className="font-semibold text-white text-sm">{f.name}</span>
                    <div className="flex flex-wrap gap-1">{(f.dimensions || []).map(d => <DimChip key={d} dim={d} />)}</div>
                  </div>
                  <DirBadge direction={f.direction} />
                </div>
                <p className="text-slate-400 text-xs pl-7">{f.description}</p>
                <div className="mt-2 pl-7 h-1 bg-slate-700 rounded-full">
                  <div className="h-1 rounded-full" style={{ width: `${Math.min(100, (f.composite_score || 0.5) * 100)}%`, backgroundColor: f.direction === 'positive' ? '#10B981' : f.direction === 'negative' ? '#EF4444' : '#F59E0B' }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {(synthesis.top_takeaways || []).length > 0 && (
        <div>
          <SectionHdr>Strategic Takeaways</SectionHdr>
          <div className="space-y-2">
            {synthesis.top_takeaways.map((t, i) => (
              <div key={i} className="flex items-start gap-3 bg-slate-800 border border-slate-700 rounded-xl p-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-950 border border-blue-700 text-blue-300 flex items-center justify-center text-xs font-bold">{i + 1}</span>
                <p className="text-slate-200 text-sm leading-relaxed">{t}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// TAB 2 — 3D FORCE MAP
// ═══════════════════════════════════════════════════════════════════

function ForceMapTab({ state }) {
  const canvasRef  = useRef(null);
  const cleanupRef = useRef(null);
  const nodesRef   = useRef([]);
  const [tooltip, setTooltip] = useState(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !state.steepData) return;

    const W = canvas.offsetWidth  || 800;
    const H = canvas.offsetHeight || 600;

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x0f172a, 1);

    const scene  = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(55, W / H, 0.1, 500);
    camera.position.set(0, 2, 22);

    scene.add(new THREE.AmbientLight(0xffffff, 0.5));
    const dl = new THREE.DirectionalLight(0xffffff, 0.9);
    dl.position.set(10, 10, 10);
    scene.add(dl);

    // Starfield
    const starVerts = [];
    for (let i = 0; i < 600; i++) starVerts.push((Math.random() - 0.5) * 200, (Math.random() - 0.5) * 200, (Math.random() - 0.5) * 200);
    const sg = new THREE.BufferGeometry();
    sg.setAttribute('position', new THREE.Float32BufferAttribute(starVerts, 3));
    scene.add(new THREE.Points(sg, new THREE.PointsMaterial({ color: 0x334466, size: 0.15 })));

    const group = new THREE.Group();
    scene.add(group);

    const mkLabel = (text, color = '#ffffff') => {
      const cv = document.createElement('canvas');
      cv.width = 256; cv.height = 64;
      const ctx = cv.getContext('2d');
      ctx.fillStyle = 'rgba(15,23,42,0.88)';
      ctx.beginPath(); ctx.roundRect(4, 4, 248, 56, 8); ctx.fill();
      ctx.font = 'bold 20px sans-serif';
      ctx.fillStyle = color;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(text.slice(0, 22), 128, 32);
      const mat = new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(cv), transparent: true, depthTest: false });
      const sp  = new THREE.Sprite(mat);
      sp.scale.set(3.5, 0.88, 1);
      return sp;
    };

    const addLine = (p1, p2, hex, op = 0.3) => {
      const g = new THREE.BufferGeometry().setFromPoints([p1, p2]);
      group.add(new THREE.Line(g, new THREE.LineBasicMaterial({ color: hex, transparent: true, opacity: op })));
    };

    const nodes = [];

    // Center node
    const cM = new THREE.Mesh(
      new THREE.SphereGeometry(0.9, 24, 24),
      new THREE.MeshPhongMaterial({ color: 0xd1d5db, emissive: 0x334155, shininess: 100 })
    );
    group.add(cM);
    const cL = mkLabel(state.subject);
    cL.position.set(0, 1.6, 0);
    group.add(cL);
    nodes.push({ mesh: cM, label: state.subject, type: 'center', description: `${state.subjectType === 'company' ? 'Company' : 'Trend'}: ${state.subject}` });

    const dimPositions = [
      new THREE.Vector3(-5.5, 2.5,  1.5),
      new THREE.Vector3( 5.5, 2.5, -1.5),
      new THREE.Vector3( 0,  -5.5,  1.0),
      new THREE.Vector3(-4,  -2.0,  5.0),
      new THREE.Vector3( 4,  -2.0, -5.0),
    ];
    const dimKeys = ['Social', 'Technological', 'Economic', 'Environmental', 'Political'];

    dimKeys.forEach((dim, di) => {
      const dimData = state.steepData[dim.toLowerCase()];
      const pos     = dimPositions[di];
      const hex     = parseInt(COLORS[dim].replace('#', ''), 16);
      const tc      = new THREE.Color(hex);

      const dM = new THREE.Mesh(
        new THREE.SphereGeometry(0.65, 16, 16),
        new THREE.MeshPhongMaterial({ color: hex, emissive: hex, emissiveIntensity: 0.2, shininess: 70 })
      );
      dM.position.copy(pos);
      group.add(dM);
      const dL = mkLabel(dim, COLORS[dim]);
      dL.position.copy(pos).add(new THREE.Vector3(0, 1.25, 0));
      group.add(dL);
      nodes.push({ mesh: dM, label: dim, type: 'dimension', dimension: dim, description: dimData?.summary || `${dim} dimension` });
      addLine(new THREE.Vector3(0, 0, 0), pos, hex, 0.3);

      (dimData?.drivers || []).slice(0, 3).forEach((driver, dri) => {
        const angle    = (dri / 3) * Math.PI * 2 + di * 1.1;
        const driverPos = new THREE.Vector3(pos.x + Math.cos(angle) * 1.8, pos.y + Math.sin(angle) * 1.6, pos.z + (dri - 1) * 1.4);
        const r        = driver.impact === 'high' ? 0.38 : driver.impact === 'medium' ? 0.27 : 0.18;
        const dc       = driver.direction === 'positive' ? 0x10b981 : driver.direction === 'negative' ? 0xef4444 : 0xf59e0b;
        const drM      = new THREE.Mesh(
          new THREE.SphereGeometry(r, 10, 10),
          new THREE.MeshPhongMaterial({ color: dc, emissive: dc, emissiveIntensity: 0.15 })
        );
        drM.position.copy(driverPos);
        group.add(drM);
        nodes.push({ mesh: drM, label: driver.name, type: 'driver', dimension: dim, description: driver.description || driver.name, evidence: driver.evidence });
        addLine(pos, driverPos, hex, 0.18);
      });
    });

    nodesRef.current = nodes;

    const raycaster = new THREE.Raycaster();
    const mouse     = { down: false, lastX: 0, lastY: 0 };

    let frame;
    const animate = () => {
      frame = requestAnimationFrame(animate);
      if (!mouse.down) group.rotation.y += 0.004;
      renderer.render(scene, camera);
    };
    animate();

    const onDown = e => { mouse.down = true; mouse.lastX = e.clientX; mouse.lastY = e.clientY; };
    const onMove = e => {
      if (!mouse.down) return;
      group.rotation.y += (e.clientX - mouse.lastX) * 0.009;
      group.rotation.x += (e.clientY - mouse.lastY) * 0.009;
      mouse.lastX = e.clientX; mouse.lastY = e.clientY;
    };
    const onUp    = () => { mouse.down = false; };
    const onWheel = e => { camera.position.z = Math.max(8, Math.min(35, camera.position.z + e.deltaY * 0.04)); };
    const onClick = e => {
      const rect = canvas.getBoundingClientRect();
      const m2   = new THREE.Vector2(
        ((e.clientX - rect.left) / rect.width)  * 2 - 1,
        -((e.clientY - rect.top) / rect.height) * 2 + 1,
      );
      raycaster.setFromCamera(m2, camera);
      const hits = raycaster.intersectObjects(nodesRef.current.map(n => n.mesh));
      if (hits.length) {
        const nd = nodesRef.current.find(n => n.mesh === hits[0].object);
        setTooltip(t => (t?.mesh === nd?.mesh ? null : nd));
      } else setTooltip(null);
    };
    const onResize = () => {
      const W2 = canvas.offsetWidth, H2 = canvas.offsetHeight;
      camera.aspect = W2 / H2; camera.updateProjectionMatrix();
      renderer.setSize(W2, H2);
    };

    canvas.addEventListener('mousedown', onDown);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup',   onUp);
    canvas.addEventListener('wheel',     onWheel, { passive: true });
    canvas.addEventListener('click',     onClick);
    window.addEventListener('resize',    onResize);

    cleanupRef.current = () => {
      cancelAnimationFrame(frame);
      canvas.removeEventListener('mousedown', onDown);
      window.removeEventListener('mousemove',  onMove);
      window.removeEventListener('mouseup',    onUp);
      canvas.removeEventListener('wheel',      onWheel);
      canvas.removeEventListener('click',      onClick);
      window.removeEventListener('resize',     onResize);
      renderer.dispose();
    };

    return cleanupRef.current;
  }, [state.steepData, state.subject, state.subjectType]);

  return (
    <div className="relative" style={{ height: 'calc(100vh - 140px)', minHeight: 500 }}>
      <canvas ref={canvasRef} className="w-full h-full rounded-xl" />

      <div className="absolute top-4 left-4 bg-slate-950 bg-opacity-90 border border-slate-700 rounded-xl p-3 text-xs">
        <p className="text-slate-500 font-semibold uppercase tracking-wider mb-2">Dimensions</p>
        {Object.entries(COLORS).map(([d, c]) => (
          <div key={d} className="flex items-center gap-2 mb-1">
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: c }} />
            <span className="text-slate-300">{d}</span>
          </div>
        ))}
        <div className="mt-2 pt-2 border-t border-slate-700">
          <p className="text-slate-500 font-semibold uppercase tracking-wider mb-1">Drivers</p>
          {[['#10b981','Positive'],['#ef4444','Negative'],['#f59e0b','Mixed']].map(([c, l]) => (
            <div key={l} className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: c }} />
              <span className="text-slate-400">{l}</span>
            </div>
          ))}
          <p className="text-slate-600 mt-1">Node size = impact</p>
        </div>
      </div>

      <div className="absolute bottom-4 left-4 bg-slate-950 bg-opacity-80 border border-slate-700 rounded-lg px-3 py-1.5">
        <p className="text-slate-600 text-xs">Drag to rotate · Scroll to zoom · Click nodes</p>
      </div>

      <button
        className="absolute top-4 right-4 bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-300 text-xs px-3 py-1.5 rounded-lg transition-colors"
        onClick={() => { if (cleanupRef.current) { /* reset handled inside */ } }}
      >
        Reset View
      </button>

      {tooltip && (
        <div className="absolute bottom-4 right-4 bg-slate-950 border border-slate-600 rounded-xl p-4 max-w-xs fade-in">
          <div className="flex items-start justify-between mb-2">
            <div>
              {tooltip.dimension && <DimChip dim={tooltip.dimension} />}
              <p className="text-white font-semibold text-sm mt-1">{tooltip.label}</p>
            </div>
            <button onClick={() => setTooltip(null)} className="text-slate-600 hover:text-white ml-3">✕</button>
          </div>
          {tooltip.description && <p className="text-slate-300 text-xs leading-relaxed">{tooltip.description}</p>}
          {tooltip.evidence?.length > 0 && (
            <div className="mt-2 border-t border-slate-700 pt-2">
              <p className="text-slate-600 text-xs mb-1">Evidence:</p>
              {tooltip.evidence.slice(0, 2).map((e, i) => <p key={i} className="text-slate-400 text-xs">• {e}</p>)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// TAB 3 — FORECAST ROADMAP
// ═══════════════════════════════════════════════════════════════════

function RoadmapTab({ state, dispatch }) {
  const { synthesis, roadmapFilter } = state;
  if (!synthesis?.roadmap) return null;

  const horizons = [
    { key: 'near', label: 'Near Term',   sub: '0–12 months', color: '#3B82F6' },
    { key: 'mid',  label: 'Medium Term', sub: '1–3 years',   color: '#8B5CF6' },
    { key: 'long', label: 'Long Term',   sub: '3–7 years',   color: '#F97316' },
  ];
  const dims = Object.keys(COLORS);

  const icon = (type) => {
    if (!type) return '◆';
    const t = type.toLowerCase();
    if (t.includes('polic') || t.includes('election') || t.includes('legislat')) return '⚖️';
    if (t.includes('tech') || t.includes('product') || t.includes('bench'))     return '⚡';
    if (t.includes('market') || t.includes('demand') || t.includes('capital'))  return '📈';
    if (t.includes('consumer') || t.includes('social') || t.includes('behav'))  return '👥';
    if (t.includes('regul') || t.includes('compliance'))                         return '📋';
    if (t.includes('climate') || t.includes('environ'))                          return '🌿';
    return '◆';
  };

  const filtered = ms => roadmapFilter.length ? ms.filter(m => roadmapFilter.includes(m.dimension)) : ms;
  const clearAll = () => dims.forEach(d => { if (roadmapFilter.includes(d)) dispatch({ type: 'TOGGLE_ROADMAP_FILTER', payload: d }); });

  return (
    <div className="space-y-6 fade-in">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-slate-500 mr-1">Filter:</span>
        <button onClick={clearAll} className={`px-3 py-1 rounded-lg text-xs transition-colors ${!roadmapFilter.length ? 'bg-slate-600 text-white' : 'bg-slate-800 border border-slate-700 text-slate-400 hover:text-white'}`}>All</button>
        {dims.map(d => (
          <button key={d} className="px-3 py-1 rounded-lg text-xs border transition-all"
            style={{ backgroundColor: roadmapFilter.includes(d) ? COLORS[d] + '28' : 'transparent', borderColor: roadmapFilter.includes(d) ? COLORS[d] + '88' : '#334155', color: roadmapFilter.includes(d) ? COLORS[d] : '#94a3b8' }}
            onClick={() => dispatch({ type: 'TOGGLE_ROADMAP_FILTER', payload: d })}
          >{d.slice(0, 4)}</button>
        ))}
      </div>

      {horizons.map(({ key, label, sub, color }) => {
        const ms = filtered(synthesis.roadmap[key] || []);
        return (
          <div key={key}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
              <span className="font-bold text-white">{label}</span>
              <span className="text-slate-500 text-sm">{sub}</span>
              <div className="flex-1 h-px bg-slate-800" />
              <span className="text-xs text-slate-600">{ms.length} item{ms.length !== 1 ? 's' : ''}</span>
            </div>
            {ms.length === 0 ? <p className="text-slate-600 text-sm pl-6">No milestones match current filter.</p> : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pl-6">
                {ms.map((m, i) => (
                  <div key={m.id || i} className="bg-slate-800 border border-slate-700 rounded-xl p-3 hover:border-slate-500 transition-colors">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-lg leading-none">{icon(m.catalyst_type)}</span>
                        <DimChip dim={m.dimension} />
                      </div>
                      <Badge className={m.direction === 'positive' ? 'bg-green-900 text-green-300 border border-green-800' : m.direction === 'negative' ? 'bg-red-900 text-red-300 border border-red-800' : 'bg-yellow-900 text-yellow-300 border border-yellow-800'}>
                        {m.direction}
                      </Badge>
                    </div>
                    <p className="text-white text-sm font-semibold mb-1 leading-tight">{m.title}</p>
                    {m.trigger && <p className="text-slate-500 text-xs mb-1"><span className="text-slate-600">Trigger:</span> {m.trigger}</p>}
                    <p className="text-slate-400 text-xs leading-relaxed">{m.description}</p>
                    {m.confidence != null && (
                      <div className="mt-2 h-1 bg-slate-700 rounded-full">
                        <div className="h-1 rounded-full bg-blue-700" style={{ width: `${m.confidence * 100}%` }} />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// TAB 4 — RISK / OPPORTUNITY / DISRUPTION MATRIX
// ═══════════════════════════════════════════════════════════════════

function MatrixTab({ state, dispatch }) {
  const { synthesis, matrixFilter, selectedMatrixItem } = state;
  const [sortKey, setSortKey] = useState('composite');
  const [sortDir, setSortDir] = useState('desc');
  if (!synthesis?.matrix_items) return null;

  const typeMap = { risks: 'risk', opportunities: 'opportunity', disruptions: 'disruption' };
  const allItems = synthesis.matrix_items || [];
  const filtered = allItems.filter(i => i.type === typeMap[matrixFilter]);

  const composite = item => {
    const ts = { immediate: 5, near: 4, mid: 3, long: 2 }[item.time_sensitivity] || 3;
    return (item.impact_score || 3) * 0.40 + (item.likelihood_score || 3) * 0.35 + ts * 0.25;
  };

  const sorted = [...filtered].sort((a, b) => {
    const av = sortKey === 'composite' ? composite(a) : (a[sortKey] || 0);
    const bv = sortKey === 'composite' ? composite(b) : (b[sortKey] || 0);
    return sortDir === 'desc' ? bv - av : av - bv;
  });

  const cells = {};
  filtered.forEach(item => {
    const x = Math.min(5, Math.max(1, item.likelihood_score || 3));
    const y = Math.min(5, Math.max(1, item.impact_score || 3));
    const k = `${x},${y}`;
    if (!cells[k]) cells[k] = [];
    cells[k].push(item);
  });

  const typeCount = t => allItems.filter(i => i.type === typeMap[t]).length;
  const handleSort = k => { if (sortKey === k) setSortDir(d => d === 'desc' ? 'asc' : 'desc'); else { setSortKey(k); setSortDir('desc'); } };

  return (
    <div className="space-y-6 fade-in">
      <div className="flex items-center gap-2">
        {['risks', 'opportunities', 'disruptions'].map(f => (
          <button key={f} onClick={() => dispatch({ type: 'SET_MATRIX_FILTER', payload: f })}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${matrixFilter === f ? 'bg-blue-700 text-white' : 'bg-slate-800 border border-slate-700 text-slate-400 hover:text-white'}`}>
            {f.charAt(0).toUpperCase() + f.slice(1)}
            <span className="ml-2 text-xs opacity-60">({typeCount(f)})</span>
          </button>
        ))}
      </div>

      <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
        <div className="flex gap-3">
          <div style={{ writingMode: 'vertical-lr', transform: 'rotate(180deg)' }} className="flex items-center justify-center">
            <span className="text-xs text-slate-500 font-semibold tracking-widest uppercase">Impact →</span>
          </div>
          <div className="flex-1">
            {[5, 4, 3, 2, 1].map(y => (
              <div key={y} className="flex gap-1 mb-1">
                <div className="w-5 flex items-center justify-center"><span className="text-xs text-slate-600 font-mono">{y}</span></div>
                {[1, 2, 3, 4, 5].map(x => {
                  const ci = cells[`${x},${y}`] || [];
                  const sc = x * y;
                  const bg = sc >= 16 ? 'bg-red-950 border-red-900' : sc >= 9 ? 'bg-orange-950 border-orange-900' : 'bg-slate-900 border-slate-700';
                  return (
                    <div key={x} className={`flex-1 border rounded-lg ${bg} flex flex-wrap content-start gap-1 p-1.5`} style={{ minHeight: 58, minWidth: 54 }}>
                      {ci.map((item, ci2) => (
                        <button key={ci2} onClick={() => dispatch({ type: 'SET_SELECTED_MATRIX_ITEM', payload: selectedMatrixItem?.id === item.id ? null : item })}
                          className="w-4 h-4 rounded-full border-2 border-slate-950 hover:scale-125 transition-transform cursor-pointer"
                          style={{ backgroundColor: COLORS[item.dimension] || '#94a3b8', boxShadow: selectedMatrixItem?.id === item.id ? `0 0 0 2px ${COLORS[item.dimension]}` : 'none' }}
                          title={item.title}
                        />
                      ))}
                    </div>
                  );
                })}
              </div>
            ))}
            <div className="flex gap-1 mt-1">
              <div className="w-5" />
              {[1, 2, 3, 4, 5].map(x => <div key={x} className="flex-1 text-center"><span className="text-xs text-slate-600 font-mono">{x}</span></div>)}
            </div>
            <div className="text-center mt-1"><span className="text-xs text-slate-500 font-semibold tracking-widest uppercase">Likelihood →</span></div>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-slate-700 flex flex-wrap gap-4">
          {Object.entries(COLORS).map(([d, c]) => (
            <div key={d} className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full" style={{ backgroundColor: c }} /><span className="text-xs text-slate-400">{d}</span></div>
          ))}
        </div>
        <div className="flex gap-4 mt-2">
          {[['bg-red-950 border-red-900','Critical'],['bg-orange-950 border-orange-900','Monitor'],['bg-slate-900 border-slate-700','Watch']].map(([cls,lbl]) => (
            <div key={lbl} className="flex items-center gap-1.5"><div className={`w-3 h-3 rounded border ${cls}`} /><span className="text-xs text-slate-500">{lbl}</span></div>
          ))}
        </div>
      </div>

      {selectedMatrixItem && (
        <div className="bg-slate-800 border rounded-xl p-5 fade-in" style={{ borderColor: (COLORS[selectedMatrixItem.dimension] || '#94a3b8') + '66' }}>
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2 flex-wrap">
              <DimChip dim={selectedMatrixItem.dimension} />
              <Badge className={selectedMatrixItem.type === 'risk' ? 'bg-red-900 text-red-300 border border-red-700' : selectedMatrixItem.type === 'opportunity' ? 'bg-green-900 text-green-300 border border-green-700' : 'bg-purple-900 text-purple-300 border border-purple-700'}>
                {selectedMatrixItem.type}
              </Badge>
            </div>
            <button onClick={() => dispatch({ type: 'SET_SELECTED_MATRIX_ITEM', payload: null })} className="text-slate-600 hover:text-white ml-3">✕</button>
          </div>
          <h4 className="text-white font-bold text-base mb-2">{selectedMatrixItem.title}</h4>
          <p className="text-slate-300 text-sm leading-relaxed mb-4">{selectedMatrixItem.description}</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[['Impact',`${selectedMatrixItem.impact_score}/5`],['Likelihood',`${selectedMatrixItem.likelihood_score}/5`],['Time Sensitivity',selectedMatrixItem.time_sensitivity||'—'],['Reversibility',selectedMatrixItem.reversibility||'—']].map(([lbl,val]) => (
              <div key={lbl}><p className="text-xs text-slate-500 mb-1">{lbl}</p><p className="text-white font-semibold capitalize text-sm">{val}</p></div>
            ))}
          </div>
        </div>
      )}

      <div>
        <SectionHdr>All Items ({sorted.length})</SectionHdr>
        <div className="overflow-x-auto rounded-xl border border-slate-700">
          <table className="w-full text-sm">
            <thead className="bg-slate-800">
              <tr>
                {[['Title','title'],['Dimension','dimension'],['Impact','impact_score'],['Likelihood','likelihood_score'],['Score','composite']].map(([lbl,k]) => (
                  <th key={k} onClick={() => handleSort(k)} className="text-left px-4 py-3 text-xs text-slate-500 font-semibold uppercase tracking-wider cursor-pointer hover:text-slate-300 whitespace-nowrap select-none">
                    {lbl}{sortKey === k ? (sortDir === 'desc' ? ' ↓' : ' ↑') : ''}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {sorted.map((item, i) => (
                <tr key={i} onClick={() => dispatch({ type: 'SET_SELECTED_MATRIX_ITEM', payload: selectedMatrixItem?.id === item.id ? null : item })}
                  className={`hover:bg-slate-800 cursor-pointer transition-colors ${selectedMatrixItem?.id === item.id ? 'bg-slate-800' : ''}`}>
                  <td className="px-4 py-3 text-slate-200 max-w-xs truncate">{item.title}</td>
                  <td className="px-4 py-3"><DimChip dim={item.dimension} /></td>
                  <td className="px-4 py-3 text-center font-mono text-white">{item.impact_score}</td>
                  <td className="px-4 py-3 text-center font-mono text-white">{item.likelihood_score}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-white">{composite(item).toFixed(1)}</span>
                      <div className="w-16 h-1.5 bg-slate-700 rounded-full">
                        <div className="h-1.5 rounded-full bg-blue-600" style={{ width: `${Math.min(100, composite(item) / 5.5 * 100)}%` }} />
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// TAB 5 — EVIDENCE BASE
// ═══════════════════════════════════════════════════════════════════

function EvidenceTab({ state }) {
  const { steepData } = state;
  const [open, setOpen] = useState({});
  const dims = [
    { key: 'social', label: 'Social' }, { key: 'technological', label: 'Technological' },
    { key: 'economic', label: 'Economic' }, { key: 'environmental', label: 'Environmental' },
    { key: 'political', label: 'Political' },
  ];

  return (
    <div className="space-y-2 fade-in">
      {dims.map(({ key, label }) => {
        const d = steepData[key];
        const isOpen = open[key];
        return (
          <div key={key} className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
            <button className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-750 transition-colors" onClick={() => setOpen(p => ({ ...p, [key]: !p[key] }))}>
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[label] }} />
                <span className="font-semibold text-white">{label}</span>
                {d ? <DirBadge direction={d.dominant_direction} /> : <Badge className="bg-red-900 text-red-400 border border-red-800">Unavailable</Badge>}
                {d?.dimension_confidence && <span className="text-xs text-slate-600">{Math.round(d.dimension_confidence * 100)}% conf</span>}
              </div>
              <span className="text-slate-500">{isOpen ? '↑' : '↓'}</span>
            </button>

            {isOpen && d && (
              <div className="border-t border-slate-700 px-5 py-4 space-y-5">
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Summary</p>
                  <p className="text-slate-300 text-sm leading-relaxed">{d.summary}</p>
                </div>

                {(d.drivers || []).length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Drivers & Evidence</p>
                    <div className="space-y-3">
                      {d.drivers.map((dr, i) => (
                        <div key={i} className="bg-slate-900 border border-slate-700 rounded-xl p-4">
                          <div className="flex items-start justify-between mb-2">
                            <span className="text-white font-semibold text-sm">{dr.name}</span>
                            <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                              <Badge className={IMPACT_CLS[dr.impact] || IMPACT_CLS.low}>{dr.impact}</Badge>
                              <Badge className={dr.direction === 'positive' ? 'bg-green-900 text-green-300' : dr.direction === 'negative' ? 'bg-red-900 text-red-300' : 'bg-yellow-900 text-yellow-300'}>{dr.direction}</Badge>
                              {dr.velocity && <Badge className="bg-slate-700 text-slate-400">{dr.velocity}</Badge>}
                            </div>
                          </div>
                          {dr.description && <p className="text-slate-400 text-xs leading-relaxed mb-2">{dr.description}</p>}
                          {(dr.evidence || []).map((ev, j) => <p key={j} className="text-slate-500 text-xs">• {ev}</p>)}
                          {dr.confidence != null && (
                            <div className="flex items-center gap-2 mt-2">
                              <span className="text-xs text-slate-600 w-16">Confidence</span>
                              <div className="flex-1 h-1.5 bg-slate-800 rounded-full">
                                <div className="h-1.5 rounded-full" style={{ width: `${dr.confidence * 100}%`, backgroundColor: dr.confidence > 0.7 ? '#10b981' : dr.confidence > 0.5 ? '#f59e0b' : '#ef4444' }} />
                              </div>
                              <span className="text-xs text-slate-600 w-8 text-right">{Math.round(dr.confidence * 100)}%</span>
                            </div>
                          )}
                          {dr.nonlinearity_flag && dr.nonlinearity_flag !== 'none' && (
                            <div className="mt-2"><Badge className="bg-purple-950 text-purple-300 border border-purple-800">⚡ {dr.nonlinearity_flag}</Badge></div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {(d.signals || []).length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Forward Signals</p>
                    {d.signals.map((sig, i) => (
                      <div key={i} className="bg-slate-900 rounded-xl p-3 flex items-start gap-3 mb-2">
                        <div className="flex-1">
                          <p className="text-white text-sm">{sig.signal}</p>
                          {sig.why_it_matters && <p className="text-slate-500 text-xs mt-1">{sig.why_it_matters}</p>}
                        </div>
                        <div className="flex flex-col items-end gap-1 flex-shrink-0">
                          <div className="w-20 h-1.5 bg-slate-700 rounded-full">
                            <div className="h-1.5 rounded-full" style={{ width: `${(sig.confidence || 0) * 100}%`, backgroundColor: (sig.confidence || 0) > 0.7 ? '#10b981' : (sig.confidence || 0) > 0.5 ? '#f59e0b' : '#ef4444' }} />
                          </div>
                          <span className="text-xs text-slate-600">{Math.round((sig.confidence || 0) * 100)}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {(d.forecast || []).length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Dimension Forecast</p>
                    {d.forecast.map((fc, i) => (
                      <div key={i} className="bg-slate-900 rounded-xl p-3 mb-2">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge className="bg-slate-700 text-slate-300 border border-slate-600">{fc.time_horizon}</Badge>
                          {fc.trigger && <span className="text-slate-500 text-xs">Trigger: {fc.trigger}</span>}
                        </div>
                        <p className="text-slate-300 text-xs leading-relaxed">{fc.description}</p>
                      </div>
                    ))}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[['Opportunities', d.opportunities, 'text-green-400', 'bg-green-500'],['Risks', d.risks, 'text-red-400', 'bg-red-500']].map(([lbl, items, tc, dc]) => (
                    (items || []).length > 0 && (
                      <div key={lbl}>
                        <p className={`text-xs font-semibold ${tc} uppercase tracking-wider mb-2`}>{lbl}</p>
                        {items.slice(0, 5).map((item, i) => (
                          <div key={i} className="flex items-start gap-2 mb-1">
                            <div className={`w-1.5 h-1.5 rounded-full ${dc} mt-1.5 flex-shrink-0`} />
                            <p className="text-slate-400 text-xs leading-relaxed">{item}</p>
                          </div>
                        ))}
                      </div>
                    )
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// ROOT APP
// ═══════════════════════════════════════════════════════════════════

function App() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const { subject, status, agentStatuses, steepData, synthesis, activeTab, selectedModel, ollamaStatus } = state;

  const isRunning  = ['classifying', 'researching', 'synthesizing'].includes(status);
  const isComplete = status === 'complete';

  // ── On mount: check Ollama health and list models ──
  useEffect(() => {
    (async () => {
      try {
        const hRes  = await fetch('/api/health');
        const hData = await hRes.json();
        dispatch({ type: 'SET_OLLAMA_STATUS', status: hData.ok ? 'online' : 'offline', version: hData.version });

        if (hData.ok) {
          const mRes  = await fetch('/api/models');
          const mData = await mRes.json();
          dispatch({ type: 'SET_MODELS', payload: mData.models || [] });
        }
      } catch {
        dispatch({ type: 'SET_OLLAMA_STATUS', status: 'offline' });
      }
    })();
  }, []);

  // ── ANALYSIS ORCHESTRATOR ──
  const handleAnalysis = useCallback(async () => {
    if (!subject.trim() || ollamaStatus !== 'online') return;
    dispatch({ type: 'START_ANALYSIS' });

    try {
      // Step 1: classify
      const subjectType = await classifySubject(subject, selectedModel);
      dispatch({ type: 'SET_SUBJECT_TYPE', payload: subjectType });

      // Step 2: run 5 dimension agents sequentially
      // (local GPU handles one request at a time; sequential shows clear progress)
      const results = { social: null, technological: null, economic: null, environmental: null, political: null };

      const agents = [
        { key: 'social',        dim: 'Social',        prompt: SOCIAL_PROMPT(subject, subjectType) },
        { key: 'technological', dim: 'Technological', prompt: TECH_PROMPT(subject, subjectType) },
        { key: 'economic',      dim: 'Economic',      prompt: ECON_PROMPT(subject, subjectType) },
        { key: 'environmental', dim: 'Environmental', prompt: ENV_PROMPT(subject, subjectType) },
        { key: 'political',     dim: 'Political',     prompt: POL_PROMPT(subject, subjectType) },
      ];

      for (const { key, dim, prompt } of agents) {
        try {
          const data = await callAgent(
            prompt,
            `Conduct a ${dim} dimension STEEP analysis on: "${subject}" (classified as: ${subjectType}). Use your training knowledge through 2024. Return only valid JSON matching the schema exactly.`,
            selectedModel,
            (s) => dispatch({ type: 'SET_AGENT_STATUS', dimension: key, status: s }),
          );
          results[key] = data;
          dispatch({ type: 'SET_STEEP_DATA', dimension: key, data });
        } catch (err) {
          console.error(`${dim} agent error:`, err.message);
          dispatch({ type: 'SET_AGENT_STATUS', dimension: key, status: 'error' });
        }
      }

      // Step 3: synthesis
      dispatch({ type: 'SET_STATUS', payload: 'synthesizing' });
      try {
        const synthData = await callAgent(
          SYNTHESIS_PROMPT(subject, subjectType, results),
          `Synthesize the five STEEP dimension analyses for "${subject}" into a unified executive intelligence report. Return only valid JSON matching the schema.`,
          selectedModel,
          (s) => dispatch({ type: 'SET_AGENT_STATUS', dimension: 'synthesis', status: s }),
        );
        dispatch({ type: 'SET_SYNTHESIS', data: synthData });
        dispatch({ type: 'SET_ACTIVE_TAB', payload: 'overview' });
      } catch (err) {
        console.error('Synthesis error:', err.message);
        dispatch({ type: 'SET_AGENT_STATUS', dimension: 'synthesis', status: 'error' });
        dispatch({ type: 'SET_STATUS', payload: 'complete' });
        dispatch({ type: 'SET_ACTIVE_TAB', payload: 'evidence' });
      }
    } catch (err) {
      dispatch({ type: 'SET_ERROR', payload: err.message });
    }
  }, [subject, selectedModel, ollamaStatus]);

  const tabs = [
    { key: 'overview',  label: 'Overview',  icon: '◉' },
    { key: 'forcemap',  label: 'Force Map', icon: '◈' },
    { key: 'roadmap',   label: 'Roadmap',   icon: '→' },
    { key: 'matrix',    label: 'Matrix',    icon: '⊞' },
    { key: 'evidence',  label: 'Evidence',  icon: '◎' },
  ];

  return (
    <div className="flex h-screen bg-slate-900 overflow-hidden">

      {/* ── SIDEBAR ── */}
      <aside className="w-64 flex-shrink-0 bg-slate-950 border-r border-slate-800 flex flex-col overflow-y-auto">
        {/* Branding */}
        <div className="px-5 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-xs font-black text-white">S</div>
            <span className="font-bold text-white">STEEP Platform</span>
          </div>
          <p className="text-slate-600 text-xs">Local Ollama · No API key needed</p>
        </div>

        {/* Ollama panel */}
        <OllamaPanel state={state} dispatch={dispatch} />

        {/* Subject + Run */}
        <div className="px-4 py-4 border-b border-slate-800">
          <label className="block text-xs text-slate-500 mb-1.5 font-medium">Subject to Analyze</label>
          <input
            type="text"
            value={subject}
            onChange={e => dispatch({ type: 'SET_SUBJECT', payload: e.target.value })}
            placeholder="e.g. quantum computing"
            disabled={isRunning}
            onKeyDown={e => e.key === 'Enter' && !isRunning && subject.trim() && handleAnalysis()}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-600 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          />
          <button
            onClick={handleAnalysis}
            disabled={isRunning || !subject.trim() || ollamaStatus !== 'online'}
            className="mt-3 w-full py-2.5 rounded-lg text-xs font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed text-white"
            style={{ background: isRunning ? 'linear-gradient(135deg,#1e3a5f,#3730a3)' : 'linear-gradient(135deg,#2563eb,#7c3aed)' }}
          >
            {isRunning
              ? <span className="flex items-center justify-center gap-2"><Spinner size={12} />Analyzing…</span>
              : ollamaStatus !== 'online' ? 'Ollama Offline' : 'Run STEEP Analysis'}
          </button>
          {ollamaStatus === 'online' && (
            <p className="text-slate-600 text-xs mt-2 text-center">
              Sequential · {CATALOG.find(m => m.id === selectedModel)?.size || '?'} model
            </p>
          )}
        </div>

        {/* Progress */}
        {isRunning && (
          <div className="px-4 py-4 border-b border-slate-800">
            <ProgressPanel agentStatuses={agentStatuses} status={status} />
          </div>
        )}

        {/* Tab nav */}
        {isComplete && (
          <nav className="flex-1 px-3 py-3">
            <p className="text-xs text-slate-600 px-2 mb-2 uppercase tracking-widest font-semibold">Dashboard</p>
            {tabs.map(tab => (
              <button key={tab.key} onClick={() => dispatch({ type: 'SET_ACTIVE_TAB', payload: tab.key })}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm mb-0.5 transition-all ${activeTab === tab.key ? 'bg-slate-700 text-white font-medium' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}>
                <span className="text-base leading-none">{tab.icon}</span>
                <span>{tab.label}</span>
                {activeTab === tab.key && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-400" />}
              </button>
            ))}
          </nav>
        )}

        {/* Error */}
        {status === 'error' && state.error && (
          <div className="mx-3 mb-3 p-3 bg-red-950 border border-red-800 rounded-xl">
            <p className="text-red-400 text-xs font-semibold mb-1">Error</p>
            <p className="text-red-300 text-xs leading-relaxed break-words">{state.error}</p>
            <button onClick={() => dispatch({ type: 'SET_STATUS', payload: 'idle' })} className="mt-2 text-xs text-red-400 hover:text-red-200 underline">Dismiss</button>
          </div>
        )}

        <div className="px-5 py-3 border-t border-slate-800 mt-auto">
          <p className="text-slate-700 text-xs">Ollama · {selectedModel}</p>
        </div>
      </aside>

      {/* ── MAIN CONTENT ── */}
      <main className="flex-1 overflow-y-auto">
        {/* Idle */}
        {status === 'idle' && (
          <div className="h-full flex items-center justify-center px-8">
            <div className="text-center max-w-xl">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-600 to-purple-700 mx-auto mb-7 flex items-center justify-center text-3xl font-black text-white shadow-2xl">S</div>
              <h1 className="text-3xl font-black text-white mb-3">STEEP Analysis Platform</h1>
              <p className="text-slate-400 text-sm leading-relaxed mb-2">100% local — no API key, no cloud, no cost.</p>
              <p className="text-slate-500 text-sm leading-relaxed mb-8">Powered by <span className="text-white font-semibold">Ollama</span>. Enter any trend or company to run a six-agent STEEP intelligence analysis with a 3D force map, forecast roadmap, and risk/opportunity matrix.</p>
              <div className="grid grid-cols-5 gap-2 mb-8">
                {Object.entries(COLORS).map(([dim, color]) => (
                  <div key={dim} className="bg-slate-800 border border-slate-700 rounded-xl p-3 text-center">
                    <div className="w-8 h-8 rounded-full mx-auto mb-2" style={{ backgroundColor: color + '33', border: `2px solid ${color}55` }}>
                      <div className="w-full h-full rounded-full" style={{ backgroundColor: color, opacity: 0.6 }} />
                    </div>
                    <p className="text-xs text-slate-400 font-medium">{dim}</p>
                  </div>
                ))}
              </div>
              {ollamaStatus === 'offline' && (
                <div className="bg-red-950 border border-red-800 rounded-xl p-4 text-left">
                  <p className="text-red-300 font-semibold text-sm mb-1">Ollama is not running</p>
                  <p className="text-red-400 text-xs">Start it with <code className="font-mono bg-red-900 px-1 rounded">npm run go</code> or <code className="font-mono bg-red-900 px-1 rounded">ollama serve</code></p>
                </div>
              )}
              {ollamaStatus === 'online' && <p className="text-slate-600 text-xs">Enter a subject in the sidebar to begin.</p>}
            </div>
          </div>
        )}

        {/* Running */}
        {isRunning && (
          <div className="h-full flex items-center justify-center px-8">
            <div className="text-center max-w-lg">
              <div className="relative w-20 h-20 mx-auto mb-7">
                <div className="w-20 h-20 rounded-full border-4 border-slate-800 animate-spin" style={{ borderTopColor: '#3B82F6', borderRightColor: '#8B5CF6', animationDuration: '1.5s' }} />
                <div className="absolute inset-0 flex items-center justify-center text-xl font-black text-white">S</div>
              </div>
              <h2 className="text-xl font-bold text-white mb-2">
                {status === 'classifying' ? 'Classifying Subject' : status === 'researching' ? 'Running Dimension Agents' : 'Synthesizing Intelligence'}
              </h2>
              <p className="text-slate-400 text-sm mb-2 max-w-sm mx-auto">
                {status === 'classifying' ? `Classifying "${subject}"…`
                  : status === 'researching' ? `Running agents sequentially on ${selectedModel}…`
                  : 'Producing your executive intelligence report…'}
              </p>
              <p className="text-slate-600 text-xs mb-8">Each dimension agent takes 30–90 seconds on a local model.</p>
              <div className="flex justify-center gap-3">
                {Object.entries(COLORS).map(([dim, color]) => {
                  const k = dim.toLowerCase();
                  const s = agentStatuses[k];
                  return (
                    <div key={dim} className="flex flex-col items-center gap-1.5">
                      <div className="w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all text-xs"
                        style={{ borderColor: s === 'complete' ? '#10b981' : s === 'researching' ? color : s === 'error' ? '#ef4444' : '#1e293b', backgroundColor: s === 'complete' ? '#10b98120' : s === 'researching' ? color + '20' : 'transparent', color: s === 'complete' ? '#10b981' : s === 'error' ? '#ef4444' : '#94a3b8' }}>
                        {s === 'complete' ? '✓' : s === 'researching' ? <Spinner size={12} /> : s === 'error' ? '✗' : '·'}
                      </div>
                      <span className="text-xs text-slate-600">{dim.slice(0, 4)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Results */}
        {isComplete && (
          <div className="min-h-full flex flex-col">
            <div className="flex items-center gap-1 px-6 pt-5 pb-0 border-b border-slate-800 flex-shrink-0">
              {tabs.map(tab => (
                <button key={tab.key} onClick={() => dispatch({ type: 'SET_ACTIVE_TAB', payload: tab.key })}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all -mb-px ${activeTab === tab.key ? 'border-blue-500 text-white' : 'border-transparent text-slate-500 hover:text-slate-300 hover:border-slate-600'}`}>
                  <span>{tab.icon}</span><span>{tab.label}</span>
                </button>
              ))}
            </div>
            <div className={`flex-1 ${activeTab === 'forcemap' ? 'p-4' : 'p-6'}`}>
              {activeTab === 'overview' && <OverviewTab state={state} />}
              {activeTab === 'forcemap' && <ForceMapTab state={state} />}
              {activeTab === 'roadmap'  && <RoadmapTab  state={state} dispatch={dispatch} />}
              {activeTab === 'matrix'   && <MatrixTab   state={state} dispatch={dispatch} />}
              {activeTab === 'evidence' && <EvidenceTab state={state} />}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default function Page() {
  return <App />;
}
