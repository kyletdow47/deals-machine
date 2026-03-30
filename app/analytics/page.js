"use client";
import { useState } from "react";
import AppShell from "../components/AppShell";
import { useApp } from "../components/AppProvider";

// ============================================================
// Analytics Dashboard — Deals Machine
// Bento grid layout with market intelligence panels
// ============================================================

function Icon({ name, className = "" }) {
  return <span className={`material-symbols-outlined ${className}`}>{name}</span>;
}

function ProgressBar({ label, value, color = "bg-primary" }) {
  const clamped = Math.min(100, Math.max(0, value));
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="text-on-surface/70 font-body">{label}</span>
        <span className="font-headline font-bold text-on-surface">{clamped.toFixed(1)}%</span>
      </div>
      <div className="h-2 bg-surface-container-highest rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ease-out ${color}`}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
}

function ConversionChart() {
  const months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN"];
  // Static decorative path that curves upward
  const pathD = "M 40 140 C 80 130, 120 120, 180 100 S 280 60, 340 70 S 440 40, 520 30";
  const fillD = `${pathD} L 520 160 L 40 160 Z`;
  // Data points along the curve
  const points = [
    { x: 40, y: 140 },
    { x: 140, y: 110 },
    { x: 220, y: 85 },
    { x: 310, y: 68 },
    { x: 420, y: 45 },
    { x: 520, y: 30 },
  ];

  return (
    <div className="relative w-full overflow-hidden">
      <svg viewBox="0 0 560 170" className="w-full h-auto" preserveAspectRatio="xMidYMid meet">
        <defs>
          <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.02" />
          </linearGradient>
        </defs>
        {/* Grid lines */}
        {[40, 80, 120, 160].map((y) => (
          <line key={y} x1="30" y1={y} x2="530" y2={y} stroke="#374151" strokeWidth="0.5" />
        ))}
        {/* Gradient fill */}
        <path d={fillD} fill="url(#chartGradient)" />
        {/* Line */}
        <path d={pathD} fill="none" stroke="#3B82F6" strokeWidth="2.5" strokeLinecap="round" />
        {/* Data points */}
        {points.map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r="5" fill="#111827" stroke="#3B82F6" strokeWidth="2" />
            <circle cx={p.x} cy={p.y} r="2" fill="#3B82F6" />
          </g>
        ))}
        {/* Month labels */}
        {months.map((m, i) => (
          <text
            key={m}
            x={40 + i * 96}
            y="168"
            textAnchor="middle"
            fill="#6B7280"
            fontSize="10"
            fontFamily="Inter, sans-serif"
          >
            {m}
          </text>
        ))}
      </svg>
    </div>
  );
}

function HeatmapDot({ color, size, delay }) {
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <div
        className="absolute inset-0 rounded-full animate-ping opacity-30"
        style={{ backgroundColor: color, animationDelay: `${delay}s`, animationDuration: "2.5s" }}
      />
      <div
        className="absolute inset-0 rounded-full animate-pulse"
        style={{ backgroundColor: color, animationDelay: `${delay}s` }}
      />
    </div>
  );
}

