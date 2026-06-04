'use client';

import { useState, useEffect } from 'react';

export default function PortfolioDashboard({ dispatch, posts: initialPosts = [], adminToken = '', groqStatus = 'checking', selectedModel = 'llama-3.3-70b-versatile', onOpenEditor }) {
  const [copied, setCopied] = useState(false);
  const [posts, setPosts] = useState(initialPosts);

  useEffect(() => {
    if (initialPosts && initialPosts.length > 0) {
      setPosts(initialPosts);
    } else {
      fetch('/api/thought-leadership?limit=5')
        .then(r => r.json())
        .then(d => {
          if (d.posts) setPosts(d.posts);
        })
        .catch(() => {});
    }
  }, [initialPosts]);

  // Schema for GEO optimization (JSON-LD)
  const schemaData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Person",
        "@id": "https://stint.studio/#person",
        "name": "Taylor Grenawalt",
        "jobTitle": "Director of Research & Insights",
        "worksFor": {
          "@type": "Organization",
          "name": "Vation Ventures",
          "url": "https://vationventures.com"
        },
        "url": "https://stint.studio",
        "sameAs": [
          "https://github.com/taygren"
        ],
        "knowsAbout": [
          "Artificial Intelligence",
          "Strategic Foresight",
          "Geoeconomics",
          "Geopolitical Risk Modeling",
          "System Architecture",
          "Software Engineering",
          "Macroeconomic Research"
        ]
      },
      {
        "@type": "WebSite",
        "@id": "https://stint.studio/#website",
        "url": "https://stint.studio",
        "name": "STINT Studio",
        "description": "Centralized portfolio of Taylor Grenawalt's thought leadership, strategic intelligence frameworks, and AI systems development.",
        "publisher": {
          "@id": "https://stint.studio/#person"
        }
      }
    ]
  };

  const instruments = [
    {
      id: 'steep',
      name: 'STEEP Analysis Engine',
      desc: 'Six-agent pipeline mapping macro forces across Social, Tech, Econ, Environmental, and Political scopes. Visualizes insights via 3D Three.js force globes.',
      icon: '⚡',
      badge: 'Active System',
      badgeColor: 'text-violet-400 bg-violet-950/40 border-violet-850',
      action: () => dispatch({ type: 'SET_ACTIVE_TAB', payload: null })
    },
    {
      id: 'bigcycle',
      name: 'Dalio Big Cycle Engine',
      desc: 'Five-agent sequential pipeline evaluating debt sustainability, empire stages, bubble metrics, and allocating assets based on geoeconomic indicators.',
      icon: '⬡',
      badge: 'Dalio Framework',
      badgeColor: 'text-amber-400 bg-amber-950/40 border-amber-850',
      action: () => dispatch({ type: 'SET_ACTIVE_TAB', payload: 'bigcycleengine' })
    },
    {
      id: 'geoinstrument',
      name: 'GeoEcon Instrument Assessment',
      desc: 'Triangular strategic modeling scoring instruments on preciseness, resistance, and speed to isolate bilateral leverage profiles.',
      icon: '◈',
      badge: 'Farrell & Newman',
      badgeColor: 'text-teal-400 bg-teal-950/40 border-teal-850',
      action: () => dispatch({ type: 'SET_ACTIVE_TAB', payload: 'geoinstrument' })
    },
    {
      id: 'geopolicylab',
      name: 'GeoPolicy Lab Simulation',
      desc: 'Decision theater combining game theory scenario runs and historical case analyses with detailed multi-agent debrief outputs.',
      icon: '🎭',
      badge: 'Decision Theater',
      badgeColor: 'text-rose-400 bg-rose-950/40 border-rose-850',
      action: () => dispatch({ type: 'SET_ACTIVE_TAB', payload: 'geopolicylab' })
    },
    {
      id: 'scenarios',
      name: 'Scenario Emulator',
      desc: 'Geopolitical simulator driving 15 branching logic paths across trade, energy transition, monetary regimes, and supply chain shocks.',
      icon: '🗺️',
      badge: '15 Branches',
      badgeColor: 'text-emerald-400 bg-emerald-950/40 border-emerald-850',
      action: () => dispatch({ type: 'SET_ACTIVE_TAB', payload: 'geoeconscenarioemulator' })
    },
    {
      id: 'promptpkg',
      name: 'Prompt Engineering Package',
      desc: 'Copy-ready advanced prompts, adversarial buddy audits, and structural prompting templates sourced from real strategy workflows.',
      icon: '✍️',
      badge: 'Toolkit',
      badgeColor: 'text-blue-400 bg-blue-950/40 border-blue-850',
      action: () => dispatch({ type: 'SET_ACTIVE_TAB', payload: 'promptpkg' })
    },
    {
      id: 'tayos',
      name: 'TayOS Terminal Shell',
      desc: 'Simulated retro developer command prompt. Execute local telemetry inspect commands like help, sysinfo, and projects.',
      icon: '💻',
      badge: 'Interactive OS',
      badgeColor: 'text-indigo-400 bg-indigo-950/40 border-indigo-850',
      action: () => dispatch({ type: 'SET_ACTIVE_TAB', payload: 'tayos' })
    },
    {
      id: 'skillstore',
      name: 'Agent Skill Store Registry',
      desc: 'Structured capability database containing prompt engineering system seeds, parameter mappings, and model target endpoints.',
      icon: '🛒',
      badge: 'Agent Database',
      badgeColor: 'text-violet-400 bg-violet-950/40 border-violet-850',
      action: () => dispatch({ type: 'SET_ACTIVE_TAB', payload: 'skillstore' })
    }
  ];

  const readingTime = (text) => Math.max(1, Math.ceil((text || '').split(/\s+/).filter(Boolean).length / 200));

  return (
    <div className="relative w-full max-w-7xl mx-auto px-4 md:px-6 py-8 space-y-10 fade-in radial-glow-violet radial-glow-emerald">
      {/* Inject GEO Schema data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }}
      />

      {/* Hero Header */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 pb-8 border-b border-slate-800/80">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <img src="/stint-logo.png" alt="STINT Studio" className="h-10 w-auto object-contain flex-shrink-0 mix-blend-screen" />
            <span className="text-[10px] uppercase tracking-widest font-mono font-bold text-slate-500 bg-slate-900 border border-slate-800 px-2 py-0.5 rounded">v2.0 Portfolio</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">
            STINT<span className="text-violet-500">.</span>Studio
          </h1>
          <p className="text-slate-400 text-sm max-w-2xl leading-relaxed">
            Applied Strategy &amp; Geoeconomic Telemetry Hub. A centralized workspace integrating practitioner tools for foresight modeling, AI-agent analysis, and structured research.
          </p>
        </div>

        {/* System Telemetry Bar */}
        <div className="glass-panel border border-slate-800/80 rounded-2xl p-4 flex flex-wrap gap-4 text-xs font-mono min-w-[280px]">
          <div>
            <span className="text-slate-500 block uppercase tracking-wider text-[9px] font-bold">Groq Inference</span>
            <span className="flex items-center gap-1.5 mt-0.5">
              <span className={`w-2 h-2 rounded-full ${groqStatus === 'online' ? 'bg-emerald-400 animate-pulse' : groqStatus === 'offline' ? 'bg-red-400' : 'bg-amber-400 animate-pulse'}`} />
              <span className="text-slate-300 font-semibold">{groqStatus === 'online' ? 'Online' : groqStatus === 'offline' ? 'Offline' : 'Syncing'}</span>
            </span>
          </div>
          <div className="h-8 w-px bg-slate-800" />
          <div>
            <span className="text-slate-500 block uppercase tracking-wider text-[9px] font-bold">Active Engine</span>
            <span className="text-slate-300 font-semibold mt-0.5 block">{selectedModel.split('/').pop().slice(0, 16)}</span>
          </div>
          <div className="h-8 w-px bg-slate-800" />
          <div>
            <span className="text-slate-500 block uppercase tracking-wider text-[9px] font-bold">Publications</span>
            <span className="text-slate-300 font-semibold mt-0.5 block">{posts.length} briefs</span>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Interactive Tools (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500">Applied Foresight Instruments</h2>
            <span className="w-1.5 h-1.5 rounded-full bg-violet-400"></span>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {instruments.map(inst => (
              <div 
                key={inst.id} 
                onClick={inst.action}
                className="glass-panel glass-panel-hover rounded-2xl p-5 flex flex-col justify-between cursor-pointer group"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <span className="text-2xl group-hover:scale-110 transition-transform duration-300 inline-block">{inst.icon}</span>
                    <span className={`text-[9px] px-2 py-0.5 rounded-full border uppercase tracking-wider font-mono font-bold ${inst.badgeColor}`}>{inst.badge}</span>
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-white font-bold text-sm leading-tight group-hover:text-violet-400 transition-colors">{inst.name}</h3>
                    <p className="text-slate-400 text-xs leading-relaxed line-clamp-3">{inst.desc}</p>
                  </div>
                </div>
                <div className="pt-4 mt-auto flex items-center text-xs text-violet-400 font-semibold group-hover:translate-x-1 transition-transform">
                  Launch Instrument
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className="ml-1"><path d="M2 5h6M5 2l3 3-3 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Bio & Insight Feeds (5 Cols) */}
        <div className="lg:col-span-5 space-y-8">
          
          {/* Executive Bio Card */}
          <div className="glass-panel rounded-2xl p-6 border border-slate-800/80 space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-700 flex-shrink-0 flex items-center justify-center text-sm font-black text-white shadow-inner">
                TG
              </div>
              <div>
                <h3 className="text-white font-bold text-sm">Taylor Grenawalt</h3>
                <p className="text-[11px] text-slate-500 font-medium">Michigan, USA</p>
              </div>
            </div>

            <div className="space-y-2 text-xs text-slate-400 leading-relaxed font-sans">
              <p>
                <strong>Director of Research &amp; Insights at Vation Ventures</strong>. Interfacing strategy Consulting, quantitative valuation models, and automated engineering architectures.
              </p>
              <p>
                Author of the STEEP automation loops. Brown University wrestling alumnus with a custom Public Affairs framework fusing policy, decision game theory, and geoeconomic systems.
              </p>
            </div>
            
            <div className="pt-3 border-t border-slate-800/60 flex items-center justify-between">
              <button 
                onClick={() => dispatch({ type: 'SET_ACTIVE_TAB', payload: 'about' })}
                className="text-[11px] font-semibold text-slate-400 hover:text-white transition-colors"
              >
                Read Bio &amp; Updates →
              </button>
              <a 
                href="https://github.com/taygren" 
                target="_blank" 
                rel="noreferrer" 
                className="text-[11px] font-semibold text-slate-500 hover:text-white transition-colors"
              >
                GitHub Profile
              </a>
            </div>
          </div>

          {/* Living Thought Leadership Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500">Curated Intelligence Briefs</h2>
              <button
                onClick={() => dispatch({ type: 'SET_ACTIVE_TAB', payload: 'thoughtleadership' })}
                className="text-[10px] text-violet-400 hover:text-violet-300 font-semibold"
              >
                See All
              </button>
            </div>

            <div className="space-y-3">
              {posts.length === 0 ? (
                <div className="glass-panel rounded-xl p-6 text-center text-slate-650 text-xs italic">
                  No published briefs yet. Use Admin to generate.
                </div>
              ) : (
                posts.slice(0, 3).map(post => (
                  <a
                    key={post.id}
                    href={`/thought-leadership/${post.slug || post.id}`}
                    className="glass-panel glass-panel-hover rounded-xl p-4 block group border border-slate-800/60"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[9px] text-slate-500 font-mono">
                          {post.publishedAt && new Date(post.publishedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                        </span>
                        <span className="text-[9px] text-slate-500 font-mono">{readingTime(post.contentMarkdown)} min read</span>
                      </div>
                      <h4 className="text-white text-xs font-bold group-hover:text-violet-400 transition-colors line-clamp-1 leading-snug">{post.title}</h4>
                      {post.dek && <p className="text-slate-500 text-[11px] line-clamp-2 leading-relaxed">{post.dek}</p>}
                    </div>
                  </a>
                ))
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
