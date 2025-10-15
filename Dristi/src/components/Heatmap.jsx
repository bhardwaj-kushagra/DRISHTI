// Simple heatmap: assets vs categories using findings keywords
const CATS = ["auth","input","config","exposure"];

function bucket(f) {
  const txt = `${f.finding} ${f.details || ""}`.toLowerCase();
  return {
    auth: +(txt.includes("auth") || txt.includes("login") || txt.includes("ssh")),
    input: +(txt.includes("xss") || txt.includes("sqli") || txt.includes("input")),
    config: +(txt.includes("misconfig") || txt.includes("default") || txt.includes("outdated")),
    exposure: +(txt.includes("open port") || txt.includes("exposed") || txt.includes("dir traversal")),
  };
}

export default function Heatmap({ results }) {
  const assets = Array.from(new Set(results.map(r => r.asset))).filter(Boolean);
  const counts = assets.map(a => {
    const rows = results.filter(r => r.asset === a);
    const c = { auth:0,input:0,config:0,exposure:0 };
    rows.forEach(r => {
      const b = bucket(r);
      CATS.forEach(k => c[k]+=b[k]);
    });
    return { asset: a, ...c };
  });

  return (
    <div className="glass-card p-4">
      <h3 className="text-indigo-400 font-semibold mb-2">Severity Heatmap</h3>
      {assets.length === 0 ? <p className="text-slate-400 text-sm">No data.</p> : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead className="table-header">
              <tr>
                <th className="py-2 px-3 text-left">Asset</th>
                {CATS.map(c => <th key={c} className="py-2 px-3">{c}</th>)}
              </tr>
            </thead>
            <tbody>
              {counts.map(row => (
                <tr key={row.asset} className="table-row">
                  <td className="py-2 px-3">{row.asset}</td>
                  {CATS.map(c => (
                    <td key={c} className="py-2 px-3">
                      <div className={`w-8 h-4 rounded ${row[c] ? "bg-red-500/50" : "bg-slate-700"}`} title={`${row[c]} issues`} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
