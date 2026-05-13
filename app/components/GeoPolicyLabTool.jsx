'use client';

export default function GeoPolicyLabTool() {
  return (
    <div className="flex flex-col h-full w-full bg-[#0D0F12]">
      {/* Header strip matching STEEP toolkit style */}
      <div className="flex items-center gap-3 px-4 py-2.5 border-b border-amber-500/20 bg-[#131720] flex-shrink-0">
        <span className="text-amber-400 text-sm">◈</span>
        <div>
          <div className="text-xs font-medium text-white font-mono tracking-wider">GEOPOLICY LAB</div>
          <div className="text-xs text-slate-500">Strategic Simulation Environment</div>
        </div>
        <a
          href="/geopolicy-lab/index.html"
          target="_blank"
          rel="noopener noreferrer"
          className="ml-auto text-xs text-slate-500 hover:text-amber-400 transition-colors font-mono border border-slate-700 hover:border-amber-500/40 px-2 py-1"
        >
          ↗ OPEN STANDALONE
        </a>
      </div>

      {/* Full-height iframe */}
      <iframe
        src="/geopolicy-lab/index.html"
        title="GeoPolicy Lab — Strategic Simulation Environment"
        className="flex-1 w-full border-none"
        style={{ minHeight: 0 }}
        allow="clipboard-write"
      />
    </div>
  );
}
