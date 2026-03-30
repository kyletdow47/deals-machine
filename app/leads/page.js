"use client";
import { useState } from "react";
import AppShell from "../components/AppShell";
import { useApp } from "../components/AppProvider";
import Link from "next/link";
import { getVelocityScore, velocityColour, velocityLabel } from "../lib/velocity";

function initials(name) {
  if (!name) return "??";
  return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
}

const AVATAR_COLOURS = [
  "#1D4ED8","#0891B2","#059669","#D97706","#7C3AED","#DC2626","#0369A1",
];
function pickColour(str) {
  let h = 0;
  for (let i = 0; i < (str || "").length; i++) h = str.charCodeAt(i) + ((h << 5) - h);
  return AVATAR_COLOURS[Math.abs(h) % AVATAR_COLOURS.length];
}

function priorityFor(lead, script) {
  if (script?.priority === "hot") return "hot";
  if (script?.priority === "warm") return "warm";
  if (lead?.phone_numbers?.length > 0 || lead?.organization_phone) return "warm";
  return "nurture";
}

const PRIORITY_CONFIG = {
  hot:     { label: "hot",     bg: "rgba(239,68,68,0.12)",    text: "#EF4444"  },
  warm:    { label: "warm",    bg: "rgba(245,158,11,0.12)",   text: "#F59E0B"  },
  nurture: { label: "nurture", bg: "rgba(107,114,128,0.15)",  text: "#6B7280"  },
};

