import { useState } from "react";
import FindingDrawer from "./FindingDrawer";

export default function ResultsTable({ results }) {
  const [active, setActive] = useState(null);
  return (
    <div className="glass-card p-5">
      <h2 className="text-xl font-semibold mb-4 text-indigo-400">Scan Results</h2>

      {results.length === 0 ? (
        <div className="p-8 text-center text-slate-400 italic">No scan data yet. Run a scan!</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead className="table-header">
              <tr>
                <th className="py-2 px-3">Tool</th>
                <th className="py-2 px-3">Finding</th>
                <th className="py-2 px-3">Asset</th>
                <th className="py-2 px-3">Component</th>
                <th className="py-2 px-3">CVE</th>
                <th className="py-2 px-3">CVSS</th>
                <th className="py-2 px-3">Severity</th>
                <th className="py-2 px-3">Exploited</th>
              </tr>
            </thead>
            <tbody>
              {results.map((r) => (
                <tr key={r.id} className="table-row cursor-pointer" onClick={()=>setActive(r)}>
                  <td className="py-2 px-3">{r.tool}</td>
                  <td className="py-2 px-3 text-slate-200">{r.finding}</td>
                  <td className="py-2 px-3">{r.asset || "-"}</td>
                  <td className="py-2 px-3">{r.component || "-"}</td>
                  <td className="py-2 px-3">{r.cve || "-"}</td>
                  <td className="py-2 px-3">{r.cvss ?? "-"}</td>
                  <td className={`py-2 px-3 font-semibold ${r.severity === "High" ? "text-red-400" : r.severity === "Medium" ? "text-amber-400" : "text-green-400"}`}>{r.severity}</td>
                  <td className="py-2 px-3">
                    <span className={`text-xs px-2 py-1 rounded ${r.exploited ? "bg-red-500/20 text-red-300" : "bg-slate-600/40 text-slate-300"}`}>
                      {r.exploited ? "Active" : "Unknown"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <FindingDrawer finding={active} onClose={()=>setActive(null)} />
    </div>
  );
}
