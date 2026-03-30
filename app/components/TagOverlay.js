"use client";
import { useApp } from "./AppProvider";

export default function TagOverlay() {
  const { tagOverlay } = useApp();
  if (!tagOverlay) return null;

  const { action, lead } = tagOverlay;
  const name = `${lead.first_name || ""} ${lead.last_name || ""}`.trim();

  const config = {
    right: { icon: "check_circle", label: "Called",  bg: "#10B981", text: "#fff" },
    save:  { icon: "bookmark",     label: "Saved",   bg: "#3B82F6", text: "#fff" },
    left:  { icon: "close",        label: "Skipped", bg: "#374151", text: "#F9FAFB" },
  };

  const c = config[action] || config.left;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none">
      <div className="animate-tag-pop px-8 py-6 rounded-2xl shadow-2xl flex flex-col items-center gap-3 editorial-shadow"
        style={{ background: c.bg, color: c.text }}>
        <span className="material-symbols-outlined text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>
          {c.icon}
        </span>
        <span className="font-bold text-lg">{c.label}</span>
        <span className="font-mono-data text-sm opacity-70">{name}</span>
      </div>
    </div>
  );
}
