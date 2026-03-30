"use client";
import { usePathname } from "next/navigation";
import Link from "next/link";

const ITEMS = [
  { href: "/",          label: "Home",     icon: "dashboard" },
  { href: "/leads",     label: "Leads",    icon: "group"     },
  { href: "/dialer",    label: "Dial",     icon: "call",     primary: true },
  { href: "/analytics", label: "Stats",    icon: "insights"  },
  { href: "/settings",  label: "Settings", icon: "person"    },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50"
      style={{ background: "#111827", borderTop: "1px solid #374151" }}>
      <div className="flex justify-around items-center h-16">
        {ITEMS.map((item) => {
          const isActive = pathname === item.href;
          if (item.primary) {
            return (
              <Link key={item.href} href={item.href} className="-mt-6">
                <div className="w-12 h-12 rounded-xl metallic-silk text-white shadow-xl flex items-center justify-center">
                  <span className="material-symbols-outlined">{item.icon}</span>
                </div>
              </Link>
            );
          }
          return (
            <Link key={item.href} href={item.href}
              className="flex flex-col items-center gap-0.5"
              style={{ color: isActive ? "#3B82F6" : "#6B7280" }}>
              <span className="material-symbols-outlined"
                style={isActive ? { fontVariationSettings: "'FILL' 1" } : {}}>
                {item.icon}
              </span>
              <span className="font-mono-data text-[10px]">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
