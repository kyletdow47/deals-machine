"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

const navLinks = [
  { href: "/", label: "Dashboard" },
  { href: "/leads", label: "Leads" },
  { href: "/pipeline", label: "Pipeline" },
  { href: "/analytics", label: "Analytics" },
];

export function TopNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [search, setSearch] = useState("");

  const handleSearch = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && search.trim()) {
      router.push(`/leads?search=${encodeURIComponent(search.trim())}`);
    }
  };

  return (
    <header className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-xl">
      <div className="flex items-center justify-between px-8 h-16 w-full">
        <div className="flex items-center gap-8">
          <Link href="/" className="text-xl font-bold text-on-surface tracking-tight font-headline">
            Deals Machine
          </Link>
          <div className="hidden md:flex gap-6">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`font-headline tracking-wider uppercase text-xs transition-colors duration-300 ${
                    isActive
                      ? "text-primary font-bold border-b-2 border-primary-container pb-0.5"
                      : "text-on-surface/50 hover:text-primary-container"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative hidden lg:block">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-sm">search</span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={handleSearch}
              placeholder="Search leads..."
              className="pl-10 pr-4 py-2 bg-surface-container-highest/80 border-none rounded-xl text-sm focus:ring-2 focus:ring-primary/30 w-56 placeholder:text-outline-variant transition-all focus:w-72"
            />
          </div>
          <button className="relative material-symbols-outlined text-on-surface-variant p-2 hover:bg-surface-container-high rounded-full transition-colors">
            notifications
          </button>
          <Link href="/settings" className="material-symbols-outlined text-on-surface-variant p-2 hover:bg-surface-container-high rounded-full transition-colors">
            settings
          </Link>
          <div className="h-9 w-9 rounded-full bg-primary-fixed-dim flex items-center justify-center text-on-primary-fixed text-xs font-bold ml-1 ring-2 ring-primary/20">
            KD
          </div>
        </div>
      </div>
      <div className="bg-outline-variant/20 h-[1px] w-full" />
    </header>
  );
}
