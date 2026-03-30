"use client";
import { useApp } from "./AppProvider";

export default function TickerBar() {
  const { actioned, leads } = useApp();

  const recentActions = actioned.slice(-6).reverse().map((a) => {
    const name = `${a.first_name || ""} ${a.last_name || ""}`.trim();
    const org = a.organization?.name || "";
    if (a.action === "right") return `CALLED · ${name} @ ${org}`;
    if (a.action === "save")  return `SAVED · ${name} @ ${org}`;
    return null;
  }).filter(Boolean);

  const staticItems = [
    `PIPELINE · ${leads.length} leads active`,
    "ENGINE · online",
    "INTEL · ready",
    "STATUS · all systems go",
  ];

  const items = recentActions.length > 0
    ? [...recentActions, ...staticItems]
    : staticItems;

  // Duplicate for seamless loop
  const doubled = [...items, ...items];

  return (
    <div
      className="h-7 flex items-center ticker-mask overflow-hidden whitespace-nowrap md:ml-16"
      style={{ background: "#0F172A", borderBottom: "1px solid rgba(55,65,81,0.4)" }}
    >
      <div className="flex gap-16 items-center animate-ticker px-8">
        {doubled.map((item, i) => (
          <span
            key={i}
            className="flex items-center gap-2 font-mono-data text-[10px] tracking-widest text-gray-600"
          >
            <span className="w-1 h-1 rounded-full bg-blue-500" />
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}
