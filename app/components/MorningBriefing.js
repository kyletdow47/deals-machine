"use client";
import { useState, useEffect } from "react";

const URGENCY_STYLES = {
  critical: "bg-error/10 text-error border-error/30",
  high: "bg-[#E8943A]/10 text-[#E8943A] border-[#E8943A]/30",
  medium: "bg-primary/10 text-primary border-primary/30",
};

const URGENCY_DOT = {
  critical: "bg-error animate-pulse",
  high: "bg-[#E8943A]",
  medium: "bg-primary",
};

export default function MorningBriefing() {
  const [briefing, setBriefing] = useState(null);
  const [alerts, setAlerts] = useState(null);
  const [loading, setLoading] = useState(false);
  const [alertLoading, setAlertLoading] = useState(false);
  const [expandedChain, setExpandedChain] = useState(null);
  const [lastCheckAt, setLastCheckAt] = useState(null);

  // Load cached briefing from localStorage
  useEffect(() => {
    try {
      const cached = localStorage.getItem("dm_briefing");
      if (cached) {
        const parsed = JSON.parse(cached);
        // Only use if generated today
        const genDate = new Date(parsed.generated_at).toDateString();
        if (genDate === new Date().toDateString()) {
          setBriefing(parsed.briefing);
        }
      }
      const cachedAlerts = localStorage.getItem("dm_alerts");
      if (cachedAlerts) setAlerts(JSON.parse(cachedAlerts));
    } catch {}
  }, []);

  async function generateBriefing() {
    setLoading(true);
    try {
      // Load company intel from localStorage for cross-referencing
      const intelRaw = localStorage.getItem("dm_company_intel");
      const companyIntel = intelRaw ? JSON.parse(intelRaw) : [];

      const res = await fetch("/api/briefing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "morning", companyIntel }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setBriefing(data.briefing);
      localStorage.setItem("dm_briefing", JSON.stringify(data));
    } catch (e) {
      console.error("Briefing failed:", e);
    }
    setLoading(false);
  }

  async function checkBreakingAlerts() {
    setAlertLoading(true);
    try {
      const intelRaw = localStorage.getItem("dm_company_intel");
      const companyIntel = intelRaw ? JSON.parse(intelRaw) : [];

      const res = await fetch("/api/briefing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "breaking", lastCheckAt, companyIntel }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setAlerts(data);
      setLastCheckAt(data.checked_at);
      localStorage.setItem("dm_alerts", JSON.stringify(data));
    } catch (e) {
      console.error("Alert check failed:", e);
    }
    setAlertLoading(false);
  }

  // No briefing yet — show generate button
  if (!briefing) {
    return (
      <div className="bg-inverse-surface rounded-2xl p-6 editorial-shadow">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-inverse-primary/20 flex items-center justify-center">
            <span className="material-symbols-outlined text-inverse-primary text-xl">
              wb_sunny
            </span>
          </div>
          <div>
            <h2 className="font-headline font-bold text-lg text-inverse-on-surface">
              Morning Briefing
            </h2>
            <p className="text-xs text-inverse-on-surface/50">
              Crisis-to-opportunity intelligence
            </p>
          </div>
        </div>
        <p className="text-sm text-inverse-on-surface/70 mb-5 leading-relaxed">
          Generate today&rsquo;s briefing to get a prioritised call list based on overnight
          market events, crisis developments, and industry news.
        </p>
        <button
          onClick={generateBriefing}
          disabled={loading}
          className="w-full metallic-silk text-on-primary py-3 rounded-xl font-headline font-bold text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          <span className="material-symbols-outlined text-sm">
            {loading ? "hourglass_top" : "radar"}
          </span>
          {loading ? "Scanning markets..." : "Generate Today's Briefing"}
        </button>
      </div>
    );
  }

  // Briefing exists — show full view
  return (
    <div className="space-y-4">
      {/* Headline Card */}
      <div className="bg-inverse-surface rounded-2xl p-6 editorial-shadow">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-inverse-primary/20 flex items-center justify-center">
              <span className="material-symbols-outlined text-inverse-primary text-xl">
                wb_sunny
              </span>
            </div>
            <div>
              <h2 className="font-headline font-bold text-lg text-inverse-on-surface">
                Morning Briefing
              </h2>
              <p className="text-xs text-inverse-on-surface/50">
                {briefing.date || new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={checkBreakingAlerts}
              disabled={alertLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 text-inverse-on-surface/80 rounded-lg text-xs font-medium hover:bg-white/15 transition-colors disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-sm">
                {alertLoading ? "hourglass_top" : "notifications_active"}
              </span>
              {alertLoading ? "Checking..." : "Check Alerts"}
            </button>
            <button
              onClick={generateBriefing}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 text-inverse-on-surface/80 rounded-lg text-xs font-medium hover:bg-white/15 transition-colors disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-sm">refresh</span>
            </button>
          </div>
        </div>

        {/* Headline */}
        <p className="text-inverse-on-surface font-headline font-bold text-base leading-relaxed mb-4">
          {briefing.headline}
        </p>

        {/* Talking Point */}
        {briefing.talking_point && (
          <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 flex items-start gap-3">
            <span className="material-symbols-outlined text-green-400 text-lg mt-0.5">tips_and_updates</span>
            <div>
              <p className="font-headline font-bold text-[10px] text-green-400 uppercase tracking-widest mb-1">
                Say this on every call today
              </p>
              <p className="text-inverse-on-surface/90 text-sm leading-relaxed">
                {briefing.talking_point}
              </p>
            </div>
          </div>
        )}

        {/* Market Pulse */}
        {briefing.market_pulse && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
            {briefing.market_pulse.brent_crude && (
              <div className="bg-white/5 rounded-lg p-3">
                <p className="text-[10px] text-inverse-on-surface/40 uppercase tracking-wider font-bold">Brent</p>
                <p className="text-sm font-headline font-bold text-inverse-on-surface">{briefing.market_pulse.brent_crude}</p>
              </div>
            )}
            {briefing.market_pulse.wti_crude && (
              <div className="bg-white/5 rounded-lg p-3">
                <p className="text-[10px] text-inverse-on-surface/40 uppercase tracking-wider font-bold">WTI</p>
                <p className="text-sm font-headline font-bold text-inverse-on-surface">{briefing.market_pulse.wti_crude}</p>
              </div>
            )}
            {briefing.market_pulse.freight_index && (
              <div className="bg-white/5 rounded-lg p-3">
                <p className="text-[10px] text-inverse-on-surface/40 uppercase tracking-wider font-bold">Freight</p>
                <p className="text-sm font-headline font-bold text-inverse-on-surface">{briefing.market_pulse.freight_index}</p>
              </div>
            )}
            {briefing.market_pulse.airspace_status && (
              <div className="bg-white/5 rounded-lg p-3">
                <p className="text-[10px] text-inverse-on-surface/40 uppercase tracking-wider font-bold">Airspace</p>
                <p className="text-sm font-headline font-bold text-inverse-on-surface">{briefing.market_pulse.airspace_status}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Breaking Alerts */}
      {alerts?.has_alerts && alerts.alerts.length > 0 && (
        <div className="bg-error/5 border border-error/20 rounded-2xl p-5 editorial-shadow">
          <div className="flex items-center gap-2 mb-4">
            <span className="w-2 h-2 rounded-full bg-error animate-pulse" />
            <h3 className="font-headline font-bold text-sm text-error uppercase tracking-wider">
              Breaking Alerts
            </h3>
          </div>
          <div className="space-y-3">
            {alerts.alerts.map((alert, i) => (
              <div key={i} className="bg-surface-container-lowest rounded-xl p-4 border border-error/10">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-headline font-bold text-sm text-on-surface">{alert.event}</p>
                    <p className="text-xs text-on-surface-variant mt-1">{alert.charter_impact}</p>
                  </div>
                  <span className="text-[10px] font-bold text-error uppercase whitespace-nowrap">
                    {alert.time_sensitivity}
                  </span>
                </div>
                {alert.opening_line && (
                  <div className="mt-3 bg-primary/5 rounded-lg p-3">
                    <p className="text-[10px] text-primary uppercase tracking-wider font-bold mb-1">Opening line</p>
                    <p className="text-xs text-on-surface italic">{alert.opening_line}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Consequence Chains */}
      {briefing.consequence_chains && briefing.consequence_chains.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-lg">account_tree</span>
            <h3 className="font-headline font-bold text-sm text-on-surface uppercase tracking-wider">
              Call Targets — {briefing.consequence_chains.length} Opportunities
            </h3>
          </div>
          {briefing.consequence_chains.map((chain, i) => (
            <div
              key={i}
              className={`rounded-xl border overflow-hidden transition-all ${
                URGENCY_STYLES[chain.urgency] || URGENCY_STYLES.medium
              }`}
            >
              <button
                onClick={() => setExpandedChain(expandedChain === i ? null : i)}
                className="w-full flex items-center gap-3 px-5 py-4 text-left"
              >
                <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${URGENCY_DOT[chain.urgency] || URGENCY_DOT.medium}`} />
                <div className="flex-1 min-w-0">
                  <p className="font-headline font-bold text-sm truncate">{chain.event}</p>
                  <p className="text-xs opacity-70 mt-0.5">{chain.charter_trigger}</p>
                </div>
                <span className="material-symbols-outlined text-sm opacity-60 transition-transform" style={{ transform: expandedChain === i ? "rotate(180deg)" : "rotate(0)" }}>
                  expand_more
                </span>
              </button>

              {expandedChain === i && (
                <div className="px-5 pb-5 space-y-4">
                  {/* Consequence chain flow */}
                  <div className="space-y-2 text-xs">
                    <div className="flex items-start gap-2">
                      <span className="font-bold uppercase tracking-wider w-20 shrink-0 mt-0.5">1st Order</span>
                      <span className="opacity-80">{chain.first_order}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="font-bold uppercase tracking-wider w-20 shrink-0 mt-0.5">2nd Order</span>
                      <span className="opacity-80">{chain.second_order}</span>
                    </div>
                  </div>

                  {/* Opening line */}
                  {chain.opening_line && (
                    <div className="rounded-lg p-3" style={{ background: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.2)" }}>
                      <p className="text-[10px] font-bold uppercase tracking-wider mb-1 text-blue-300">
                        <span className="material-symbols-outlined text-xs align-middle mr-1">record_voice_over</span>
                        Opening Line
                      </p>
                      <p className="text-xs text-gray-300 italic leading-relaxed">{chain.opening_line}</p>
                    </div>
                  )}

                  {/* Target profile */}
                  {chain.target_profile && (
                    <div className="flex flex-wrap gap-1.5">
                      {(chain.target_profile.titles || []).map((t, j) => (
                        <span key={j} className="px-2 py-0.5 bg-white/60 rounded text-[10px] font-medium">{t}</span>
                      ))}
                      {(chain.target_profile.locations || []).map((l, j) => (
                        <span key={j} className="px-2 py-0.5 bg-white/40 rounded text-[10px] font-medium">{l}</span>
                      ))}
                    </div>
                  )}

                  {/* Email hook */}
                  {chain.email_hook && (
                    <div className="text-[10px] opacity-60">
                      <span className="font-bold">Email subject: </span>
                      {chain.email_hook}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Priority Verticals */}
      {briefing.priority_verticals && briefing.priority_verticals.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {briefing.priority_verticals.map((v, i) => (
            <div key={i} className="bg-surface-container-low rounded-xl p-4 editorial-shadow">
              <div className="flex items-center justify-between mb-2">
                <span className="font-headline font-bold text-sm text-on-surface">{v.vertical}</span>
                <span className={`text-[10px] font-mono-data font-bold uppercase px-2 py-0.5 rounded-md ${
                  v.estimated_demand === "high" ? "bg-emerald-900/50 text-emerald-400" :
                  v.estimated_demand === "medium" ? "bg-yellow-900/50 text-yellow-400" :
                  "bg-gray-800 text-gray-500"
                }`}>
                  {v.estimated_demand}
                </span>
              </div>
              <p className="text-xs text-on-surface-variant leading-relaxed">{v.reason}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
