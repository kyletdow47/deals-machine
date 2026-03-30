"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useToast } from "@/components/Toast";

interface ListDetail {
  id: string; name: string; description: string; auto_tag: string | null;
  members: { id: string; email: string; first_name: string; last_name: string; company: string; title: string; }[];
}
interface Sequence { id: string; name: string; step_count: number; }

export default function ListDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
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
    const res = await fetch("/api/sequences"); setSequences(await res.json());
  }, []);

  useEffect(() => { fetchList(); fetchSequences(); }, [fetchList, fetchSequences]);

  const enrollInSequence = async () => {
    if (!selectedSequence) return;
    const res = await fetch(`/api/sequences/${selectedSequence}/enroll`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ list_id: params.id }),
    });
    const data = await res.json();
    toast(`Enrolled ${data.enrolled} contact(s) in sequence`);
    setShowEnroll(false);
  };

  if (!list) return (
    <div className="space-y-4 animate-fadeIn">
      <div className="h-8 w-48 bg-surface-dim rounded animate-shimmer" />
      <div className="h-64 bg-surface-container-highest rounded-xl animate-shimmer" />
    </div>
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <button onClick={() => router.push("/lists")} className="text-sm text-outline hover:text-primary mb-2 flex items-center gap-1 transition-colors">
            <span className="material-symbols-outlined text-sm">arrow_back</span> Lists
          </button>
          <h1 className="font-headline text-2xl font-extrabold tracking-tight">{list.name}</h1>
          <p className="text-on-surface-variant text-sm">{list.members.length} contacts{list.description && ` · ${list.description}`}</p>
        </div>
        <button onClick={() => setShowEnroll(true)} className="metallic-silk text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-lg flex items-center gap-2 btn-press">
          <span className="material-symbols-outlined text-sm">forward_to_inbox</span> Send to Sequence
        </button>
      </div>

      {/* Members Table */}
      <div className="bg-surface-container-highest rounded-2xl overflow-hidden editorial-shadow border border-outline-variant/10">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-surface-container-low/50">
              <th className="px-6 py-4 font-label text-[10px] uppercase tracking-widest text-on-surface-variant/70">Name</th>
              <th className="px-6 py-4 font-label text-[10px] uppercase tracking-widest text-on-surface-variant/70">Company</th>
              <th className="px-6 py-4 font-label text-[10px] uppercase tracking-widest text-on-surface-variant/70">Title</th>
              <th className="px-6 py-4 font-label text-[10px] uppercase tracking-widest text-on-surface-variant/70">Email</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/10">
            {list.members.map((m) => (
              <tr key={m.id} className="hover:bg-surface-container-low transition-colors">
                <td className="px-6 py-4 font-headline font-bold">{m.first_name} {m.last_name}</td>
                <td className="px-6 py-4 text-on-surface-variant text-sm">{m.company}</td>
                <td className="px-6 py-4 text-on-surface-variant text-sm">{m.title}</td>
                <td className="px-6 py-4 text-on-surface-variant text-sm">{m.email}</td>
              </tr>
            ))}
            {list.members.length === 0 && (
              <tr><td colSpan={4} className="px-6 py-16 text-center">
                <span className="material-symbols-outlined text-5xl text-outline-variant mb-4 block">group</span>
                <p className="text-on-surface-variant font-medium">No contacts in this list yet</p>
              </td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Enroll Modal */}
      {showEnroll && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn" onClick={() => setShowEnroll(false)}>
          <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-2xl p-8 w-full max-w-md shadow-2xl animate-scaleIn" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-headline font-extrabold mb-4">Send to Sequence</h2>
            <p className="text-on-surface-variant text-sm mb-6">
              All {list.members.length} contacts in &ldquo;{list.name}&rdquo; will be enrolled.
            </p>
            {sequences.length === 0 ? (
              <p className="text-outline text-sm">No sequences yet. Create one first.</p>
            ) : (
              <select value={selectedSequence} onChange={(e) => setSelectedSequence(e.target.value)}
                className="w-full px-4 py-3 mb-6 bg-surface-container-highest border-none rounded-xl text-sm focus:ring-2 focus:ring-primary/20">
                <option value="">Select a sequence...</option>
                {sequences.map((s) => <option key={s.id} value={s.id}>{s.name} ({s.step_count} steps)</option>)}
              </select>
            )}
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowEnroll(false)} className="px-4 py-2 text-sm text-on-surface-variant hover:text-on-surface font-medium">Cancel</button>
              <button onClick={enrollInSequence} disabled={!selectedSequence}
                className="px-6 py-2.5 metallic-silk text-white rounded-xl text-sm font-bold disabled:opacity-50 btn-press">Enroll</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
