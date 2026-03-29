"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";

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
  tags: string | null;
  last_activity: string | null;
  last_activity_desc: string | null;
  created_at: string;
}

const stageColors: Record<string, string> = {
  new: "bg-zinc-700",
  contacted: "bg-blue-900/60 text-blue-300",
  discovery: "bg-purple-900/60 text-purple-300",
  proposal: "bg-yellow-900/60 text-yellow-300",
  negotiation: "bg-orange-900/60 text-orange-300",
  "closed-won": "bg-green-900/60 text-green-300",
  "closed-lost": "bg-red-900/60 text-red-300",
};

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr + "Z").getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [showAdd, setShowAdd] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    first_name: "", last_name: "", email: "", company: "",
    title: "", phone: "", city: "", country: "",
  });

  const fetchLeads = useCallback(async () => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (stageFilter) params.set("stage", stageFilter);
    const res = await fetch(`/api/leads?${params}`);
    setLeads(await res.json());
  }, [search, stageFilter]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  const addLead = async () => {
    if (!form.email) return;
    await fetch("/api/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setForm({ first_name: "", last_name: "", email: "", company: "", title: "", phone: "", city: "", country: "" });
    setShowAdd(false);
    fetchLeads();
  };

  const importCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    const lines = text.trim().split("\n");
    const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
    const rows = lines.slice(1).map((line) => {
      const values = line.split(",").map((v) => v.trim());
      const row: any = {};
      headers.forEach((h, i) => { row[h] = values[i] || ""; });
      row.source = "csv";
      return row;
    });
    const res = await fetch("/api/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(rows),
    });
    const data = await res.json();
    alert(`Imported ${data.imported} contacts`);
    setShowImport(false);
    fetchLeads();
  };

  const addToCallQueue = async () => {
    if (selected.size === 0) return;
    await fetch("/api/calls", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lead_ids: Array.from(selected) }),
    });
    alert(`Added ${selected.size} lead(s) to call queue`);
    setSelected(new Set());
  };

  const toggleSelect = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const stages = ["", "new", "contacted", "discovery", "proposal", "negotiation", "closed-won", "closed-lost"];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Lead Bank</h1>
          <p className="text-zinc-500 text-sm">{leads.length} contacts</p>
        </div>
        <div className="flex gap-2">
          {selected.size > 0 && (
            <button onClick={addToCallQueue} className="px-3 py-1.5 bg-green-600 hover:bg-green-500 text-sm rounded-lg transition-colors">
              Add {selected.size} to Call Queue
            </button>
          )}
          <button onClick={() => setShowImport(true)} className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-sm rounded-lg transition-colors">
            Import CSV
          </button>
          <button onClick={() => setShowAdd(true)} className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-sm rounded-lg transition-colors">
            Add Contact
          </button>
        </div>
      </div>

      {/* Search + Filters */}
      <div className="flex gap-3 mb-5">
        <input
          type="text"
          placeholder="Search by name, company, or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-sm focus:outline-none focus:border-zinc-600"
        />
        <select
          value={stageFilter}
          onChange={(e) => setStageFilter(e.target.value)}
          className="px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-sm focus:outline-none focus:border-zinc-600"
        >
          <option value="">All stages</option>
          {stages.filter(Boolean).map((s) => (
            <option key={s} value={s}>{s.replace("-", " ").replace(/\b\w/g, (c) => c.toUpperCase())}</option>
          ))}
        </select>
      </div>

      {/* CSV Import Modal */}
      {showImport && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={() => setShowImport(false)}>
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold mb-4">Import CSV</h2>
            <p className="text-zinc-400 text-sm mb-4">
              CSV should have headers: email, first_name, last_name, company, title, phone, city, country
            </p>
            <input ref={fileInputRef} type="file" accept=".csv" onChange={importCSV} className="text-sm" />
            <div className="flex justify-end mt-4">
              <button onClick={() => setShowImport(false)} className="px-3 py-1.5 text-sm text-zinc-400 hover:text-white">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Contact Modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={() => setShowAdd(false)}>
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold mb-4">Add Contact</h2>
            <div className="grid grid-cols-2 gap-3">
              {(["first_name", "last_name", "email", "company", "title", "phone", "city", "country"] as const).map((field) => (
                <input
                  key={field}
                  placeholder={field.replace("_", " ")}
                  value={form[field]}
                  onChange={(e) => setForm({ ...form, [field]: e.target.value })}
                  className="px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm focus:outline-none focus:border-zinc-500"
                />
              ))}
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={() => setShowAdd(false)} className="px-3 py-1.5 text-sm text-zinc-400 hover:text-white">Cancel</button>
              <button onClick={addLead} className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-sm rounded-lg">Save</button>
            </div>
          </div>
        </div>
      )}

      {/* Lead Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {leads.map((lead) => (
          <Link
            key={lead.id}
            href={`/leads/${lead.id}`}
            className={`block border rounded-xl p-4 transition-all hover:border-zinc-600 ${
              selected.has(lead.id) ? "border-blue-500 bg-blue-950/20" : "border-zinc-800 hover:bg-zinc-900/50"
            }`}
          >
            <div className="flex items-start justify-between mb-2">
              <div className="min-w-0">
                <h3 className="font-semibold truncate">{lead.first_name} {lead.last_name}</h3>
                <p className="text-sm text-zinc-400 truncate">{lead.title}{lead.title && lead.company ? " at " : ""}{lead.company}</p>
              </div>
              <div className="flex items-center gap-2 ml-2 shrink-0">
                <span className={`text-xs px-2 py-0.5 rounded-full ${stageColors[lead.pipeline_stage] || stageColors.new}`}>
                  {lead.pipeline_stage.replace("-", " ")}
                </span>
                <input
                  type="checkbox"
                  checked={selected.has(lead.id)}
                  onClick={(e) => toggleSelect(e, lead.id)}
                  onChange={() => {}}
                  className="accent-blue-600"
                />
              </div>
            </div>

            <div className="text-xs text-zinc-500 mb-2">{lead.email}</div>

            {lead.tags && (
              <div className="flex flex-wrap gap-1 mb-2">
                {lead.tags.split(",").map((tag) => (
                  <span key={tag} className="px-1.5 py-0.5 text-xs rounded bg-zinc-800 text-zinc-400">{tag}</span>
                ))}
              </div>
            )}

            {lead.last_activity && (
              <div className="text-xs text-zinc-600 mt-2 truncate">
                {lead.last_activity_desc} · {timeAgo(lead.last_activity)}
              </div>
            )}
          </Link>
        ))}
        {leads.length === 0 && (
          <div className="col-span-full text-center py-12 text-zinc-500 border border-zinc-800 rounded-xl">
            No leads yet. Import a CSV or add contacts manually.
          </div>
        )}
      </div>
    </div>
  );
}
