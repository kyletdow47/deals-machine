"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

interface CallItem {
  id: string;
  lead_id: string;
  first_name: string;
  last_name: string;
  company: string;
  title: string;
  phone: string;
  email: string;
  city: string;
  tags: string | null;
}

const outcomes = [
  { value: "positive", label: "Interested", icon: "thumb_up", color: "bg-primary text-on-primary", desc: "Add to Positive list" },
  { value: "negative", label: "Not a Fit", icon: "thumb_down", color: "bg-error text-on-error", desc: "Add to Negative list" },
  { value: "callback", label: "Call Back", icon: "schedule", color: "bg-primary-container text-on-primary-container", desc: "Schedule follow-up" },
  { value: "follow-up-email", label: "Email Follow-Up", icon: "forward_to_inbox", color: "bg-secondary text-on-secondary", desc: "Send to email sequence" },
  { value: "completed", label: "Done", icon: "check_circle", color: "bg-outline text-on-primary", desc: "No action needed" },
];

export default function DialerPage() {
  const [queue, setQueue] = useState<CallItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [notes, setNotes] = useState("");
  const [processing, setProcessing] = useState(false);
  const [completedCount, setCompletedCount] = useState(0);

  const fetchQueue = useCallback(async () => {
    const res = await fetch("/api/calls?status=pending");
    setQueue(await res.json());
    setCurrentIndex(0);
    setNotes("");
  }, []);

  useEffect(() => { fetchQueue(); }, [fetchQueue]);

  const current = queue[currentIndex];
  const remaining = queue.length - currentIndex;

  const handleOutcome = async (outcome: string) => {
    if (!current || processing) return;
    setProcessing(true);
    await fetch(`/api/calls/${current.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ outcome, notes }),
    });
    setCompletedCount((c) => c + 1);
    setNotes("");
    setProcessing(false);
    if (currentIndex < queue.length - 1) setCurrentIndex((i) => i + 1);
    else setQueue([]);
  };

  if (queue.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-6">
        <span className="material-symbols-outlined text-7xl text-outline-variant">call</span>
        <h1 className="text-3xl font-headline font-extrabold">Call Queue Empty</h1>
        <p className="text-on-surface-variant max-w-md text-center">
          {completedCount > 0
            ? `Great session — ${completedCount} call${completedCount !== 1 ? "s" : ""} completed.`
            : "Go to Lead Bank to add contacts to the call queue."
          }
        </p>
        <Link href="/leads" className="metallic-silk text-white px-8 py-3 rounded-xl font-bold text-sm shadow-xl">
          Open Lead Bank
        </Link>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <header className="mb-8 flex justify-between items-end">
        <div>
          <span className="text-primary font-label font-bold uppercase tracking-[0.2em] text-[10px]">Active Session</span>
          <h2 className="font-headline text-3xl font-extrabold text-on-surface tracking-tight">Dialer</h2>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-xs text-on-surface-variant">{remaining} remaining · {completedCount} done</span>
          </div>
        </div>
        {/* Progress */}
        <div className="w-48">
          <div className="w-full bg-surface-container-highest h-1.5 rounded-full overflow-hidden">
            <div className="bg-primary h-full rounded-full transition-all" style={{ width: `${queue.length > 0 ? (currentIndex / queue.length) * 100 : 0}%` }} />
          </div>
        </div>
      </header>

      {current && (
        <div className="grid grid-cols-12 gap-8">
          {/* Left: Lead Profile */}
          <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">
            <section className="bg-surface-container-highest p-8 rounded-xl shadow-sm border border-outline-variant/5">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <p className="font-label text-[10px] uppercase tracking-[0.2em] text-primary mb-1">Lead Contact</p>
                  <h3 className="font-headline text-2xl font-bold text-on-background">{current.first_name} {current.last_name}</h3>
                  <p className="text-on-surface-variant text-sm">{current.title}{current.title && current.company ? " at " : ""}{current.company}</p>
                </div>
                <span className="text-[10px] bg-surface-container-low px-2 py-1 rounded text-outline font-bold">
                  #{currentIndex + 1} / {queue.length}
                </span>
              </div>
              <div className="space-y-5">
                {current.phone && (
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-surface-container-low flex items-center justify-center text-primary">
                      <span className="material-symbols-outlined">call</span>
                    </div>
                    <div>
                      <p className="text-[10px] font-label uppercase text-on-surface-variant">Phone</p>
                      <p className="text-sm font-mono font-medium">{current.phone}</p>
                    </div>
                  </div>
                )}
                {current.email && (
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-surface-container-low flex items-center justify-center text-primary">
                      <span className="material-symbols-outlined">mail</span>
                    </div>
                    <div>
                      <p className="text-[10px] font-label uppercase text-on-surface-variant">Email</p>
                      <p className="text-sm font-medium">{current.email}</p>
                    </div>
                  </div>
                )}
                {current.city && (
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-surface-container-low flex items-center justify-center text-primary">
                      <span className="material-symbols-outlined">location_on</span>
                    </div>
                    <div>
                      <p className="text-[10px] font-label uppercase text-on-surface-variant">Location</p>
                      <p className="text-sm font-medium">{current.city}</p>
                    </div>
                  </div>
                )}
              </div>
              {current.tags && (
                <div className="mt-6 pt-4 border-t border-outline-variant/20 flex flex-wrap gap-1">
                  {current.tags.split(",").map((tag) => (
                    <span key={tag} className="px-2 py-0.5 text-[10px] rounded-full bg-secondary-container text-on-secondary-container font-bold uppercase">{tag}</span>
                  ))}
                </div>
              )}
            </section>

            <Link href={`/leads/${current.lead_id}`} className="text-center text-xs font-bold text-primary hover:text-primary-container transition-colors">
              View Full Profile &rarr;
            </Link>
          </div>

          {/* Center: Notes */}
          <div className="col-span-12 lg:col-span-4 space-y-6">
            <div className="bg-surface-container-highest p-8 rounded-xl min-h-[300px] flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-headline font-bold text-lg">Call Notes</h4>
              </div>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Type insights from the conversation..."
                className="flex-1 bg-surface-container-lowest border-none focus:ring-2 focus:ring-primary-container rounded-xl p-4 text-sm font-body leading-relaxed text-on-surface resize-none shadow-inner"
                rows={8}
              />
            </div>

            {/* Script Tips */}
            <div className="bg-surface-container-low p-6 rounded-xl">
              <div className="flex items-center gap-3 mb-4">
                <span className="material-symbols-outlined text-primary">tips_and_updates</span>
                <h5 className="font-label font-bold text-xs uppercase tracking-widest">Script Tips</h5>
              </div>
              <ul className="text-xs text-on-surface-variant space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-primary font-bold">1.</span>
                  Open with a specific pain point for their industry
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary font-bold">2.</span>
                  Mention the ROI anchor: one charter pays for the system
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary font-bold">3.</span>
                  Ask about their current lead generation process
                </li>
              </ul>
            </div>
          </div>

          {/* Right: Outcomes */}
          <div className="col-span-12 lg:col-span-4 space-y-6">
            <div className="bg-surface-container-highest p-6 rounded-xl">
              <p className="text-[10px] font-bold uppercase tracking-widest text-outline mb-4">How did it go?</p>
              <div className="space-y-3">
                {outcomes.map((o) => (
                  <button
                    key={o.value}
                    onClick={() => handleOutcome(o.value)}
                    disabled={processing}
                    className={`${o.color} w-full px-5 py-4 rounded-xl text-left font-medium transition-all disabled:opacity-50 hover:scale-[1.01] active:scale-[0.99] shadow-sm`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>{o.icon}</span>
                      <div>
                        <div className="font-bold text-sm">{o.label}</div>
                        <div className="text-[10px] opacity-75">{o.desc}</div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => {
                if (currentIndex < queue.length - 1) { setCurrentIndex((i) => i + 1); setNotes(""); }
              }}
              className="w-full px-4 py-3 text-sm text-outline hover:text-on-surface transition-colors rounded-xl border border-outline-variant/20 hover:bg-surface-container-low text-center font-medium"
            >
              Skip for now
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
