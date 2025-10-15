import React, { useState } from "react";
import { MOCK_RESULTS } from "../data/mockResults";

// Optional: consume global mode if available
let getUserMode = () => "Beginner";
try {
  // Lazy import to avoid breaking if context not created yet
  // eslint-disable-next-line
  const ctx = require("../context/AppContext");
  if (ctx?.useMode) getUserMode = () => ctx.useMode().mode || "Beginner";
} catch (_) {}

export default function Chatbot() {
  const userMode = getUserMode();

  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState("chat"); // "chat" | "search"

  const GEMINI_API_KEY = import.meta?.env?.VITE_GEMINI_API_KEY || "";
  const GEMINI_URL =
    "https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent";

  const append = (m) => setMessages((prev) => [...prev, m]);

  const deterministicReply = (q) => {
    const txt = q.toLowerCase();
    if (txt.includes("summar") || txt.includes("overview")) {
      return userMode === "Beginner"
        ? "High risk on Apache (CVE‑2021‑41773) is actively exploited. Update Apache first, then update WordPress, and harden SSH."
        : "Prioritize CVE‑2021‑41773 (apache2, CVSS 7.5, exploited). Next, remediate CVE‑2020‑28036 in WordPress. Restrict port 22 and enforce key‑based auth.";
    }
    if (txt.includes("fix") || txt.includes("remedi")) {
      return "1) Patch Apache to 2.4.51+ and disable vulnerable configs. 2) Update WordPress core/plugins. 3) Limit SSH to admin IPs; keys only; fail2ban.";
    }
    if (txt.includes("chain") || txt.includes("attack path")) {
      return "Likely chain: Apache path traversal (CVE‑2021‑41773) → web shell → plugin exploit on WordPress (CVE‑2020‑28036) → credential theft.";
    }
    if (txt.includes("cve")) {
      return "Search tip: provide CVE ID, affected component, and version to get targeted remediation and references.";
    }
    return "Ask: “Summarize criticals”, “Explain attack chain”, or “Generate patch plan”.";
  };

  const sendMessage = async () => {
    const trimmed = input.trim();
    if (!trimmed) return;

    const userMessage = { role: "user", text: trimmed };
    append(userMessage);
    setInput("");

    // Fast local demo mode if no API key
    if (!GEMINI_API_KEY) {
      const reply = deterministicReply(trimmed);
      append({ role: "assistant", text: reply });
      return;
    }

    setLoading(true);
    try {
      const basePrompt = `
You are "Drishti Cybersecurity Defender", an AI assistant specialized in vulnerability analysis and remediation guidance.
UI mode: ${userMode}. If Beginner, explain in simple steps; if Expert, include technical detail and triage priority.
If asked to summarize results, use this data: ${JSON.stringify(MOCK_RESULTS)}
      `.trim();

      const payload = {
        contents: [
          {
            role: "user",
            parts: [{ text: `${basePrompt}\n\nUser query: ${trimmed}` }],
          },
        ],
      };

      const resp = await fetch(`${GEMINI_URL}?key=${GEMINI_API_KEY}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!resp.ok) {
        throw new Error(`API request failed with status ${resp.status}`);
      }

      const data = await resp.json();
      const reply =
        data?.candidates?.[0]?.content?.parts?.[0]?.text ||
        "⚠️ No response from Dristi.";
      append({ role: "assistant", text: reply });
    } catch (err) {
      console.error("Gemini API Error:", err);
      append({ role: "assistant", text: "❌ Error connecting to Gemini API." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full text-slate-200 p-3">
      {/* Header (compact to maximize message area) */}
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold text-indigo-400 text-sm tracking-tight flex items-center gap-2">
          <span>🛡️</span> Drishti Assistant
        </h3>
        <div className="space-x-2 text-[11px] font-medium">
          <button
            onClick={() => setTab("chat")}
            className={`px-2 py-1 rounded-md transition ${
              tab === "chat"
                ? "bg-indigo-600 text-white"
                : "bg-slate-700 hover:bg-slate-600 text-slate-300"
            }`}
          >
            Chat
          </button>
          <button
            onClick={() => setTab("search")}
            className={`px-2 py-1 rounded-md transition ${
              tab === "search"
                ? "bg-indigo-600 text-white"
                : "bg-slate-700 hover:bg-slate-600 text-slate-300"
            }`}
          >
            Search
          </button>
        </div>
      </div>

      {/* Messages: the only scrollable region */}
      <div className="flex-1 overflow-y-auto custom-scrollbar border border-slate-700 rounded-lg bg-slate-900/60 px-3 py-2 space-y-2">
        {messages.length === 0 && (
          <p className="text-slate-500 text-center mt-8 text-xs">
            Start {tab === "chat" ? "chatting" : "searching"} about vulnerabilities, CVEs, or attacks...
          </p>
        )}

        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[75%] px-3 py-2 rounded-lg text-sm leading-relaxed shadow-sm ${
                msg.role === "user"
                  ? "bg-indigo-600 text-white rounded-br-none"
                  : "bg-slate-700 text-slate-100 rounded-bl-none"
              }`}
            >
              {msg.text}
            </div>
          </div>
        ))}

        {loading && (
          <div className="text-slate-400 italic text-xs mt-1">Dristi is analyzing...</div>
        )}
      </div>

      {/* Footer input (fixed below) */}
      <div className="mt-2 flex items-center gap-2">
        <input
          type="text"
          placeholder={
            tab === "chat"
              ? "Ask: summarize criticals / explain chain / patch plan"
              : "Search CVE-2024-XXXX"
          }
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          className="flex-1 border border-slate-700 bg-slate-800 text-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
        <button
          onClick={sendMessage}
          disabled={loading}
          className="bg-indigo-600 hover:bg-indigo-700 transition text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
        >
          {loading ? "..." : tab === "chat" ? "Send" : "Search"}
        </button>
      </div>

      {!GEMINI_API_KEY && (
        <p className="text-[10px] text-amber-300 mt-2">
          {/* Running in local demo mode (no API key detected). */}
        </p>
      )}
    </div>
  );
}
