"use client";
import { useState, useEffect } from "react";

const TEMPLATES = [
  { id: "followup",     label: "Follow-Up",      icon: "reply",          desc: "Standard follow-up after a great call" },
  { id: "meeting",      label: "Book Meeting",    icon: "event",          desc: "Confirm and lock in the next meeting" },
  { id: "nice_to_meet", label: "Nice to Meet",    icon: "handshake",      desc: "Warm intro / first contact thanks" },
  { id: "capability",   label: "Capability Deck", icon: "picture_as_pdf", desc: "Send credentials + deck" },
];

function buildPrompt(template, lead, callNotes, callTags, outcome, script) {
  const orgName  = lead?.organization?.name || lead?.organization_name || "their company";
  const fullName = [lead?.first_name, lead?.last_name].filter(Boolean).join(" ") || "there";
  const title    = lead?.title || "";

  const context = [
    `Contact: ${fullName}${title ? `, ${title}` : ""} at ${orgName}`,
    callNotes ? `Call notes: ${callNotes}` : null,
    callTags?.length ? `Tags: ${callTags.join(", ")}` : null,
    outcome ? `Outcome: ${outcome}` : null,
    script?.opening_line ? `Opening used: ${script.opening_line}` : null,
  ].filter(Boolean).join("\n");

  const intentions = {
    followup:     "Write a concise, professional follow-up email referencing the call.",
    meeting:      "Write a short email confirming or proposing a specific meeting time.",
    nice_to_meet: "Write a warm, brief thanks-for-the-call email.",
    capability:   "Write a short email introducing our capability deck and key value propositions.",
  };

  return `${intentions[template] || intentions.followup}\n\nContext:\n${context}\n\nKeep it under 120 words. No subject line needed. Start with "Hi ${lead?.first_name || "there"},". Be direct, professional, and warm. No hype language.`;
}

