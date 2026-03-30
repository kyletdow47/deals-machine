"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import AppShell from "./components/AppShell";
import MorningBriefing from "./components/MorningBriefing";
import { useApp } from "./components/AppProvider";
import { getVelocityScore, velocityColour, velocityLabel } from "./lib/velocity";

// ── Animated counter hook ────────────────────────────────────
function useCountUp(target, duration = 900) {
  const [count, setCount] = useState(0);
  const prev = useRef(0);
  useEffect(() => {
    if (target === prev.current) return;
    const start = prev.current;
    const diff = target - start;
    const startTime = performance.now();
    function step(now) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      setCount(Math.round(start + diff * eased));
      if (progress < 1) requestAnimationFrame(step);
      else prev.current = target;
    }
    requestAnimationFrame(step);
  }, [target, duration]);
  return count;
}

// ── Stat Card ────────────────────────────────────────────────
function StatCard({ icon, label, value, delta, deltaLabel, accent }) {
  const animated = useCountUp(typeof value === "number" ? value : 0);
  const display = typeof value === "number" ? animated : value;

  return (
    <div className="rounded-2xl p-5 editorial-shadow animate-fade-up stat-counter"
      style={{ background: "#1F2937", border: "1px solid #374151" }}>
      <div className="flex items-center gap-2 mb-3">
        <span className="material-symbols-outlined text-lg" style={{ color: accent || "#3B82F6" }}>
          {icon}
        </span>
        <span className="font-mono-data text-[10px] uppercase tracking-widest text-gray-500">
          {label}
        </span>
      </div>
      <p className="font-bold text-3xl text-white tracking-tight">{display}</p>
      {delta !== undefined && (
        <div className="flex items-center gap-1.5 mt-2">
          <span className={`material-symbols-outlined text-sm ${delta >= 0 ? "text-emerald-400" : "text-red-400"}`}>
            {delta >= 0 ? "trending_up" : "trending_down"}
          </span>
          <span className={`font-mono-data text-xs ${delta >= 0 ? "text-emerald-400" : "text-red-400"}`}>
            {delta >= 0 ? "+" : ""}{delta}%
          </span>
          {deltaLabel && (
            <span className="font-mono-data text-[10px] text-gray-600 ml-1">{deltaLabel}</span>
          )}
        </div>
      )}
    </div>
  );
}

// ── Priority Action Card ─────────────────────────────────────
function PriorityCard({ icon, colour, title, subtitle, action, href, onClick }) {
  return (
    <Link
      href={href || "#"}
      onClick={onClick}
      className="flex items-center gap-4 p-4 rounded-xl group hover:opacity-90 transition-opacity cursor-pointer"
      style={{ background: "#1F2937", border: "1px solid #374151" }}
    >
      <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
        style={{ background: `${colour}1A` }}>
        <span className="material-symbols-outlined text-xl" style={{ color: colour }}>{icon}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-white truncate">{title}</p>
        <p className="font-mono-data text-[11px] text-gray-500 truncate mt-0.5">{subtitle}</p>
      </div>
      <span className="material-symbols-outlined text-gray-600 text-lg group-hover:text-blue-400 transition-colors">
        arrow_forward
      </span>
    </Link>
  );
}

// ── Velocity Bar ─────────────────────────────────────────────
function VelocityBar({ score }) {
  const colour = velocityColour(score);
  return (
    <div className="w-full h-0.5 rounded-full mt-2" style={{ background: "#374151" }}>
      <div
        className="h-full rounded-full transition-all duration-700"
        style={{ width: `${score}%`, background: colour }}
      />
    </div>
  );
}

