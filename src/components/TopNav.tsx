"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navLinks = [
  { href: "/", label: "Dashboard" },
  { href: "/leads", label: "Leads" },
  { href: "/pipeline", label: "Pipeline" },
  { href: "/analytics", label: "Analytics" },
];

export function TopNav() {
  const pathname = usePathname();

  return (
    <header className="fixed top-0 w-full z-50 bg-background">
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
                  className={`font-headline tracking-wider uppercase text-sm transition-colors duration-300 ${
                    isActive
                      ? "text-primary font-bold border-b-2 border-primary-container"
                      : "text-on-surface/60 hover:text-primary-container"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative hidden lg:block">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-sm">search</span>
            <input
              type="text"
              placeholder="Search leads..."
              className="pl-10 pr-4 py-2 bg-surface-container-highest border-none rounded-xl text-sm focus:ring-2 focus:ring-primary w-64"
            />
          </div>
          <button className="material-symbols-outlined text-on-surface-variant p-2 hover:bg-surface-container-high rounded-full transition-colors">
            notifications
          </button>
          <button className="material-symbols-outlined text-on-surface-variant p-2 hover:bg-surface-container-high rounded-full transition-colors">
            settings
          </button>
          <div className="h-8 w-8 rounded-full bg-primary-fixed-dim flex items-center justify-center text-on-primary-fixed text-xs font-bold ml-2">
            KD
          </div>
        </div>
      </div>
      <div className="bg-surface-container-low h-[1px] w-full" />
    </header>
  );
}
