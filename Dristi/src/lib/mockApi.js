// Simple in-memory mock "API" to read/write state.json
import state from "../data/state.json";

let memory = JSON.parse(JSON.stringify(state));

export function getState() {
  return memory;
}

export function addComment({ findingId, author, text }) {
  const id = "cm" + (memory.comments.length + 1);
  const ts = new Date().toISOString();
  memory.comments.push({ id, findingId, author, text, ts });
  return memory.comments.filter(c => c.findingId === findingId);
}

export function createDryRunScan({ targetId, tools }) {
  const id = "s" + (memory.scans.length + 1);
  const startedAt = new Date().toISOString();
  memory.scans.push({
    id, targetId, tools, startedAt, status: "done",
    steps: tools.map((t, i) => ({ tool: t, t: `${new Date().getHours()}:${String(10+i).padStart(2,"0")}`, msg: `Simulated ${t} step`, level: "info" }))
  });
  return memory.scans.find(s => s.id === id);
}

export function getComments(findingId) {
  return memory.comments.filter(c => c.findingId === findingId);
}
