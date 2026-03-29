"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

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

const stageLabels: Record<string, string> = {
  new: "New",
  contacted: "Contacted",
  discovery: "Discovery",
  proposal: "Proposal",
  negotiation: "Negotiation",
  "closed-won": "Closed Won",
  "closed-lost": "Closed Lost",
};

const stageColors: Record<string, string> = {
  new: "bg-zinc-600",
  contacted: "bg-blue-600",
  discovery: "bg-purple-600",
  proposal: "bg-yellow-600",
  negotiation: "bg-orange-600",
  "closed-won": "bg-green-600",
  "closed-lost": "bg-red-600",
};

const actionIcons: Record<string, string> = {
  lead_created: "➕",
  call_completed: "📞",
  tag_added: "🏷️",
  note_added: "📝",
  stage_changed: "📊",
  sequence_enrolled: "📧",
  email_sent: "✉️",
  email_opened: "👀",
  list_added: "📋",
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr + "Z").getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);

  useEffect(() => {
    fetch("/api/stats").then((r) => r.json()).then(setStats);
    fetch("/api/activity?limit=15").then((r) => r.json()).then(setActivities);
  }, []);

  if (!stats) return <div className="text-zinc-500">Loading...</div>;

  const pipelineStages = ["new", "contacted", "discovery", "proposal", "negotiation", "closed-won", "closed-lost"];
  const totalInPipeline = pipelineStages.reduce((sum, s) => sum + (stats.pipeline[s] || 0), 0);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-zinc-500 text-sm">Deals Machine overview</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <Link href="/leads" className="border border-zinc-800 rounded-xl p-5 hover:border-zinc-700 transition-colors">
          <div className="text-3xl font-bold">{stats.total_leads}</div>
          <div className="text-sm text-zinc-500">Total Leads</div>
        </Link>
        <Link href="/calls" className="border border-zinc-800 rounded-xl p-5 hover:border-zinc-700 transition-colors">
          <div className="text-3xl font-bold">{stats.calls_pending}</div>
          <div className="text-sm text-zinc-500">Calls Pending</div>
        </Link>
        <div className="border border-zinc-800 rounded-xl p-5">
          <div className="text-3xl font-bold">{stats.calls_today}</div>
          <div className="text-sm text-zinc-500">Calls Today</div>
        </div>
        <Link href="/sequences" className="border border-zinc-800 rounded-xl p-5 hover:border-zinc-700 transition-colors">
          <div className="text-3xl font-bold">{stats.active_sequences}</div>
          <div className="text-sm text-zinc-500">Active Sequences</div>
        </Link>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Pipeline Summary */}
        <div className="col-span-7">
          <div className="border border-zinc-800 rounded-xl p-5 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold">Pipeline</h2>
              <Link href="/pipeline" className="text-xs text-zinc-500 hover:text-white transition-colors">View all &rarr;</Link>
            </div>

            {/* Pipeline bar */}
            {totalInPipeline > 0 && (
              <div className="flex h-3 rounded-full overflow-hidden mb-4">
                {pipelineStages.map((stage) => {
                  const count = stats.pipeline[stage] || 0;
                  if (count === 0) return null;
                  const pct = (count / totalInPipeline) * 100;
                  return (
                    <div
                      key={stage}
                      className={`${stageColors[stage]} transition-all`}
                      style={{ width: `${pct}%` }}
                      title={`${stageLabels[stage]}: ${count}`}
                    />
                  );
                })}
              </div>
            )}

            {/* Stage counts */}
            <div className="grid grid-cols-4 gap-3">
              {pipelineStages.filter((s) => s !== "closed-lost").map((stage) => (
                <div key={stage} className="text-center">
                  <div className="text-lg font-semibold">{stats.pipeline[stage] || 0}</div>
                  <div className="text-xs text-zinc-500">{stageLabels[stage]}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 gap-3">
            <Link href="/leads" className="border border-zinc-800 rounded-xl p-4 hover:border-zinc-600 hover:bg-zinc-900 transition-all text-center">
              <div className="font-medium text-sm">Lead Bank</div>
              <div className="text-xs text-zinc-500 mt-1">Browse & import contacts</div>
            </Link>
            <Link href="/calls" className="border border-zinc-800 rounded-xl p-4 hover:border-zinc-600 hover:bg-zinc-900 transition-all text-center">
              <div className="font-medium text-sm">Start Calling</div>
              <div className="text-xs text-zinc-500 mt-1">{stats.calls_pending} in queue</div>
            </Link>
          </div>
        </div>

        {/* Activity Feed */}
        <div className="col-span-5">
          <div className="border border-zinc-800 rounded-xl p-5">
            <h2 className="font-semibold mb-4">Recent Activity</h2>
            <div className="space-y-3">
              {activities.map((a) => (
                <Link key={a.id} href={`/leads/${a.lead_id}`} className="flex gap-3 hover:bg-zinc-900 -mx-2 px-2 py-1 rounded-lg transition-colors">
                  <div className="w-5 h-5 rounded-full bg-zinc-800 flex items-center justify-center text-xs shrink-0 mt-0.5">
                    {actionIcons[a.action] || "·"}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm truncate">
                      <span className="font-medium">{a.first_name} {a.last_name}</span>
                      <span className="text-zinc-500"> · {a.description}</span>
                    </p>
                    <p className="text-xs text-zinc-600">{timeAgo(a.created_at)}</p>
                  </div>
                </Link>
              ))}
              {activities.length === 0 && (
                <p className="text-sm text-zinc-600">No activity yet. Start by importing leads.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
