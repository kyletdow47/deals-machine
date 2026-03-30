"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { AnimatedNumber } from "@/components/AnimatedNumber";
import { SkeletonPage } from "@/components/Skeleton";

interface Stats {
  total_leads: number;
  calls_pending: number;
  calls_today: number;
  active_sequences: number;
  pipeline: Record<string, number>;
}

interface Activity {
  id: string;
  lead_id: string;
  first_name: string;
  last_name: string;
  company: string;
  action: string;
  description: string;
  created_at: string;
}

const actionIcons: Record<string, string> = {
  lead_created: "person_add",
  call_completed: "call",
  tag_added: "label",
  note_added: "edit_note",
  stage_changed: "swap_horiz",
  sequence_enrolled: "forward_to_inbox",
  email_sent: "mail",
  email_opened: "visibility",
  list_added: "playlist_add",
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr + "Z").getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);

  useEffect(() => {
    fetch("/api/stats").then((r) => r.json()).then(setStats);
    fetch("/api/activity?limit=10").then((r) => r.json()).then(setActivities);
  }, []);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (stats !== null) setLoading(false);
  }, [stats]);

  const pipelineStages = ["new", "contacted", "discovery", "proposal", "negotiation", "closed-won"];
  const totalInPipeline = stats ? pipelineStages.reduce((s, k) => s + (stats.pipeline[k] || 0), 0) : 0;

  if (loading) return <SkeletonPage />;

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <span className="text-primary font-label font-bold uppercase tracking-[0.2em] text-[10px]">Command Center</span>
        <h1 className="font-headline text-3xl font-extrabold tracking-tight text-on-surface mt-1">Dashboard</h1>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Left Column */}
        <div className="flex-grow flex flex-col gap-8">

          {/* Market Pulse Stats */}
          <section className="grid grid-cols-1 md:grid-cols-4 gap-4 stagger-children">
            <div className="bg-surface-container-highest/60 backdrop-blur-sm p-5 rounded-2xl border border-outline-variant/20 shadow-sm card-hover animate-fadeSlideUp">
              <span className="text-[10px] font-bold uppercase tracking-widest text-outline">Total Leads</span>
              <div className="flex items-end justify-between mt-2">
                <span className="text-2xl font-black text-primary font-headline"><AnimatedNumber value={stats?.total_leads || 0} /></span>
                <span className="material-symbols-outlined text-primary/30">group</span>
              </div>
            </div>
            <div className="bg-surface-container-highest/60 backdrop-blur-sm p-5 rounded-2xl border border-outline-variant/20 shadow-sm card-hover animate-fadeSlideUp">
              <span className="text-[10px] font-bold uppercase tracking-widest text-outline">Calls Pending</span>
              <div className="flex items-end justify-between mt-2">
                <span className="text-2xl font-black text-primary font-headline"><AnimatedNumber value={stats?.calls_pending || 0} /></span>
                <span className="material-symbols-outlined text-primary/30">call</span>
              </div>
            </div>
            <div className="bg-surface-container-highest/60 backdrop-blur-sm p-5 rounded-2xl border border-outline-variant/20 shadow-sm card-hover animate-fadeSlideUp">
              <span className="text-[10px] font-bold uppercase tracking-widest text-outline">Calls Today</span>
              <div className="flex items-end justify-between mt-2">
                <span className="text-2xl font-black text-primary font-headline"><AnimatedNumber value={stats?.calls_today || 0} /></span>
                <span className="material-symbols-outlined text-primary/30">trending_up</span>
              </div>
            </div>
            <div className="bg-surface-container-highest/60 backdrop-blur-sm p-5 rounded-2xl border border-outline-variant/20 shadow-sm card-hover animate-fadeSlideUp">
              <span className="text-[10px] font-bold uppercase tracking-widest text-outline">Active Sequences</span>
              <div className="flex items-end justify-between mt-2">
                <span className="text-2xl font-black text-primary font-headline"><AnimatedNumber value={stats?.active_sequences || 0} /></span>
                <span className="material-symbols-outlined text-primary/30">forward_to_inbox</span>
              </div>
            </div>
          </section>

          {/* Pipeline Overview */}
          {stats && totalInPipeline > 0 && (
            <section className="bg-surface-container-highest rounded-2xl p-6 border border-outline-variant/10">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-headline font-bold text-lg">Pipeline</h2>
                <Link href="/pipeline" className="text-[10px] font-bold uppercase tracking-widest text-primary hover:text-primary-container transition-colors">
                  View all &rarr;
                </Link>
              </div>
              <div className="flex h-3 rounded-full overflow-hidden mb-4">
                {pipelineStages.map((stage) => {
                  const count = stats.pipeline[stage] || 0;
                  if (count === 0) return null;
                  const pct = (count / totalInPipeline) * 100;
                  const colors: Record<string, string> = {
                    new: "bg-outline",
                    contacted: "bg-primary/40",
                    discovery: "bg-primary/60",
                    proposal: "bg-primary-container",
                    negotiation: "bg-primary-fixed-dim",
                    "closed-won": "bg-primary",
                  };
                  return <div key={stage} className={`${colors[stage] || "bg-outline"} transition-all`} style={{ width: `${pct}%` }} title={`${stage}: ${count}`} />;
                })}
              </div>
              <div className="grid grid-cols-6 gap-2">
                {pipelineStages.map((stage) => (
                  <div key={stage} className="text-center">
                    <div className="text-lg font-bold font-headline">{stats.pipeline[stage] || 0}</div>
                    <div className="text-[9px] text-outline uppercase font-bold tracking-wider">{stage.replace("-", " ")}</div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Quick Actions */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link href="/calls" className="bg-inverse-surface text-inverse-on-surface rounded-2xl p-6 shadow-xl hover:scale-[1.01] transition-transform relative overflow-hidden group">
              <div className="absolute top-0 right-0 opacity-10">
                <span className="material-symbols-outlined text-8xl">call</span>
              </div>
              <div className="relative z-10">
                <span className="text-[10px] font-bold uppercase tracking-widest text-primary-fixed-dim">Ready to dial</span>
                <h3 className="font-headline font-extrabold text-xl mt-2">Start Calling</h3>
                <p className="text-inverse-on-surface/60 text-sm mt-1">{stats?.calls_pending || 0} contacts in queue</p>
                <div className="mt-4 flex items-center gap-2 text-primary-fixed-dim text-sm font-bold">
                  Open Dialer <span className="material-symbols-outlined text-sm group-hover:translate-x-1 transition-transform">arrow_forward</span>
                </div>
              </div>
            </Link>
            <Link href="/leads" className="bg-surface-container-highest rounded-2xl p-6 border border-outline-variant/10 hover:border-primary/20 transition-all hover:scale-[1.01] group">
              <span className="material-symbols-outlined text-primary text-3xl">group</span>
              <h3 className="font-headline font-extrabold text-xl mt-3">Lead Bank</h3>
              <p className="text-on-surface-variant text-sm mt-1">Browse, import & manage contacts</p>
              <div className="mt-4 flex items-center gap-2 text-primary text-sm font-bold">
                Open Leads <span className="material-symbols-outlined text-sm group-hover:translate-x-1 transition-transform">arrow_forward</span>
              </div>
            </Link>
          </section>
        </div>

        {/* Right Column */}
        <div className="w-full lg:w-80 flex flex-col gap-8">
          {/* Activity Feed */}
          <div className="bg-surface-container-highest rounded-2xl p-6 border border-outline-variant/10">
            <h3 className="font-headline font-bold text-[10px] uppercase tracking-widest mb-6 border-b border-outline-variant/30 pb-3">
              Recent Activity
            </h3>
            <div className="space-y-4">
              {activities.map((a) => (
                <Link key={a.id} href={`/leads/${a.lead_id}`} className="flex gap-3 hover:bg-surface-container-low -mx-2 px-2 py-1.5 rounded-xl transition-colors">
                  <div className="w-8 h-8 rounded-full bg-surface-container-low flex items-center justify-center text-primary shrink-0">
                    <span className="material-symbols-outlined text-sm">{actionIcons[a.action] || "circle"}</span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{a.first_name} {a.last_name}</p>
                    <p className="text-[10px] text-on-surface-variant truncate">{a.description}</p>
                    <p className="text-[9px] text-outline mt-0.5">{timeAgo(a.created_at)}</p>
                  </div>
                </Link>
              ))}
              {activities.length === 0 && (
                <p className="text-sm text-outline text-center py-8">No activity yet. Import leads to get started.</p>
              )}
            </div>
          </div>

          {/* Performance Card */}
          <div className="bg-surface-container-high/40 rounded-2xl p-6 border border-outline-variant/20">
            <h3 className="font-headline font-bold text-[10px] uppercase tracking-widest mb-6 border-b border-outline-variant/30 pb-3">
              Today&apos;s Progress
            </h3>
            <div className="space-y-6">
              <div>
                <div className="flex justify-between items-end mb-2">
                  <span className="text-xs font-bold text-outline">Call Volume</span>
                  <span className="text-xs font-black text-primary">{stats?.calls_today || 0} / 20</span>
                </div>
                <div className="w-full bg-surface-container-highest h-1.5 rounded-full overflow-hidden">
                  <div className="bg-primary h-full rounded-full transition-all" style={{ width: `${Math.min(((stats?.calls_today || 0) / 20) * 100, 100)}%` }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between items-end mb-2">
                  <span className="text-xs font-bold text-outline">Pipeline Built</span>
                  <span className="text-xs font-black text-primary">{totalInPipeline} leads</span>
                </div>
                <div className="w-full bg-surface-container-highest h-1.5 rounded-full overflow-hidden">
                  <div className="bg-primary h-full rounded-full transition-all" style={{ width: `${Math.min((totalInPipeline / 50) * 100, 100)}%` }} />
                </div>
              </div>
            </div>
          </div>

          {/* Bento Insight Card */}
          <div className="bg-primary text-on-primary rounded-2xl p-6 shadow-2xl shadow-primary/20">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h5 className="font-bold text-sm text-on-primary/80 uppercase tracking-widest">Quick Tip</h5>
                <p className="text-xl font-black mt-1 font-headline">Build the Pipeline</p>
              </div>
              <span className="material-symbols-outlined text-on-primary/60 text-3xl">tips_and_updates</span>
            </div>
            <p className="text-xs text-on-primary/70 leading-relaxed">
              Import a CSV of prospects, add them to the call queue, and work through them one by one. Tag outcomes to auto-sort into follow-up lists.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
