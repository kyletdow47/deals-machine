"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

interface Lead {
  id: string;
  first_name: string;
  last_name: string;
  company: string;
  title: string;
  email: string;
  pipeline_stage: string;
  lead_score: number;
  tags: string | null;
  last_activity: string | null;
  last_activity_desc: string | null;
}

const stages = [
  { key: "new", label: "New", color: "border-zinc-600" },
  { key: "contacted", label: "Contacted", color: "border-blue-600" },
  { key: "discovery", label: "Discovery", color: "border-purple-600" },
  { key: "proposal", label: "Proposal", color: "border-yellow-600" },
  { key: "negotiation", label: "Negotiation", color: "border-orange-600" },
  { key: "closed-won", label: "Closed Won", color: "border-green-600" },
  { key: "closed-lost", label: "Closed Lost", color: "border-red-600" },
];

type ViewMode = "board" | "table" | "list";

export default function PipelinePage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [view, setView] = useState<ViewMode>(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("pipeline_view") as ViewMode) || "board";
    }
    return "board";
  });
  const [draggedId, setDraggedId] = useState<string | null>(null);

  const fetchLeads = useCallback(async () => {
    const res = await fetch("/api/leads");
    setLeads(await res.json());
  }, []);

  useEffect(() => { fetchLeads(); }, [fetchLeads]);

  useEffect(() => {
    localStorage.setItem("pipeline_view", view);
  }, [view]);

  const moveStage = async (leadId: string, newStage: string) => {
    await fetch(`/api/leads/${leadId}/stage`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stage: newStage }),
    });
    setLeads((prev) => prev.map((l) => l.id === leadId ? { ...l, pipeline_stage: newStage } : l));
  };

  const getLeadsForStage = (stage: string) => leads.filter((l) => l.pipeline_stage === stage);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Pipeline</h1>
          <p className="text-zinc-500 text-sm">{leads.length} total leads</p>
        </div>
        <div className="flex gap-1 bg-zinc-900 p-1 rounded-lg">
          {(["board", "table", "list"] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${
                view === v ? "bg-zinc-700 text-white" : "text-zinc-500 hover:text-white"
              }`}
            >
              {v.charAt(0).toUpperCase() + v.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Board View */}
      {view === "board" && (
        <div className="flex gap-3 overflow-x-auto pb-4">
          {stages.map((stage) => {
            const stageLeads = getLeadsForStage(stage.key);
            return (
              <div
                key={stage.key}
                className={`flex-shrink-0 w-64 border-t-2 ${stage.color} bg-zinc-900/50 rounded-lg`}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => { if (draggedId) moveStage(draggedId, stage.key); setDraggedId(null); }}
              >
                <div className="p-3 flex items-center justify-between">
                  <span className="text-sm font-medium">{stage.label}</span>
                  <span className="text-xs text-zinc-500 bg-zinc-800 px-1.5 py-0.5 rounded">{stageLeads.length}</span>
                </div>
                <div className="px-2 pb-2 space-y-2 min-h-[100px]">
                  {stageLeads.map((lead) => (
                    <Link
                      key={lead.id}
                      href={`/leads/${lead.id}`}
                      draggable
                      onDragStart={() => setDraggedId(lead.id)}
                      className="block p-3 bg-zinc-900 border border-zinc-800 rounded-lg hover:border-zinc-700 transition-colors cursor-grab active:cursor-grabbing"
                    >
                      <div className="font-medium text-sm truncate">{lead.first_name} {lead.last_name}</div>
                      <div className="text-xs text-zinc-500 truncate">{lead.company}</div>
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Table View */}
      {view === "table" && (
        <div className="border border-zinc-800 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-zinc-900/80">
              <tr>
                <th className="px-4 py-3 text-left text-zinc-400 font-medium">Name</th>
                <th className="px-4 py-3 text-left text-zinc-400 font-medium">Company</th>
                <th className="px-4 py-3 text-left text-zinc-400 font-medium">Title</th>
                <th className="px-4 py-3 text-left text-zinc-400 font-medium">Stage</th>
                <th className="px-4 py-3 text-left text-zinc-400 font-medium">Tags</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {leads.map((lead) => (
                <tr key={lead.id} className="hover:bg-zinc-900/50">
                  <td className="px-4 py-3">
                    <Link href={`/leads/${lead.id}`} className="font-medium hover:text-blue-400">{lead.first_name} {lead.last_name}</Link>
                  </td>
                  <td className="px-4 py-3 text-zinc-400">{lead.company}</td>
                  <td className="px-4 py-3 text-zinc-400">{lead.title}</td>
                  <td className="px-4 py-3">
                    <select
                      value={lead.pipeline_stage}
                      onChange={(e) => moveStage(lead.id, e.target.value)}
                      className="bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-xs"
                    >
                      {stages.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    {lead.tags && lead.tags.split(",").map((tag) => (
                      <span key={tag} className="inline-block px-1.5 py-0.5 mr-1 text-xs rounded bg-zinc-800 text-zinc-400">{tag}</span>
                    ))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* List View */}
      {view === "list" && (
        <div className="space-y-6">
          {stages.map((stage) => {
            const stageLeads = getLeadsForStage(stage.key);
            if (stageLeads.length === 0) return null;
            return (
              <div key={stage.key}>
                <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                  {stage.label} ({stageLeads.length})
                </h3>
                <div className="space-y-1">
                  {stageLeads.map((lead) => (
                    <Link
                      key={lead.id}
                      href={`/leads/${lead.id}`}
                      className="flex items-center justify-between p-3 border border-zinc-800 rounded-lg hover:border-zinc-700 transition-colors"
                    >
                      <div>
                        <span className="font-medium text-sm">{lead.first_name} {lead.last_name}</span>
                        <span className="text-zinc-500 text-sm ml-2">{lead.company}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {lead.tags && lead.tags.split(",").slice(0, 2).map((tag) => (
                          <span key={tag} className="px-1.5 py-0.5 text-xs rounded bg-zinc-800 text-zinc-400">{tag}</span>
                        ))}
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
