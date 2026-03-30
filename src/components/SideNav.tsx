"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/", icon: "dashboard", label: "Dashboard" },
  { href: "/leads", icon: "group", label: "Lead Bank" },
  { href: "/calls", icon: "call", label: "Dialer" },
  { href: "/pipeline", icon: "view_kanban", label: "Pipeline" },
  { href: "/lists", icon: "list_alt", label: "Lists" },
  { href: "/sequences", icon: "forward_to_inbox", label: "Sequences" },
  { href: "/analytics", icon: "insights", label: "Analytics" },
  { href: "/settings", icon: "settings", label: "Settings" },
];

export function SideNav() {
  const pathname = usePathname();

  return (
    <aside className="h-screen w-64 fixed left-0 top-0 bg-surface-container-low hidden md:flex flex-col py-8 gap-2 z-40 pt-24">
      <div className="px-6 mb-8">
        <h2 className="font-black text-on-surface text-xl font-headline">Deals Machine</h2>
        <p className="text-xs font-headline uppercase tracking-widest text-primary">Aviation Lead Gen</p>
      </div>

      <nav className="flex flex-col gap-1 flex-grow">
        {navItems.map((item) => {
          const isActive = pathname === item.href ||
            (item.href !== "/" && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-6 py-3 font-headline font-medium text-sm tracking-wide transition-all duration-200 ${
                isActive
                  ? "bg-surface-container-highest text-primary rounded-r-full font-bold"
                  : "text-on-surface/70 hover:bg-surface-container-high/50"
              }`}
            >
              <span
                className="material-symbols-outlined"
                style={isActive ? { fontVariationSettings: "'FILL' 1" } : undefined}
              >
                {item.icon}
              </span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto px-6 flex flex-col gap-4">
        <button className="metallic-silk text-white py-3 rounded-xl font-bold text-sm shadow-xl flex items-center justify-center gap-2 hover:opacity-90 transition-opacity">
          <span className="material-symbols-outlined text-sm">add</span>
          New Lead
        </button>
        <Link
          href="#"
          className="flex items-center gap-3 text-on-surface/70 py-3 hover:text-primary transition-colors"
        >
          <span className="material-symbols-outlined">help_outline</span>
          <span className="font-headline font-medium text-sm tracking-wide">Support</span>
        </Link>
      </div>
    </aside>
  );
}
