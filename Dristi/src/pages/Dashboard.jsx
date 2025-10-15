import React, { useMemo, useState } from "react";
import ScanControls from "../components/ScanControls";
import ResultsTable from "../components/ResultsTable";
import AttackPathGraph from "../components/AttackPathGraph";
import Heatmap from "../components/Heatmap";
import DiffView from "../components/DiffView";
import ReportComposer from "../components/ReportComposer";
import ModelPanel from "../components/ModelPanel";
import TimelineSelector from "../components/TimelineSelector";
import state from "../data/state.json";

function findingsOfScan(scanId) {
  return state.findings
    .filter((f) => f.scanId === scanId)
    .map((f) => ({
      id: f.id,
      tool: f.tool,
      finding: f.cve || f.evidence || f.component,
      cve: f.cve,
      cvss: f.cvss,
      component: f.component,
      severity: f.severity,
      details: f.evidence,
      asset: f.asset,
      exploited: f.exploited,
    }));
}

export default function Dashboard() {
  const [results, setResults] = useState([]);
  const [baselineId, setBaselineId] = useState("s0");
  const [currentId, setCurrentId] = useState("s1");

  const baseline = useMemo(() => findingsOfScan(baselineId), [baselineId]);
  const current = useMemo(
    () => (results.length ? results : findingsOfScan(currentId)),
    [results, currentId]
  );

  return (
    <main className="container-app">
      <div className="grid-shell my-4">
        {/* Left rail */}
        <aside className="rail-sticky">
          <div className="glass-card">
            <h2 className="card-title">Target & Scan</h2>
            <ScanControls onResults={setResults} />
          </div>
          <div className="glass-card">
            <h2 className="card-title">Scan Timeline</h2>
            <TimelineSelector value={currentId} onChange={setCurrentId} />
          </div>
        </aside>

        {/* Center content */}
        <section className="flex flex-col gap-4">
          <div className="glass-card">
            <h2 className="card-title">Scan Results</h2>
            <ResultsTable results={current} />
          </div>
          <div className="glass-card">
            <h2 className="card-title">Attack Path</h2>
            <AttackPathGraph results={current} onSelect={() => {}} />
          </div>
          <div className="glass-card">
            <h2 className="card-title">Severity Heatmap</h2>
            <Heatmap results={current} />
          </div>
          <div className="glass-card">
            <h2 className="card-title">What changed?</h2>
            <DiffView baseline={baseline} current={current} />
          </div>
          <div className="glass-card">
            <h2 className="card-title">Model Features</h2>
            <ModelPanel results={current} />
          </div>
          <div className="glass-card">
            <h2 className="card-title">Report Composer</h2>
            <ReportComposer results={current} />
          </div>
        </section>
      </div>
    </main>
  );
}
