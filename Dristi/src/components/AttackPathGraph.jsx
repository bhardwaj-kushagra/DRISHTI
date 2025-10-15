import React from "react";

export default function AttackPathGraph({ results, onSelect }) {
  const chain = results.filter((r) => r.cve);
  return (
    <div className="glass-card p-4">
      <h3 className="text-indigo-400 font-semibold mb-2">Attack Path (Demo)</h3>
      {chain.length === 0 ? (
        <p className="text-slate-400 text-sm">No CVE chain detected.</p>
      ) : (
        <div className="flex items-center gap-2 flex-wrap text-xs">
          {chain.map((r, i) => (
            <React.Fragment key={r.id}>
              <button
                onClick={()=>onSelect?.(r)}
                className="px-2 py-1 rounded bg-slate-800 border border-slate-600 hover:border-indigo-500"
                title="Open finding"
              >
                {r.component} • {r.cve} • {r.severity}
              </button>
              {i < chain.length - 1 && <span className="text-slate-500">→</span>}
            </React.Fragment>
          ))}
        </div>
      )}
    </div>
  );
}
