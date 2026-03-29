"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";

interface Lead {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  company: string;
  title: string;
  phone: string;
  city: string;
  country: string;
  source: string;
  pipeline_stage: string;
  lead_score: number;
  score_reason: string;
  tags: string | null;
  notes: string;
  created_at: string;
  updated_at: string;
}

interface Activity {
  id: string;
  action: string;
  description: string;
  metadata: string;
  created_at: string;
}

interface Note {
  id: string;
  content: string;
  created_at: string;
}

const stages = ["new", "contacted", "discovery", "proposal", "negotiation", "closed-won", "closed-lost"];

const stageColors: Record<string, string> = {
  new: "bg-zinc-700",
  contacted: "bg-blue-600",
  discovery: "bg-purple-600",
  proposal: "bg-yellow-600",
  negotiation: "bg-orange-600",
  "closed-won": "bg-green-600",
  "closed-lost": "bg-red-600",
};

const actionIcons: Record<string, string> = {
  lead_created: "➕",
  lead_updated: "✏️",
  tag_added: "🏷️",
  tag_removed: "🏷️",
  call_queued: "📞",
  call_completed: "📞",
  note_added: "📝",
  stage_changed: "📊",
  sequence_enrolled: "📧",
  email_sent: "✉️",
  email_opened: "👀",
  list_added: "📋",
  meeting_synced: "🎤",
};

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "Z");
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function formatTime(dateStr: string): string {
  const d = new Date(dateStr + "Z");
  return d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

export default function ContactDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [lead, setLead] = useState<Lead | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [newNote, setNewNote] = useState("");
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Lead>>({});

  const fetchLead = useCallback(async () => {
    const res = await fetch(`/api/leads/${params.id}`);
    if (!res.ok) return router.push("/leads");
    const data = await res.json();
    setLead(data);
    setEditForm(data);
  }, [params.id, router]);

  const fetchActivities = useCallback(async () => {
    const res = await fetch(`/api/leads/${params.id}/activity`);
    setActivities(await res.json());
  }, [params.id]);

  const fetchNotes = useCallback(async () => {
    const res = await fetch(`/api/leads/${params.id}/notes`);
    setNotes(await res.json());
  }, [params.id]);

  useEffect(() => {
    fetchLead();
    fetchActivities();
    fetchNotes();
  }, [fetchLead, fetchActivities, fetchNotes]);

  const updateStage = async (stage: string) => {
    await fetch(`/api/leads/${params.id}/stage`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stage }),
    });
    fetchLead();
    fetchActivities();
  };

  const saveEdit = async () => {
    await fetch(`/api/leads/${params.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editForm),
    });
    setEditing(false);
    fetchLead();
  };

  const addNote = async () => {
    if (!newNote.trim()) return;
    await fetch(`/api/leads/${params.id}/notes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: newNote }),
    });
    setNewNote("");
    fetchNotes();
    fetchActivities();
  };

  const addToCallQueue = async () => {
    await fetch("/api/calls", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lead_ids: [params.id] }),
    });
    fetchActivities();
  };

  if (!lead) return <div className="text-zinc-500">Loading...</div>;

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <button onClick={() => router.push("/leads")} className="text-sm text-zinc-500 hover:text-white mb-2 block">
          &larr; Lead Bank
        </button>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold">{lead.first_name} {lead.last_name}</h1>
            <p className="text-zinc-400">{lead.title}{lead.title && lead.company ? " at " : ""}{lead.company}</p>
          </div>
          <div className="flex gap-2">
            <button onClick={addToCallQueue} className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-sm rounded-lg transition-colors">
              Add to Call Queue
            </button>
            <button onClick={() => setEditing(!editing)} className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-sm rounded-lg transition-colors">
              {editing ? "Cancel" : "Edit"}
            </button>
          </div>
        </div>
      </div>

      {/* Pipeline Stage Bar */}
      <div className="flex gap-1 mb-6 p-1 bg-zinc-900 rounded-lg">
        {stages.map((stage) => (
          <button
            key={stage}
            onClick={() => updateStage(stage)}
            className={`flex-1 py-2 text-xs font-medium rounded-md transition-colors ${
              lead.pipeline_stage === stage
                ? `${stageColors[stage]} text-white`
                : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800"
            }`}
          >
            {stage.replace("-", " ").replace(/\b\w/g, (c) => c.toUpperCase())}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Left Column — Info + Notes */}
        <div className="col-span-5 space-y-6">
          {/* Contact Info */}
          <div className="border border-zinc-800 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-3">Contact Info</h3>
            {editing ? (
              <div className="space-y-2">
                {(["first_name", "last_name", "email", "company", "title", "phone", "city", "country"] as const).map((field) => (
                  <div key={field}>
                    <label className="text-xs text-zinc-500">{field.replace("_", " ")}</label>
                    <input
                      value={(editForm as any)[field] || ""}
                      onChange={(e) => setEditForm({ ...editForm, [field]: e.target.value })}
                      className="w-full px-3 py-1.5 bg-zinc-800 border border-zinc-700 rounded text-sm focus:outline-none focus:border-zinc-500"
                    />
                  </div>
                ))}
                <button onClick={saveEdit} className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-sm rounded-lg mt-2">
                  Save Changes
                </button>
              </div>
            ) : (
              <div className="space-y-2 text-sm">
                {lead.email && <div><span className="text-zinc-500 w-16 inline-block">Email</span> <span>{lead.email}</span></div>}
                {lead.phone && <div><span className="text-zinc-500 w-16 inline-block">Phone</span> <span className="font-mono">{lead.phone}</span></div>}
                {lead.city && <div><span className="text-zinc-500 w-16 inline-block">City</span> <span>{lead.city}{lead.country ? `, ${lead.country}` : ""}</span></div>}
                <div><span className="text-zinc-500 w-16 inline-block">Source</span> <span>{lead.source}</span></div>
                <div><span className="text-zinc-500 w-16 inline-block">Added</span> <span>{formatDate(lead.created_at)}</span></div>
              </div>
            )}

            {/* Tags */}
            {lead.tags && (
              <div className="mt-4 pt-3 border-t border-zinc-800">
                <div className="flex flex-wrap gap-1">
                  {lead.tags.split(",").map((tag) => (
                    <span key={tag} className="px-2 py-0.5 text-xs rounded-full bg-zinc-800 text-zinc-300">{tag}</span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="border border-zinc-800 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-3">Notes</h3>
            <div className="mb-3">
              <textarea
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Add a note..."
                rows={3}
                className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-sm resize-none focus:outline-none focus:border-zinc-600"
              />
              <button
                onClick={addNote}
                disabled={!newNote.trim()}
                className="mt-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-sm rounded-lg disabled:opacity-50 transition-colors"
              >
                Add Note
              </button>
            </div>
            <div className="space-y-3">
              {notes.map((note) => (
                <div key={note.id} className="p-3 bg-zinc-900 rounded-lg">
                  <p className="text-sm whitespace-pre-wrap">{note.content}</p>
                  <p className="text-xs text-zinc-600 mt-1">{formatDate(note.created_at)} at {formatTime(note.created_at)}</p>
                </div>
              ))}
              {notes.length === 0 && (
                <p className="text-sm text-zinc-600">No notes yet.</p>
              )}
            </div>
          </div>
        </div>

        {/* Right Column — Activity Timeline */}
        <div className="col-span-7">
          <div className="border border-zinc-800 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-4">Activity Timeline</h3>
            <div className="space-y-0">
              {activities.map((activity, i) => (
                <div key={activity.id} className="flex gap-3 relative">
                  {/* Timeline line */}
                  {i < activities.length - 1 && (
                    <div className="absolute left-[11px] top-7 bottom-0 w-px bg-zinc-800" />
                  )}
                  {/* Icon */}
                  <div className="w-6 h-6 rounded-full bg-zinc-800 flex items-center justify-center text-xs shrink-0 z-10 mt-0.5">
                    {actionIcons[activity.action] || "·"}
                  </div>
                  {/* Content */}
                  <div className="pb-4 min-w-0">
                    <p className="text-sm">{activity.description}</p>
                    <p className="text-xs text-zinc-600 mt-0.5">
                      {formatDate(activity.created_at)} at {formatTime(activity.created_at)}
                    </p>
                  </div>
                </div>
              ))}
              {activities.length === 0 && (
                <p className="text-sm text-zinc-600">No activity yet.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
