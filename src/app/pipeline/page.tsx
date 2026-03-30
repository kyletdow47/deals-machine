"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

interface Lead {
  id: string; first_name: string; last_name: string; company: string; title: string;
  pipeline_stage: string; tags: string | null;
}

const stages = [
  { key: "new", label: "New", color: "border-outline" },
  { key: "contacted", label: "Contacted", color: "border-primary/40" },
  { key: "discovery", label: "Discovery", color: "border-primary/60" },
  { key: "proposal", label: "Proposal", color: "border-primary-container" },
  { key: "negotiation", label: "Negotiation", color: "border-primary-fixed-dim" },
  { key: "closed-won", label: "Closed Won", color: "border-primary" },
  { key: "closed-lost", label: "Closed Lost", color: "border-error" },
];

type ViewMode = "board" | "table" | "list";

export default function PipelinePage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [view, setView] = useState<ViewMode>("board");
  const [draggedId, setDraggedId] = useState<string | null>(null);

  const fetchLeads = useCallback(async () => {
    const res = await fetch("/api/leads");
    setLeads(await res.json());
  }, []);

  useEffect(() => { fetchLeads(); }, [fetchLeads]);

  const moveStage = async (leadId: string, newStage: string) => {
    await fetch(`/api/leads/${leadId}/stage`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ stage: newStage }) });
    setLeads((prev) => prev.map((l) => l.id === leadId ? { ...l, pipeline_stage: newStage } : l));
  };

  const getLeadsForStage = (stage: string) => leads.filter((l) => l.pipeline_stage === stage);

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <span className="text-primary font-label font-bold uppercase tracking-[0.2em] text-[10px]">Deal Flow</span>
          <h1 className="font-headline text-3xl font-extrabold tracking-tight text-on-surface">Pipeline</h1>
          <p className="text-on-surface-variant text-sm">{leads.length} total leads</p>
        </div>
        <div className="flex gap-1 bg-surface-container p-1 rounded-lg">
          {(["board", "table", "list"] as const).map((v) => (
            <button key={v} onClick={() => setView(v)}
              className={`px-4 py-1.5 text-xs font-bold font-headline rounded-lg transition-colors ${
                view === v ? "bg-surface-container-lowest shadow-sm text-on-surface" : "text-on-surface-variant hover:text-on-surface"
              }`}>{v.charAt(0).toUpperCase() + v.slice(1)}</button>
          ))}
        </div>
      </div>

      {view === "board" && (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {stages.map((stage) => {
            const stageLeads = getLeadsForStage(stage.key);
            return (
              <div key={stage.key} className={`flex-shrink-0 w-56 border-t-2 ${stage.color} bg-surface-container-low/50 rounded-xl`}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => { if (draggedId) moveStage(draggedId, stage.key); setDraggedId(null); }}>
                <div className="p-3 flex items-center justify-between">
                  <span className="text-xs font-headline font-bold">{stage.label}</span>
                  <span className="text-[10px] text-outline bg-surface-container-highest px-1.5 py-0.5 rounded font-bold">{stageLeads.length}</span>
                </div>
                <div className="px-2 pb-2 space-y-2 min-h-[100px]">
                  {stageLeads.map((lead) => (
                    <Link key={lead.id} href={`/leads/${lead.id}`} draggable onDragStart={() => setDraggedId(lead.id)}
                      className="block p-3 bg-surface-container-lowest border border-outline-variant/10 rounded-lg hover:border-primary/20 transition-colors cursor-grab active:cursor-grabbing shadow-sm">
                      <div className="font-headline font-bold text-sm truncate">{lead.first_name} {lead.last_name}</div>
                      <div className="text-[10px] text-on-surface-variant truncate">{lead.company}</div>
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {view === "table" && (
        <div className="bg-surface-container-highest rounded-2xl overflow-hidden editorial-shadow border border-outline-variant/10">
          <table className="w-full text-left">
            <thead><tr className="bg-surface-container-low/50">
              <th className="px-6 py-4 font-label text-[10px] uppercase tracking-widest text-on-surface-variant/70">Contact</th>
              <th className="px-6 py-4 font-label text-[10px] uppercase tracking-widest text-on-surface-variant/70">Company</th>
              <th className="px-6 py-4 font-label text-[10px] uppercase tracking-widest text-on-surface-variant/70">Stage</th>
            </tr></thead>
            <tbody className="divide-y divide-outline-variant/10">
              {leads.map((lead) => (
                <tr key={lead.id} className="hover:bg-surface-container-low transition-colors">
                  <td className="px-6 py-4"><Link href={`/leads/${lead.id}`} className="font-headline font-bold hover:text-primary">{lead.first_name} {lead.last_name}</Link></td>
                  <td className="px-6 py-4 text-on-surface-variant text-sm">{lead.company}</td>
                  <td className="px-6 py-4">
                    <select value={lead.pipeline_stage} onChange={(e) => moveStage(lead.id, e.target.value)}
                      className="bg-surface-container-lowest border-none rounded-lg px-3 py-1 text-xs font-bold">
                      {stages.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {view === "list" && (
        <div className="space-y-8">
          {stages.map((stage) => {
            const sl = getLeadsForStage(stage.key);
            if (sl.length === 0) return null;
            return (
              <div key={stage.key}>
                <h3 className="text-[10px] font-headline font-bold uppercase tracking-widest text-outline mb-3">{stage.label} ({sl.length})</h3>
                <div className="space-y-1">
                  {sl.map((lead) => (
                    <Link key={lead.id} href={`/leads/${lead.id}`}
                      className="flex items-center justify-between p-4 bg-surface-container-highest rounded-xl hover:bg-surface-container-high transition-colors border border-outline-variant/5">
                      <span className="font-headline font-bold text-sm">{lead.first_name} {lead.last_name} <span className="text-on-surface-variant font-normal ml-2">{lead.company}</span></span>
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
