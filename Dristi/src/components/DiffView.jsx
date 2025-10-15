// Visual diff of two scans by finding identity (tool + component + cve)
function keyOf(f){ return [f.tool,f.component,f.cve].join("|"); }

export default function DiffView({ baseline=[], current=[] }) {
  const baseMap = new Map(baseline.map(f => [keyOf(f), f]));
  const currMap = new Map(current.map(f => [keyOf(f), f]));
  const added = current.filter(f => !baseMap.has(keyOf(f)));
  const removed = baseline.filter(f => !currMap.has(keyOf(f)));
  const intersect = current.filter(f => baseMap.has(keyOf(f)));
  const regressed = intersect.filter(f => (baseMap.get(keyOf(f))?.severity || "") !== f.severity);

  return (
    <div className="glass-card p-4">
      <h3 className="text-indigo-400 font-semibold mb-2">What changed?</h3>
      <div className="grid grid-cols-3 gap-3">
        <div>
          <h4 className="text-sm text-emerald-300 mb-1">Resolved</h4>
          {removed.length ? removed.map(f => <div key={keyOf(f)} className="text-xs text-slate-200">{f.tool} • {f.component} • {f.cve || "-"}</div>) : <p className="text-xs text-slate-400">None</p>}
        </div>
        <div>
          <h4 className="text-sm text-amber-300 mb-1">New</h4>
          {added.length ? added.map(f => <div key={keyOf(f)} className="text-xs text-slate-200">{f.tool} • {f.component} • {f.cve || "-"}</div>) : <p className="text-xs text-slate-400">None</p>}
        </div>
        <div>
          <h4 className="text-sm text-red-300 mb-1">Regressed</h4>
          {regressed.length ? regressed.map(f => <div key={keyOf(f)} className="text-xs text-slate-200">{f.tool} • {f.component} • {f.cve || "-"} → {f.severity}</div>) : <p className="text-xs text-slate-400">None</p>}
        </div>
      </div>
    </div>
  );
}
