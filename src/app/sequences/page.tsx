"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

interface Sequence {
  id: string; name: string; description: string; step_count: number;
  enrolled_count: number; active_count: number; created_at: string;
}

export default function SequencesPage() {
  const [sequences, setSequences] = useState<Sequence[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const fetchSequences = useCallback(async () => {
    const res = await fetch("/api/sequences");
    setSequences(await res.json());
  }, []);

  useEffect(() => { fetchSequences(); }, [fetchSequences]);

  const createSequence = async () => {
    if (!name) return;
    const res = await fetch("/api/sequences", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, description, steps: [{ step_number: 1, delay_days: 0, subject_template: "", body_template: "" }] }),
    });
    const data = await res.json();
    setName(""); setDescription(""); setShowCreate(false);
    window.location.href = `/sequences/${data.id}`;
  };

  const deleteSequence = async (id: string, seqName: string) => {
    if (!confirm(`Delete "${seqName}"?`)) return;
    await fetch(`/api/sequences/${id}`, { method: "DELETE" });
    fetchSequences();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <span className="text-primary font-label font-bold uppercase tracking-[0.2em] text-[10px]">Email Automation</span>
          <h1 className="font-headline text-3xl font-extrabold tracking-tight text-on-surface">Sequences</h1>
          <p className="text-on-surface-variant text-sm">Build email flows with custom templates</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="metallic-silk text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-lg flex items-center gap-2 btn-press">
          <span className="material-symbols-outlined text-sm">add</span> New Sequence
        </button>
      </div>

      <div className="space-y-3 stagger-children">
        {sequences.map((seq) => (
          <div key={seq.id} className="bg-surface-container-highest rounded-xl p-6 border border-outline-variant/10 editorial-shadow card-hover animate-fadeSlideUp">
            <div className="flex items-center justify-between">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>forward_to_inbox</span>
                </div>
                <div>
                  <Link href={`/sequences/${seq.id}`} className="font-headline font-bold text-on-surface hover:text-primary transition-colors text-lg">{seq.name}</Link>
                  {seq.description && <p className="text-sm text-on-surface-variant mt-0.5">{seq.description}</p>}
                  <div className="flex gap-3 mt-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-secondary-container text-[10px] font-bold uppercase text-on-secondary-container">
                      {seq.step_count} step{seq.step_count !== 1 ? "s" : ""}
                    </span>
                    {seq.enrolled_count > 0 && (
                      <span className="px-2.5 py-0.5 rounded-full bg-surface-variant text-[10px] font-bold uppercase text-on-surface-variant">
                        {seq.active_count} active / {seq.enrolled_count} enrolled
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Link href={`/sequences/${seq.id}`} className="px-4 py-2 bg-primary-container text-on-primary-container hover:bg-primary-container/90 rounded-xl font-headline font-bold text-xs transition-all btn-press">
                  Edit
                </Link>
                <button onClick={() => deleteSequence(seq.id, seq.name)} className="text-[10px] font-bold text-outline hover:text-error transition-colors uppercase tracking-wider">
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
        {sequences.length === 0 && (
          <div className="text-center py-16 bg-surface-container-highest rounded-xl border border-outline-variant/10">
            <span className="material-symbols-outlined text-5xl text-outline-variant mb-4 block">forward_to_inbox</span>
            <p className="text-on-surface-variant font-medium">No sequences yet</p>
            <p className="text-outline text-sm mb-6">Create one to start building email flows</p>
            <button onClick={() => setShowCreate(true)} className="metallic-silk text-white px-6 py-2.5 rounded-xl text-xs font-bold shadow-lg btn-press">
              Create First Sequence
            </button>
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn" onClick={() => setShowCreate(false)}>
          <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-2xl p-8 w-full max-w-md shadow-2xl animate-scaleIn" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-headline font-extrabold mb-6">New Sequence</h2>
            <input
              placeholder="Sequence name (e.g. Cold Outreach v1)"
              value={name} onChange={(e) => setName(e.target.value)} autoFocus
              className="w-full px-4 py-3 mb-3 bg-surface-container-highest border-none rounded-xl text-sm focus:ring-2 focus:ring-primary/20 placeholder:text-outline-variant"
            />
            <input
              placeholder="Description (optional)"
              value={description} onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-3 mb-6 bg-surface-container-highest border-none rounded-xl text-sm focus:ring-2 focus:ring-primary/20 placeholder:text-outline-variant"
            />
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowCreate(false)} className="px-4 py-2 text-sm text-on-surface-variant hover:text-on-surface font-medium">Cancel</button>
              <button onClick={createSequence} className="px-6 py-2.5 metallic-silk text-white rounded-xl text-sm font-bold shadow-lg btn-press">Create & Edit</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
