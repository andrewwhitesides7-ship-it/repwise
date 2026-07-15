"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/* Adunda dashboard shell — sidebar on desktop, top bar on mobile.
 * Brand mark matches the landing page. */

const CONTACT_EMAIL = "hello@adunda.com"; // ← keep in sync with the landing page

function Mark({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="9" stroke="url(#mgs)" strokeWidth="1.6" />
      <line x1="12" y1="2.5" x2="12" y2="21.5" stroke="url(#mgs)" strokeWidth="1.6" />
      <circle cx="12" cy="12" r="2.1" fill="url(#mgs)" />
      <defs>
        <linearGradient id="mgs" x1="0" y1="0" x2="24" y2="24">
          <stop stopColor="#0a84ff" />
          <stop offset="1" stopColor="#6a5cff" />
        </linearGradient>
      </defs>
    </svg>
  );
}

const NAV = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
      </svg>
    ),
  },
  {
    href: "/upload",
    label: "Upload data",
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
      </svg>
    ),
  },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#f5f5f7]">
      <aside className="w-full md:w-64 bg-white/80 backdrop-blur-md border-b md:border-b-0 md:border-r border-black/5 p-4 flex md:flex-col justify-between shrink-0 z-30">
        {/* top: brand + nav */}
        <div className="flex md:flex-col gap-4 md:gap-8 w-full items-center md:items-stretch">
          <Link href="/dashboard" className="flex items-center gap-2.5 px-3 py-2">
            <Mark />
            <span className="leading-none">
              <span className="font-semibold tracking-tight text-[17px] text-[#1d1d1f] block">Adunda</span>
              <span className="text-[9px] font-mono text-[#6e6e73] tracking-[0.18em] uppercase block mt-1">Revenue recovery</span>
            </span>
          </Link>

          <nav className="flex md:flex-col gap-1 w-full justify-end md:justify-start">
            {NAV.map((link) => {
              const active = pathname === link.href || pathname?.startsWith(link.href + "/");
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={active ? "page" : undefined}
                  className={`px-3 py-2 rounded-xl text-[13px] font-semibold transition-all duration-200 flex items-center gap-2.5 ${
                    active
                      ? "bg-white text-[#1d1d1f] shadow-sm ring-1 ring-black/5"
                      : "text-[#6e6e73] hover:text-[#1d1d1f] hover:bg-black/[0.02]"
                  }`}
                >
                  <span className={active ? "text-[#0a84ff]" : "opacity-70"}>{link.icon}</span>
                  <span className="hidden sm:inline">{link.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* bottom: support (desktop only) */}
        <div className="hidden md:block px-3 pb-1">
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="text-[12px] font-medium text-[#6e6e73] hover:text-[#1d1d1f] transition flex items-center gap-2"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
            </svg>
            Need help?
          </a>
          <p className="mt-3 text-[10px] font-mono text-[#b8b8bd]">© 2026 Adunda</p>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto relative z-10">{children}</main>
    </div>
  );
}
