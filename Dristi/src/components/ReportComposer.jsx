import fileDownload from "js-file-download";

function buildMarkdown({ results }) {
  const criticals = results.filter(r => r.severity === "High");
  const lines = [];
  lines.push("# SmartScanner Report");
  lines.push("");
  lines.push("## Executive summary");
  lines.push(`- Targets scanned: ${new Set(results.map(r=>r.asset)).size}`);
  lines.push(`- High-risk findings: ${criticals.length}`);
  lines.push("");
  lines.push("## Prioritized remediation");
  criticals.forEach(r => lines.push(`- ${r.asset} • ${r.cve || r.finding} • ${r.component}`));
  lines.push("");
  lines.push("## Findings (normalized)");
  results.forEach(r => lines.push(`- ${r.tool} • ${r.asset} • ${r.component} • ${r.cve || "-"} • CVSS ${r.cvss ?? "-"} • ${r.severity}`));
  return lines.join("\n");
}

export default function ReportComposer({ results=[] }) {
  const download = () => {
    const md = buildMarkdown({ results });
    fileDownload(md, "SmartScanner_Report.md");
  };
  return (
    <div className="glass-card p-4">
      <h3 className="text-indigo-400 font-semibold mb-2">Report Composer</h3>
      <p className="text-slate-300 text-sm mb-2">Generate an executive-ready report with normalized findings and a prioritized remediation list.</p>
      <button onClick={download} className="btn-primary text-sm px-3 py-2">Export Markdown</button>
    </div>
  );
}
