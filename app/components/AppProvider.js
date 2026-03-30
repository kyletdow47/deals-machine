"use client";
import { createContext, useContext, useState, useCallback, useEffect } from "react";

const AppContext = createContext(null);

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}

const PASSWORD = "dealsplease";

// ── localStorage helpers ────────────────────────────────────
function loadLocal(key, fallback) {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(`dm_${key}`);
    return raw ? JSON.parse(raw) : fallback;
  } catch { return fallback; }
}
function saveLocal(key, value) {
  if (typeof window === "undefined") return;
  try { localStorage.setItem(`dm_${key}`, JSON.stringify(value)); } catch {}
}

const VERTICALS = [
  { id: "energy_oil_gas", label: "Energy / Oil & Gas", icon: "local_gas_station", color: "#ba1a1a" },
  { id: "dangerous_goods", label: "Dangerous Goods", icon: "warning", color: "#E8943A" },
  { id: "automotive_aog", label: "Automotive / AOG", icon: "build", color: "#4A9FD9" },
  { id: "pharma_cold_chain", label: "Pharma / Cold Chain", icon: "medication", color: "#3ECF7A" },
  { id: "perishables_food", label: "Perishables / Food", icon: "nutrition", color: "#3ECF7A" },
  { id: "humanitarian", label: "Humanitarian / Aid", icon: "health_and_safety", color: "#ba1a1a" },
  { id: "general_air_freight", label: "General Air Freight", icon: "flight", color: "#3B82F6" },
];

const MODES = [
  { id: "normal", label: "Freight", icon: "inventory_2", desc: "Freight forwarder verticals" },
  { id: "political", label: "Political", icon: "public", desc: "Crisis-driven leads" },
  { id: "private_jets", label: "Private Jets", icon: "flight", desc: "Operator ICP" },
];