// ── Lead Card (dark) ─────────────────────────────────────────
function LeadCard({ lead, featured, selectLeadForDialer, actioned = [] }) {
  const name = [lead.first_name, lead.last_name].filter(Boolean).join(" ") || "Unknown";
  const org = lead.organization?.name || lead.organization_name || "Unknown";
  const title = lead.title || "";
  const phone = lead.phone_numbers?.[0]?.sanitized_number || lead.organization_phone || "";
  const score = getVelocityScore(lead, actioned);
  const colour = velocityColour(score);
  const label = velocityLabel(score);

  const estimatedValue = lead.organization?.estimated_num_employees
    ? `$${Math.round(lead.organization.estimated_num_employees * 120).toLocaleString()}`
    : "$--";

  if (featured) {
    return (
      <div className="rounded-2xl overflow-hidden editorial-shadow animate-fade-up"
        style={{ background: "#1F2937", border: "1px solid #374151" }}>
        {/* Blue accent top bar */}
        <div className="px-5 py-3 flex items-center justify-between"
          style={{ background: "linear-gradient(135deg, #1e3a5f 0%, #1F2937 100%)", borderBottom: "1px solid #374151" }}>
          <span className="font-mono-data text-[10px] uppercase tracking-widest text-blue-400">
            🔥 hottest lead
          </span>
          <span className="font-mono-data text-[10px]" style={{ color: colour }}>
            {label} · {score}
          </span>
        </div>
        <div className="p-5">
          <VelocityBar score={score} />
          <h3 className="font-bold text-xl text-white mt-3">{name}</h3>
          {title && <p className="text-gray-400 text-sm mt-0.5">{title}</p>}
          <p className="text-blue-400 font-semibold text-sm mt-0.5">{org}</p>

          {/* Contact info inline */}
          <div className="flex items-center gap-4 mt-3">
            {phone && (
              <a href={`tel:${phone}`} className="flex items-center gap-1.5 text-gray-400 hover:text-white transition-colors">
                <span className="material-symbols-outlined text-sm">call</span>
                <span className="font-mono-data text-xs">{phone}</span>
              </a>
            )}
            {lead.linkedin_url && (
              <a href={lead.linkedin_url} target="_blank" rel="noreferrer"
                className="flex items-center gap-1.5 text-gray-400 hover:text-blue-400 transition-colors">
                <span className="material-symbols-outlined text-sm">link</span>
                <span className="font-mono-data text-xs">LinkedIn</span>
              </a>
            )}
          </div>

          <div className="flex items-center gap-2 mt-4">
            <span className="material-symbols-outlined text-blue-400 text-sm">payments</span>
            <span className="font-bold text-lg text-white">{estimatedValue}</span>
            <span className="font-mono-data text-[10px] uppercase tracking-widest text-gray-500">est. value</span>
          </div>
          <Link
            href="/dialer"
            onClick={() => selectLeadForDialer(lead)}
            className="mt-5 w-full metallic-silk text-white py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
          >
            <span className="material-symbols-outlined text-sm">call</span>
            Dial Now
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl p-4 editorial-shadow animate-fade-up transition-colors"
      style={{ background: "#1F2937", border: "1px solid #374151" }}>
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-lg bg-blue-600/20 flex items-center justify-center shrink-0">
          <span className="text-blue-400 font-bold text-sm">
            {org.charAt(0).toUpperCase()}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm text-white truncate">{name}</p>
          <p className="text-gray-500 text-xs truncate">{org}</p>
          <VelocityBar score={score} />
        </div>
      </div>

      {phone && (
        <div className="flex items-center gap-1.5 mt-3">
          <span className="material-symbols-outlined text-gray-500 text-sm">call</span>
          <span className="font-mono-data text-xs text-gray-400">{phone}</span>
        </div>
      )}

      <Link
        href="/dialer"
        onClick={() => selectLeadForDialer(lead)}
        className="mt-3 w-full text-center py-2 rounded-lg font-bold text-xs text-blue-400 hover:text-white hover:bg-blue-600 transition-all"
        style={{ border: "1px solid #1E3A5F" }}
      >
        Call Now
      </Link>
    </div>
  );
}

// ── Playbook Section ─────────────────────────────────────────
function PlaybookSection({ title, icon, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ borderBottom: "1px solid rgba(55,65,81,0.5)" }} className="last:border-b-0">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full py-4 px-1 text-left group"
      >
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-blue-400 text-lg">{icon}</span>
          <span className="font-semibold text-sm text-gray-200 tracking-wide">{title}</span>
        </div>
        <span className="material-symbols-outlined text-gray-600 text-lg transition-transform duration-200"
          style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}>
          expand_more
        </span>
      </button>
      {open && <div className="pb-4 px-1">{children}</div>}
    </div>
  );
}

