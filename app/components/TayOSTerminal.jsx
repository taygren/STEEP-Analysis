'use client';

import { useState, useRef, useEffect } from 'react';

export default function TayOSTerminal({ groqStatus = 'online', selectedModel = 'llama-3.3-70b-versatile' }) {
  const [history, setHistory] = useState([
    { text: 'TayOS v1.4.2 (Secure Boot: Active)', type: 'system' },
    { text: 'Initialising telemetry connection to Groq API...', type: 'system' },
    { text: `Status: Connected | Active Node: ${selectedModel}`, type: 'success' },
    { text: 'Type "help" for a list of available command directives.', type: 'info' }
  ]);
  const [input, setInput] = useState('');
  const terminalEndRef = useRef(null);

  const executeCommand = (cmd) => {
    const rawCmd = cmd.trim();
    const cleanCmd = rawCmd.toLowerCase();
    const args = cleanCmd.split(' ');
    const primary = args[0];

    const newHistory = [...history, { text: `tay@stint-studio:~$ ${rawCmd}`, type: 'input' }];

    if (cleanCmd === '') {
      setHistory(newHistory);
      return;
    }

    switch (primary) {
      case 'help':
        newHistory.push(
          { text: 'Supported Directives:', type: 'system' },
          { text: '  sysinfo      - Display telemetry, inference engine parameters, and API states.', type: 'info' },
          { text: '  projects     - Detail active software assets and github repos in Taylor\'s stack.', type: 'info' },
          { text: '  skills       - View a listing of autonomous agent capabilities.', type: 'info' },
          { text: '  clear        - Flush the console buffer and reset terminal screen.', type: 'info' }
        );
        break;
      case 'sysinfo':
        newHistory.push(
          { text: `OS Name:       TayOS`, type: 'info' },
          { text: `Build Core:    Next.js 14 / React 18 / Tailwind`, type: 'info' },
          { text: `API Node:      Groq Cloud Service (${groqStatus.toUpperCase()})`, type: 'info' },
          { text: `Model:         ${selectedModel}`, type: 'info' },
          { text: `Firmware:      0x${(102901 + Math.floor(Math.random() * 90000)).toString(16).toUpperCase()}`, type: 'info' },
          { text: `Host Environment: Vercel Serverless Edge`, type: 'info' }
        );
        break;
      case 'projects':
        newHistory.push(
          { text: 'Active Repository Registry:', type: 'system' },
          { text: '  1. STEEP-Analysis  - Six-agent macro intelligence & geoeconomics dashboard.', type: 'info' },
          { text: '  2. TayOS           - Command shell & micro-kernel developer terminal.', type: 'info' },
          { text: '  3. Skill-Store     - AI automation capabilities & structured JSON schemas.', type: 'info' }
        );
        break;
      case 'skills':
        newHistory.push(
          { text: 'Directing to Skill Store... Use the sidebar tabs to launch the registry explorer.', type: 'success' }
        );
        break;
      case 'clear':
        setHistory([]);
        setInput('');
        return;
      default:
        newHistory.push({ text: `Unknown instruction: "${primary}". Type "help" to view directory of commands.`, type: 'error' });
    }

    setHistory(newHistory);
    setInput('');
  };

  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history]);

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 fade-in space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-ping"></span>
            TayOS Terminal Shell
          </h1>
          <p className="text-slate-500 text-xs mt-0.5">Simulated developer interface &amp; kernel controller</p>
        </div>
        <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest bg-slate-900 border border-slate-850 px-2.5 py-1 rounded">Secure Shell</span>
      </div>

      {/* Terminal Window */}
      <div className="w-full bg-[#0a0a14] border border-slate-850 rounded-2xl shadow-2xl overflow-hidden font-mono text-xs flex flex-col min-h-[500px]">
        {/* Terminal Header */}
        <div className="flex items-center gap-1.5 px-4 py-3 bg-[#0d0d1a] border-b border-slate-900">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500/80"></div>
          <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80"></div>
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80"></div>
          <span className="text-[10px] text-slate-600 font-semibold uppercase tracking-wider mx-auto">tay@stint-studio: ~</span>
        </div>

        {/* Console logs */}
        <div className="flex-1 overflow-y-auto p-5 space-y-2 select-text scrollbar-none h-[400px]">
          {history.map((log, idx) => (
            <div 
              key={idx} 
              className={`leading-relaxed whitespace-pre-wrap ${
                log.type === 'system' ? 'text-slate-400 font-semibold' :
                log.type === 'success' ? 'text-emerald-400 font-semibold' :
                log.type === 'info' ? 'text-indigo-300' :
                log.type === 'error' ? 'text-red-400 font-bold' : 'text-white'
              }`}
            >
              {log.text}
            </div>
          ))}
          <div ref={terminalEndRef} />
        </div>

        {/* Input prompt */}
        <div className="px-5 py-3.5 bg-[#080810] border-t border-slate-900 flex items-center gap-2">
          <span className="text-violet-400 font-bold shrink-0 select-none">tay@stint-studio:~$</span>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && executeCommand(input)}
            placeholder="Type command here..."
            className="flex-1 bg-transparent text-white focus:outline-none placeholder-slate-700 caret-violet-500"
            autoFocus
          />
        </div>
      </div>
    </div>
  );
}
