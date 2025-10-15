// A scan timeline scrubber to feed DiffView.
import state from "../data/state.json";

export default function TimelineSelector({ value, onChange }) {
  const scans = state.scans.sort((a,b)=> new Date(a.startedAt) - new Date(b.startedAt));
  return (
    <div className="glass-card p-3">
      <h3 className="text-indigo-400 font-semibold mb-2">Scan Timeline</h3>
      <div className="flex items-center gap-2 overflow-x-auto">
        {scans.map(s => {
          const highs = state.findings.filter(f => f.scanId === s.id && f.severity === "High").length;
          return (
            <button
              key={s.id}
              onClick={()=>onChange?.(s.id)}
              className={`px-2 py-1 rounded border ${value===s.id?"border-indigo-500 bg-indigo-500/10":"border-slate-600 bg-slate-800"}`}
              title={new Date(s.startedAt).toLocaleString()}
            >
              {s.id.toUpperCase()} • H:{highs}
            </button>
          );
        })}
      </div>
    </div>
  );
}
