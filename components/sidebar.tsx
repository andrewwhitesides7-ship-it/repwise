"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const navLinks = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: (
      <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    href: "/goals",
    label: "Goals",
    icon: (
      <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
  {
    href: "/team",
    label: "Team",
    icon: (
      <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    href: "/team/messages",
    label: "Messages",
    icon: (
      <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    ),
  },
  {
    href: "/history",
    label: "History",
    icon: (
      <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    href: "/upload",
    label: "Upload",
    icon: (
      <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
      </svg>
    ),
  },
  {
    href: "/billing",
    label: "Billing",
    icon: (
      <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
      </svg>
    ),
  },
  {
    href: "/referrals",
    label: "Refer & Earn",
    icon: (
      <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
];

const adminLink = {
  href: "/admin",
  label: "Admin",
  icon: (
    <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18" />
    </svg>
  ),
};

const adminEmails = ["andrewwhitesides7@gmail.com", "tylerwedemeyer@gmail.com"];

export default function Sidebar({ email }: { email?: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [hoveredLink, setHoveredLink] = useState<string | null>(null);

  const isAdmin = adminEmails.includes(email || "");
  const allLinks = isAdmin ? [...navLinks, adminLink] : navLinks;

  const initial = email?.[0]?.toUpperCase() || "?";

  async function handleSignOut() {
    setSigningOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-[#0a0a12] border-r border-white/5">

      {/* Logo */}
      <div className="px-5 py-5 border-b border-white/5">
        <Link href="/dashboard" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-600/30 group-hover:shadow-blue-500/40 transition-all duration-300">
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <span className="text-base font-black text-white tracking-tight">
            Try<span className="text-blue-400">RepWise</span>
          </span>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto scrollbar-none">
        {allLinks.map((link) => {
          const isActive = pathname === link.href || (link.href !== "/dashboard" && pathname.startsWith(link.href + "/"));
          const isHovered = hoveredLink === link.href;

          return (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              onMouseEnter={() => setHoveredLink(link.href)}
              onMouseLeave={() => setHoveredLink(null)}
              className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 group ${
                isActive
                  ? "text-white"
                  : "text-gray-500 hover:text-gray-200"
              }`}
            >
              {/* Active background */}
              {isActive && (
                <div className="absolute inset-0 rounded-xl bg-blue-600/15 border border-blue-500/20" />
              )}

              {/* Hover background */}
              {!isActive && isHovered && (
                <div className="absolute inset-0 rounded-xl bg-white/4" />
              )}

              {/* Active left bar */}
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-blue-400 rounded-full" />
              )}

              <span className={`relative z-10 transition-all duration-200 ${isActive ? "text-blue-400" : "text-gray-600 group-hover:text-gray-300"}`}>
                {link.icon}
              </span>
              <span className="relative z-10">{link.label}</span>

              {/* Active glow dot */}
              {isActive && (
                <div className="relative z-10 ml-auto w-1.5 h-1.5 rounded-full bg-blue-400 shadow-lg shadow-blue-400/60" />
              )}

              {link.label === "Refer & Earn" && (
                <span className="relative z-10 ml-auto text-[10px] font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded-full">
                  $20
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom section */}
      <div className="px-3 pb-4 pt-3 border-t border-white/5 space-y-0.5">
        <Link
          href="/help"
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-gray-500 hover:text-gray-200 hover:bg-white/4 transition-all duration-200"
        >
          <svg className="w-[18px] h-[18px] text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Help
        </Link>

        {/* User card */}
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/3 border border-white/5 mt-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-black flex-shrink-0 shadow-lg shadow-blue-500/20">
            {initial}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-xs font-bold truncate">{email?.split("@")[0] || "User"}</p>
            <p className="text-gray-600 text-xs truncate">{email}</p>
          </div>
          <button
            onClick={handleSignOut}
            disabled={signingOut}
            className="flex-shrink-0 text-gray-600 hover:text-gray-300 transition-colors duration-200 p-1 rounded-lg hover:bg-white/8"
            title="Sign out"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop */}
      <aside className="hidden md:flex w-56 flex-col h-screen flex-shrink-0">
        <SidebarContent />
      </aside>

      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-[#0a0a12]/95 backdrop-blur-xl border-b border-white/5 px-4 py-3 flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-600/30">
            <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <span className="text-base font-black text-white">Try<span className="text-blue-400">RepWise</span></span>
        </Link>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="w-8 h-8 flex items-center justify-center rounded-xl bg-white/5 border border-white/8 text-gray-400 hover:text-white transition-colors duration-200"
        >
          {mobileOpen ? (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          ) : (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" /></svg>
          )}
        </button>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-30">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="absolute left-0 top-0 bottom-0 w-64">
            <SidebarContent />
          </aside>
        </div>
      )}
    </>
  );
}
