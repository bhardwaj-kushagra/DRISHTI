// A panel that showcases "model" features on local data: planning, retrieval, verification.
import { useMemo, useState } from "react";
import { buildVulnGraph, planExploitChain } from "../lib/graphPlanner";
import { retrieveForFinding } from "../lib/riskRetrieval";
import { verifyReferencesInAnswer, lintCommands } from "../lib/verifier";

function DemoAnswer({ finding }) {
  const text = finding?.cve
    ? `Exploit ${finding.cve} on ${finding.asset} (${finding.component}) via path traversal; patch to fixed version and validate httpd configs.`
    : `Reduce exposure of ${finding.component} on ${finding.asset}; restrict access and harden service.`;
  const passes = verifyReferencesInAnswer(text, finding);
  return (
    <div className={`text-xs ${passes ? "text-emerald-300" : "text-amber-300"}`}>
      {text} • Verifier: {passes ? "OK" : "Missing refs"}
    </div>
  );
}

export default function ModelPanel({ results=[] }) {
  const graph = useMemo(()=>buildVulnGraph(results), [results]);
  const chain = useMemo(()=>planExploitChain(graph), [graph]);
  const [cmds] = useState([
    "nmap -sV -Pn shop.example.com",
    "nuclei -u https://shop.example.com -severity medium,high,critical"
  ]);
  const lintOk = lintCommands(cmds);

  const firstFinding = results.find(r=>r.severity==="High") || results[0];
  const sources = firstFinding ? retrieveForFinding(firstFinding) : [];

  return (
    <div className="glass-card p-4">
      <h3 className="text-indigo-400 font-semibold mb-2">Model Features (Demo)</h3>

      <div className="mb-3">
        <h4 className="text-slate-200 text-sm font-semibold">Constraint-aware chain</h4>
        {chain.length ? chain.map((s,i)=>(
          <div key={i} className="text-xs text-slate-300">
            {i+1}. {s.action} • pre: {s.preconditions.join(", ")} • reason: {s.rationale}
          </div>
        )) : <p className="text-xs text-slate-400">No chain available.</p>}
      </div>

      <div className="mb-3">
        <h4 className="text-slate-200 text-sm font-semibold">Risk-adaptive sources</h4>
        {sources.length ? sources.map(s => (
          <span key={s.id} className="text-[10px] mr-2 px-2 py-1 rounded bg-slate-700 text-slate-200">
            {s.id} • w:{s.weight.toFixed(2)}
          </span>
        )) : <p className="text-xs text-slate-400">No sources.</p>}
      </div>

      <div className="mb-3">
        <h4 className="text-slate-200 text-sm font-semibold">Answer with verifier</h4>
        {firstFinding ? <DemoAnswer finding={firstFinding} /> : <p className="text-xs text-slate-400">No findings.</p>}
      </div>

      <div>
        <h4 className="text-slate-200 text-sm font-semibold">Procedure validity (linter)</h4>
        <pre className="bg-slate-900/70 border border-slate-700 rounded p-2 text-[11px] text-slate-300 overflow-x-auto">{cmds.join("\n")}</pre>
        <p className={`text-xs mt-1 ${lintOk ? "text-emerald-300" : "text-amber-300"}`}>Linter: {lintOk ? "All commands valid" : "Found invalid flags"}</p>
      </div>
    </div>
  );
}