export default function PostCallEmail({ lead, callNotes, callTags, script, outcome, onClose, onSent }) {
  const [selectedTemplate, setSelectedTemplate] = useState("followup");
  const [draft, setDraft]         = useState("");
  const [generating, setGenerating] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [chatHistory, setChatHistory] = useState([]);
  const [sending, setSending]     = useState(false);
  const [copied, setCopied]       = useState(false);
  const [sendError, setSendError] = useState(null);
  const [subject, setSubject]     = useState("");

  const orgName  = lead?.organization?.name || lead?.organization_name || "";
  const fullName = [lead?.first_name, lead?.last_name].filter(Boolean).join(" ") || "Contact";
  const email    = lead?.email || "";

  // Auto-generate on template change
  useEffect(() => {
    generateDraft(selectedTemplate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTemplate]);

  // Default subject
  useEffect(() => {
    const subjectMap = {
      followup:     `Following up — ${orgName || fullName}`,
      meeting:      `Confirming our next meeting`,
      nice_to_meet: `Great speaking with you`,
      capability:   `FlyFX Capability Deck — ${orgName || fullName}`,
    };
    setSubject(subjectMap[selectedTemplate] || "Following up");
  }, [selectedTemplate, orgName, fullName]);

  async function generateDraft(template) {
    setGenerating(true);
    setDraft("");
    try {
      const prompt = buildPrompt(template, lead, callNotes, callTags, outcome, script);
      const res = await fetch("/api/script", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "email_draft", prompt }),
      });
      const data = await res.json();
      setDraft(data.email || data.draft || data.text || "");
      setChatHistory([]);
    } catch {
      setDraft("Could not generate draft — write your email below.");
    } finally {
      setGenerating(false);
    }
  }

  async function refineWithChat() {
    if (!chatInput.trim()) return;
    const instruction = chatInput.trim();
    setChatInput("");
    setChatHistory((prev) => [...prev, { role: "user", text: instruction }]);
    setGenerating(true);
    try {
      const res = await fetch("/api/script", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "email_refine",
          draft,
          instruction,
          lead,
        }),
      });
      const data = await res.json();
      const refined = data.email || data.draft || data.text || draft;
      setDraft(refined);
      setChatHistory((prev) => [...prev, { role: "assistant", text: "Done — email updated." }]);
    } catch {
      setChatHistory((prev) => [...prev, { role: "assistant", text: "Refinement failed." }]);
    } finally {
      setGenerating(false);
    }
  }

  async function sendEmail() {
    if (!email || !draft) return;
    setSending(true);
    setSendError(null);
    try {
      const res = await fetch("/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: email, subject, body: draft }),
      });
      if (!res.ok) throw new Error("Send failed");
      onSent?.();
    } catch {
      setSendError("Send failed — copied to clipboard instead.");
      await copyToClipboard();
    } finally {
      setSending(false);
    }
  }

  async function copyToClipboard() {
    try {
      await navigator.clipboard.writeText(`Subject: ${subject}\n\n${draft}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {}
  }

  return (
    <div className="fixed inset-0 z-[70] bg-black/75 flex items-center justify-center p-4"
      onClick={onClose}>
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl editorial-shadow"
        style={{ background: "#1F2937", border: "1px solid #374151" }}
        onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4"
          style={{ borderBottom: "1px solid #374151" }}>
          <div>
            <h2 className="font-bold text-base text-white flex items-center gap-2">
              <span className="material-symbols-outlined text-blue-400">forward_to_inbox</span>
              Post-Call Email
            </h2>
            <p className="font-mono-data text-[11px] text-gray-600 mt-0.5">
              {fullName}{orgName ? ` · ${orgName}` : ""}
            </p>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-500 hover:text-white hover:bg-white/10 transition-all">
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* Template selector */}
          <div>
            <p className="font-mono-data text-[10px] uppercase tracking-widest text-gray-600 mb-2">Email Type</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {TEMPLATES.map((t) => (
                <button key={t.id} onClick={() => setSelectedTemplate(t.id)}
                  className="flex flex-col items-center gap-1.5 px-3 py-3 rounded-xl text-center transition-all"
                  style={selectedTemplate === t.id
                    ? { background: "rgba(59,130,246,0.2)", border: "1px solid #1D4ED8", color: "#93C5FD" }
                    : { background: "#111827", border: "1px solid #374151", color: "#6B7280" }}>
                  <span className="material-symbols-outlined text-lg">{t.icon}</span>
                  <span className="font-mono-data text-[11px] font-medium leading-tight">{t.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* To + Subject */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl"
              style={{ background: "#111827", border: "1px solid #374151" }}>
              <span className="font-mono-data text-[10px] text-gray-600 shrink-0">TO</span>
              <span className="font-mono-data text-xs text-blue-400 truncate">{email || "No email on file"}</span>
            </div>
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Email subject…"
              className="w-full px-3 py-2 rounded-xl font-mono-data text-xs text-gray-200 placeholder:text-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
              style={{ background: "#111827", border: "1px solid #374151" }}
            />
          </div>

          {/* Draft */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="font-mono-data text-[10px] uppercase tracking-widest text-gray-600">Draft</p>
              {generating && (
                <span className="flex items-center gap-1.5 font-mono-data text-[10px] text-blue-400">
                  <span className="material-symbols-outlined text-xs animate-spin">progress_activity</span>
                  Generating…
                </span>
              )}
            </div>
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              rows={7}
              placeholder={generating ? "Generating your draft…" : "Your email will appear here…"}
              className="w-full px-3 py-2.5 rounded-xl text-sm text-gray-200 placeholder:text-gray-600 resize-none focus:outline-none focus:ring-1 focus:ring-blue-500 leading-relaxed"
              style={{ background: "#111827", border: "1px solid #374151" }}
            />
          </div>

          {/* AI chat refinement */}
          <div>
            <p className="font-mono-data text-[10px] uppercase tracking-widest text-gray-600 mb-2">
              Refine with AI
            </p>
            {chatHistory.length > 0 && (
              <div className="space-y-1.5 mb-2 max-h-28 overflow-y-auto">
                {chatHistory.map((msg, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="font-mono-data text-[9px] uppercase text-gray-600 shrink-0 mt-0.5 w-14">
                      {msg.role === "user" ? "You" : "AI"}
                    </span>
                    <p className="font-mono-data text-[11px] text-gray-400">{msg.text}</p>
                  </div>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <input
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); refineWithChat(); } }}
                placeholder="e.g. Make it shorter, more urgent, add our phone number…"
                disabled={generating}
                className="flex-1 px-3 py-2 rounded-xl font-mono-data text-xs text-gray-200 placeholder:text-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
                style={{ background: "#111827", border: "1px solid #374151" }}
              />
              <button
                onClick={refineWithChat}
                disabled={generating || !chatInput.trim()}
                className="px-4 py-2 rounded-xl font-mono-data text-xs font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-80"
                style={{ background: "rgba(59,130,246,0.2)", color: "#93C5FD", border: "1px solid rgba(59,130,246,0.3)" }}>
                <span className="material-symbols-outlined text-sm">send</span>
              </button>
            </div>
          </div>

          {sendError && (
            <div className="rounded-xl px-3 py-2.5"
              style={{ background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.25)" }}>
              <p className="font-mono-data text-xs text-amber-400 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm">warning</span>
                {sendError}
              </p>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-between px-6 py-4 gap-3"
          style={{ borderTop: "1px solid #374151" }}>
          <button onClick={copyToClipboard}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl font-mono-data text-xs font-medium transition-all hover:opacity-80"
            style={{ background: "#374151", color: copied ? "#10B981" : "#9CA3AF", border: "1px solid transparent" }}>
            <span className="material-symbols-outlined text-sm">{copied ? "check" : "content_copy"}</span>
            {copied ? "Copied!" : "Copy"}
          </button>

          <div className="flex items-center gap-2">
            <button onClick={onClose}
              className="px-4 py-2 rounded-xl font-mono-data text-xs text-gray-500 hover:text-gray-300 transition-colors">
              Skip for now
            </button>
            <button
              onClick={sendEmail}
              disabled={sending || !draft || !email}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl metallic-silk text-white font-mono-data text-xs font-bold uppercase tracking-wider hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-all">
              {sending ? (
                <>
                  <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>
                  Sending…
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-sm">send</span>
                  Send Email
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
