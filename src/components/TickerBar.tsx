"use client";

import { useState, useEffect } from "react";

export function TickerBar() {
  const [activities, setActivities] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/activity?limit=5")
      .then((r) => r.json())
      .then(setActivities)
      .catch(() => {});
  }, []);

  const items = activities.length > 0
    ? activities.map((a) => `${a.first_name} ${a.last_name}: ${a.description}`)
    : [
        "System ready — import leads to get started",
        "Deals Machine v2 — AI-powered lead gen for aviation brokers",
        "Add contacts to the Lead Bank to begin building your pipeline",
      ];

  // Duplicate for seamless infinite scroll
  const doubled = [...items, ...items];

  return (
    <div className="w-full h-8 bg-surface-container-lowest flex items-center overflow-hidden ticker-mask border-b border-outline-variant/10">
      <div className="whitespace-nowrap flex items-center gap-12 px-8 animate-ticker">
        {doubled.map((item, i) => (
          <span key={i} className="text-[10px] font-headline uppercase tracking-widest text-tertiary flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-primary-container flex-shrink-0" />
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}
