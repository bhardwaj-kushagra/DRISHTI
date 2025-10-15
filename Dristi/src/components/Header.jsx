import { useState } from "react";
import { useMode, useRole } from "../context/AppContext";
import Chatbot from "./Chatbot";

export default function Header() {
  const { mode, setMode } = useMode();
  const { role, setRole } = useRole();
  const [assistantOpen, setAssistantOpen] = useState(false);

  return (
    <div className="px-4 pt-4">{/* non-sticky header wrapper */}
      <header className="glass-card px-6 py-4">
        <div className="max-w-[1280px] mx-auto flex items-center justify-between">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold">
              D
            </div>
            <div>
              <h1 className="text-lg font-semibold text-white tracking-tight">DRISTHI</h1>
              <p className="text-xs text-slate-400">AI-Powered Security Assistant</p>
            </div>
          </div>

          {/* Controls + Dristi Assistant trigger */}
          <div className="flex items-center gap-3">
            <select
              value={mode}
              onChange={(e) => setMode(e.target.value)}
              className="bg-slate-800 border border-slate-600 text-slate-100 text-xs rounded-md px-2 py-1"
              aria-label="Mode"
            >
              <option>Beginner</option>
              <option>Expert</option>
            </select>

            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="bg-slate-800 border border-slate-600 text-slate-100 text-xs rounded-md px-2 py-1"
              aria-label="Role"
            >
              <option>Viewer</option>
              <option>Analyst</option>
              <option>Admin</option>
            </select>

            <button
              className="assist-btn"
              onClick={() => setAssistantOpen(true)}
              aria-label="Open Dristi Assistant"
            >
              Dristi Assistant
            </button>

            <div className="text-sm text-slate-300">
              Logged in as: <span className="text-indigo-400 font-medium">{role}_01</span>
            </div>
          </div>
        </div>
      </header>

      {/* Fullscreen Assistant Modal */}
      {assistantOpen && (
        <div className="assist-modal" role="dialog" aria-modal="true" aria-label="Dristi Assistant">
          <div className="glass-card assist-card flex flex-col">
            <div className="flex items-center justify-between px-4 py-2 border-b border-white/10">
              <h3 className="text-indigo-300 font-semibold">Dristi Assistant</h3>
              <div className="flex items-center gap-2">
                <button
                  className="btn-secondary px-3 py-1 text-xs"
                  onClick={() => setAssistantOpen(false)}
                  aria-label="Close Assistant"
                >
                  Close
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-hidden">
              <Chatbot />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
