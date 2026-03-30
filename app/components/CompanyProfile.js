"use client";
import { useState, useEffect } from "react";

function DarkCard({ children, className = "", style = {} }) {
  return (
    <div className={`rounded-2xl p-5 editorial-shadow ${className}`}
      style={{ background: "#1F2937", border: "1px solid #374151", ...style }}>
      {children}
    </div>
  );
}

function IntelItem({ item }) {
  const typeConfig = {
    news:     { icon: "newspaper",       colour: "#3B82F6", label: "News" },
    shipping: { icon: "local_shipping",  colour: "#10B981", label: "Shipping" },
    angle:    { icon: "flight_takeoff",  colour: "#F59E0B", label: "Angle" },
    flag:     { icon: "flag",            colour: "#EF4444", label: "Flag" },
    intel:    { icon: "psychology",      colour: "#8B5CF6", label: "Intel" },
  };
  const cfg = typeConfig[item.type] || typeConfig.intel;
  return (
    <div className="flex items-start gap-3 py-2.5 border-b last:border-0"
      style={{ borderColor: "#374151" }}>
      <span className="material-symbols-outlined text-sm mt-0.5 shrink-0"
        style={{ color: cfg.colour }}>{cfg.icon}</span>
      <div className="flex-1 min-w-0">
        <span className="font-mono-data text-[9px] uppercase tracking-widest"
          style={{ color: cfg.colour }}>{cfg.label}</span>
        <p className="text-xs text-gray-300 leading-relaxed mt-0.5">{item.text || item.content}</p>
        {item.date && (
          <p className="font-mono-data text-[10px] text-gray-600 mt-0.5">{item.date}</p>
        )}
      </div>
    </div>
  );
}

