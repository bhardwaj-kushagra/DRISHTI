import { useMode } from "../context/AppContext";
import CommentsPanel from "./CommentsPanel";

export default function FindingDrawer({ finding, onClose }) {
  const { mode } = useMode();
  if (!finding) return null;
  const simple = mode === "Beginner";

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="absolute right-0 top-0 h-full w-full max-w-md bg-slate-900 border-l border-slate-700 p-4 overflow-y-auto">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-indigo-300 font-semibold">Finding details</h3>
          <button onClick={onClose} className="btn-secondary px-2 py-1 text-xs">Close</button>
        </div>

        <div className="space-y-2 text-sm">
          <div><span className="text-slate-400">Tool:</span> {finding.tool}</div>
          <div><span className="text-slate-400">Asset:</span> {finding.asset}</div>
          <div><span className="text-slate-400">Component:</span> {finding.component}</div>
          <div><span className="text-slate-400">CVE:</span> {finding.cve || "-"}</div>
          <div><span className="text-slate-400">CVSS:</span> {finding.cvss ?? "-"}</div>
          <div><span className="text-slate-400">Severity:</span> {finding.severity}</div>
          <div><span className="text-slate-400">Evidence:</span> {finding.details || finding.evidence}</div>
        </div>

        <div className="mt-4">
          <h4 className="text-slate-200 font-semibold mb-1">{simple ? "Why this matters" : "Risk rationale"}</h4>
          <p className="text-slate-300 text-sm">
            {finding.cve ? "Known vulnerability with public references; exploitation may lead to lateral movement or data exposure." : "Service exposure can increase attack surface; harden or restrict as appropriate."}
          </p>
        </div>

        <div className="mt-3">
          <h4 className="text-slate-200 font-semibold mb-1">{simple ? "How to fix" : "Remediation plan"}</h4>
          <ul className="list-disc ml-5 text-slate-300 text-sm">
            {finding.cve === "CVE-2021-41773" && <li>Upgrade Apache 2.4.49 to 2.4.51+ and verify configs.</li>}
            {finding.component === "wordpress" && <li>Update WordPress core and vulnerable plugins; restrict admin access.</li>}
            {finding.component === "sshd" && <li>Limit SSH exposure (ACL), use keys only, and monitor brute-force attempts.</li>}
          </ul>
        </div>

        <div className="mt-4">
          <CommentsPanel findingId={finding.id} />
        </div>
      </div>
    </div>
  );
}