// ── Main Dashboard ───────────────────────────────────────────
export default function DashboardPage() {
  const {
    leads, savedLeads, calledLeads, skippedLeads,
    scripts, intel, loading, mode, MODES, actioned,
    fetchLeads, runPoliticalScan, selectLeadForDialer,
  } = useApp();

  const totalPipeline = leads.length + savedLeads.length + calledLeads.length;
  const modeConfig = MODES.find((m) => m.id === mode) || MODES[0];
  const nextLead = leads[0];

  // Greeting
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  // Priority actions — 3 most important things right now
  const hotLeads = leads.filter((_, i) => i < 3);
  const coolingLeads = leads.filter((l) => getVelocityScore(l, actioned) < 50);
  const followUpDue = savedLeads.slice(0, 1);

  return (
    <AppShell>
      {/* ── Greeting Hero ────────────────────────────────── */}
      <div className="mb-8">
        <p className="font-mono-data text-[10px] uppercase tracking-widest text-blue-500 mb-1">
          {new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}
        </p>
        <h1 className="font-bold text-3xl text-white tracking-tight">
          {greeting}, Kyle.
        </h1>
        <p className="text-gray-400 text-sm mt-1">
          {leads.length > 0
            ? `${leads.length} leads in pipeline · ${coolingLeads.length} cooling · ${calledLeads.length} called today`
            : "Here's what needs your attention today."}
        </p>
      </div>

      {/* ── Priority Actions ─────────────────────────────── */}
      {(hotLeads.length > 0 || followUpDue.length > 0) && (
        <div className="mb-8">
          <p className="font-mono-data text-[10px] uppercase tracking-widest text-gray-600 mb-3">
            Priority actions
          </p>
          <div className="flex flex-col gap-2">
            {hotLeads[0] && (
              <PriorityCard
                icon="local_fire_department"
                colour="#3B82F6"
                title={`Call ${[hotLeads[0].first_name, hotLeads[0].last_name].filter(Boolean).join(" ")} — ${hotLeads[0].organization?.name || ""}`}
                subtitle={`Hot lead · ${hotLeads[0].title || "decision maker"} · velocity ${getVelocityScore(hotLeads[0], actioned)}/100`}
                href="/dialer"
                onClick={() => selectLeadForDialer(hotLeads[0])}
              />
            )}
            {coolingLeads[0] && (
              <PriorityCard
                icon="thermostat"
                colour="#F59E0B"
                title={`Re-engage ${[coolingLeads[0].first_name, coolingLeads[0].last_name].filter(Boolean).join(" ")} — ${coolingLeads[0].organization?.name || ""}`}
                subtitle={`Cooling · velocity ${getVelocityScore(coolingLeads[0], actioned)}/100 — call before it goes cold`}
                href="/dialer"
                onClick={() => selectLeadForDialer(coolingLeads[0])}
              />
            )}
            {followUpDue[0] && (
              <PriorityCard
                icon="mark_email_unread"
                colour="#10B981"
                title={`Send follow-up to ${[followUpDue[0].first_name, followUpDue[0].last_name].filter(Boolean).join(" ")}`}
                subtitle={`Saved lead · ${followUpDue[0].organization?.name || ""} · no email sent yet`}
                href="/leads"
              />
            )}
            {!hotLeads[0] && !coolingLeads[0] && !followUpDue[0] && (
              <PriorityCard
                icon="download"
                colour="#3B82F6"
                title="Fetch leads to get started"
                subtitle="Select a vertical in Lead Bank and search for new prospects"
                href="/leads"
              />
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* ── LEFT COLUMN ──────────────────────────────── */}
        <div className="lg:col-span-2 flex flex-col gap-8">

          {/* Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard icon="inventory_2" label="Open pipeline" value={totalPipeline}
              delta={totalPipeline > 0 ? 12 : 0} deltaLabel="vs last week" />
            <StatCard icon="group" label="Active leads" value={leads.length} />
            <StatCard icon="call" label="Calls made" value={calledLeads.length}
              accent="#10B981" />
          </div>

          {/* Morning Briefing */}
          <MorningBriefing />

          {/* Call Playbook */}
          <div className="rounded-2xl p-6 editorial-shadow"
            style={{ background: "#1E3A5F", border: "1px solid #1D4ED8" }}>
            <div className="flex items-center gap-2 mb-4">
              <span className="material-symbols-outlined text-blue-300 text-lg">menu_book</span>
              <h2 className="font-bold text-lg text-white">Call playbook</h2>
            </div>

            <PlaybookSection title="Opening lines" icon="record_voice_over" defaultOpen>
              <div className="space-y-3">
                <div className="p-4 rounded-xl" style={{ background: "rgba(255,255,255,0.04)" }}>
                  <p className="text-blue-100/80 text-sm leading-relaxed">
                    "Hi [Name], Kyle from FlyFX — air charter specialist. I spotted your company
                    does [vertical] shipments and wanted to see if you ever need urgent or oversized air
                    freight. We broker full and part-charter capacity worldwide."
                  </p>
                </div>
                <div className="p-4 rounded-xl flex items-start gap-3"
                  style={{ background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.15)" }}>
                  <span className="material-symbols-outlined text-emerald-400 text-lg mt-0.5">tips_and_updates</span>
                  <div>
                    <p className="font-mono-data text-[10px] text-emerald-400 uppercase tracking-widest mb-1">
                      Say this on every call
                    </p>
                    <p className="text-blue-100/70 text-sm leading-relaxed">
                      "Even if nothing is moving today, I'd love to be the first call when something
                      urgent comes up. Can I send you our capability deck?"
                    </p>
                  </div>
                </div>
              </div>
            </PlaybookSection>

            <PlaybookSection title="Qualifying questions" icon="help_outline">
              <ul className="space-y-2.5 text-blue-100/70 text-sm">
                {[
                  "What percentage of your freight moves by air vs sea?",
                  "When did you last need emergency or AOG air charter?",
                  "Do you have a preferred charter broker or do you go direct to carriers?",
                  "What are your biggest pain points with current air freight providers?",
                ].map((q, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="font-mono-data text-blue-400 text-xs mt-0.5 shrink-0">
                      {String(i + 1).padStart(2, "0")}.
                    </span>
                    {q}
                  </li>
                ))}
              </ul>
            </PlaybookSection>

            <PlaybookSection title="Objection handling" icon="shield">
              <div className="space-y-3">
                {[
                  {
                    obj: '"We already have a broker"',
                    resp: 'Totally get it. Most of our clients had someone before us too. We specialise purely in air charter — no sea, no road — so we often get better rates and faster turnaround on the urgent stuff. Happy to be your second call for a comparison quote?',
                  },
                  {
                    obj: '"Not interested right now"',
                    resp: 'No problem at all. These things are always driven by timing. Can I drop you an email with our capability summary so you have us on file for when something does come up?',
                  },
                ].map(({ obj, resp }, i) => (
                  <div key={i} className="p-4 rounded-xl" style={{ background: "rgba(255,255,255,0.04)" }}>
                    <p className="font-mono-data text-[10px] text-blue-300 uppercase tracking-widest mb-1.5">{obj}</p>
                    <p className="text-blue-100/70 text-sm leading-relaxed">{resp}</p>
                  </div>
                ))}
              </div>
            </PlaybookSection>
          </div>

          {/* Hot Leads */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-blue-400 text-lg">local_fire_department</span>
                <h2 className="font-bold text-lg text-white">Hot leads</h2>
              </div>
              {leads.length > 0 && (
                <Link href="/leads"
                  className="font-mono-data text-xs text-gray-500 hover:text-blue-400 flex items-center gap-1 transition-colors">
                  View all
                  <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </Link>
              )}
            </div>

            {leads.length > 0 ? (
              <div className="space-y-4">
                <LeadCard lead={leads[0]} featured selectLeadForDialer={selectLeadForDialer} actioned={actioned} />
                {leads.length > 1 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {leads.slice(1, 3).map((lead) => (
                      <LeadCard key={lead.id} lead={lead}
                        selectLeadForDialer={selectLeadForDialer} actioned={actioned} />
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="rounded-2xl p-12 text-center editorial-shadow"
                style={{ background: "#1F2937", border: "1px solid #374151" }}>
                <span className="material-symbols-outlined text-gray-600 text-5xl mb-4 block">inventory_2</span>
                <h3 className="font-bold text-white text-lg mb-2">No leads loaded</h3>
                <p className="text-gray-500 text-sm mb-6 max-w-xs mx-auto">
                  {mode === "political"
                    ? "Run a political scan to surface crisis-driven opportunities."
                    : `Fetch ${modeConfig.label.toLowerCase()} leads to start dialling.`}
                </p>
                <button
                  onClick={() => mode === "political" ? runPoliticalScan() : fetchLeads(mode, undefined, 1)}
                  disabled={loading}
                  className="metallic-silk text-white px-6 py-3 rounded-xl font-bold text-sm inline-flex items-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-sm">
                    {loading ? "hourglass_top" : "download"}
                  </span>
                  {loading ? "Loading..." : "Fetch leads"}
                </button>
              </div>
            )}
          </div>

          {/* Intel Panel */}
          {intel && (
            <div className="space-y-4">
              <p className="font-mono-data text-[10px] uppercase tracking-widest text-gray-600">
                Intelligence briefing
              </p>
              {intel.market_snapshot && (
                <div className="rounded-2xl p-5 editorial-shadow"
                  style={{ background: "#1F2937", border: "1px solid #374151" }}>
                  <p className="font-mono-data text-[10px] uppercase tracking-widest text-gray-600 mb-4">
                    Market snapshot
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    {intel.market_snapshot.brent_crude && (
                      <div>
                        <p className="font-mono-data text-xs text-gray-500">Brent crude</p>
                        <p className="font-bold text-xl text-white mt-0.5">{intel.market_snapshot.brent_crude}</p>
                      </div>
                    )}
                    {intel.market_snapshot.hormuz_status && (
                      <div>
                        <p className="font-mono-data text-xs text-gray-500">Hormuz status</p>
                        <p className="font-bold text-xl text-white mt-0.5">{intel.market_snapshot.hormuz_status}</p>
                      </div>
                    )}
                  </div>
                  {intel.market_snapshot.talking_point && (
                    <div className="mt-4 p-4 rounded-xl"
                      style={{ background: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.15)" }}>
                      <p className="text-gray-200 text-sm leading-relaxed">{intel.market_snapshot.talking_point}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── RIGHT SIDEBAR ────────────────────────────── */}
        <div className="hidden lg:flex flex-col gap-5">
          {/* Quick Dialer */}
          <div className="rounded-2xl p-5 editorial-shadow"
            style={{ background: "#1E3A5F", border: "1px solid #1D4ED8" }}>
            <div className="flex items-center gap-2 mb-4">
              <span className="material-symbols-outlined text-blue-300 text-lg">call</span>
              <h3 className="font-bold text-sm text-white">Quick dialer</h3>
            </div>
            {nextLead ? (
              <>
                <p className="font-bold text-lg text-white">
                  {[nextLead.first_name, nextLead.last_name].filter(Boolean).join(" ")}
                </p>
                <p className="text-blue-200/50 text-xs mt-0.5 font-mono-data">{nextLead.title || ""}</p>
                <p className="text-blue-300 text-xs font-semibold mt-0.5">
                  {nextLead.organization?.name || nextLead.organization_name || ""}
                </p>
                <Link href="/dialer" onClick={() => selectLeadForDialer(nextLead)}
                  className="mt-5 w-full metallic-silk text-white py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-opacity">
                  <span className="material-symbols-outlined text-sm">call</span>
                  Initiate call
                </Link>
              </>
            ) : (
              <p className="text-blue-200/30 text-sm">No leads loaded yet.</p>
            )}
          </div>

          {/* Personal Performance */}
          <div className="rounded-2xl p-5 editorial-shadow"
            style={{ background: "#1F2937", border: "1px solid #374151" }}>
            <div className="flex items-center gap-2 mb-4">
              <span className="material-symbols-outlined text-blue-400 text-lg">leaderboard</span>
              <h3 className="font-bold text-sm text-white">Performance</h3>
            </div>

            {/* Call volume */}
            <div className="mb-5">
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono-data text-xs text-gray-500">Call volume</span>
                <span className="font-mono-data text-xs text-white">{calledLeads.length} / 50</span>
              </div>
              <div className="w-full h-1.5 rounded-full" style={{ background: "#374151" }}>
                <div className="h-full rounded-full metallic-silk transition-all duration-700"
                  style={{ width: `${Math.min((calledLeads.length / 50) * 100, 100)}%` }} />
              </div>
              <p className="font-mono-data text-[10px] text-gray-600 mt-1">Daily target: 50 calls</p>
            </div>

            {/* Conversion */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono-data text-xs text-gray-500">Conversion rate</span>
                <span className="font-mono-data text-xs text-white">
                  {actioned.length > 0
                    ? `${Math.round((calledLeads.length / actioned.length) * 100)}%`
                    : "0%"}
                </span>
              </div>
              <div className="w-full h-1.5 rounded-full" style={{ background: "#374151" }}>
                <div className="h-full rounded-full bg-emerald-500 transition-all duration-700"
                  style={{
                    width: `${actioned.length > 0
                      ? Math.round((calledLeads.length / actioned.length) * 100)
                      : 0}%`
                  }} />
              </div>
            </div>

            {/* Quick stats */}
            <div className="grid grid-cols-3 gap-3 mt-5 pt-4"
              style={{ borderTop: "1px solid #374151" }}>
              {[
                { val: savedLeads.length,   label: "Saved"   },
                { val: calledLeads.length,  label: "Called"  },
                { val: skippedLeads.length, label: "Skipped" },
              ].map(({ val, label }) => (
                <div key={label} className="text-center">
                  <p className="font-bold text-lg text-white">{val}</p>
                  <p className="font-mono-data text-[10px] uppercase tracking-widest text-gray-600">{label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Pipeline velocity summary */}
          {leads.length > 0 && (
            <div className="rounded-2xl p-5 editorial-shadow"
              style={{ background: "#1F2937", border: "1px solid #374151" }}>
              <p className="font-mono-data text-[10px] uppercase tracking-widest text-gray-600 mb-4">
                Deal velocity
              </p>
              {leads.slice(0, 5).map((lead) => {
                const score = getVelocityScore(lead, actioned);
                const colour = velocityColour(score);
                const name = [lead.first_name, lead.last_name].filter(Boolean).join(" ") || "Unknown";
                return (
                  <div key={lead.id} className="mb-3 last:mb-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-gray-300 truncate max-w-[140px]">{name}</span>
                      <span className="font-mono-data text-[10px]" style={{ color: colour }}>{score}</span>
                    </div>
                    <div className="w-full h-0.5 rounded-full" style={{ background: "#374151" }}>
                      <div className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${score}%`, background: colour }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
