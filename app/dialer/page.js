"use client";
import { useState, useEffect, useRef } from "react";
import AppShell from "../components/AppShell";
import { useApp } from "../components/AppProvider";
import PostCallEmail from "../components/PostCallEmail";
import CompanyProfile from "../components/CompanyProfile";
import Link from "next/link";
import { getVelocityScore, velocityColour } from "../lib/velocity";

const KEYPAD = [
  { num: "1", sub: "" },   { num: "2", sub: "ABC" }, { num: "3", sub: "DEF" },
  { num: "4", sub: "GHI" },{ num: "5", sub: "JKL" }, { num: "6", sub: "MNO" },
  { num: "7", sub: "PQRS"},{ num: "8", sub: "TUV" }, { num: "9", sub: "WXYZ" },
  { num: "*", sub: "" },   { num: "0", sub: "+" },   { num: "#", sub: "" },
];

const AVAILABLE_TAGS = [
  "Follow-up Needed","Budget Approved","Decision Maker","Not Interested","Call Back Later",
];

const CALL_OUTCOMES = [
  { id: "interested",     label: "Interested",     icon: "thumb_up",       bg: "rgba(16,185,129,0.12)",  text: "#10B981" },
  { id: "not_interested", label: "Not Interested", icon: "thumb_down",     bg: "rgba(239,68,68,0.12)",   text: "#EF4444" },
  { id: "voicemail",      label: "Voicemail",      icon: "voicemail",      bg: "rgba(245,158,11,0.12)",  text: "#F59E0B" },
  { id: "callback",       label: "Call Back",      icon: "schedule",       bg: "rgba(59,130,246,0.12)",  text: "#3B82F6" },
  { id: "wrong_person",   label: "Wrong Person",   icon: "person_off",     bg: "rgba(107,114,128,0.12)", text: "#6B7280" },
  { id: "meeting_booked", label: "Meeting Booked", icon: "event_available",bg: "rgba(16,185,129,0.12)",  text: "#10B981" },
];

