"use client";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { useApp } from "./AppProvider";

const TABS = [
  { href: "/",          label: "Dashboard" },
  { href: "/leads",     label: "Leads"     },
  { href: "/dialer",    label: "Dialer"    },
  { href: "/analytics", label: "Analytics" },
];

export default function TopNav() {
  const pathname = usePathname();
  const { searchQuery, setSearchQuery } = useApp();

  return (
    <header
      className="fixed top-0 w-full z-50 topnav-glow"
      style={{ background: "#111827" }}
    >
      <div className="flex items-center justify-between px-6 h-14 md:pl-20">
        {/* Left: Logo on mobile + tabs on desktop */}
        <div className="flex items-center gap-8">
          <span className="text-white font-bold text-base md:hidden tracking-tight">
            Deals Machine
          </span>
          <nav className="hidden md:flex gap-1">
            {TABS.map((tab) => (
              <Link
                key={tab.href}
                href={tab.href}
                className={`relative px-3 py-2 text-xs font-semibold uppercase tracking-widest transition-colors duration-200 ${
                  pathname === tab.href
                    ? "text-white"
                    : "text-gray-500 hover:text-gray-300"
                }`}
              >
                {tab.label}
                {pathname === tab.href && (
                  <span
                    className="absolute bottom-0 left-3 right-3 h-0.5 rounded-full bg-blue-500"
                  />
                )}
              </Link>
            ))}
          </nav>
        </div>

        {/* Right: Search + Actions */}
        <div className="flex items-center gap-3">
          <div className="relative hidden lg:block">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
              search
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search leads..."
              className="pl-9 pr-4 py-1.5 rounded-lg text-sm text-gray-200 placeholder:text-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-500 w-52 font-mono-data"
              style={{ background: "#1F2937", border: "1px solid #374151" }}
            />
          </div>

          <button className="relative p-2 rounded-lg hover:bg-gray-800 transition-colors">
            <span className="material-symbols-outlined text-gray-400 text-xl">notifications</span>
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-blue-500 rounded-full" />
          </button>

          <Link href="/settings" className="p-2 rounded-lg hover:bg-gray-800 transition-colors">
            <span className="material-symbols-outlined text-gray-400 text-xl">settings</span>
          </Link>

          <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-xs">
            K
          </div>
        </div>
      </div>
    </header>
  );
}
