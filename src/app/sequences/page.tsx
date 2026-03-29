"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

interface Sequence {
  id: string;
  name: string;
  description: string;
  step_count: number;
  enrolled_count: number;
  active_count: number;
  created_at: string;
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

  useEffect(() => {
    fetchSequences();
  }, [fetchSequences]);

  const createSequence = async () => {
    if (!name) return;
    const res = await fetch("/api/sequences", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        description,
        steps: [
          { step_number: 1, delay_days: 0, subject_template: "", body_template: "" },
        ],
      }),
    });
    const data = await res.json();
    setName("");
    setDescription("");
    setShowCreate(false);
    window.location.href = `/sequences/${data.id}`;
  };

  const deleteSequence = async (id: string, seqName: string) => {
    if (!confirm(`Delete sequence "${seqName}"?`)) return;
    await fetch(`/api/sequences/${id}`, { method: "DELETE" });
    fetchSequences();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Sequences</h1>
          <p className="text-zinc-500 text-sm">Build email flows with custom templates</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-sm rounded-lg transition-colors">
          New Sequence
        </button>
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={() => setShowCreate(false)}>
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold mb-4">New Sequence</h2>
            <input
              placeholder="Sequence name (e.g. Cold Outreach v1)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 mb-3 bg-zinc-800 border border-zinc-700 rounded-lg text-sm focus:outline-none focus:border-zinc-500"
              autoFocus
            />
            <input
              placeholder="Description (optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 mb-4 bg-zinc-800 border border-zinc-700 rounded-lg text-sm focus:outline-none focus:border-zinc-500"
            />
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowCreate(false)} className="px-3 py-1.5 text-sm text-zinc-400 hover:text-white">Cancel</button>
              <button onClick={createSequence} className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-sm rounded-lg">Create &amp; Edit</button>
            </div>
          </div>
        </div>
      )}

      {/* Sequences List */}
      <div className="space-y-3">
        {sequences.map((seq) => (
          <div key={seq.id} className="border border-zinc-800 rounded-xl p-5 hover:border-zinc-700 transition-colors">
            <div className="flex items-center justify-between">
              <div>
                <Link href={`/sequences/${seq.id}`} className="font-semibold hover:text-blue-400 transition-colors">
                  {seq.name}
                </Link>
                {seq.description && <p className="text-sm text-zinc-500 mt-0.5">{seq.description}</p>}
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right text-sm">
                  <span className="text-zinc-400">{seq.step_count} step{seq.step_count !== 1 ? "s" : ""}</span>
                  {seq.enrolled_count > 0 && (
                    <span className="text-zinc-500 ml-3">
                      {seq.active_count} active / {seq.enrolled_count} enrolled
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  <Link href={`/sequences/${seq.id}`} className="text-xs text-zinc-500 hover:text-white transition-colors">Edit</Link>
                  <button onClick={() => deleteSequence(seq.id, seq.name)} className="text-xs text-zinc-500 hover:text-red-400 transition-colors">Delete</button>
                </div>
              </div>
            </div>
          </div>
        ))}
        {sequences.length === 0 && (
          <div className="text-center py-12 text-zinc-500 border border-zinc-800 rounded-xl">
            No sequences yet. Create one to start building email flows.
          </div>
        )}
      </div>
    </div>
  );
}
