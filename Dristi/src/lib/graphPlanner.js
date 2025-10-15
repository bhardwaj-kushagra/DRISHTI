// Constraint-aware attack path planning over local results.
export function buildVulnGraph(results) {
  // Nodes by finding id; edges by simple feasibility rules
  const nodes = results.map(r => ({ id: r.id, label: r.cve || r.finding, component: r.component, severity: r.severity, asset: r.asset }));
  const edges = [];
  // Simple rule: High-severity CVE on web tier can lead to Medium plugin vuln on same asset
  const highs = results.filter(r => r.severity === "High");
  highs.forEach(h => {
    results.forEach(m => {
      const sameAsset = h.asset && m.asset && h.asset === m.asset;
      if (sameAsset && m.id !== h.id && (m.cve || /plugin|wordpress|config|auth/i.test(m.finding))) {
        edges.push({ from: h.id, to: m.id, rationale: "Post-compromise pivot on same asset" });
      }
    });
  });
  return { nodes, edges };
}

export function planExploitChain(graph) {
  // Pick a chain of length 2-3 if possible with rationales and preconditions
  const steps = [];
  const first = graph.nodes.find(n => /CVE/.test(n.label)) || graph.nodes[0];
  if (!first) return steps;

  steps.push({
    id: first.id,
    action: "Initial exploitation",
    preconditions: ["Network access to target service", "Version vulnerable or misconfigured"],
    rationale: "Known exploit path or misconfiguration"
  });

  const nextEdge = graph.edges.find(e => e.from === first.id);
  if (nextEdge) {
    const second = graph.nodes.find(n => n.id === nextEdge.to);
    if (second) {
      steps.push({
        id: second.id,
        action: "Post-exploitation lateral/config abuse",
        preconditions: ["Same-asset privileges", "Web/Admin session or file write"],
        rationale: nextEdge.rationale
      });
    }
  }
  return steps;
}