function Icon({ name, className = "" }) {
  return (
    <span className={`material-symbols-outlined ${className}`}
      style={{ fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}>
      {name}
    </span>
  );
}

function exportCSV(leads, scripts) {
  const rows = [["Company","Name","Title","Industry","Phone","Email","Priority"]];
  leads.forEach((l) => {
    const phone = l.phone_numbers?.[0]?.sanitized_number || l.organization_phone || "";
    const pri = priorityFor(l, scripts[l.id]);
    rows.push([
      l.organization?.name || "",
      `${l.first_name||""} ${l.last_name||""}`.trim(),
      l.title || "", l.organization?.industry || "",
      phone, l.email || "", pri,
    ]);
  });
  const csv = rows.map((r) => r.map((c) => `"${(c||"").replace(/"/g,'""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href = url; a.download = `deals-leads-${new Date().toISOString().split("T")[0]}.csv`;
  a.click(); URL.revokeObjectURL(url);
}

export default function LeadBankPage() {
  const {
    leads, filteredLeads, savedLeads, calledLeads,
    scripts, mode, vertical, MODES, VERTICALS,
    loading, loadingScripts, error, setError,
    handleModeChange, setVertical, fetchLeads, runPoliticalScan,
    handleAction, selectLeadForDialer, loadMore,
    searchQuery, setSearchQuery, page, allDone, actioned,
  } = useApp();

  const [tagMenuId, setTagMenuId]     = useState(null);
  const [sortByDate, setSortByDate]   = useState(false);

  const displayLeads = sortByDate
    ? [...filteredLeads].sort((a, b) => (b.updated_at||b.created_at||"").localeCompare(a.updated_at||a.created_at||""))
    : filteredLeads;

  const totalPages   = Math.max(1, Math.ceil(displayLeads.length / 25));
  const [tablePage, setTablePage] = useState(1);
  const pageLeads    = displayLeads.slice((tablePage - 1) * 25, tablePage * 25);

  return (
    <AppShell>
      <div className="space-y-6 pb-8">

        {/* HEADER */}
        <div className="flex flex-col gap-1">
          <h1 className="font-bold text-2xl md:text-3xl text-white tracking-tight">Lead Bank</h1>
          <p className="font-mono-data text-xs text-gray-500">
            {filteredLeads.length} prospects ·{" "}
            {savedLeads.length} saved · {calledLeads.length} called
          </p>
        </div>

        {/* MODE TABS */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {MODES.map((m) => (
            <button
              key={m.id}
              onClick={() => handleModeChange(m.id)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl font-mono-data text-xs font-medium transition-all whitespace-nowrap"
              style={mode === m.id
                ? { background: "#1E3A5F", color: "#93C5FD", border: "1px solid #1D4ED8" }
                : { background: "#1F2937", color: "#6B7280", border: "1px solid #374151" }}
            >
              <Icon name={m.icon} className="text-[16px]" />
              {m.label}
            </button>
          ))}
        </div>

        {/* VERTICAL CHIPS */}
        {mode === "normal" && (
          <div className="flex items-center gap-2 flex-wrap">
            {VERTICALS.map((v) => (
              <button
                key={v.id}
                onClick={() => { setVertical(v.id); fetchLeads("normal", v.id, 1); }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-mono-data text-[11px] font-medium transition-all"
                style={vertical === v.id
                  ? { background: "#1E3A5F", color: "#93C5FD", border: "1px solid #1D4ED8" }
                  : { background: "#1F2937", color: "#6B7280", border: "1px solid #374151" }}
              >
                <Icon name={v.icon} className="text-[14px]" />
                {v.label}
              </button>
            ))}
          </div>
        )}

        {/* ACTION BAR */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600 text-[18px]" />
            <input
              type="text"
              placeholder="Search leads..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl font-mono-data text-sm text-gray-200 placeholder:text-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
              style={{ background: "#1F2937", border: "1px solid #374151" }}
            />
          </div>

          <button
            onClick={() => mode === "political" ? runPoliticalScan() : fetchLeads(mode, vertical, 1)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl font-mono-data text-xs font-semibold metallic-silk text-white hover:opacity-90 transition-opacity"
          >
            <Icon name={mode === "political" ? "radar" : "search"} className="text-[16px]" />
            {mode === "political" ? "Scan Intel" : "Search Leads"}
          </button>

          <button
            onClick={() => exportCSV(filteredLeads, scripts)}
            disabled={filteredLeads.length === 0}
            className="flex items-center gap-2 px-4 py-2 rounded-xl font-mono-data text-xs font-medium transition-colors disabled:opacity-30"
            style={{ background: "#1F2937", color: "#6B7280", border: "1px solid #374151" }}
          >
            <Icon name="download" className="text-[16px]" />
            Export CSV
          </button>

          <button
            onClick={() => setSortByDate((p) => !p)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl font-mono-data text-xs font-medium transition-colors"
            style={sortByDate
              ? { background: "#1E3A5F", color: "#93C5FD", border: "1px solid #1D4ED8" }
              : { background: "#1F2937", color: "#6B7280", border: "1px solid #374151" }}
          >
            <Icon name="sort" className="text-[16px]" />
            Sort by Date
          </button>
        </div>

        {/* SCRIPT LOADING */}
        {loadingScripts && (
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl"
            style={{ background: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.2)" }}>
            <span className="material-symbols-outlined text-blue-400 animate-spin text-[18px]"
              style={{ fontVariationSettings: "'FILL' 0, 'wght' 400" }}>progress_activity</span>
            <span className="font-mono-data text-xs text-blue-400">Generating personalised scripts...</span>
          </div>
        )}

        {/* ERROR */}
        {error && (
          <div className="flex items-center justify-between px-4 py-3 rounded-xl"
            style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
            <div className="flex items-center gap-3">
              <Icon name="error" className="text-red-400 text-[18px]" />
              <span className="font-mono-data text-xs text-red-300">{error}</span>
            </div>
            <button onClick={() => setError(null)} className="p-1 rounded-full hover:bg-red-400/10 transition-colors">
              <Icon name="close" className="text-red-400 text-[16px]" />
            </button>
          </div>
        )}

        {/* LOADING */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-10 h-10 rounded-full border-2 border-gray-700 border-t-blue-500 animate-spin" />
            <p className="font-mono-data text-xs text-gray-600 animate-pulse">Searching...</p>
          </div>
        )}

        {/* LEAD TABLE */}
        {!loading && displayLeads.length > 0 && (
          <div className="rounded-2xl overflow-hidden editorial-shadow"
            style={{ background: "#1F2937", border: "1px solid #374151" }}>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ borderBottom: "1px solid #374151" }}>
                    {["Company & Lead","Industry","Contact","Velocity","Priority","Action"].map((h, i) => (
                      <th key={h}
                        className={`text-left px-4 py-3 font-mono-data text-[10px] uppercase tracking-wider text-gray-600 ${
                          i === 1 ? "hidden md:table-cell" :
                          i === 2 ? "hidden lg:table-cell" :
                          i === 3 ? "hidden xl:table-cell" :
                          i === 5 ? "text-right" : ""
                        }`}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {pageLeads.map((lead) => {
                    const orgName  = lead.organization?.name || "Unknown";
                    const fullName = `${lead.first_name||""} ${lead.last_name||""}`.trim() || "Unknown";
                    const phone    = lead.phone_numbers?.[0]?.sanitized_number || lead.organization_phone || "";
                    const email    = lead.email || "";
                    const industry = lead.organization?.industry || "";
                    const script   = scripts[lead.id];
                    const priority = priorityFor(lead, script);
                    const pConfig  = PRIORITY_CONFIG[priority];
                    const score    = getVelocityScore(lead, actioned || []);
                    const vColour  = velocityColour(score);

                    return (
                      <tr key={lead.id}
                        className="group transition-colors"
                        style={{ borderBottom: "1px solid rgba(55,65,81,0.5)" }}
                        onMouseEnter={e => e.currentTarget.style.background = "#374151"}
                        onMouseLeave={e => e.currentTarget.style.background = "transparent"}>

                        {/* Company & Lead */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-lg flex items-center justify-center text-white font-bold text-xs shrink-0"
                              style={{ background: pickColour(orgName) }}>
                              {initials(orgName)}
                            </div>
                            <div className="min-w-0">
                              <div className="font-semibold text-sm text-white truncate">{orgName}</div>
                              <div className="font-mono-data text-[11px] text-gray-500 truncate">
                                {fullName}{lead.title && <span className="text-gray-600"> · {lead.title}</span>}
                              </div>
                              {/* Velocity bar inline */}
                              <div className="w-24 h-0.5 rounded-full mt-1.5" style={{ background: "#374151" }}>
                                <div className="h-full rounded-full transition-all"
                                  style={{ width: `${score}%`, background: vColour }} />
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Industry */}
                        <td className="px-4 py-3 hidden md:table-cell">
                          <span className="font-mono-data text-[11px] text-gray-500">{industry || "—"}</span>
                        </td>

                        {/* Contact */}
                        <td className="px-4 py-3 hidden lg:table-cell">
                          <div className="flex flex-col gap-1">
                            {phone ? (
                              <a href={`tel:${phone}`}
                                className="flex items-center gap-1.5 font-mono-data text-[11px] text-gray-400 hover:text-blue-400 transition-colors">
                                <Icon name="call" className="text-[13px]" />
                                {phone}
                              </a>
                            ) : email ? (
                              <a href={`mailto:${email}`}
                                className="flex items-center gap-1.5 font-mono-data text-[11px] text-gray-400 hover:text-blue-400 transition-colors">
                                <Icon name="email" className="text-[13px]" />
                                {email}
                              </a>
                            ) : (
                              <span className="font-mono-data text-[11px] text-gray-600">—</span>
                            )}
                            {lead.linkedin_url && (
                              <a href={lead.linkedin_url} target="_blank" rel="noreferrer"
                                className="flex items-center gap-1.5 font-mono-data text-[11px] text-gray-500 hover:text-blue-400 transition-colors">
                                <Icon name="link" className="text-[13px]" />
                                LinkedIn
                              </a>
                            )}
                          </div>
                        </td>

                        {/* Velocity score */}
                        <td className="px-4 py-3 hidden xl:table-cell">
                          <div className="flex items-center gap-2">
                            <span className="font-mono-data text-xs font-bold" style={{ color: vColour }}>
                              {score}
                            </span>
                            <span className="font-mono-data text-[10px] text-gray-600">
                              {velocityLabel(score)}
                            </span>
                          </div>
                        </td>

                        {/* Priority */}
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md font-mono-data text-[10px] font-semibold uppercase tracking-wide"
                            style={{ background: pConfig.bg, color: pConfig.text }}>
                            {pConfig.label}
                          </span>
                        </td>

                        {/* Action */}
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-2 relative">
                            <Link href="/dialer" onClick={() => selectLeadForDialer(lead)}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-mono-data text-[11px] font-semibold text-white hover:opacity-90 transition-opacity metallic-silk">
                              <Icon name="call" className="text-[13px]" />
                              Call
                            </Link>
                            <button
                              onClick={() => setTagMenuId(tagMenuId === lead.id ? null : lead.id)}
                              className="p-1.5 rounded-lg hover:bg-gray-700 transition-colors">
                              <Icon name="more_vert" className="text-[16px] text-gray-500" />
                            </button>
                            {tagMenuId === lead.id && (
                              <div className="absolute right-0 top-full mt-1 z-30 rounded-xl p-1 min-w-[140px] editorial-shadow"
                                style={{ background: "#1F2937", border: "1px solid #374151" }}>
                                {[
                                  { action: "left",  icon: "skip_next",    label: "Skip",   colour: "#6B7280" },
                                  { action: "save",  icon: "bookmark",     label: "Save",   colour: "#3B82F6" },
                                  { action: "right", icon: "check_circle", label: "Called", colour: "#10B981" },
                                ].map(({ action, icon, label, colour }) => (
                                  <button key={action}
                                    onClick={() => { handleAction(action, lead, script); setTagMenuId(null); }}
                                    className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-left transition-colors"
                                    style={{ color: colour }}
                                    onMouseEnter={e => e.currentTarget.style.background = "#374151"}
                                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                                    <Icon name={icon} className="text-[14px]" />
                                    <span className="font-mono-data text-xs">{label}</span>
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between px-4 py-3"
              style={{ borderTop: "1px solid #374151", background: "#1F2937" }}>
              <span className="font-mono-data text-[11px] text-gray-600">
                Page {tablePage} of {totalPages} · {displayLeads.length} leads
              </span>
              <div className="flex items-center gap-2">
                <button disabled={tablePage <= 1}
                  onClick={() => setTablePage((p) => Math.max(1, p - 1))}
                  className="p-1.5 rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-30">
                  <Icon name="chevron_left" className="text-[16px] text-gray-400" />
                </button>
                <button disabled={tablePage >= totalPages}
                  onClick={() => setTablePage((p) => Math.min(totalPages, p + 1))}
                  className="p-1.5 rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-30">
                  <Icon name="chevron_right" className="text-[16px] text-gray-400" />
                </button>
                <button onClick={loadMore}
                  className="flex items-center gap-1.5 ml-2 px-3 py-1.5 rounded-lg font-mono-data text-[11px] font-medium transition-colors"
                  style={{ background: "#374151", color: "#9CA3AF" }}>
                  <Icon name="add" className="text-[14px]" />
                  Load More
                </button>
              </div>
            </div>
          </div>
        )}

        {/* EMPTY STATE */}
        {!loading && displayLeads.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 gap-4 rounded-2xl"
            style={{ background: "#1F2937", border: "1px solid #374151" }}>
            <div className="w-14 h-14 rounded-full flex items-center justify-center"
              style={{ background: "#374151" }}>
              <Icon name={mode === "political" ? "public" : mode === "private_jets" ? "flight" : "inventory_2"}
                className="text-[26px] text-gray-500" />
            </div>
            <div className="text-center space-y-1">
              <p className="font-bold text-base text-white">
                {mode === "political" ? "No political intelligence yet"
                  : mode === "private_jets" ? "No private jet operators loaded"
                  : "No freight leads loaded"}
              </p>
              <p className="font-mono-data text-xs text-gray-500 max-w-xs">
                {mode === "political" ? "Run an intel scan to find crisis-driven cargo opportunities."
                  : mode === "private_jets" ? "Search for private jet operator leads."
                  : "Select a vertical and search to populate your lead pipeline."}
              </p>
            </div>
            <button
              onClick={() => mode === "political" ? runPoliticalScan() : fetchLeads(mode, vertical, 1)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-mono-data text-xs font-semibold metallic-silk text-white hover:opacity-90 transition-opacity">
              <Icon name={mode === "political" ? "radar" : "search"} className="text-[16px]" />
              {mode === "political" ? "Run Intel Scan" : "Fetch Leads"}
            </button>
          </div>
        )}

        {/* BOTTOM INSIGHT CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            {
              label: "Pipeline Value",
              icon: "trending_up",
              value: savedLeads.length + calledLeads.length,
              sub: `${savedLeads.length} saved · ${calledLeads.length} called`,
              colour: "#3B82F6",
            },
            {
              label: "Engagement Rate",
              icon: "speed",
              value: leads.length > 0
                ? `${Math.round(((savedLeads.length + calledLeads.length) / leads.length) * 100)}%`
                : "—",
              sub: `Across ${leads.length} leads`,
              colour: "#10B981",
            },
            {
              label: "Next Milestone",
              icon: "flag",
              value: Math.max(0, 50 - (savedLeads.length + calledLeads.length)),
              sub: "Leads to 50-prospect target",
              colour: "#F59E0B",
              highlight: true,
            },
          ].map(({ label, icon, value, sub, colour, highlight }) => (
            <div key={label} className="rounded-2xl p-5 editorial-shadow"
              style={highlight
                ? { background: "#1E3A5F", border: "1px solid #1D4ED8" }
                : { background: "#1F2937", border: "1px solid #374151" }}>
              <div className="flex items-center justify-between mb-3">
                <span className="font-mono-data text-[10px] uppercase tracking-wider text-gray-600">{label}</span>
                <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                  style={{ background: `${colour}1A` }}>
                  <Icon name={icon} className="text-[16px]" style={{ color: colour }} />
                </div>
              </div>
              <div className="font-bold text-2xl text-white">{value}</div>
              <p className="font-mono-data text-[11px] text-gray-500 mt-1">{sub}</p>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
