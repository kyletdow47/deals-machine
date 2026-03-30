"use client";
import { useState } from "react";
import { useApp } from "./AppProvider";

export default function AuthGate({ children }) {
  const { authed, login } = useApp();
  const [pw, setPw] = useState("");
  const [err, setErr] = useState(false);

  if (authed) return children;

  const attempt = () => {
    if (!login(pw)) setErr(true);
  };

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "#111827" }}>
      <div className="text-center animate-fade-up w-full max-w-sm px-6">

        {/* Logo mark */}
        <div className="flex justify-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-blue-600 flex items-center justify-center shadow-lg"
            style={{ boxShadow: "0 0 40px rgba(59,130,246,0.3)" }}>
            <span className="material-symbols-outlined text-white text-2xl"
              style={{ fontVariationSettings: "'FILL' 1" }}>bolt</span>
          </div>
        </div>

        {/* Title */}
        <p className="font-mono-data text-[10px] uppercase tracking-[0.25em] text-gray-600 mb-3">
          Sales Intelligence Platform
        </p>
        <h1 className="text-3xl font-bold text-white mb-1 tracking-tight">
          Deals Machine
        </h1>
        <p className="text-sm text-gray-500 font-mono-data mb-10">
          {greeting} · {new Date().toLocaleDateString("en-GB", {
            weekday: "short", day: "numeric", month: "short"
          })}
        </p>

        {/* Input */}
        <div className="flex rounded-xl overflow-hidden"
          style={{ border: `1px solid ${err ? "#EF4444" : "#374151"}` }}>
          <input
            type="password"
            value={pw}
            onChange={(e) => { setPw(e.target.value); setErr(false); }}
            onKeyDown={(e) => e.key === "Enter" && attempt()}
            placeholder="Access code"
            className="flex-1 px-4 py-3 text-sm text-gray-200 placeholder:text-gray-600 outline-none font-mono-data"
            style={{ background: "#1F2937" }}
          />
          <button
            onClick={attempt}
            className="px-5 py-3 metallic-silk text-white font-bold text-xs uppercase tracking-widest hover:opacity-90 transition-opacity"
          >
            Enter
          </button>
        </div>

        {err && (
          <p className="mt-3 text-xs font-mono-data text-red-400">
            · invalid access code ·
          </p>
        )}

        {/* Status */}
        <div className="mt-12 flex items-center justify-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
          <span className="font-mono-data text-[10px] uppercase tracking-widest text-gray-600">
            Engine Active
          </span>
        </div>
      </div>
    </div>
  );
}
