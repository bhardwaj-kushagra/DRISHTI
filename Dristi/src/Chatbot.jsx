import React, { useState } from "react";

export default function App() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]); // { role: "user"|"assistant", text: string }
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState("chat"); // “chat” or “search”

  // 🔑 Your API key (for testing only)
  const GEMINI_API_KEY = "AIzaSyD6vWQRMkg-_-iJKkFtr2bn5S2M-2FbsB8";

  // ✅ Use gemini-2.0-flash (or gemini-2.5 if supported)
  const GEMINI_URL =
    "https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent";

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = { role: "user", text: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      // 🧠 Combine system prompt + user message
      const basePrompt = `You are "Dristi Cybersecurity Defender", an advanced AI assistant specialized in cybersecurity and vulnerability scanning. You are an expert in tools such as Nmap, OpenVAS, Nessus, Metasploit, Burp Suite, Nikto, and all other vulnerability assessment utilities.

Primary objectives:

Help users identify and analyze vulnerabilities, open ports, misconfigurations, and security weaknesses.

Interpret scanner results clearly, including CVE details, exploitability, risk scores, and potential impact.

Provide actionable guidance for mitigation, patching, and system hardening.

Politely decline any queries unrelated to cybersecurity.

Behavior in integrated platform environment:

Assume the user has access to a fully integrated scanning platform combining multiple tools.

If asked where to scan or which tool to use, respond enthusiastically: “All your scanners—from Nmap to Burp Suite—are ready right here in one place. No juggling multiple tools, just tell me what you want to scan!”

If asked “how can I secure my system?” or similar questions, reply confidently and engagingly: “Why worry? Dristi is here! Let’s check, fix, and harden your system together.”

Keep default answers short, crisp, engaging, and slightly humorous. Use clever analogies or light humor to make explanations memorable.

Only provide detailed step-by-step instructions when explicitly requested.

Answer style and structure:

Clarify the issue or question in simple terms.

Explain the risk or vulnerability concisely, highlighting potential impact.

Provide mitigation or actionable advice, including tools or commands when appropriate.

Highlight the value of the integrated scanning environment naturally.

Behavior summary:

Default mode: short, engaging, slightly humorous, informative.

Detailed mode: technical, methodical, step-by-step guidance.

Maintain professional tone with approachable language.

Subtle humor is encouraged but never compromises clarity or accuracy.

Always emphasize best practices and responsible scanning.

Mission: Make vulnerability scanning clear, actionable, and engaging—helping users understand and fix security issues, while demonstrating the power and convenience of the integrated scanning platform. Assure users that with Dristi watching over their systems, they have nothing to worry about.`;

      // Modify for “search mode”
      const modePrompt =
        mode === "search"
          ? "\nYou are in SEARCH MODE — provide short, factual cybersecurity information focused on vulnerabilities, exploits, and network defense."
          : "";

      // ✅ Build the payload properly (NO system role)
      const payload = {
        contents: [
          {
            role: "user",
            parts: [
              {
                text: `${basePrompt}${modePrompt}\n\nUser query: ${input}`,
              },
            ],
          },
        ],
      };

      const resp = await fetch(`${GEMINI_URL}?key=${GEMINI_API_KEY}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!resp.ok) {
        const errText = await resp.text();
        throw new Error(`Gemini API error: ${errText}`);
      }

      const data = await resp.json();
      console.log("Gemini response:", data);

      const reply =
        data?.candidates?.[0]?.content?.parts?.[0]?.text ||
        "⚠️ No response from Gemini.";

      setMessages((prev) => [...prev, { role: "assistant", text: reply }]);
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: "❌ Error connecting to Gemini API." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white">
      <div className="w-full max-w-md bg-gray-800 rounded-2xl shadow-lg p-4 flex flex-col">
        <h1 className="text-2xl font-bold text-center mb-3 text-blue-400">
          🛡️ Dristi Cybersecurity Defender
        </h1>

        <div className="mb-3 flex justify-center space-x-4">
          <button
            className={`px-3 py-1 rounded ${
              mode === "chat" ? "bg-blue-500" : "bg-gray-600"
            }`}
            onClick={() => setMode("chat")}
          >
            Chat
          </button>
          <button
            className={`px-3 py-1 rounded ${
              mode === "search" ? "bg-blue-500" : "bg-gray-600"
            }`}
            onClick={() => setMode("search")}
          >
            Search
          </button>
        </div>

        <div className="flex-1 overflow-y-auto h-96 border border-gray-700 rounded-lg p-3 space-y-2 mb-3 bg-gray-900">
          {messages.length === 0 && (
            <p className="text-gray-500 text-center">
              Start {mode === "chat" ? "chatting" : "searching"} about cybersecurity...
            </p>
          )}
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`p-2 rounded-lg max-w-[80%] ${
                msg.role === "user"
                  ? "bg-blue-600 self-end ml-auto text-right"
                  : "bg-gray-700 self-start mr-auto text-left"
              }`}
            >
              {msg.text}
            </div>
          ))}
          {loading && (
            <div className="text-gray-400 text-sm italic">
              Dristi Defender is analyzing...
            </div>
          )}
        </div>

        <div className="flex">
          <input
            type="text"
            className="flex-1 p-2 rounded-l-lg bg-gray-700 text-white border border-gray-600 focus:outline-none"
            placeholder={
              mode === "chat"
                ? "Ask about vulnerabilities, Nmap, OpenVAS..."
                : "Search for CVEs or security tools..."
            }
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          />
          <button
            onClick={sendMessage}
            className="bg-blue-500 hover:bg-blue-600 px-4 rounded-r-lg text-white font-semibold"
            disabled={loading}
          >
            {mode === "chat" ? "Send" : "Search"}
          </button>
        </div>
      </div>
    </div>
  );
}
