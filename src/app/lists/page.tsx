"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

interface List {
  id: string;
  name: string;
  description: string;
  auto_tag: string | null;
  member_count: number;
  created_at: string;
}

export default function ListsPage() {
  const [lists, setLists] = useState<List[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const fetchLists = useCallback(async () => {
    const res = await fetch("/api/lists");
    setLists(await res.json());
  }, []);

  useEffect(() => {
    fetchLists();
  }, [fetchLists]);

  const createList = async () => {
    if (!name) return;
    await fetch("/api/lists", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, description }),
    });
    setName("");
    setDescription("");
    setShowCreate(false);
    fetchLists();
  };

  const deleteList = async (id: string, listName: string) => {
    if (!confirm(`Delete list "${listName}"?`)) return;
    await fetch(`/api/lists/${id}`, { method: "DELETE" });
    fetchLists();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Lists</h1>
          <p className="text-zinc-500 text-sm">Contact segments from call outcomes and filters</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-sm rounded-lg transition-colors">
          Create List
        </button>
      </div>

      {/* Create List Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={() => setShowCreate(false)}>
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold mb-4">Create List</h2>
            <input
              placeholder="List name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 mb-3 bg-zinc-800 border border-zinc-700 rounded-lg text-sm focus:outline-none focus:border-zinc-500"
            />
            <input
              placeholder="Description (optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 mb-4 bg-zinc-800 border border-zinc-700 rounded-lg text-sm focus:outline-none focus:border-zinc-500"
            />
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowCreate(false)} className="px-3 py-1.5 text-sm text-zinc-400 hover:text-white">Cancel</button>
              <button onClick={createList} className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-sm rounded-lg">Create</button>
            </div>
          </div>
        </div>
      )}

      {/* Lists Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {lists.map((list) => (
          <div key={list.id} className="border border-zinc-800 rounded-xl p-5 hover:border-zinc-700 transition-colors">
            <div className="flex items-start justify-between mb-3">
              <Link href={`/lists/${list.id}`} className="hover:text-blue-400 transition-colors">
                <h3 className="font-semibold">{list.name}</h3>
              </Link>
              {list.auto_tag && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400">
                  auto: {list.auto_tag}
                </span>
              )}
            </div>
            {list.description && (
              <p className="text-sm text-zinc-500 mb-3">{list.description}</p>
            )}
            <div className="flex items-center justify-between">
              <span className="text-sm text-zinc-400">{list.member_count} contact{list.member_count !== 1 ? "s" : ""}</span>
              <div className="flex gap-2">
                <Link href={`/lists/${list.id}`} className="text-xs text-zinc-500 hover:text-white transition-colors">
                  View
                </Link>
                {!list.auto_tag && (
                  <button onClick={() => deleteList(list.id, list.name)} className="text-xs text-zinc-500 hover:text-red-400 transition-colors">
                    Delete
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
        {lists.length === 0 && (
          <div className="col-span-full text-center py-12 text-zinc-500">
            No lists yet. Default lists are created when you process calls.
          </div>
        )}
      </div>
    </div>
  );
}
