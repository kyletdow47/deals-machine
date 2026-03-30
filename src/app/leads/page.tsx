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
  pipeline_stage: string;
  lead_score: number;
  tags: string | null;
  last_activity: string | null;
  last_activity_desc: string | null;
}

const stageLabels: Record<string, string> = {
  new: "New", contacted: "Contacted", discovery: "Discovery",
  proposal: "Proposal", negotiation: "Negotiation",
  "closed-won": "Won", "closed-lost": "Lost",
};

const stageStyles: Record<string, string> = {
  new: "bg-secondary-container text-on-secondary-container",
  contacted: "bg-primary/10 text-primary",
  discovery: "bg-primary/20 text-on-primary-container",
  proposal: "bg-primary-fixed text-on-primary-fixed",
  negotiation: "bg-primary-container text-on-primary-container",
  "closed-won": "bg-primary text-on-primary",
  "closed-lost": "bg-error-container text-on-error-container",
};

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr + "Z").getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [showAdd, setShowAdd] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    first_name: "", last_name: "", email: "", company: "",
    title: "", phone: "", city: "", country: "",
  });

  const fetchLeads = useCallback(async () => {
    const p = new URLSearchParams();
    if (search) p.set("search", search);
    if (stageFilter) p.set("stage", stageFilter);
    const res = await fetch(`/api/leads?${p}`);
    setLeads(await res.json());
  }, [search, stageFilter]);

  useEffect(() => { fetchLeads(); }, [fetchLeads]);

  const addLead = async () => {
    if (!form.email) return;
    await fetch("/api/leads", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
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
      const vals = line.split(",").map((v) => v.trim());
      const row: any = {};
      headers.forEach((h, i) => { row[h] = vals[i] || ""; });
      row.source = "csv";
      return row;
    });
    const res = await fetch("/api/leads", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(rows) });
    const data = await res.json();
    alert(`Imported ${data.imported} contacts`);
    setShowImport(false);
    fetchLeads();
  };

  const addToCallQueue = async () => {
    if (selected.size === 0) return;
    await fetch("/api/calls", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ lead_ids: Array.from(selected) }) });
    alert(`Added ${selected.size} lead(s) to call queue`);
    setSelected(new Set());
  };

  const toggleSelect = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    setSelected((prev) => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  };

  const stages = ["", "new", "contacted", "discovery", "proposal", "negotiation", "closed-won", "closed-lost"];

  return (
    <div className="flex flex-col xl:flex-row gap-8">
      {/* Filters Sidebar */}
      <section className="w-full xl:w-72 flex-shrink-0">
        <div className="bg-surface-container-low rounded-xl p-6 sticky top-24">
          <h3 className="font-headline font-extrabold text-on-surface mb-6 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">filter_list</span>
            Filters
          </h3>
          <div className="space-y-6">
            <div>
              <label className="block font-label text-[10px] uppercase tracking-wider text-on-surface-variant/70 mb-2">Search</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-sm">search</span>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Name, company, email..."
                  className="w-full bg-surface-container-lowest border-none rounded-lg pl-10 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 placeholder:text-outline-variant"
                />
              </div>
            </div>
            <div>
              <label className="block font-label text-[10px] uppercase tracking-wider text-on-surface-variant/70 mb-2">Pipeline Stage</label>
              <select
                value={stageFilter}
                onChange={(e) => setStageFilter(e.target.value)}
                className="w-full bg-surface-container-lowest border-none rounded-lg py-2.5 text-sm focus:ring-2 focus:ring-primary/20"
              >
                <option value="">All Stages</option>
                {stages.filter(Boolean).map((s) => (
                  <option key={s} value={s}>{stageLabels[s] || s}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <button onClick={() => setShowImport(true)} className="w-full py-2.5 bg-surface-container-highest rounded-lg font-headline font-bold text-xs uppercase tracking-widest hover:bg-surface-dim transition-colors flex items-center justify-center gap-2">
                <span className="material-symbols-outlined text-sm">upload</span> Import CSV
              </button>
              <button onClick={() => setShowAdd(true)} className="w-full py-2.5 bg-on-surface text-surface rounded-lg font-headline font-bold text-xs uppercase tracking-widest hover:opacity-90 transition-opacity flex items-center justify-center gap-2">
                <span className="material-symbols-outlined text-sm">add</span> Add Contact
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="flex-grow">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <span className="text-primary font-label font-bold uppercase tracking-[0.2em] text-[10px]">Contact Database</span>
            <h1 className="text-3xl font-headline font-extrabold text-on-surface tracking-tight">Lead Bank</h1>
            <p className="text-on-surface-variant/80">Managing <span className="font-bold text-primary">{leads.length}</span> prospects</p>
          </div>
          {selected.size > 0 && (
            <button onClick={addToCallQueue} className="metallic-silk text-white px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-primary/20">
              <span className="material-symbols-outlined text-sm">call</span>
              Add {selected.size} to Call Queue
            </button>
          )}
        </div>

        {/* Table */}
        <div className="bg-surface-container-highest rounded-2xl overflow-hidden editorial-shadow border border-outline-variant/10">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-low/50">
                  <th className="px-6 py-4 w-10">
                    <input type="checkbox" checked={selected.size === leads.length && leads.length > 0} onChange={() => {
                      if (selected.size === leads.length) setSelected(new Set());
                      else setSelected(new Set(leads.map((l) => l.id)));
                    }} className="accent-primary" />
                  </th>
                  <th className="px-6 py-4 font-label text-[10px] uppercase tracking-widest text-on-surface-variant/70">Contact</th>
                  <th className="px-6 py-4 font-label text-[10px] uppercase tracking-widest text-on-surface-variant/70">Stage</th>
                  <th className="px-6 py-4 font-label text-[10px] uppercase tracking-widest text-on-surface-variant/70">Tags</th>
                  <th className="px-6 py-4 font-label text-[10px] uppercase tracking-widest text-on-surface-variant/70">Last Activity</th>
                  <th className="px-6 py-4 font-label text-[10px] uppercase tracking-widest text-on-surface-variant/70">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/10">
                {leads.map((lead) => {
                  const initials = `${lead.first_name?.[0] || ""}${lead.last_name?.[0] || ""}`.toUpperCase();
                  return (
                    <tr key={lead.id} className="hover:bg-surface-container-low transition-colors group">
                      <td className="px-6 py-5">
                        <input type="checkbox" checked={selected.has(lead.id)} onClick={(e) => toggleSelect(e, lead.id)} onChange={() => {}} className="accent-primary" />
                      </td>
                      <td className="px-6 py-5">
                        <Link href={`/leads/${lead.id}`} className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-lg bg-primary-fixed flex items-center justify-center text-primary font-bold text-sm">{initials}</div>
                          <div>
                            <div className="font-headline font-bold text-on-surface">{lead.first_name} {lead.last_name}</div>
                            <div className="text-xs text-on-surface-variant">{lead.title}{lead.title && lead.company ? " at " : ""}{lead.company}</div>
                          </div>
                        </Link>
                      </td>
                      <td className="px-6 py-5">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-tighter ${stageStyles[lead.pipeline_stage] || stageStyles.new}`}>
                          {stageLabels[lead.pipeline_stage] || lead.pipeline_stage}
                        </span>
                      </td>
                      <td className="px-6 py-5">
                        {lead.tags && lead.tags.split(",").slice(0, 2).map((tag) => (
                          <span key={tag} className="inline-block px-2 py-0.5 mr-1 text-[10px] rounded-full bg-secondary-container text-on-secondary-container font-bold uppercase">{tag}</span>
                        ))}
                      </td>
                      <td className="px-6 py-5">
                        {lead.last_activity_desc ? (
                          <div>
                            <div className="text-sm font-medium text-on-surface truncate max-w-[150px]">{lead.last_activity_desc}</div>
                            <div className="text-[10px] text-on-surface-variant">{timeAgo(lead.last_activity)}</div>
                          </div>
                        ) : (
                          <span className="text-[10px] text-outline">No activity</span>
                        )}
                      </td>
                      <td className="px-6 py-5">
                        <Link href={`/leads/${lead.id}`} className="bg-primary-container text-on-primary-container hover:bg-primary-container/90 px-4 py-2 rounded-xl font-headline font-bold text-xs flex items-center gap-2 transition-all transform group-hover:scale-105 active:scale-95 shadow-sm w-fit">
                          <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>visibility</span> View
                        </Link>
                      </td>
                    </tr>
                  );
                })}
                {leads.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-16 text-center">
                      <span className="material-symbols-outlined text-5xl text-outline-variant mb-4 block">group</span>
                      <p className="text-on-surface-variant font-medium">No leads yet</p>
                      <p className="text-outline text-sm">Import a CSV or add contacts manually</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Bento Insights */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-surface-container-low p-6 rounded-2xl flex flex-col justify-between min-h-[140px]">
            <span className="material-symbols-outlined text-primary text-2xl">trending_up</span>
            <div>
              <div className="text-xl font-headline font-extrabold text-on-surface">{leads.length}</div>
              <div className="text-[10px] uppercase tracking-widest font-bold text-on-surface-variant/70">Total in Bank</div>
            </div>
          </div>
          <div className="bg-surface-container-low p-6 rounded-2xl flex flex-col justify-between min-h-[140px] relative overflow-hidden">
            <span className="material-symbols-outlined text-primary text-2xl">bolt</span>
            <div>
              <div className="text-xl font-headline font-extrabold text-on-surface">{leads.filter((l) => l.pipeline_stage !== "new").length}</div>
              <div className="text-[10px] uppercase tracking-widest font-bold text-on-surface-variant/70">In Pipeline</div>
            </div>
            <div className="absolute -bottom-6 -right-6 w-20 h-20 rounded-full bg-primary/5" />
          </div>
          <div className="bg-primary text-on-primary p-6 rounded-2xl flex flex-col justify-between min-h-[140px]">
            <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>emoji_events</span>
            <div>
              <div className="text-lg font-headline font-extrabold">Next Step</div>
              <div className="text-xs opacity-80 mt-1">Add leads to call queue and start dialing</div>
            </div>
          </div>
        </div>
      </section>

      {/* Add Contact Modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setShowAdd(false)}>
          <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-2xl p-8 w-full max-w-md shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-headline font-extrabold mb-6">Add Contact</h2>
            <div className="grid grid-cols-2 gap-3">
              {(["first_name", "last_name", "email", "company", "title", "phone", "city", "country"] as const).map((field) => (
                <input
                  key={field}
                  placeholder={field.replace("_", " ")}
                  value={form[field]}
                  onChange={(e) => setForm({ ...form, [field]: e.target.value })}
                  className="px-3 py-2.5 bg-surface-container-highest border-none rounded-lg text-sm focus:ring-2 focus:ring-primary/20 placeholder:text-outline-variant capitalize"
                />
              ))}
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowAdd(false)} className="px-4 py-2 text-sm text-on-surface-variant hover:text-on-surface font-medium">Cancel</button>
              <button onClick={addLead} className="px-6 py-2.5 metallic-silk text-white rounded-xl text-sm font-bold shadow-lg">Save Contact</button>
            </div>
          </div>
        </div>
      )}

      {/* Import Modal */}
      {showImport && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setShowImport(false)}>
          <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-2xl p-8 w-full max-w-md shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-headline font-extrabold mb-4">Import CSV</h2>
            <p className="text-on-surface-variant text-sm mb-6">Headers: email, first_name, last_name, company, title, phone, city, country</p>
            <input ref={fileRef} type="file" accept=".csv" onChange={importCSV} className="text-sm" />
            <div className="flex justify-end mt-6">
              <button onClick={() => setShowImport(false)} className="px-4 py-2 text-sm text-on-surface-variant hover:text-on-surface font-medium">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
