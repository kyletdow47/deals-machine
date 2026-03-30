"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";

interface Lead {
  id: string; email: string; first_name: string; last_name: string; company: string;
  title: string; phone: string; city: string; country: string; source: string;
  pipeline_stage: string; lead_score: number; tags: string | null; notes: string;
  created_at: string; updated_at: string;
}
interface Activity { id: string; action: string; description: string; created_at: string; }
interface Note { id: string; content: string; created_at: string; }
interface Memory { lead_id: string; summary: string | null; raw_context: string | null; last_updated: string | null; }

const stages = ["new", "contacted", "discovery", "proposal", "negotiation", "closed-won", "closed-lost"];
const stageLabels: Record<string, string> = { new: "New", contacted: "Contacted", discovery: "Discovery", proposal: "Proposal", negotiation: "Negotiation", "closed-won": "Closed Won", "closed-lost": "Closed Lost" };
const stageColors: Record<string, string> = { new: "bg-outline", contacted: "bg-primary/40", discovery: "bg-primary/60", proposal: "bg-primary-container", negotiation: "bg-primary-fixed-dim", "closed-won": "bg-primary", "closed-lost": "bg-error" };

const actionIcons: Record<string, string> = {
  lead_created: "person_add", lead_updated: "edit", tag_added: "label", tag_removed: "label_off",
  call_completed: "call", note_added: "edit_note", stage_changed: "swap_horiz",
  sequence_enrolled: "forward_to_inbox", email_sent: "mail", email_opened: "visibility", list_added: "playlist_add",
};

function fmtDate(d: string) { return new Date(d + "Z").toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }); }
function fmtTime(d: string) { return new Date(d + "Z").toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }); }

