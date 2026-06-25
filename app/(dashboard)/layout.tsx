"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const links = [
    { href: "/dashboard", label: "Pipeline Analytics", icon: "📊" },
    { href: "/upload", label: "Data Ingestion", icon: "📥" },
  ];

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#f5f5f7]">
      {/* Dynamic Liquid Header/Sidebar */}
      <aside className="w-full md:w-64 bg-white/80 backdrop-blur-md border-b md:border-b-0 md:border-r border-black/5 p-4 flex md:flex-col justify-between shrink-0 z-30">
        <div className="flex md:flex-col gap-6 w-full items-center md:items-start">
          <div className="px-3 py-2">
            <span className="font-bold tracking-tight text-lg bg-gradient-to-r from-[#0a84ff] to-[#6a5cff] bg-clip-text text-transparent">
              MERIDIAN
            </span>
            <span className="text-[9px] block font-mono text-[#6e6e73] tracking-widest uppercase"> Leak Detection</span>
          </div>
          
          <nav className="flex md:flex-col gap-1 w-full justify-end md:justify-start">
            {links.map((link) => {
              const active = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-200 flex items-center gap-2.5 ${
                    active
                      ? "bg-white text-[#1d1d1f] shadow-sm ring-1 ring-black/5"
                      : "text-[#6e6e73] hover:text-[#1d1d1f] hover:bg-black/[0.02]"
                  }`}
                >
                  <span className="text-sm opacity-80">{link.icon}</span>
                  <span className="hidden sm:inline">{link.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </aside>

      {/* Primary Workspace viewport */}
      <main className="flex-1 overflow-y-auto relative z-10">
        {children}
      </main>
    </div>
  );
}
