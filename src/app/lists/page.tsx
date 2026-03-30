"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

interface List { id: string; name: string; description: string; auto_tag: string | null; member_count: number; }

export default function ListsPage() {
  const [lists, setLists] = useState<List[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const fetchLists = useCallback(async () => { const r = await fetch("/api/lists"); setLists(await r.json()); }, []);
  useEffect(() => { fetchLists(); }, [fetchLists]);

  const createList = async () => {
    if (!name) return;
    await fetch("/api/lists", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, description }) });
    setName(""); setDescription(""); setShowCreate(false); fetchLists();
  };

  const deleteList = async (id: string, n: string) => {
    if (!confirm(`Delete "${n}"?`)) return;
    await fetch(`/api/lists/${id}`, { method: "DELETE" }); fetchLists();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <span className="text-primary font-label font-bold uppercase tracking-[0.2em] text-[10px]">Segments</span>
          <h1 className="font-headline text-3xl font-extrabold tracking-tight text-on-surface">Lists</h1>
          <p className="text-on-surface-variant text-sm">Contact segments from call outcomes and filters</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="metallic-silk text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-lg flex items-center gap-2">
          <span className="material-symbols-outlined text-sm">add</span> Create List
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {lists.map((list) => (
          <div key={list.id} className="bg-surface-container-highest rounded-xl p-6 hover:border-primary/20 transition-all border border-outline-variant/10 editorial-shadow">
            <div className="flex items-start justify-between mb-3">
              <Link href={`/lists/${list.id}`} className="hover:text-primary transition-colors">
                <h3 className="font-headline font-bold">{list.name}</h3>
              </Link>
              {list.auto_tag && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container font-bold uppercase">auto: {list.auto_tag}</span>
              )}
            </div>
            {list.description && <p className="text-sm text-on-surface-variant mb-3">{list.description}</p>}
            <div className="flex items-center justify-between pt-3 border-t border-outline-variant/20">
              <span className="text-sm text-on-surface-variant font-medium">{list.member_count} contact{list.member_count !== 1 ? "s" : ""}</span>
              <div className="flex gap-3">
                <Link href={`/lists/${list.id}`} className="text-[10px] font-bold text-primary uppercase tracking-wider hover:text-primary-container">View</Link>
                {!list.auto_tag && <button onClick={() => deleteList(list.id, list.name)} className="text-[10px] font-bold text-outline uppercase tracking-wider hover:text-error">Delete</button>}
              </div>
            </div>
          </div>
        ))}
        {lists.length === 0 && (
          <div className="col-span-full text-center py-16">
            <span className="material-symbols-outlined text-5xl text-outline-variant mb-4 block">list_alt</span>
            <p className="text-on-surface-variant font-medium">No lists yet</p>
            <p className="text-outline text-sm">Default lists are created when you process calls</p>
          </div>
        )}
      </div>

      {showCreate && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setShowCreate(false)}>
          <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-2xl p-8 w-full max-w-md shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-headline font-extrabold mb-6">Create List</h2>
            <input placeholder="List name" value={name} onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2.5 mb-3 bg-surface-container-highest border-none rounded-lg text-sm focus:ring-2 focus:ring-primary/20" />
            <input placeholder="Description (optional)" value={description} onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2.5 mb-4 bg-surface-container-highest border-none rounded-lg text-sm focus:ring-2 focus:ring-primary/20" />
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowCreate(false)} className="px-4 py-2 text-sm text-on-surface-variant">Cancel</button>
              <button onClick={createList} className="px-6 py-2.5 metallic-silk text-white rounded-xl text-sm font-bold">Create</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
