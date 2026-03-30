"use client";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { useApp } from "./AppProvider";

const NAV_ITEMS = [
  { href: "/",          label: "Dashboard", icon: "dashboard" },
  { href: "/leads",     label: "Lead Bank",  icon: "group"     },
  { href: "/dialer",    label: "Dialer",     icon: "call"      },
  { href: "/analytics", label: "Analytics",  icon: "insights"  },
  { href: "/settings",  label: "Settings",   icon: "settings"  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { leads } = useApp();

  return (
    <aside className="hidden md:flex group flex-col h-screen w-16 hover:w-60 fixed left-0 top-0 z-40 transition-all duration-200 ease-in-out overflow-hidden"
      style={{ background: "#0F172A", borderRight: "1px solid rgba(55,65,81,0.5)" }}>

      {/* Brand */}
      <div className="px-4 py-5 flex items-center gap-3 min-w-[240px]">
        <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shrink-0">
          <span className="material-symbols-outlined text-white text-sm">bolt</span>
        </div>
        <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-150 whitespace-nowrap">
          <p className="text-white font-bold text-sm leading-tight">Deals Machine</p>
          <p className="text-[10px] font-mono-data text-blue-400 uppercase tracking-widest">v2.0</p>
        </div>
      </div>

      {/* Divider */}
      <div className="mx-3 mb-4" style={{ height: "1px", background: "rgba(55,65,81,0.5)" }} />

      {/* Nav */}
      <nav className="flex-1 flex flex-col gap-1 px-2">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              title={item.label}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm transition-all duration-150 whitespace-nowrap min-w-0 ${
                isActive
                  ? "bg-blue-600/20 text-blue-400"
                  : "text-gray-400 hover:bg-gray-800 hover:text-gray-100"
              }`}
              style={isActive ? { borderLeft: "2px solid #3B82F6" } : { borderLeft: "2px solid transparent" }}
            >
              <span
                className="material-symbols-outlined text-xl shrink-0"
                style={isActive ? { fontVariationSettings: "'FILL' 1" } : {}}
              >
                {item.icon}
              </span>
              <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-150 flex items-center gap-2 flex-1 min-w-0">
                {item.label}
                {item.href === "/leads" && leads.length > 0 && (
                  <span className="ml-auto text-[10px] font-mono-data bg-blue-600/20 text-blue-400 px-1.5 py-0.5 rounded-md">
                    {leads.length}
                  </span>
                )}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="px-2 pb-5 mt-auto flex flex-col gap-2">
        <div className="mx-1 mb-2" style={{ height: "1px", background: "rgba(55,65,81,0.5)" }} />
        <div className="flex items-center gap-3 px-3 py-2.5 whitespace-nowrap">
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-xs shrink-0">
            K
          </div>
          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-150">
            <p className="text-gray-200 text-sm font-medium">Kyle Dow</p>
            <p className="text-[10px] font-mono-data text-gray-500">On-set Producer</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
