import React, { useState, useEffect, useMemo } from "react";
import { MOCK_RESULTS } from "../data/mockResults";
import { useMode } from "../context/AppContext";

const PRESETS = {
  Recon: { nmap: true, nessus: false, nuclei: false, openvas: false },
  WebApp: { nmap: true, nessus: true, nuclei: true, openvas: false },
  Infra: { nmap: true, nessus: true, nuclei: false, openvas: true },
  Compliance: { nmap: false, nessus: true, nuclei: false, openvas: true }
};

export default function ScanControls({ onResults }) {
  const { mode } = useMode();
  const [target, setTarget] = useState("");
  const [scanning, setScanning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [selectedTools, setSelectedTools] = useState({ nmap: true, nessus: true, nuclei: false, openvas: false });

  useEffect(() => {
    let id;
    if (scanning && progress < 100) id = setInterval(() => setProgress((p) => Math.min(p + 10, 100)), 300);
    if (!scanning) setProgress(0);
    return () => clearInterval(id);
  }, [scanning, progress]);

  useEffect(() => {
    if (progress === 100 && scanning) {
      setTimeout(() => {
        onResults(MOCK_RESULTS);
        setScanning(false);
      }, 500);
    }
  }, [progress, scanning, onResults]);

  const commandPreview = useMemo(() => {
    if (!target) return "";
    const cmds = [];
    if (selectedTools.nmap) cmds.push(`nmap -sV -Pn ${target}`);
    if (selectedTools.nessus) cmds.push(`# nessus scan target=${target}`);
    if (selectedTools.nuclei) cmds.push(`nuclei -u https://${target} -severity medium,high,critical`);
    if (selectedTools.openvas) cmds.push(`# openvas target=${target}`);
    return cmds.join("\n");
  }, [selectedTools, target]);

  const setPreset = (name) => setSelectedTools(PRESETS[name]);

  const startScan = () => {
    if (!target.trim()) return alert("Enter a valid target first!");
    const httpWarn = target.startsWith("http://");
    if (httpWarn && mode === "Beginner" && !confirm("Target uses http:// (less safe). Continue?")) return;
    setScanning(true);
    onResults([]);
  };

  return (
    <div className="p-0 w-full max-w-full">
      <input
        type="text"
        className="input-box mb-2"
        placeholder="Enter domain or IP e.g. example.com"
        value={target}
        onChange={(e) => setTarget(e.target.value)}
      />

      {/* Presets wrap neatly inside the card */}
      <div className="preset-row mb-3">
        {Object.keys(PRESETS).map((p) => (
          <button key={p} onClick={() => setPreset(p)} className="btn-secondary px-3 py-1 text-xs preset-chip">
            {p}
          </button>
        ))}
      </div>

      <div className="space-y-2 mb-4">
        {Object.keys(selectedTools).map((tool) => (
          <label key={tool} className="flex items-center gap-2 text-slate-300">
            <input
              type="checkbox"
              checked={selectedTools[tool]}
              onChange={() => setSelectedTools((prev) => ({ ...prev, [tool]: !prev[tool] }))}
            />
            {tool.toUpperCase()}
          </label>
        ))}
      </div>

      <div className="mb-4">
        <label className="text-xs text-slate-400">Command Preview</label>
        <pre className="codeblock">{commandPreview || "# select tools and enter a target to preview commands"}</pre>
      </div>

      <div className="flex gap-3 mb-2">
        <button
          onClick={startScan}
          disabled={scanning}
          className={`btn-primary flex-1 ${scanning ? "opacity-70 cursor-not-allowed" : ""}`}
        >
          {scanning ? "Scanning..." : "Start Scan"}
        </button>
        <button onClick={() => setScanning(false)} disabled={!scanning} className="btn-secondary flex-1">
          Stop
        </button>
      </div>

      {scanning && (
        <div className="h-3 bg-slate-700 rounded-lg overflow-hidden">
          <div className="h-full bg-indigo-500 transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>
      )}
    </div>
  );
}