export default function ContactDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [lead, setLead] = useState<Lead | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [memory, setMemory] = useState<Memory | null>(null);
  const [synthLoading, setSynthLoading] = useState(false);
  const [newNote, setNewNote] = useState("");
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Lead>>({});

  const fetchAll = useCallback(async () => {
    const [lr, ar, nr, mr] = await Promise.all([
      fetch(`/api/leads/${params.id}`), fetch(`/api/leads/${params.id}/activity`),
      fetch(`/api/leads/${params.id}/notes`), fetch(`/api/leads/${params.id}/memory`),
    ]);
    if (!lr.ok) return router.push("/leads");
    const ld = await lr.json(); setLead(ld); setEditForm(ld);
    setMemory(await mr.json());
    setActivities(await ar.json()); setNotes(await nr.json());
  }, [params.id, router]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const updateStage = async (stage: string) => {
    await fetch(`/api/leads/${params.id}/stage`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ stage }) });
    fetchAll();
  };
  const saveEdit = async () => {
    await fetch(`/api/leads/${params.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(editForm) });
    setEditing(false); fetchAll();
  };
  const addNote = async () => {
    if (!newNote.trim()) return;
    await fetch(`/api/leads/${params.id}/notes`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ content: newNote }) });
    setNewNote(""); fetchAll();
  };
  const synthesizeMemory = async () => {
    setSynthLoading(true);
    const res = await fetch(`/api/leads/${params.id}/memory`, { method: "POST" });
    setMemory(await res.json());
    setSynthLoading(false);
  };

  const addToQueue = async () => {
    await fetch("/api/calls", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ lead_ids: [params.id] }) });
    fetchAll();
  };

  if (!lead) return <div className="text-outline">Loading...</div>;

  const initials = `${lead.first_name?.[0] || ""}${lead.last_name?.[0] || ""}`.toUpperCase();

  return (
    <div>
      <button onClick={() => router.push("/leads")} className="text-sm text-outline hover:text-primary mb-4 flex items-center gap-1 transition-colors">
        <span className="material-symbols-outlined text-sm">arrow_back</span> Lead Bank
      </button>

      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-primary-fixed flex items-center justify-center text-primary font-bold text-xl font-headline">{initials}</div>
          <div>
            <h1 className="font-headline text-3xl font-extrabold tracking-tight">{lead.first_name} {lead.last_name}</h1>
            <p className="text-on-surface-variant">{lead.title}{lead.title && lead.company ? " at " : ""}{lead.company}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={addToQueue} className="px-4 py-2 bg-surface-container-highest hover:bg-surface-dim rounded-xl text-xs font-bold font-headline flex items-center gap-2 transition-colors">
            <span className="material-symbols-outlined text-sm">call</span> Add to Queue
          </button>
          <button onClick={() => setEditing(!editing)} className="px-4 py-2 bg-surface-container-highest hover:bg-surface-dim rounded-xl text-xs font-bold font-headline transition-colors">
            {editing ? "Cancel" : "Edit"}
          </button>
        </div>
      </div>

      {/* Pipeline Stage Bar */}
      <div className="flex gap-1 mb-8 p-1 bg-surface-container rounded-xl">
        {stages.map((stage) => (
          <button key={stage} onClick={() => updateStage(stage)}
            className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-colors ${
              lead.pipeline_stage === stage ? `${stageColors[stage]} text-white` : "text-outline hover:text-on-surface hover:bg-surface-container-high"
            }`}>
            {stageLabels[stage]}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-12 gap-8">
        {/* Left: Info + Notes */}
        <div className="col-span-12 lg:col-span-5 space-y-6">
          <section className="bg-surface-container-highest rounded-xl p-6 border border-outline-variant/5">
            <h3 className="font-label font-bold text-[10px] uppercase tracking-widest text-primary mb-4">Contact Info</h3>
            {editing ? (
              <div className="space-y-2">
                {(["first_name", "last_name", "email", "company", "title", "phone", "city", "country"] as const).map((f) => (
                  <div key={f}>
                    <label className="text-[10px] font-bold uppercase text-outline">{f.replace("_", " ")}</label>
                    <input value={(editForm as any)[f] || ""} onChange={(e) => setEditForm({ ...editForm, [f]: e.target.value })}
                      className="w-full px-3 py-2 bg-surface-container-lowest border-none rounded-lg text-sm focus:ring-2 focus:ring-primary/20" />
                  </div>
                ))}
                <button onClick={saveEdit} className="metallic-silk text-white px-4 py-2 rounded-xl text-xs font-bold mt-2">Save</button>
              </div>
            ) : (
              <div className="space-y-4">
                {[
                  { icon: "mail", label: "Email", value: lead.email },
                  { icon: "call", label: "Phone", value: lead.phone },
                  { icon: "location_on", label: "Location", value: [lead.city, lead.country].filter(Boolean).join(", ") },
                  { icon: "info", label: "Source", value: lead.source },
                  { icon: "calendar_today", label: "Added", value: fmtDate(lead.created_at) },
                ].filter((r) => r.value).map((r) => (
                  <div key={r.label} className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-full bg-surface-container-low flex items-center justify-center text-primary">
                      <span className="material-symbols-outlined text-sm">{r.icon}</span>
                    </div>
                    <div>
                      <p className="text-[10px] font-label uppercase text-outline">{r.label}</p>
                      <p className="text-sm font-medium">{r.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {lead.tags && (
              <div className="mt-4 pt-3 border-t border-outline-variant/20 flex flex-wrap gap-1">
                {lead.tags.split(",").map((t) => (
                  <span key={t} className="px-2 py-0.5 text-[10px] rounded-full bg-secondary-container text-on-secondary-container font-bold uppercase">{t}</span>
                ))}
              </div>
            )}
          </section>

          {/* AI Memory */}
          <section className="bg-inverse-surface text-inverse-on-surface rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-primary-fixed-dim" style={{ fontVariationSettings: "'FILL' 1" }}>psychology</span>
                <h3 className="font-headline font-bold text-lg">AI Memory</h3>
              </div>
              <button onClick={synthesizeMemory} disabled={synthLoading}
                className="text-[10px] font-bold uppercase tracking-widest text-primary-fixed-dim hover:text-primary-fixed disabled:opacity-50 flex items-center gap-1 transition-colors">
                <span className="material-symbols-outlined text-sm">{synthLoading ? "hourglass_top" : "sync"}</span>
                {synthLoading ? "Synthesizing..." : "Refresh"}
              </button>
            </div>
            {memory?.summary ? (
              <p className="text-sm leading-relaxed text-inverse-on-surface/80">{memory.summary}</p>
            ) : (
              <div className="text-center py-4">
                <p className="text-inverse-on-surface/50 text-sm mb-3">No memory synthesized yet</p>
                <button onClick={synthesizeMemory} disabled={synthLoading}
                  className="px-4 py-2 bg-white/10 hover:bg-white/15 rounded-xl text-xs font-bold transition-colors btn-press">
                  Generate Memory
                </button>
              </div>
            )}
            {memory?.last_updated && (
              <p className="text-[10px] text-inverse-on-surface/40 mt-3">Last updated: {fmtDate(memory.last_updated)}</p>
            )}
          </section>

          <section className="bg-surface-container-low rounded-xl p-6">
            <h3 className="font-headline font-bold text-lg mb-4">Notes</h3>
            <div className="mb-4">
              <textarea value={newNote} onChange={(e) => setNewNote(e.target.value)} placeholder="Add a note..."
                rows={3} className="w-full px-4 py-3 bg-surface-container-lowest border-none rounded-xl text-sm resize-none focus:ring-2 focus:ring-primary/20 shadow-inner" />
              <button onClick={addNote} disabled={!newNote.trim()} className="mt-2 px-4 py-2 metallic-silk text-white rounded-xl text-xs font-bold disabled:opacity-50">Add Note</button>
            </div>
            <div className="space-y-3">
              {notes.map((n) => (
                <div key={n.id} className="p-3 bg-surface-container-lowest rounded-lg">
                  <p className="text-sm whitespace-pre-wrap">{n.content}</p>
                  <p className="text-[10px] text-outline mt-1">{fmtDate(n.created_at)} at {fmtTime(n.created_at)}</p>
                </div>
              ))}
              {notes.length === 0 && <p className="text-sm text-outline">No notes yet.</p>}
            </div>
          </section>
        </div>

        {/* Right: Activity */}
        <div className="col-span-12 lg:col-span-7">
          <section className="bg-surface-container-highest rounded-xl p-6 border border-outline-variant/5">
            <h3 className="font-headline font-bold text-lg mb-6">Activity Timeline</h3>
            <div className="space-y-0">
              {activities.map((a, i) => (
                <div key={a.id} className="flex gap-4 relative">
                  {i < activities.length - 1 && <div className="absolute left-[15px] top-8 bottom-0 w-[1px] bg-outline-variant/30" />}
                  <div className="w-8 h-8 rounded-full bg-surface-container-low flex items-center justify-center text-primary shrink-0 z-10 mt-0.5">
                    <span className="material-symbols-outlined text-sm">{actionIcons[a.action] || "circle"}</span>
                  </div>
                  <div className="pb-6 min-w-0">
                    <p className="text-sm font-medium">{a.description}</p>
                    <p className="text-[10px] text-outline mt-0.5">{fmtDate(a.created_at)} at {fmtTime(a.created_at)}</p>
                  </div>
                </div>
              ))}
              {activities.length === 0 && <p className="text-sm text-outline">No activity yet.</p>}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
