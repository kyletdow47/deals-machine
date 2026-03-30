"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

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
  const router = useRouter();

  return (
    <>
      {/* Desktop Side Nav */}
      <aside className="h-screen w-64 fixed left-0 top-0 bg-surface-container-low hidden md:flex flex-col py-8 gap-2 z-40 pt-24">
        <div className="px-6 mb-8">
          <h2 className="font-black text-on-surface text-xl font-headline tracking-tight">Deals Machine</h2>
          <p className="text-[10px] font-headline uppercase tracking-[0.15em] text-primary font-bold mt-0.5">Aviation Lead Gen</p>
        </div>

        <nav className="flex flex-col gap-0.5 flex-grow">
          {navItems.map((item) => {
            const isActive = pathname === item.href ||
              (item.href !== "/" && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-6 py-3 font-headline font-medium text-sm tracking-wide transition-all duration-200 relative ${
                  isActive
                    ? "bg-surface-container-highest text-primary rounded-r-full font-bold nav-active-bar"
                    : "text-on-surface/60 hover:bg-surface-container-high/50 hover:text-on-surface"
                }`}
              >
                <span
                  className="material-symbols-outlined text-xl"
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
          <button
            onClick={() => router.push("/leads?new=1")}
            className="metallic-silk text-white py-3 rounded-xl font-bold text-sm shadow-xl flex items-center justify-center gap-2 hover:opacity-90 transition-opacity btn-press"
          >
            <span className="material-symbols-outlined text-sm">add</span>
            New Lead
          </button>
          <div className="flex items-center gap-3 text-on-surface/50 py-3 text-sm">
            <span className="material-symbols-outlined text-lg">help_outline</span>
            <span className="font-headline font-medium tracking-wide">Support</span>
          </div>
        </div>
      </aside>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 glass-effect border-t border-outline-variant/20 z-50">
        <div className="flex justify-around items-center h-16">
          {[
            { href: "/", icon: "dashboard", label: "Home" },
            { href: "/leads", icon: "group", label: "Leads" },
            { href: "/calls", icon: "call", label: "Dial", special: true },
            { href: "/analytics", icon: "insights", label: "Stats" },
            { href: "/settings", icon: "person", label: "Profile" },
          ].map((item) => {
            const isActive = pathname === item.href;
            if (item.special) {
              return (
                <Link key={item.href} href={item.href} className="-mt-6">
                  <div className="w-14 h-14 rounded-full metallic-silk text-white shadow-xl flex items-center justify-center border-4 border-background">
                    <span className="material-symbols-outlined">{item.icon}</span>
                  </div>
                </Link>
              );
            }
            return (
              <Link key={item.href} href={item.href} className={`flex flex-col items-center gap-0.5 ${isActive ? "text-primary" : "text-outline"}`}>
                <span className="material-symbols-outlined text-xl" style={isActive ? { fontVariationSettings: "'FILL' 1" } : undefined}>{item.icon}</span>
                <span className="text-[10px] font-bold">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
