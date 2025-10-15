// Verifiers to increase objective correctness.
const KNOWN_TOOL_FLAGS = {
  nmap: ["-sV","-Pn","-p","-A"],
  nuclei: ["-u","-severity","-tags","-t"],
  nessus: ["--policy","--target"], // placeholders
  openvas: ["--target","--scan"]
};

export function verifyReferencesInAnswer(answer, finding) {
  const want = [finding.component, finding.asset].filter(Boolean);
  return want.every(w => new RegExp(String(w).replace(/[.*+?^${}()|[\]\\]/g,"\\$&"), "i").test(answer));
}

export function lintCommands(cmds=[]) {
  // Ensure each command appears to use valid flags for the declared tool
  return cmds.every(c => {
    const tool = c.trim().split(/\s+/)[0];
    const flags = (c.match(/ -[-\w]+| -\w+/g) || []).map(s=>s.trim());
    const allow = KNOWN_TOOL_FLAGS[tool] || [];
    return flags.every(f => allow.some(a => f.startsWith(a)));
  });
}