export default function CompanyProfile({ lead }) {
  const [loading, setLoading] = useState(false);
  const [research, setResearch] = useState(null);
  const [storedIntel, setStoredIntel] = useState([]);
  const [expanded, setExpanded] = useState(false);

  const orgName = lead?.organization?.name || lead?.organization_name || "";

  // Load stored intel from localStorage
  useEffect(() => {
    if (!lead?.id) return;
    try {
      const all = JSON.parse(localStorage.getItem("dm_company_intel") || "[]");
      const relevant = all.filter((i) => i.leadId === lead.id || i.orgName === orgName);
      setStoredIntel(relevant);
    } catch {}
  }, [lead?.id, orgName]);

  async function runResearch() {
    if (!lead) return;
    setLoading(true);
    setExpanded(true);
    try {
      const res = await fetch("/api/intel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "research", lead }),
      });
      const data = await res.json();
      setResearch(data);
    } catch {
      setResearch({ error: true });
    } finally {
      setLoading(false);
    }
  }

  const hasIntel = storedIntel.length > 0;
  const industries = lead?.organization?.keywords?.slice(0, 3) || [];
  const employeeCount = lead?.organization?.estimated_num_employees;
  const revenue = lead?.organization?.annual_revenue_printed;
  const website = lead?.organization?.website_url;
  const founded = lead?.organization?.founded_year;

  return (
    <DarkCard>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-sm text-white flex items-center gap-2">
          <span className="material-symbols-outlined text-base text-blue-400">domain</span>
          Company Intel
        </h3>
        <button
          onClick={runResearch}
          disabled={loading || !lead}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-mono-data text-[11px] font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-80"
          style={{ background: "rgba(59,130,246,0.15)", color: "#93C5FD", border: "1px solid rgba(59,130,246,0.25)" }}>
          {loading ? (
            <>
              <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>
              Researching…
            </>
          ) : (
            <>
              <span className="material-symbols-outlined text-sm">auto_awesome</span>
              Auto-Research
            </>
          )}
        </button>
      </div>

      {/* Company meta */}
      {orgName ? (
        <div className="space-y-1.5 mb-4">
          <p className="font-mono-data text-xs font-semibold text-blue-400">{orgName}</p>
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            {employeeCount && (
              <span className="font-mono-data text-[10px] text-gray-500 flex items-center gap-1">
                <span className="material-symbols-outlined text-xs">group</span>
                {employeeCount.toLocaleString()} employees
              </span>
            )}
            {revenue && (
              <span className="font-mono-data text-[10px] text-gray-500 flex items-center gap-1">
                <span className="material-symbols-outlined text-xs">attach_money</span>
                {revenue}
              </span>
            )}
            {founded && (
              <span className="font-mono-data text-[10px] text-gray-500 flex items-center gap-1">
                <span className="material-symbols-outlined text-xs">calendar_today</span>
                Est. {founded}
              </span>
            )}
          </div>
          {industries.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1.5">
              {industries.map((kw) => (
                <span key={kw} className="px-2 py-0.5 rounded-md font-mono-data text-[9px] uppercase tracking-wide"
                  style={{ background: "rgba(59,130,246,0.1)", color: "#93C5FD", border: "1px solid rgba(59,130,246,0.2)" }}>
                  {kw}
                </span>
              ))}
            </div>
          )}
          {website && (
            <a href={website.startsWith("http") ? website : `https://${website}`}
              target="_blank" rel="noopener noreferrer"
              className="font-mono-data text-[10px] text-gray-600 hover:text-blue-400 transition-colors flex items-center gap-1 mt-1">
              <span className="material-symbols-outlined text-xs">open_in_new</span>
              {website.replace(/^https?:\/\//, "").replace(/\/$/, "")}
            </a>
          )}
        </div>
      ) : (
        <p className="font-mono-data text-[11px] text-gray-600 mb-4">No company data available.</p>
      )}

      {/* Stored intel */}
      {hasIntel && (
        <div className="mb-3">
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center justify-between w-full mb-2">
            <span className="font-mono-data text-[10px] uppercase tracking-widest text-gray-600 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
              {storedIntel.length} intel {storedIntel.length === 1 ? "item" : "items"} stored
            </span>
            <span className="material-symbols-outlined text-sm text-gray-600">
              {expanded ? "expand_less" : "expand_more"}
            </span>
          </button>
          {expanded && (
            <div className="rounded-xl overflow-hidden"
              style={{ background: "#111827", border: "1px solid #374151" }}>
              <div className="px-3 py-1 divide-y" style={{ divideColor: "#374151" }}>
                {storedIntel.map((item, i) => (
                  <IntelItem key={i} item={item} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* AI research results */}
      {research && !research.error && expanded && (
        <div className="space-y-3 mt-2">
          {research.opening_line && (
            <div className="rounded-xl p-3" style={{ background: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.2)" }}>
              <p className="font-mono-data text-[10px] uppercase tracking-widest text-blue-400 mb-1">Opening Line</p>
              <p className="text-xs text-gray-200 leading-relaxed italic">&quot;{research.opening_line}&quot;</p>
            </div>
          )}
          {research.angles?.length > 0 && (
            <div>
              <p className="font-mono-data text-[10px] uppercase tracking-widest text-gray-600 mb-2">Charter Angles</p>
              <div className="space-y-1.5">
                {research.angles.map((angle, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="font-mono-data text-[10px] text-gray-700 mt-0.5">{i + 1}.</span>
                    <p className="text-xs text-gray-400 leading-relaxed">{angle}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
          {research.news?.length > 0 && (
            <div>
              <p className="font-mono-data text-[10px] uppercase tracking-widest text-gray-600 mb-2">Recent News</p>
              <div className="space-y-2">
                {research.news.map((n, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="material-symbols-outlined text-xs text-blue-500 mt-0.5 shrink-0">newspaper</span>
                    <p className="text-xs text-gray-400 leading-relaxed">{n}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
          {research.shipping_profile && (
            <div>
              <p className="font-mono-data text-[10px] uppercase tracking-widest text-gray-600 mb-1">Shipping Profile</p>
              <p className="text-xs text-gray-400 leading-relaxed">{research.shipping_profile}</p>
            </div>
          )}
          {research.red_flags?.length > 0 && (
            <div className="rounded-xl p-3" style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.2)" }}>
              <p className="font-mono-data text-[10px] uppercase tracking-widest text-red-400 mb-2">Red Flags</p>
              <div className="space-y-1">
                {research.red_flags.map((flag, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="material-symbols-outlined text-xs text-red-500 mt-0.5 shrink-0">warning</span>
                    <p className="text-xs text-red-400 leading-relaxed">{flag}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {research?.error && (
        <div className="rounded-xl p-3 mt-2" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
          <p className="font-mono-data text-xs text-red-400 flex items-center gap-1.5">
            <span className="material-symbols-outlined text-sm">error</span>
            Research failed — check API connection
          </p>
        </div>
      )}

      {!hasIntel && !research && !loading && (
        <p className="font-mono-data text-[11px] text-gray-700 text-center py-1">
          Hit Auto-Research to pull AI intel
        </p>
      )}
    </DarkCard>
  );
}
