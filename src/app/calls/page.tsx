"use client";

import { useState, useEffect, useCallback } from "react";

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
  status: string;
  queued_at: string;
}

const outcomes = [
  { value: "positive", label: "Positive", color: "bg-green-600 hover:bg-green-500", desc: "Interested — add to Positive list" },
  { value: "negative", label: "Not a Fit", color: "bg-red-600 hover:bg-red-500", desc: "Not a fit — add to Negative list" },
  { value: "callback", label: "Call Back Later", color: "bg-yellow-600 hover:bg-yellow-500", desc: "Schedule a callback" },
  { value: "follow-up-email", label: "Follow-Up Email", color: "bg-blue-600 hover:bg-blue-500", desc: "Send to email sequence" },
  { value: "completed", label: "Done", color: "bg-zinc-600 hover:bg-zinc-500", desc: "Completed — no action needed" },
];

export default function CallsPage() {
  const [queue, setQueue] = useState<CallItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [notes, setNotes] = useState("");
  const [processing, setProcessing] = useState(false);
  const [completedCount, setCompletedCount] = useState(0);

  const fetchQueue = useCallback(async () => {
    const res = await fetch("/api/calls?status=pending");
    const data = await res.json();
    setQueue(data);
    setCurrentIndex(0);
    setNotes("");
  }, []);

  useEffect(() => {
    fetchQueue();
  }, [fetchQueue]);

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

    if (currentIndex < queue.length - 1) {
      setCurrentIndex((i) => i + 1);
    } else {
      setQueue([]);
    }
  };

  if (queue.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <div className="text-5xl">📞</div>
        <h1 className="text-2xl font-bold">Call Queue Empty</h1>
        <p className="text-zinc-500">
          {completedCount > 0
            ? `Nice work — ${completedCount} call${completedCount !== 1 ? "s" : ""} completed this session.`
            : "Go to Lead Bank to add contacts to the call queue."
          }
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Progress bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-2xl font-bold">Call Queue</h1>
          <span className="text-sm text-zinc-500">{remaining} remaining · {completedCount} done</span>
        </div>
        <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-600 transition-all duration-300"
            style={{ width: `${(currentIndex / queue.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Current Contact Card */}
      {current && (
        <div className="border border-zinc-800 rounded-xl p-6 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold">
                {current.first_name} {current.last_name}
              </h2>
              <p className="text-zinc-400">{current.title} at {current.company}</p>
            </div>
            <span className="text-xs text-zinc-600 bg-zinc-800 px-2 py-1 rounded">
              #{currentIndex + 1} of {queue.length}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
            {current.phone && (
              <div>
                <span className="text-zinc-500">Phone</span>
                <p className="font-mono">{current.phone}</p>
              </div>
            )}
            {current.email && (
              <div>
                <span className="text-zinc-500">Email</span>
                <p>{current.email}</p>
              </div>
            )}
            {current.city && (
              <div>
                <span className="text-zinc-500">Location</span>
                <p>{current.city}</p>
              </div>
            )}
            {current.tags && (
              <div>
                <span className="text-zinc-500">Tags</span>
                <div className="flex gap-1 mt-1">
                  {current.tags.split(",").map((tag) => (
                    <span key={tag} className="px-2 py-0.5 text-xs rounded-full bg-zinc-800">{tag}</span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Notes */}
          <textarea
            placeholder="Call notes (optional)..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-lg text-sm mb-6 resize-none focus:outline-none focus:border-zinc-600"
            rows={3}
          />

          {/* Outcome Buttons */}
          <div className="space-y-2">
            <p className="text-xs text-zinc-500 uppercase tracking-wider mb-3">How did it go?</p>
            <div className="grid grid-cols-2 gap-2">
              {outcomes.map((o) => (
                <button
                  key={o.value}
                  onClick={() => handleOutcome(o.value)}
                  disabled={processing}
                  className={`${o.color} px-4 py-3 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 text-left`}
                >
                  <div>{o.label}</div>
                  <div className="text-xs opacity-75 mt-0.5">{o.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Skip */}
          <button
            onClick={() => {
              if (currentIndex < queue.length - 1) {
                setCurrentIndex((i) => i + 1);
                setNotes("");
              }
            }}
            className="w-full mt-3 px-4 py-2 text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            Skip for now
          </button>
        </div>
      )}
    </div>
  );
}
