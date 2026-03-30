"use client";

import { useState, useEffect } from "react";

interface Stats {
  total_leads: number; calls_pending: number; calls_today: number; active_sequences: number;
  pipeline: Record<string, number>;
}

export default function AnalyticsPage() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => { fetch("/api/stats").then((r) => r.json()).then(setStats); }, []);

  const pipelineStages = ["new", "contacted", "discovery", "proposal", "negotiation", "closed-won", "closed-lost"];
  const stageLabels: Record<string, string> = { new: "New", contacted: "Contacted", discovery: "Discovery", proposal: "Proposal", negotiation: "Negotiation", "closed-won": "Won", "closed-lost": "Lost" };
  const total = stats ? pipelineStages.reduce((s, k) => s + (stats.pipeline[k] || 0), 0) : 0;

  return (
    <div>
      <div className="flex justify-between items-end mb-10">
        <div>
          <span className="text-primary font-label font-bold uppercase tracking-[0.2em] text-[10px]">Market Intelligence</span>
          <h1 className="font-headline text-3xl font-extrabold tracking-tight text-on-surface mt-1">Analytics</h1>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-8">
        {/* Pipeline Conversion */}
        <div className="col-span-12 lg:col-span-8 bg-surface-container-highest rounded-xl p-8">
          <div className="flex justify-between items-start mb-8">
            <div>
              <h4 className="font-headline font-bold text-lg text-on-surface">Pipeline Distribution</h4>
              <p className="text-on-surface-variant text-xs mt-1">Leads across all stages</p>
            </div>
            <div className="text-right">
              <span className="text-primary font-bold text-2xl font-headline">{total}</span>
              <p className="text-[10px] font-bold text-primary-fixed-dim uppercase tracking-wider">Total Leads</p>
            </div>
          </div>

          {/* Bar visualization */}
          <div className="space-y-4">
            {pipelineStages.map((stage) => {
              const count = stats?.pipeline[stage] || 0;
              const pct = total > 0 ? (count / total) * 100 : 0;
              return (
                <div key={stage} className="space-y-1">
                  <div className="flex justify-between text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                    <span>{stageLabels[stage]}</span>
                    <span>{count} ({pct.toFixed(0)}%)</span>
                  </div>
                  <div className="h-3 w-full bg-surface-container-lowest rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-primary to-primary-container rounded-full transition-all" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Key Metrics */}
        <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">
          <div className="glass-effect rounded-xl p-6 border border-outline-variant/20 shadow-lg">
            <div className="flex items-center gap-3 mb-4">
              <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
              <h5 className="font-bold text-sm text-on-surface">Insight</h5>
            </div>
            <p className="text-sm text-on-surface-variant leading-relaxed">
              Your pipeline has <span className="text-primary font-bold">{stats?.pipeline?.discovery || 0}</span> leads in Discovery.
              Focus on moving these to Proposal stage this week.
            </p>
          </div>

          <div className="bg-primary text-on-primary rounded-xl p-6 shadow-2xl shadow-primary/20">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h5 className="font-bold text-sm text-on-primary/80 uppercase tracking-widest">Activity</h5>
                <p className="text-3xl font-black mt-1 font-headline">{stats?.calls_today || 0}</p>
              </div>
              <span className="material-symbols-outlined text-on-primary/60 text-3xl">trending_up</span>
            </div>
            <p className="text-xs text-on-primary/70">Calls completed today</p>
          </div>

          <div className="bg-surface-container-highest rounded-xl p-6 border border-outline-variant/10">
            <h5 className="font-label font-bold text-[10px] uppercase tracking-widest text-outline mb-4">Quick Stats</h5>
            <div className="space-y-3">
              <div className="flex justify-between"><span className="text-sm text-on-surface-variant">Pending Calls</span><span className="font-bold">{stats?.calls_pending || 0}</span></div>
              <div className="flex justify-between"><span className="text-sm text-on-surface-variant">Active Sequences</span><span className="font-bold">{stats?.active_sequences || 0}</span></div>
              <div className="flex justify-between"><span className="text-sm text-on-surface-variant">Total Leads</span><span className="font-bold">{stats?.total_leads || 0}</span></div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Meta */}
      <div className="mt-12 flex items-center justify-between py-6 border-t border-outline-variant/20">
        <div className="flex gap-8">
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-on-surface-variant/60 uppercase tracking-widest">Last updated</span>
            <span className="text-xs font-medium">Just now</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Live</span>
        </div>
      </div>
    </div>
  );
}
