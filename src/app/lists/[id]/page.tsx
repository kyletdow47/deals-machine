"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";

interface ListDetail {
  id: string;
  name: string;
  description: string;
  auto_tag: string | null;
  members: {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
    company: string;
    title: string;
    tags: string | null;
  }[];
}

interface Sequence {
  id: string;
  name: string;
  step_count: number;
}

export default function ListDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [list, setList] = useState<ListDetail | null>(null);
  const [sequences, setSequences] = useState<Sequence[]>([]);
  const [showEnroll, setShowEnroll] = useState(false);
  const [selectedSequence, setSelectedSequence] = useState("");

  const fetchList = useCallback(async () => {
    const res = await fetch(`/api/lists/${params.id}`);
    if (!res.ok) return router.push("/lists");
    setList(await res.json());
  }, [params.id, router]);

  const fetchSequences = useCallback(async () => {
    const res = await fetch("/api/sequences");
    setSequences(await res.json());
  }, []);

  useEffect(() => {
    fetchList();
    fetchSequences();
  }, [fetchList, fetchSequences]);

  const enrollInSequence = async () => {
    if (!selectedSequence) return;
    const res = await fetch(`/api/sequences/${selectedSequence}/enroll`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ list_id: params.id }),
    });
    const data = await res.json();
    alert(`Enrolled ${data.enrolled} contact(s) in sequence`);
    setShowEnroll(false);
  };

  if (!list) return <div className="text-zinc-500">Loading...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <button onClick={() => router.push("/lists")} className="text-sm text-zinc-500 hover:text-white mb-1">&larr; Lists</button>
          <h1 className="text-2xl font-bold">{list.name}</h1>
          <p className="text-zinc-500 text-sm">{list.members.length} contacts{list.description && ` · ${list.description}`}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowEnroll(true)} className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-sm rounded-lg transition-colors">
            Send to Sequence
          </button>
        </div>
      </div>

      {/* Enroll in Sequence Modal */}
      {showEnroll && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={() => setShowEnroll(false)}>
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold mb-4">Send List to Sequence</h2>
            <p className="text-zinc-400 text-sm mb-4">
              All {list.members.length} contacts in &ldquo;{list.name}&rdquo; will be enrolled in the selected email sequence.
            </p>
            {sequences.length === 0 ? (
              <p className="text-zinc-500 text-sm">No sequences created yet. Go to Sequences to create one first.</p>
            ) : (
              <select
                value={selectedSequence}
                onChange={(e) => setSelectedSequence(e.target.value)}
                className="w-full px-3 py-2 mb-4 bg-zinc-800 border border-zinc-700 rounded-lg text-sm focus:outline-none focus:border-zinc-500"
              >
                <option value="">Select a sequence...</option>
                {sequences.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.step_count} steps)
                  </option>
                ))}
              </select>
            )}
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowEnroll(false)} className="px-3 py-1.5 text-sm text-zinc-400 hover:text-white">Cancel</button>
              <button onClick={enrollInSequence} disabled={!selectedSequence} className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-sm rounded-lg disabled:opacity-50">
                Enroll
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Members Table */}
      <div className="border border-zinc-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-zinc-900/80">
            <tr>
              <th className="px-4 py-3 text-left text-zinc-400 font-medium">Name</th>
              <th className="px-4 py-3 text-left text-zinc-400 font-medium">Company</th>
              <th className="px-4 py-3 text-left text-zinc-400 font-medium">Title</th>
              <th className="px-4 py-3 text-left text-zinc-400 font-medium">Email</th>
              <th className="px-4 py-3 text-left text-zinc-400 font-medium">Tags</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/50">
            {list.members.map((m) => (
              <tr key={m.id} className="hover:bg-zinc-900/50">
                <td className="px-4 py-3 font-medium">{m.first_name} {m.last_name}</td>
                <td className="px-4 py-3 text-zinc-400">{m.company}</td>
                <td className="px-4 py-3 text-zinc-400">{m.title}</td>
                <td className="px-4 py-3 text-zinc-400">{m.email}</td>
                <td className="px-4 py-3">
                  {m.tags && m.tags.split(",").map((tag) => (
                    <span key={tag} className="inline-block px-2 py-0.5 mr-1 text-xs rounded-full bg-zinc-800 text-zinc-300">{tag}</span>
                  ))}
                </td>
              </tr>
            ))}
            {list.members.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-zinc-500">
                  No contacts in this list yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