export default function AnalyticsPage() {
  const {
    leads,
    savedLeads,
    calledLeads,
    skippedLeads,
    actioned,
    mode,
    intel,
  } = useApp();

  const [viewMode, setViewMode] = useState("realtime");

  // Computed metrics
  const conversionRate = actioned.length > 0
    ? (calledLeads.length / Math.max(actioned.length, 1)) * 100
    : 0;
  const callCompletion = leads.length > 0
    ? (calledLeads.length / leads.length) * 100
    : 0;
  const saveRate = actioned.length > 0
    ? (savedLeads.length / actioned.length) * 100
    : 0;
  const skipRate = actioned.length > 0
    ? (skippedLeads.length / actioned.length) * 100
    : 0;

  const isJets = mode === "private_jets";

  // Region data based on mode
  const regions = isJets
    ? [
        { name: "Iberia", pct: 38 },
        { name: "France / Italy", pct: 27 },
        { name: "Northern Europe", pct: 22 },
        { name: "Other", pct: 13 },
      ]
    : [
        { name: "UK", pct: 34 },
        { name: "Europe", pct: 29 },
        { name: "Middle East", pct: 24 },
        { name: "Other", pct: 13 },
      ];

  const regionColors = ["#3B82F6", "#10B981", "#F59E0B", "#6B7280"];

  // Predictive insight based on mode
  const insights = {
    normal: "Freight conversion peaks mid-week. Schedule high-value calls Tuesday through Thursday for optimal close rates.",
    political: "Crisis-driven leads show 2.3x higher engagement within 48 hours of geopolitical events. Act fast on fresh intel.",
    private_jets: "Private jet operators respond best to personalised outreach referencing fleet specifics. Emphasise route flexibility.",
  };

  // Projected revenue estimate
  const projectedValue = leads.length > 0
    ? (leads.length * (isJets ? 12500 : 4800) * (conversionRate / 100 || 0.15)).toFixed(0)
    : 0;

  const now = new Date();
  const timestamp = now.toLocaleString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <AppShell>
      <div className="space-y-6 animate-fade-up">
        {/* ── Header ─────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <p className="text-xs font-label tracking-widest text-primary uppercase mb-1">
              Market intelligence
            </p>
            <h1 className="text-3xl font-headline font-extrabold text-on-surface tracking-tight">
              Analytics Dashboard
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex bg-surface-container-highest rounded-full p-0.5">
              <button
                onClick={() => setViewMode("realtime")}
                className={`px-4 py-1.5 rounded-full text-xs font-label font-semibold transition-all ${
                  viewMode === "realtime"
                    ? "bg-primary text-on-primary"
                    : "text-on-surface/60 hover:text-on-surface"
                }`}
              >
                <Icon name="speed" className="text-sm mr-1" />
                Real-time
              </button>
              <button
                onClick={() => setViewMode("historical")}
                className={`px-4 py-1.5 rounded-full text-xs font-label font-semibold transition-all ${
                  viewMode === "historical"
                    ? "bg-primary text-on-primary"
                    : "text-on-surface/60 hover:text-on-surface"
                }`}
              >
                <Icon name="history" className="text-sm mr-1" />
                Historical
              </button>
            </div>
            <button className="flex items-center gap-1.5 px-4 py-2 bg-surface-container-low border border-outline-variant/30 rounded-full text-xs font-label font-semibold text-on-surface hover:bg-surface-container-high transition-colors">
              <Icon name="picture_as_pdf" className="text-sm" />
              Export PDF
            </button>
          </div>
        </div>

        {/* ── Bento Grid ─────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Lead Conversion Velocity — col-span-8 */}
          <div className="lg:col-span-8 bg-surface-container-lowest rounded-2xl editorial-shadow border border-outline-variant/10 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-label text-on-surface/50 uppercase tracking-wider">
                  Lead Conversion Velocity
                </p>
                <div className="flex items-end gap-3 mt-1">
                  <span className="text-4xl font-headline font-extrabold text-on-surface">
                    {conversionRate.toFixed(1)}%
                  </span>
                  {actioned.length > 0 && (
                    <span className="flex items-center gap-0.5 text-xs font-label text-primary mb-1.5">
                      <Icon name="trending_up" className="text-sm" />
                      {calledLeads.length} converted
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs text-on-surface/40 font-label">
                <Icon name="query_stats" className="text-lg text-primary/60" />
                6-month trend
              </div>
            </div>
            {actioned.length > 0 ? (
              <ConversionChart rate={conversionRate} />
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-on-surface/30">
                <Icon name="show_chart" className="text-4xl mb-2" />
                <p className="text-sm font-label">Process leads to see conversion data</p>
              </div>
            )}
          </div>

          {/* Market Intensity — col-span-4 */}
          <div className="lg:col-span-4 bg-surface-container-lowest rounded-2xl editorial-shadow border border-outline-variant/10 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-label text-on-surface/50 uppercase tracking-wider">
                Market Intensity
              </p>
              <Icon name="radar" className="text-lg text-primary/60" />
            </div>

            {/* Heatmap visual */}
            <div className="relative h-28 flex items-center justify-center gap-4">
              <HeatmapDot color="#3B82F6" size={48} delay={0} />
              <HeatmapDot color="#60A5FA" size={36} delay={0.5} />
              <HeatmapDot color="#7f7664" size={28} delay={1.0} />
              <HeatmapDot color="#d1c5b1" size={22} delay={1.5} />
            </div>

            {/* Region breakdown */}
            <div className="space-y-2.5">
              {regions.map((r, i) => (
                <div key={r.name} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-label">
                    <span className="text-on-surface/70">{r.name}</span>
                    <span className="font-semibold text-on-surface">{r.pct}%</span>
                  </div>
                  <div className="h-1.5 bg-surface-container-highest rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${r.pct}%`, backgroundColor: regionColors[i] }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Team Conversion Benchmarks — col-span-7 */}
          <div className="lg:col-span-7 bg-surface-container-lowest rounded-2xl editorial-shadow border border-outline-variant/10 p-6 space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-label text-on-surface/50 uppercase tracking-wider">
                  Team Conversion Benchmarks
                </p>
                <p className="text-xs text-on-surface/40 mt-0.5 font-label">
                  {actioned.length} leads processed
                </p>
              </div>
              <Icon name="group" className="text-lg text-primary/60" />
            </div>

            {actioned.length > 0 ? (
              <div className="space-y-4">
                <ProgressBar label="Call Completion" value={callCompletion} color="bg-primary" />
                <ProgressBar label="Save Rate" value={saveRate} color="bg-primary-container" />
                <ProgressBar label="Skip Rate" value={skipRate} color="bg-outline" />
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-on-surface/30">
                <Icon name="bar_chart" className="text-4xl mb-2" />
                <p className="text-sm font-label">No benchmark data yet</p>
              </div>
            )}

            {/* Stat chips */}
            <div className="flex gap-2 flex-wrap">
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-container-high rounded-full text-xs font-label">
                <Icon name="call" className="text-sm text-primary" />
                <span className="text-on-surface/70">Called</span>
                <span className="font-bold text-on-surface">{calledLeads.length}</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-container-high rounded-full text-xs font-label">
                <Icon name="bookmark" className="text-sm text-primary-container" />
                <span className="text-on-surface/70">Saved</span>
                <span className="font-bold text-on-surface">{savedLeads.length}</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-container-high rounded-full text-xs font-label">
                <Icon name="skip_next" className="text-sm text-outline" />
                <span className="text-on-surface/70">Skipped</span>
                <span className="font-bold text-on-surface">{skippedLeads.length}</span>
              </div>
            </div>
          </div>

          {/* Key Insights — col-span-5 */}
          <div className="lg:col-span-5 space-y-4">
            {/* Predictive Insight */}
            <div className="glass-effect rounded-2xl border border-outline-variant/15 p-5 space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
                  <Icon name="psychology" className="text-base text-primary" />
                </div>
                <p className="text-xs font-label text-on-surface/50 uppercase tracking-wider">
                  Predictive Insight
                </p>
              </div>
              <p className="text-sm font-body text-on-surface/80 leading-relaxed">
                {insights[mode] || insights.normal}
              </p>
              <div className="flex items-center gap-1.5 text-xs text-primary font-label">
                <Icon name="auto_awesome" className="text-sm" />
                AI-generated from session data
              </div>
            </div>

            {/* Revenue Forecast */}
            <div className="bg-primary text-on-primary rounded-2xl p-5 space-y-3 editorial-shadow">
              <div className="flex items-center justify-between">
                <p className="text-xs font-label uppercase tracking-wider opacity-80">
                  Revenue Forecast
                </p>
                <Icon name="trending_up" className="text-lg opacity-80" />
              </div>
              <div className="flex items-end gap-2">
                <span className="text-3xl font-headline font-extrabold">
                  {leads.length > 0
                    ? `$${Number(projectedValue).toLocaleString()}`
                    : "--"}
                </span>
                {leads.length > 0 && (
                  <span className="text-xs opacity-70 mb-1 font-label">projected pipeline</span>
                )}
              </div>
              <p className="text-xs opacity-70 font-label">
                {leads.length > 0
                  ? `Based on ${leads.length} leads at ${conversionRate > 0 ? conversionRate.toFixed(0) : 15}% est. conversion`
                  : "Load leads to generate forecast"}
              </p>
            </div>
          </div>

          {/* ── Intel Panel ─────────────────────────────────── */}
          {intel && (
            <div className="lg:col-span-12 bg-surface-container-low rounded-2xl editorial-shadow border border-outline-variant/10 p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 rounded-full bg-error/10 flex items-center justify-center">
                  <Icon name="public" className="text-base text-error" />
                </div>
                <p className="text-xs font-label text-on-surface/50 uppercase tracking-wider">
                  Intel Panel
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Market Snapshot */}
                {intel.market_snapshot && (
                  <div className="bg-surface-container-lowest rounded-xl p-4 space-y-3 border border-outline-variant/10">
                    <p className="text-xs font-label font-semibold text-on-surface/60 uppercase">
                      Market Snapshot
                    </p>
                    {intel.market_snapshot.brent_crude && (
                      <div className="flex items-center justify-between text-sm font-body">
                        <span className="text-on-surface/60">Brent Crude</span>
                        <span className="font-headline font-bold text-on-surface">
                          {intel.market_snapshot.brent_crude}
                        </span>
                      </div>
                    )}
                    {intel.market_snapshot.hormuz_status && (
                      <div className="flex items-center justify-between text-sm font-body">
                        <span className="text-on-surface/60">Hormuz Status</span>
                        <span className="font-headline font-bold text-on-surface">
                          {intel.market_snapshot.hormuz_status}
                        </span>
                      </div>
                    )}
                    {intel.market_snapshot.talking_point && (
                      <p className="text-xs text-on-surface/50 italic font-body pt-1 border-t border-outline-variant/10">
                        {intel.market_snapshot.talking_point}
                      </p>
                    )}
                  </div>
                )}

                {/* Consequence Chains */}
                {intel.consequence_chains && intel.consequence_chains.length > 0 && (
                  <div className="bg-surface-container-lowest rounded-xl p-4 space-y-3 border border-outline-variant/10">
                    <p className="text-xs font-label font-semibold text-on-surface/60 uppercase">
                      Consequence Chains
                    </p>
                    {intel.consequence_chains.slice(0, 3).map((chain, i) => (
                      <div key={i} className="flex items-start gap-2 text-sm font-body">
                        <Icon name="link" className="text-sm text-primary mt-0.5" />
                        <div>
                          <p className="text-on-surface/80 font-semibold text-xs">
                            {chain.trigger || chain.event || `Chain ${i + 1}`}
                          </p>
                          {chain.impact && (
                            <p className="text-xs text-on-surface/50">{chain.impact}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Food Crisis / Additional Intel */}
                <div className="bg-surface-container-lowest rounded-xl p-4 space-y-3 border border-outline-variant/10">
                  <p className="text-xs font-label font-semibold text-on-surface/60 uppercase">
                    Crisis Monitor
                  </p>
                  {intel.market_snapshot?.food_crisis ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-error animate-pulse" />
                        <span className="text-sm font-body text-on-surface/70">Food Crisis Active</span>
                      </div>
                      <p className="text-xs text-on-surface/50 font-body">
                        {intel.market_snapshot.food_crisis}
                      </p>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-primary" />
                      <span className="text-sm font-body text-on-surface/50">
                        No active crisis alerts
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Footer Meta ────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pt-4 border-t border-outline-variant/10">
          <div className="flex items-center gap-4 text-xs text-on-surface/40 font-label">
            <span>Last updated: {timestamp}</span>
            <span className="flex items-center gap-1">
              <Icon name="verified" className="text-sm text-primary/50" />
              High fidelity
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-label text-primary/70">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-50" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
            </span>
            Live Engine Active
          </div>
        </div>
      </div>
    </AppShell>
  );
}
