// Risk-adaptive retrieval and source triangulation on local mock data.
import state from "../data/state.json";

export function retrieveForFinding(finding) {
  const intel = state.intel || { exploitedCves: [], trending: [] };
  const base = [
    { id: "NVD", weight: 1.0, url: "nvd.nist.gov" },
    { id: "ExploitDB", weight: 0.9, url: "exploit-db.com" },
    { id: "Rapid7", weight: 0.8, url: "rapid7.com" }
  ];

  const boosted = base.map(s => {
    let w = s.weight;
    if (finding?.cve && intel.exploitedCves.includes(finding.cve)) w += 0.5;
    if (finding?.cve && intel.trending.includes(finding.cve)) w += 0.25;
    if (finding?.severity === "High") w += 0.15;
    return { ...s, weight: w };
  });

  // Require at least 2 sources to "triangulate"
  const ranked = boosted.sort((a,b)=>b.weight-a.weight);
  return ranked.slice(0, Math.max(2, Math.min(3, ranked.length)));
}