export function AppProvider({ children }) {
  const [authed, setAuthed] = useState(false);
  const [mode, setMode] = useState("normal");
  const [vertical, setVertical] = useState("energy_oil_gas");
  const [leads, setLeads] = useState([]);
  const [scripts, setScripts] = useState({});
  const [currentIdx, setCurrentIdx] = useState(0);
  const [actioned, setActioned] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingScripts, setLoadingScripts] = useState(false);
  const [error, setError] = useState(null);
  const [intel, setIntel] = useState(null);
  const [page, setPage] = useState(1);
  const [selectedLead, setSelectedLead] = useState(null);
  const [callNotes, setCallNotes] = useState("");
  const [callTags, setCallTags] = useState([]);
  const [tagOverlay, setTagOverlay] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [hydrated, setHydrated] = useState(false);

  // ── Hydrate from localStorage on mount ──────────────────
  useEffect(() => {
    const savedLeads = loadLocal("leads", []);
    const savedScripts = loadLocal("scripts", {});
    const savedActioned = loadLocal("actioned", []);
    const savedIntel = loadLocal("intel", null);
    if (savedLeads.length > 0) setLeads(savedLeads);
    if (Object.keys(savedScripts).length > 0) setScripts(savedScripts);
    if (savedActioned.length > 0) setActioned(savedActioned);
    if (savedIntel) setIntel(savedIntel);
    setHydrated(true);
  }, []);

  // ── Persist to localStorage on change ───────────────────
  useEffect(() => { if (hydrated) saveLocal("leads", leads); }, [leads, hydrated]);
  useEffect(() => { if (hydrated) saveLocal("scripts", scripts); }, [scripts, hydrated]);
  useEffect(() => { if (hydrated) saveLocal("actioned", actioned); }, [actioned, hydrated]);
  useEffect(() => { if (hydrated && intel) saveLocal("intel", intel); }, [intel, hydrated]);

  // Login
  const login = (pw) => {
    if (pw === PASSWORD) { setAuthed(true); return true; }
    return false;
  };

  // Generate scripts via Claude
  const generateScripts = async (leadsToScript, currentMode) => {
    setLoadingScripts(true);
    try {
      const res = await fetch("/api/intelligence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "generate_scripts", leads: leadsToScript.slice(0, 20), mode: currentMode }),
      });
      const data = await res.json();
      if (data.scripts) {
        const map = {};
        data.scripts.forEach((s, i) => { if (leadsToScript[i]) map[leadsToScript[i].id] = s; });
        setScripts(prev => ({ ...prev, ...map }));
      }
    } catch (e) {
      console.error("Script generation failed:", e);
    }
    setLoadingScripts(false);
  };

  // Fetch leads from Apollo
  const fetchLeads = useCallback(async (newMode, newVertical, newPage) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: newMode || mode,
          vertical: newVertical || vertical,
          page: newPage || page,
          ...(newMode === "political" && intel?.consequence_chains?.[0]?.apollo_search
            ? { customSearch: intel.consequence_chains[0].apollo_search }
            : {}),
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      const newLeads = data.people || [];
      if (newPage > 1) {
        setLeads(prev => [...prev, ...newLeads]);
      } else {
        setLeads(newLeads);
        setCurrentIdx(0);
        setActioned([]);
      }
      setPage(newPage || 1);
      if (newLeads.length > 0) {
        generateScripts(newLeads, newMode || mode);
      }
    } catch (e) {
      setError(e.message);
    }
    setLoading(false);
  }, [mode, vertical, page, intel]);

  // Political mode intelligence scan
  const runPoliticalScan = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/intelligence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "political_scan" }),
      });
      const data = await res.json();
      if (data.intelligence) {
        setIntel(data.intelligence);
        const chain = data.intelligence.consequence_chains?.[0];
        if (chain?.apollo_search) {
          const leadsRes = await fetch("/api/leads", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ mode: "political", customSearch: chain.apollo_search, page: 1 }),
          });
          const leadsData = await leadsRes.json();
          setLeads(leadsData.people || []);
          setCurrentIdx(0);
          setActioned([]);
          if (leadsData.people?.length) generateScripts(leadsData.people, "political");
        }
      }
    } catch (e) {
      setError(e.message);
    }
    setLoading(false);
  };

  // Handle mode change
  const handleModeChange = (newMode) => {
    setMode(newMode);
    setLeads([]);
    setScripts({});
    setCurrentIdx(0);
    setActioned([]);
    setIntel(null);
    setPage(1);
  };

  // Handle lead action (skip/save/called)
  const handleAction = (dir, lead, script) => {
    const action = { ...lead, script, action: dir, ts: new Date().toISOString() };
    setActioned(prev => [...prev, action]);
    // Show tag overlay briefly
    setTagOverlay({ action: dir, lead });
    setTimeout(() => setTagOverlay(null), 1500);
    setTimeout(() => setCurrentIdx(prev => prev + 1), 50);
  };

  // Select lead for dialer
  const selectLeadForDialer = (lead) => {
    setSelectedLead(lead);
    setCallNotes("");
    setCallTags([]);
  };

  // Tag a call
  const toggleCallTag = (tag) => {
    setCallTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
  };

  // Complete call with tags
  const completeCall = () => {
    if (selectedLead) {
      const action = {
        ...selectedLead,
        script: scripts[selectedLead.id],
        action: "right",
        ts: new Date().toISOString(),
        notes: callNotes,
        tags: callTags,
      };
      setActioned(prev => [...prev, action]);
      setTagOverlay({ action: "right", lead: selectedLead });
      setTimeout(() => setTagOverlay(null), 1500);
      setSelectedLead(null);
      setCallNotes("");
      setCallTags([]);
    }
  };

  // Load more leads
  const loadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchLeads(mode, vertical, nextPage);
  };

  // Computed values
  const savedLeads = actioned.filter(a => a.action === "save");
  const calledLeads = actioned.filter(a => a.action === "right");
  const skippedLeads = actioned.filter(a => a.action === "left");
  const currentLead = leads[currentIdx];
  const remaining = Math.max(0, leads.length - currentIdx);
  const allDone = currentIdx >= leads.length && leads.length > 0;

  // Filtered leads for search
  const filteredLeads = searchQuery
    ? leads.filter(l => {
        const q = searchQuery.toLowerCase();
        return (
          (l.first_name || "").toLowerCase().includes(q) ||
          (l.last_name || "").toLowerCase().includes(q) ||
          (l.organization?.name || "").toLowerCase().includes(q) ||
          (l.title || "").toLowerCase().includes(q)
        );
      })
    : leads;

  const value = {
    // Auth
    authed, login,
    // Data
    mode, vertical, leads, scripts, currentIdx, actioned, loading, loadingScripts,
    error, intel, page, selectedLead, callNotes, callTags, tagOverlay, searchQuery,
    // Computed
    savedLeads, calledLeads, skippedLeads, currentLead, remaining, allDone, filteredLeads,
    // Constants
    VERTICALS, MODES,
    // Actions
    setMode, setVertical, setError, setSearchQuery,
    handleModeChange, fetchLeads, runPoliticalScan, generateScripts,
    handleAction, loadMore,
    selectLeadForDialer, setSelectedLead, setCallNotes, toggleCallTag, completeCall,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