function formatTimer(s) {
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

function getPriorityBadge(script) {
  const p = script?.priority;
  if (p === "hot" || p === "high")   return { label: "Hot",    bg: "rgba(239,68,68,0.12)",  text: "#EF4444" };
  if (p === "warm" || p === "medium")return { label: "Warm",   bg: "rgba(245,158,11,0.12)", text: "#F59E0B" };
  return { label: "Nurture", bg: "rgba(107,114,128,0.12)", text: "#6B7280" };
}

// Dark card wrapper
function DarkCard({ children, className = "", style = {} }) {
  return (
    <div className={`rounded-2xl p-5 editorial-shadow ${className}`}
      style={{ background: "#1F2937", border: "1px solid #374151", ...style }}>
      {children}
    </div>
  );
}

export default function DialerPage() {
  const {
    selectedLead, scripts, leads, callNotes, setCallNotes,
    callTags, toggleCallTag, completeCall, selectLeadForDialer, actioned,
  } = useApp();

  const lead   = selectedLead || (leads.length > 0 ? leads[0] : null);
  const script = lead ? scripts[lead.id] : null;

  const [elapsed, setElapsed]           = useState(0);
  const [callActive, setCallActive]     = useState(false);
  const [muted, setMuted]               = useState(false);
  const timerRef                        = useRef(null);

  const [showOutcome, setShowOutcome]   = useState(false);
  const [selectedOutcome, setSelectedOutcome] = useState(null);
  const [showEmail, setShowEmail]       = useState(false);
  const [completedLead, setCompletedLead]     = useState(null);
  const [completedNotes, setCompletedNotes]   = useState("");
  const [completedTags, setCompletedTags]     = useState([]);

  // Timer management
  useEffect(() => {
    if (callActive) {
      timerRef.current = setInterval(() => setElapsed((p) => p + 1), 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [callActive]);

  useEffect(() => {
    setElapsed(0);
    setCallActive(false);
  }, [lead?.id]);

  function startCall() { setCallActive(true); }
  function endCall()   { setCallActive(false); handleCompleteCall(); }

  function handleCompleteCall() { setShowOutcome(true); }

  function confirmOutcome(outcomeId) {
    setSelectedOutcome(outcomeId);
    setCompletedLead(lead);
    setCompletedNotes(callNotes);
    setCompletedTags([...callTags]);
    completeCall();
    setShowOutcome(false);
    setCallActive(false);
    setElapsed(0);
    if (callNotes?.trim().length > 5) extractIntel(lead, callNotes, callTags, outcomeId);
    if (["interested","callback","meeting_booked"].includes(outcomeId)) setShowEmail(true);
  }

  async function extractIntel(callLead, notes, tags, outcome) {
    try {
      const res = await fetch("/api/intel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "extract", lead: callLead, callNotes: notes, callTags: tags, outcome }),
      });
      const data = await res.json();
      if (data.intel?.length > 0) {
        try {
          const existing = JSON.parse(localStorage.getItem("dm_company_intel") || "[]");
          localStorage.setItem("dm_company_intel", JSON.stringify([...existing, ...data.intel]));
        } catch {}
      }
    } catch {}
  }

  // Lead data
  const phone    = lead?.phone_numbers?.[0]?.sanitized_number || lead?.organization?.phone || lead?.organization_phone || null;
  const email    = lead?.email || null;
  const linkedin = lead?.linkedin_url || null;
  const city     = lead?.city || lead?.organization?.city || null;
  const country  = lead?.country || lead?.organization?.country || null;
  const location = [city, country].filter(Boolean).join(", ");
  const orgName  = lead?.organization?.name || lead?.organization_name || "";
  const fullName = [lead?.first_name, lead?.last_name].filter(Boolean).join(" ");
  const title    = lead?.title || "";
  const badge    = getPriorityBadge(script);
  const velocityScore = lead ? getVelocityScore(lead, actioned) : 0;
  const vColour  = velocityColour(velocityScore);

  const history = actioned
    .filter((a) => a.id === lead?.id)
    .map((a) => ({
      action: a.action === "right" ? "Called" : a.action === "save" ? "Saved" : "Skipped",
      ts: a.ts,
      notes: a.notes,
    }));

  return (
    <AppShell>
      {/* ── Persistent Active Call Bar ──────────────────────── */}
      {callActive && lead && (
        <div className="fixed top-14 left-16 right-0 z-40 h-11 call-bar-enter flex items-center justify-between px-5"
          style={{ background: "#2563EB", borderBottom: "1px solid #1D4ED8" }}>
          <div className="flex items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
            <span className="font-mono-data text-xs text-white font-semibold">
              {fullName} · {orgName}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="font-mono-data text-sm text-white font-bold tabular-nums">
              {formatTimer(elapsed)}
            </span>
            <button onClick={() => setMuted(!muted)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-white hover:bg-white/10 transition-colors">
              <span className="material-symbols-outlined text-sm">{muted ? "mic_off" : "mic"}</span>
              <span className="font-mono-data text-[11px]">{muted ? "unmute" : "mute"}</span>
            </button>
            <button onClick={endCall}
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg font-mono-data text-[11px] font-semibold hover:opacity-90 transition-opacity"
              style={{ background: "#EF4444" }}>
              <span className="material-symbols-outlined text-sm">call_end</span>
              End Call
            </button>
          </div>
        </div>
      )}

      {/* ── Header ──────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-6" style={callActive ? { paddingTop: "44px" } : {}}>
        <div>
          <h1 className="font-bold text-2xl text-white">
            {lead ? (callActive ? "On Call" : "Ready to Dial") : "Select a Lead"}
          </h1>
          <p className="font-mono-data text-xs text-gray-500 mt-0.5">
            Dialer · Sales Intelligence Platform
          </p>
        </div>
        <div className="flex items-center gap-3">
          {lead && !callActive && (
            <span className="font-mono-data text-xl font-bold text-gray-600 tabular-nums">
              {formatTimer(elapsed)}
            </span>
          )}
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg font-mono-data text-[11px]"
            style={{ background: "#1F2937", color: "#6B7280", border: "1px solid #374151" }}>
            <span className="material-symbols-outlined text-sm">encrypted</span>
            Encrypted Line
          </span>
        </div>
      </div>

      {/* ── 3-Column Grid ───────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* LEFT: Lead Profile */}
        <div className="lg:col-span-4 space-y-4">
          {!lead ? (
            <DarkCard className="text-center py-10">
              <span className="material-symbols-outlined text-5xl text-gray-700 mb-3 block">person_search</span>
              <p className="text-gray-500 text-sm">
                Select a lead from the{" "}
                <Link href="/leads" className="text-blue-400 hover:underline">Lead Bank</Link>{" "}
                to begin
              </p>
            </DarkCard>
          ) : (
            <>
              {/* Profile Card */}
              <DarkCard>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-blue-600/20 flex items-center justify-center text-blue-300 font-bold text-lg">
                      {(lead.first_name || "?")[0]}
                    </div>
                    <div>
                      <h2 className="font-bold text-base text-white leading-tight">{fullName || "Unknown"}</h2>
                      {title && <p className="font-mono-data text-[11px] text-gray-500">{title}</p>}
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-md font-mono-data text-[10px] font-semibold"
                    style={{ background: badge.bg, color: badge.text }}>
                    {badge.label}
                  </span>
                </div>

                {orgName && <p className="font-mono-data text-xs text-blue-400 mb-4">{orgName}</p>}

                {/* Velocity */}
                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono-data text-[10px] text-gray-600 uppercase tracking-widest">Velocity</span>
                  <span className="font-mono-data text-[11px] font-bold" style={{ color: vColour }}>{velocityScore}/100</span>
                </div>
                <div className="w-full h-1 rounded-full mb-4" style={{ background: "#374151" }}>
                  <div className="h-full rounded-full" style={{ width: `${velocityScore}%`, background: vColour }} />
                </div>

                {/* Contact */}
                <div className="space-y-2">
                  {location && (
                    <div className="flex items-center gap-2 font-mono-data text-[11px] text-gray-500">
                      <span className="material-symbols-outlined text-sm text-gray-600">location_on</span>
                      {location}
                    </div>
                  )}
                  {phone && (
                    <a href={`tel:${phone}`} className="flex items-center gap-2 font-mono-data text-[11px] text-blue-400 hover:text-blue-300 transition-colors">
                      <span className="material-symbols-outlined text-sm">call</span>
                      {phone}
                    </a>
                  )}
                  {email && (
                    <a href={`mailto:${email}`} className="flex items-center gap-2 font-mono-data text-[11px] text-gray-400 hover:text-blue-400 transition-colors truncate">
                      <span className="material-symbols-outlined text-sm">mail</span>
                      {email}
                    </a>
                  )}
                  {linkedin && (
                    <a href={linkedin} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-2 font-mono-data text-[11px] text-gray-500 hover:text-blue-400 transition-colors">
                      <span className="material-symbols-outlined text-sm">link</span>
                      LinkedIn Profile
                    </a>
                  )}
                </div>
              </DarkCard>

              {/* Company Profile */}
              <CompanyProfile lead={lead} />

              {/* Engagement History */}
              <DarkCard>
                <h3 className="font-semibold text-sm text-white mb-3 flex items-center gap-2">
                  <span className="material-symbols-outlined text-base text-blue-400">history</span>
                  Engagement History
                </h3>
                <div className="space-y-3">
                  {history.length > 0 ? history.map((h, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="w-1.5 h-1.5 mt-1.5 rounded-full bg-blue-500 shrink-0" />
                      <div>
                        <p className="font-semibold text-xs text-white">{h.action}</p>
                        <p className="font-mono-data text-[10px] text-gray-600">
                          {new Date(h.ts).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                        </p>
                        {h.notes && <p className="text-gray-500 text-xs mt-0.5">{h.notes}</p>}
                      </div>
                    </div>
                  )) : (
                    <>
                      {[{label:"Initial Outreach",sub:"Pending first contact"},{label:"Discovery Call",sub:"Not scheduled"}].map((h) => (
                        <div key={h.label} className="flex items-start gap-3">
                          <div className="w-1.5 h-1.5 mt-1.5 rounded-full bg-gray-700 shrink-0" />
                          <div>
                            <p className="font-semibold text-xs text-gray-400">{h.label}</p>
                            <p className="font-mono-data text-[10px] text-gray-600">{h.sub}</p>
                          </div>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              </DarkCard>
            </>
          )}
        </div>

        {/* CENTER: Keypad & Controls */}
        <div className="lg:col-span-4 space-y-4">
          {/* Phone display */}
          <DarkCard className="text-center">
            <p className="font-mono-data text-[10px] uppercase tracking-widest text-gray-600 mb-2">Calling</p>
            <p className="font-mono-data text-2xl font-semibold text-white tracking-wider">
              {phone || "+__ ___ ___ ____"}
            </p>
            {lead && <p className="font-mono-data text-xs text-gray-600 mt-1">{fullName}</p>}
            {callActive && (
              <div className="mt-2 flex items-center justify-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                <span className="font-mono-data text-[10px] text-blue-400 uppercase tracking-widest">
                  Live · {formatTimer(elapsed)}
                </span>
              </div>
            )}
          </DarkCard>

          {/* Keypad */}
          <DarkCard>
            <div className="grid grid-cols-3 gap-3 max-w-[240px] mx-auto">
              {KEYPAD.map((k) => (
                <button key={k.num}
                  className="aspect-square rounded-xl flex flex-col items-center justify-center transition-all hover:scale-95 active:scale-90"
                  style={{ background: "#374151" }}
                  onMouseEnter={e => e.currentTarget.style.background = "#4B5563"}
                  onMouseLeave={e => e.currentTarget.style.background = "#374151"}>
                  <span className="text-xl font-bold text-white leading-none">{k.num}</span>
                  {k.sub && <span className="font-mono-data text-[9px] tracking-wider text-gray-500 mt-0.5">{k.sub}</span>}
                </button>
              ))}
            </div>
          </DarkCard>

          {/* Call controls */}
          <div className="grid grid-cols-4 gap-2">
            {[
              { icon: muted ? "mic" : "mic_off", label: muted ? "Unmute" : "Mute", action: () => setMuted(!muted), colour: null },
              { icon: "pause",     label: "Pause",   action: () => {},              colour: null },
              { icon: "call_made", label: "Fwd",     action: () => {},              colour: null },
              { icon: "call_end",  label: "End",     action: endCall,               colour: "#EF4444", danger: true },
            ].map(({ icon, label, action, colour, danger }) => (
              <button key={label} onClick={action}
                className="flex flex-col items-center gap-1 p-3 rounded-xl transition-colors"
                style={danger
                  ? { background: "rgba(239,68,68,0.1)" }
                  : { background: "#1F2937", border: "1px solid #374151" }}
                onMouseEnter={e => e.currentTarget.style.background = danger ? "rgba(239,68,68,0.2)" : "#374151"}
                onMouseLeave={e => e.currentTarget.style.background = danger ? "rgba(239,68,68,0.1)" : "#1F2937"}>
                <span className="material-symbols-outlined"
                  style={{ color: danger ? "#EF4444" : "#9CA3AF" }}>{icon}</span>
                <span className="font-mono-data text-[10px]"
                  style={{ color: danger ? "#EF4444" : "#6B7280" }}>{label}</span>
              </button>
            ))}
          </div>

          {/* Start/Complete CTA */}
          {!callActive ? (
            <button onClick={startCall} disabled={!lead}
              className="w-full py-3.5 rounded-xl metallic-silk text-white font-bold text-sm uppercase tracking-wider hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed">
              <span className="flex items-center justify-center gap-2">
                <span className="material-symbols-outlined text-lg">call</span>
                Start Call
              </span>
            </button>
          ) : (
            <button onClick={handleCompleteCall} disabled={!lead}
              className="w-full py-3.5 rounded-xl font-bold text-sm uppercase tracking-wider hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-40"
              style={{ background: "#10B981", color: "#fff" }}>
              <span className="flex items-center justify-center gap-2">
                <span className="material-symbols-outlined text-lg">check_circle</span>
                Complete Call
              </span>
            </button>
          )}
        </div>

        {/* RIGHT: Notes & Script */}
        <div className="lg:col-span-4 space-y-4">
          {/* Call Notes */}
          <DarkCard>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-sm text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-base text-blue-400">edit_note</span>
                Call Notes
              </h3>
              {callActive && (
                <span className="flex items-center gap-1.5 font-mono-data text-[10px] text-red-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                  Live
                </span>
              )}
            </div>
            <textarea
              value={callNotes}
              onChange={(e) => setCallNotes(e.target.value)}
              placeholder="Type notes during the call..."
              rows={5}
              className="w-full rounded-xl px-3 py-2.5 text-sm text-gray-200 placeholder:text-gray-600 resize-none focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono-data"
              style={{ background: "#111827", border: "1px solid #374151" }}
            />
          </DarkCard>

          {/* Call Tags */}
          <DarkCard>
            <h3 className="font-semibold text-sm text-white mb-3 flex items-center gap-2">
              <span className="material-symbols-outlined text-base text-blue-400">label</span>
              Call Tags
            </h3>
            <div className="flex flex-wrap gap-2">
              {AVAILABLE_TAGS.map((tag) => {
                const active = callTags.includes(tag);
                return (
                  <button key={tag} onClick={() => toggleCallTag(tag)}
                    className="px-3 py-1.5 rounded-lg font-mono-data text-[11px] font-medium transition-all"
                    style={active
                      ? { background: "rgba(59,130,246,0.2)", color: "#93C5FD", border: "1px solid #1D4ED8" }
                      : { background: "#374151", color: "#6B7280", border: "1px solid transparent" }}>
                    {tag}
                  </button>
                );
              })}
            </div>
          </DarkCard>

          {/* Script Tips */}
          {script && (
            <DarkCard>
              <h3 className="font-semibold text-sm text-white mb-3 flex items-center gap-2">
                <span className="material-symbols-outlined text-base text-blue-400">auto_awesome</span>
                Script Tips
              </h3>
              <div className="space-y-4">
                {script.opening_line && (
                  <div>
                    <p className="font-mono-data text-[10px] uppercase tracking-widest text-gray-600 mb-1">Opening Line</p>
                    <p className="text-sm text-gray-200 leading-relaxed">{script.opening_line}</p>
                  </div>
                )}
                {script.lead_differentiator && (
                  <div>
                    <p className="font-mono-data text-[10px] uppercase tracking-widest text-gray-600 mb-1">Differentiator</p>
                    <p className="text-sm text-gray-400 leading-relaxed">{script.lead_differentiator}</p>
                  </div>
                )}
                {script.why_today && (
                  <div>
                    <p className="font-mono-data text-[10px] uppercase tracking-widest text-gray-600 mb-1">Why Today</p>
                    <p className="text-sm text-gray-400 leading-relaxed">{script.why_today}</p>
                  </div>
                )}
              </div>
            </DarkCard>
          )}

          {/* Objection Handling */}
          {script?.objection && (
            <DarkCard style={{ border: "1px solid rgba(59,130,246,0.2)" }}>
              <h3 className="font-semibold text-sm text-white mb-3 flex items-center gap-2">
                <span className="material-symbols-outlined text-base text-blue-400">shield</span>
                Objection Handling
              </h3>
              <p className="text-sm text-gray-400 leading-relaxed">{script.objection}</p>
            </DarkCard>
          )}

          {/* Cold Email Fallback */}
          {script?.cold_email && !phone && (
            <DarkCard>
              <h3 className="font-semibold text-sm text-white mb-3 flex items-center gap-2">
                <span className="material-symbols-outlined text-base text-blue-400">forward_to_inbox</span>
                Cold Email
              </h3>
              {script.email_subject && (
                <div className="mb-3">
                  <p className="font-mono-data text-[10px] uppercase tracking-widest text-gray-600 mb-1">Subject</p>
                  <p className="text-sm font-semibold text-white">{script.email_subject}</p>
                </div>
              )}
              <div>
                <p className="font-mono-data text-[10px] uppercase tracking-widest text-gray-600 mb-1">Body</p>
                <p className="text-sm text-gray-400 leading-relaxed whitespace-pre-line">{script.cold_email}</p>
              </div>
            </DarkCard>
          )}
        </div>
      </div>

      {/* Outcome Modal */}
      {showOutcome && (
        <div className="fixed inset-0 z-[60] bg-black/70 flex items-center justify-center p-4"
          onClick={() => setShowOutcome(false)}>
          <div className="rounded-2xl p-6 max-w-sm w-full editorial-shadow"
            style={{ background: "#1F2937", border: "1px solid #374151" }}
            onClick={e => e.stopPropagation()}>
            <h3 className="font-bold text-lg text-white mb-1">Call Outcome</h3>
            <p className="font-mono-data text-xs text-gray-600 mb-5">How did the call go?</p>
            <div className="grid grid-cols-2 gap-3">
              {CALL_OUTCOMES.map(o => (
                <button key={o.id} onClick={() => confirmOutcome(o.id)}
                  className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-all hover:scale-[1.02] active:scale-95"
                  style={{ background: o.bg, color: o.text, border: `1px solid ${o.text}30` }}>
                  <span className="material-symbols-outlined text-lg">{o.icon}</span>
                  {o.label}
                </button>
              ))}
            </div>
            <button onClick={() => { setShowOutcome(false); completeCall(); setCallActive(false); }}
              className="w-full mt-4 py-2 text-center font-mono-data text-xs text-gray-600 hover:text-gray-400 transition-colors">
              Skip — just log the call
            </button>
          </div>
        </div>
      )}

      {/* Post-Call Email */}
      {showEmail && completedLead && (
        <PostCallEmail
          lead={completedLead}
          callNotes={completedNotes}
          callTags={completedTags}
          script={scripts[completedLead.id]}
          outcome={selectedOutcome}
          onClose={() => { setShowEmail(false); setCompletedLead(null); }}
          onSent={() => { setShowEmail(false); setCompletedLead(null); }}
        />
      )}
    </AppShell>
  );
}
