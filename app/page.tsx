"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";

/* ------------------------------------------------------------------ *
 * Adunda — landing page  (app/page.tsx)
 * Style: futuristic Apple. Light grey field, liquid-glass panels,
 * SF Pro type, one cool gradient accent. Signature element: a glowing
 * "meridian" line that draws down the page as you scroll, connecting
 * the Connect → Diagnose → Deploy → Operate sequence.
 * Respects prefers-reduced-motion.
 * ------------------------------------------------------------------ */

/* ----------------------------- CONFIG — replace these two values ---- */
const BRAND = "Adunda";
const CALENDLY_URL = "https://calendly.com/your-handle/meridian-demo"; // ← your real Calendly link
const CONTACT_EMAIL = "hello@trymeridian.com"; // ← your real inbox
/* ------------------------------------------------------------------- */

type Step = { k: string; n: string; eyebrow: string; title: string; body: string };

const STEPS: Step[] = [
  {
    k: "connect",
    n: "01",
    eyebrow: "Connect",
    title: "Bring your business data",
    body: "Leads, jobs, calls, quotes, invoices, schedules — exported however you have it. Messy spreadsheets are fine. Adunda reads it, no cleanup from you.",
  },
  {
    k: "diagnose",
    n: "02",
    eyebrow: "Diagnose",
    title: "Find where revenue leaks out",
    body: "The engine pinpoints exactly where money and hours disappear: leads never answered, quotes never chased, follow-ups that never happened, capacity sitting idle.",
  },
  {
    k: "deploy",
    n: "03",
    eyebrow: "Deploy",
    title: "Spin up an agent to fix it",
    body: "A modular AI agent, tuned to your data, takes over the leaking workflow — answering, qualifying, following up, scheduling, recovering. Live in days, not quarters.",
  },
  {
    k: "operate",
    n: "04",
    eyebrow: "Operate",
    title: "Watch it work, stay in control",
    body: "Your dashboard shows every action the agent takes in real time. Approve, pause, or hand it more. You always see exactly what it's doing and what it recovered.",
  },
];

const FINDINGS = [
  {
    tag: "Revenue leak",
    title: "1 in 3 leads never gets a reply",
    body: "Calls missed after hours, web forms that sit in an inbox. The agent answers and qualifies every one in seconds — around the clock.",
  },
  {
    tag: "System gap",
    title: "Quotes go out and go quiet",
    body: "No second touch, no third. Won work slips to whoever followed up first. Adunda runs the cadence automatically until they book or decline.",
  },
  {
    tag: "Hidden capacity",
    title: "Empty slots you never filled",
    body: "Cancellations and gaps in the calendar are lost margin. The agent backfills from your waitlist and dormant leads before the day starts.",
  },
];

const AGENTS = [
  { title: "Lead Response", body: "Answers, qualifies, and books every new lead in seconds — 24/7, across phone, text, and web." },
  { title: "Follow-Up & Reactivation", body: "Works “get back to me later” and dormant leads on a cadence until they convert or opt out." },
  { title: "Scheduling & Dispatch", body: "Books, confirms, and reshuffles the calendar — and fills gaps the moment they open." },
  { title: "Quote & Invoice", body: "Chases open quotes and unpaid invoices on a schedule so cash stops slipping through." },
  { title: "Reviews & Reputation", body: "Requests a review after every completed job, routes the happy ones, flags the unhappy ones." },
  { title: "Custom workflow", body: "Have a workflow that bleeds time? We tune a module to your data and plug it into the same dashboard." },
];

const INCLUDED = [
  "Full diagnostic of where your business leaks revenue and time",
  "One agent built and tuned to your data, live in days",
  "Real-time dashboard of every action the agent takes",
  "Ongoing tuning, monitoring, and support",
  "Add agents as you grow — same dashboard, same control",
];

/* -------------------------------------------------- helpers */

const clamp = (n: number, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, n));

function useInView<T extends HTMLElement>(threshold = 0.18) {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setInView(true);
          io.disconnect();
        }
      },
      { threshold }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [threshold]);
  return { ref, inView };
}

function Reveal({
  children,
  className = "",
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const { ref, inView } = useInView<HTMLDivElement>();
  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={`reveal ${inView ? "in" : ""} ${className}`}
    >
      {children}
    </div>
  );
}

/* -------------------------------------------------- scroll-driven meridian spine */

function Journey({ onBook }: { onBook: () => void }) {
  const spineRef = useRef<HTMLDivElement>(null);
  const [p, setP] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const el = spineRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight || 1;
      // fill tracks toward the middle of the viewport as the section passes through
      setP(clamp((vh * 0.5 - r.top) / r.height));
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    onScroll();
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  const activeIdx = Math.min(STEPS.length - 1, Math.floor(p * STEPS.length + 0.15));

  return (
    <div ref={spineRef} className="relative max-w-3xl mx-auto">
      {/* dim track */}
      <div className="meridian-track" aria-hidden />
      {/* animated fill */}
      <div className="meridian-fill" style={{ height: `${p * 100}%` }} aria-hidden />

      <div className="relative space-y-16 md:space-y-24">
        {STEPS.map((s, i) => {
          const on = i <= activeIdx;
          return (
            <div key={s.k} className="relative flex flex-col items-center text-center">
              {/* node */}
              <div className={`node ${on ? "on" : ""}`} aria-hidden>
                <span className="node-core" />
              </div>

              <Reveal className="glass rounded-[28px] px-7 py-8 md:px-10 md:py-10 mt-7 w-full">
                <div className="flex items-center justify-center gap-3">
                  <span className="font-mono text-xs tracking-[0.2em] text-[var(--muted)]">{s.n}</span>
                  <span className="h-3 w-px bg-black/15" />
                  <span className="font-mono text-xs tracking-[0.2em] uppercase grad-text font-semibold">
                    {s.eyebrow}
                  </span>
                </div>
                <h3 className="mt-4 text-2xl md:text-3xl font-semibold tracking-tight">{s.title}</h3>
                <p className="mt-3 text-[15px] md:text-base leading-relaxed text-[var(--muted)] max-w-xl mx-auto">
                  {s.body}
                </p>
                {i === STEPS.length - 1 && (
                  <button onClick={onBook} className="btn-primary mt-7 inline-flex">
                    Book a demo
                  </button>
                )}
              </Reveal>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* -------------------------------------------------- glass dashboard preview */

function DashboardPreview() {
  const rows = [
    { t: "09:14:02", a: "Answered + qualified inbound lead", m: "Northgate Landscaping", tone: "ok" },
    { t: "09:13:41", a: "Booked estimate · Thu 2:00 PM", m: "Auto-confirmed", tone: "ok" },
    { t: "09:11:30", a: "Follow-up sent on open quote", m: "Quote #4471 · $3,200", tone: "accent" },
    { t: "09:08:55", a: "Reactivated dormant lead", m: "Quiet 38 days", tone: "accent" },
    { t: "09:05:12", a: "Invoice reminder delivered", m: "Invoice #2210 · 14 days late", tone: "warn" },
  ];
  return (
    <div className="glass glass-lift rounded-[28px] p-2 md:p-3">
      <div className="rounded-[22px] bg-white/55 border border-white/60 overflow-hidden">
        {/* window bar */}
        <div className="flex items-center gap-2 px-5 py-3 border-b border-black/5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
          <span className="w-2.5 h-2.5 rounded-full bg-[#febc2e]" />
          <span className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
          <span className="ml-3 font-mono text-[11px] text-[var(--muted)]">meridian · lead response agent</span>
          <span className="ml-auto inline-flex items-center gap-1.5 font-mono text-[11px] text-[var(--muted)]">
            <span className="live-dot" /> live
          </span>
        </div>

        {/* stat strip */}
        <div className="grid grid-cols-3 divide-x divide-black/5 border-b border-black/5">
          {[
            { v: "42", l: "Leads handled today" },
            { v: "11s", l: "Avg response" },
            { v: "$18.4K", l: "Recovered this week" },
          ].map((s) => (
            <div key={s.l} className="px-5 py-4">
              <div className="text-xl md:text-2xl font-semibold tracking-tight tabular-nums">{s.v}</div>
              <div className="mt-0.5 text-[11px] text-[var(--muted)]">{s.l}</div>
            </div>
          ))}
        </div>

        {/* activity feed */}
        <div className="divide-y divide-black/5">
          {rows.map((r, i) => (
            <div key={i} className="flex items-center gap-4 px-5 py-3">
              <span className="font-mono text-[11px] text-[var(--muted)] w-16 shrink-0">{r.t}</span>
              <span
                className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                  r.tone === "warn" ? "bg-[#e0922f]" : r.tone === "accent" ? "bg-[var(--accent)]" : "bg-[#28c840]"
                }`}
              />
              <span className="text-sm font-medium truncate">{r.a}</span>
              <span className="ml-auto text-[12px] text-[var(--muted)] truncate hidden sm:block">{r.m}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------- mark */

function Mark({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="9" stroke="url(#mg)" strokeWidth="1.6" />
      <line x1="12" y1="2.5" x2="12" y2="21.5" stroke="url(#mg)" strokeWidth="1.6" />
      <circle cx="12" cy="12" r="2.1" fill="url(#mg)" />
      <defs>
        <linearGradient id="mg" x1="0" y1="0" x2="24" y2="24">
          <stop stopColor="#0a84ff" />
          <stop offset="1" stopColor="#6a5cff" />
        </linearGradient>
      </defs>
    </svg>
  );
}

/* -------------------------------------------------- reactive background */

function Background() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const h = document.documentElement;
        el.style.setProperty("--p", clamp(h.scrollTop / (h.scrollHeight - h.clientHeight || 1)).toFixed(4));
      });
    };
    const onMove = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      el.style.setProperty("--mx", (e.clientX / (window.innerWidth || 1)).toFixed(3));
      el.style.setProperty("--my", (e.clientY / (window.innerHeight || 1)).toFixed(3));
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    window.addEventListener("pointermove", onMove, { passive: true });
    onScroll();
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      window.removeEventListener("pointermove", onMove);
      cancelAnimationFrame(raf);
    };
  }, []);
  return (
    <div ref={ref} aria-hidden className="bg-field">
      <div className="bg-aurora" />
      <div className="bg-blob b1" />
      <div className="bg-blob b2" />
      <div className="bg-blob b3" />
      <div className="bg-blob b4" />
      <div className="bg-grid" />
      <div className="bg-spot" />
    </div>
  );
}

/* -------------------------------------------------- page */

export default function Landing() {
  const progRef = useRef<HTMLDivElement>(null);

  // top scroll-progress bar
  useEffect(() => {
    const onScroll = () => {
      const h = document.documentElement;
      const p = h.scrollTop / (h.scrollHeight - h.clientHeight || 1);
      if (progRef.current) progRef.current.style.transform = `scaleX(${p})`;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // load Calendly assets once
  useEffect(() => {
    const css = document.createElement("link");
    css.rel = "stylesheet";
    css.href = "https://assets.calendly.com/assets/external/widget.css";
    document.head.appendChild(css);
    const s = document.createElement("script");
    s.src = "https://assets.calendly.com/assets/external/widget.js";
    s.async = true;
    document.body.appendChild(s);
  }, []);

  const openDemo = () => {
    const w = window as unknown as { Calendly?: { initPopupWidget: (o: { url: string }) => void } };
    if (w.Calendly) w.Calendly.initPopupWidget({ url: CALENDLY_URL });
    else window.open(CALENDLY_URL, "_blank");
  };

  const scrollTo = (id: string) =>
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });

  return (
    <div className="relative min-h-screen text-[var(--ink)] antialiased overflow-x-hidden">
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link
        href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap"
        rel="stylesheet"
      />

      <style jsx global>{`
        :root {
          --ink: #1d1d1f;
          --muted: #6e6e73;
          --field: #f5f5f7;
          --accent: #0a84ff;
          --accent2: #6a5cff;
        }
        body {
          font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text",
            "Inter", system-ui, sans-serif;
          letter-spacing: -0.01em;
        }
        .font-mono {
          font-family: "JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace;
          letter-spacing: 0;
        }
        .grad-text {
          background: linear-gradient(120deg, var(--accent), var(--accent2));
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
        }

        /* ---- liquid glass ---- */
        .glass {
          position: relative;
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.72), rgba(255, 255, 255, 0.42));
          backdrop-filter: blur(22px) saturate(180%);
          -webkit-backdrop-filter: blur(22px) saturate(180%);
          border: 1px solid rgba(255, 255, 255, 0.7);
          box-shadow: 0 10px 40px rgba(20, 24, 40, 0.08),
            inset 0 1px 0 rgba(255, 255, 255, 0.9), inset 0 -1px 0 rgba(255, 255, 255, 0.25);
        }
        .glass::before {
          content: "";
          position: absolute;
          inset: 0;
          border-radius: inherit;
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.55), transparent 42%);
          pointer-events: none;
        }
        .glass-lift {
          transition: transform 0.4s cubic-bezier(0.2, 0.8, 0.2, 1),
            box-shadow 0.4s cubic-bezier(0.2, 0.8, 0.2, 1);
        }
        .glass-lift:hover {
          transform: translateY(-4px);
          box-shadow: 0 22px 60px rgba(20, 24, 40, 0.13),
            inset 0 1px 0 rgba(255, 255, 255, 0.9);
        }

        /* ---- buttons ---- */
        .btn-primary {
          align-items: center;
          gap: 0.5rem;
          font-size: 0.95rem;
          font-weight: 600;
          color: #fff;
          padding: 0.85rem 1.6rem;
          border-radius: 999px;
          background: linear-gradient(120deg, var(--accent), var(--accent2));
          box-shadow: 0 8px 24px rgba(10, 132, 255, 0.32), inset 0 1px 0 rgba(255, 255, 255, 0.4);
          transition: transform 0.2s ease, box-shadow 0.2s ease, filter 0.2s ease;
        }
        .btn-primary:hover {
          transform: translateY(-1px);
          filter: brightness(1.05);
          box-shadow: 0 12px 30px rgba(10, 132, 255, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.5);
        }
        .btn-primary:active {
          transform: translateY(0);
        }
        .btn-ghost {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          font-size: 0.95rem;
          font-weight: 600;
          color: var(--ink);
          padding: 0.85rem 1.4rem;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.5);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(0, 0, 0, 0.07);
          transition: background 0.2s ease, transform 0.2s ease;
        }
        .btn-ghost:hover {
          background: rgba(255, 255, 255, 0.85);
          transform: translateY(-1px);
        }

        /* ---- meridian spine ---- */
        .meridian-track,
        .meridian-fill {
          position: absolute;
          left: 50%;
          top: 0;
          transform: translateX(-50%);
          width: 2px;
          border-radius: 2px;
        }
        .meridian-track {
          height: 100%;
          background: rgba(0, 0, 0, 0.08);
        }
        .meridian-fill {
          background: linear-gradient(180deg, var(--accent), var(--accent2));
          box-shadow: 0 0 16px rgba(10, 132, 255, 0.55);
          transition: height 0.15s linear;
        }
        .node {
          position: relative;
          width: 18px;
          height: 18px;
          border-radius: 999px;
          background: var(--field);
          border: 2px solid rgba(0, 0, 0, 0.12);
          display: grid;
          place-items: center;
          transition: border-color 0.4s ease, box-shadow 0.4s ease;
          z-index: 1;
        }
        .node-core {
          width: 7px;
          height: 7px;
          border-radius: 999px;
          background: rgba(0, 0, 0, 0.15);
          transition: background 0.4s ease, transform 0.4s ease;
        }
        .node.on {
          border-color: var(--accent);
          box-shadow: 0 0 0 5px rgba(10, 132, 255, 0.12), 0 0 18px rgba(10, 132, 255, 0.4);
        }
        .node.on .node-core {
          background: linear-gradient(120deg, var(--accent), var(--accent2));
          transform: scale(1.15);
        }

        .live-dot {
          width: 7px;
          height: 7px;
          border-radius: 999px;
          background: #28c840;
          box-shadow: 0 0 0 0 rgba(40, 200, 64, 0.5);
          animation: pulse 2s infinite;
        }

        /* ---- reveal ---- */
        .reveal {
          opacity: 0;
          transform: translateY(22px);
          transition: opacity 0.7s cubic-bezier(0.2, 0.8, 0.2, 1),
            transform 0.7s cubic-bezier(0.2, 0.8, 0.2, 1);
        }
        .reveal.in {
          opacity: 1;
          transform: none;
        }

        @keyframes pulse {
          0% { box-shadow: 0 0 0 0 rgba(40, 200, 64, 0.5); }
          70% { box-shadow: 0 0 0 7px rgba(40, 200, 64, 0); }
          100% { box-shadow: 0 0 0 0 rgba(40, 200, 64, 0); }
        }
        @keyframes drift {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(28px, -36px) scale(1.07); }
        }

        /* ---- scroll/pointer-reactive background ---- */
        .bg-field {
          position: fixed; inset: 0; z-index: 0; overflow: hidden;
          background: var(--field);
          --p: 0; --mx: 0.5; --my: 0.32;
        }
        .bg-blob {
          position: absolute; border-radius: 999px; filter: blur(120px);
          will-change: transform, opacity;
        }
        .bg-blob.b1 {
          width: 62vw; max-width: 700px; aspect-ratio: 1; top: -14vh; left: -8vw;
          background: #bcd4ff; opacity: 0.5;
          transform: translate3d(calc(var(--p) * 36px), calc(var(--p) * -170px), 0) scale(calc(1 + var(--p) * 0.06));
          animation: drift 26s ease-in-out infinite;
        }
        .bg-blob.b2 {
          width: 56vw; max-width: 640px; aspect-ratio: 1; top: 26vh; right: -10vw;
          background: #e2d4ff; opacity: calc(0.28 + var(--p) * 0.3);
          transform: translate3d(0, calc(var(--p) * 150px), 0);
          animation: drift 30s ease-in-out infinite -6s;
        }
        .bg-blob.b3 {
          width: 54vw; max-width: 580px; aspect-ratio: 1; bottom: -12vh; left: 22vw;
          background: #cdeede; opacity: calc(0.16 + var(--p) * 0.34);
          transform: translate3d(0, calc(var(--p) * -120px), 0);
          animation: drift 32s ease-in-out infinite -12s;
        }
        .bg-blob.b4 {
          width: 40vw; max-width: 460px; aspect-ratio: 1; top: 58vh; left: 4vw;
          background: #bfeaff; opacity: calc(0.1 + var(--p) * 0.3);
          transform: translate3d(0, calc(var(--p) * -70px), 0);
          animation: drift 28s ease-in-out infinite -3s;
        }
        .bg-aurora {
          position: absolute; inset: -25%;
          background: conic-gradient(from 0deg at 50% 50%,
            rgba(10, 132, 255, 0.05), rgba(106, 92, 255, 0.06),
            rgba(40, 200, 120, 0.045), rgba(10, 132, 255, 0.05));
          filter: blur(36px);
          transform: rotate(calc(var(--p) * 48deg)) scale(1.1);
          will-change: transform;
        }
        .bg-grid {
          position: absolute; inset: 0;
          background-image: radial-gradient(rgba(0, 0, 0, 0.05) 1px, transparent 1px);
          background-size: 34px 34px;
          opacity: calc(0.45 - var(--p) * 0.32);
          transform: translateY(calc(var(--p) * 60px));
          -webkit-mask-image: radial-gradient(ellipse 78% 58% at 50% 28%, #000 28%, transparent 76%);
          mask-image: radial-gradient(ellipse 78% 58% at 50% 28%, #000 28%, transparent 76%);
        }
        .bg-spot {
          position: absolute; inset: 0;
          background: radial-gradient(440px circle at calc(var(--mx) * 100%) calc(var(--my) * 100%),
            rgba(10, 132, 255, 0.1), transparent 60%);
        }

        @media (max-width: 640px) {
          .bg-blob { filter: blur(72px); }
          .bg-blob.b4, .bg-aurora, .bg-grid, .bg-spot { display: none; }
        }
        @media (prefers-reduced-motion: reduce) {
          .reveal { opacity: 1 !important; transform: none !important; }
          .meridian-fill { transition: none; }
          .bg-blob, .bg-aurora { animation: none !important; }
        }
        *:focus-visible {
          outline: 2px solid var(--accent);
          outline-offset: 3px;
          border-radius: 4px;
        }
      `}</style>

      {/* ambient field — scroll- & pointer-reactive */}
      <Background />

      {/* scroll progress */}
      <div
        ref={progRef}
        className="fixed top-0 left-0 right-0 h-0.5 z-[60] origin-left"
        style={{ transform: "scaleX(0)", background: "linear-gradient(90deg, var(--accent), var(--accent2))" }}
      />

      <div className="relative z-10">
        {/* ---------------------------------------------- NAV */}
        <nav className="sticky top-3 z-50 px-4">
          <div className="glass max-w-5xl mx-auto rounded-full px-5 h-14 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2.5">
              <Mark />
              <span className="text-[17px] font-semibold tracking-tight">{BRAND}</span>
            </Link>
            <div className="hidden sm:flex items-center gap-7 text-sm font-medium text-[var(--muted)]">
              <button onClick={() => scrollTo("how")} className="hover:text-[var(--ink)] transition">How it works</button>
              <button onClick={() => scrollTo("agents")} className="hover:text-[var(--ink)] transition">Agents</button>
              <button onClick={() => scrollTo("pricing")} className="hover:text-[var(--ink)] transition">Pricing</button>
            </div>
            <div className="flex items-center gap-1 sm:gap-3">
              <Link href="/login" className="text-sm font-medium text-[var(--muted)] hover:text-[var(--ink)] transition px-2.5 py-2">Log in</Link>
              <button onClick={openDemo} className="btn-primary !py-2 !px-3.5 sm:!px-4 !text-sm whitespace-nowrap">Book a demo</button>
            </div>
          </div>
        </nav>

        {/* ---------------------------------------------- HERO */}
        <header className="px-5 pt-20 pb-16 md:pt-28 md:pb-24">
          <div className="max-w-5xl mx-auto text-center">
            <Reveal>
              <span className="inline-flex items-center gap-2 glass rounded-full px-4 py-1.5 text-xs font-medium text-[var(--muted)]">
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: "linear-gradient(120deg,var(--accent),var(--accent2))" }} />
                Introducing {BRAND} · AI operations for service businesses
              </span>
            </Reveal>

            <Reveal delay={80}>
              <h1 className="mt-7 text-[2.7rem] sm:text-6xl md:text-7xl font-semibold tracking-tight leading-[1.04]">
                Find the money your
                <br className="hidden sm:block" /> business is leaking.
                <span className="block grad-text">Then deploy an agent that recovers it.</span>
              </h1>
            </Reveal>

            <Reveal delay={180}>
              <p className="mt-7 text-lg md:text-xl text-[var(--muted)] max-w-2xl mx-auto leading-relaxed">
                {BRAND} diagnoses where revenue and time slip out of your operations, then deploys a
                tuned AI agent to close the gaps — and shows you exactly what it's doing, live.
              </p>
            </Reveal>

            <Reveal delay={280}>
              <div className="mt-9 flex flex-col sm:flex-row gap-3 justify-center">
                <button onClick={openDemo} className="btn-primary justify-center">Book a demo</button>
                <button onClick={() => scrollTo("how")} className="btn-ghost justify-center">See how it works</button>
              </div>
              <p className="mt-5 text-xs font-medium text-[var(--muted)]">
                Built for service businesses with 1–10 people · Live in days, not quarters
              </p>
            </Reveal>

            <Reveal delay={380} className="mt-16 md:mt-20 max-w-3xl mx-auto text-left">
              <DashboardPreview />
            </Reveal>
          </div>
        </header>

        {/* ---------------------------------------------- HOW / JOURNEY (meridian spine) */}
        <section id="how" className="px-5 py-20 md:py-28 scroll-mt-24">
          <Reveal className="max-w-2xl mx-auto text-center mb-16 md:mb-24">
            <span className="font-mono text-xs tracking-[0.2em] uppercase grad-text font-semibold">The path</span>
            <h2 className="mt-3 text-3xl md:text-5xl font-semibold tracking-tight">
              From raw data to a working agent.
            </h2>
            <p className="mt-4 text-[var(--muted)] text-lg">
              One continuous line, four steps. Follow it down.
            </p>
          </Reveal>
          <Journey onBook={openDemo} />
        </section>

        {/* ---------------------------------------------- WHAT IT FINDS */}
        <section className="px-5 py-20 md:py-28">
          <div className="max-w-5xl mx-auto">
            <Reveal className="max-w-2xl mb-14">
              <span className="font-mono text-xs tracking-[0.2em] uppercase grad-text font-semibold">What it finds</span>
              <h2 className="mt-3 text-3xl md:text-5xl font-semibold tracking-tight">
                The leaks hiding in your day-to-day.
              </h2>
              <p className="mt-4 text-[var(--muted)] text-lg">
                Same patterns across landscapers, contractors, and small B2B teams — invisible until someone counts them.
              </p>
            </Reveal>

            <div className="grid md:grid-cols-3 gap-5">
              {FINDINGS.map((f, i) => (
                <Reveal key={f.title} delay={i * 100}>
                  <article className="glass glass-lift rounded-[26px] p-7 h-full">
                    <span className="font-mono text-[11px] tracking-[0.15em] uppercase grad-text font-semibold">
                      {f.tag}
                    </span>
                    <h3 className="mt-3 text-xl font-semibold tracking-tight leading-snug">{f.title}</h3>
                    <p className="mt-3 text-[15px] leading-relaxed text-[var(--muted)]">{f.body}</p>
                  </article>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ---------------------------------------------- AGENTS */}
        <section id="agents" className="px-5 py-20 md:py-28 scroll-mt-24">
          <div className="max-w-5xl mx-auto">
            <Reveal className="max-w-2xl mb-14">
              <span className="font-mono text-xs tracking-[0.2em] uppercase grad-text font-semibold">The agents</span>
              <h2 className="mt-3 text-3xl md:text-5xl font-semibold tracking-tight">
                Modular agents, tuned to your data.
              </h2>
              <p className="mt-4 text-[var(--muted)] text-lg">
                Start with the one that plugs your biggest leak. Add more as you grow — all on the same dashboard.
              </p>
            </Reveal>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {AGENTS.map((a, i) => (
                <Reveal key={a.title} delay={(i % 3) * 100}>
                  <article className="glass glass-lift rounded-[26px] p-7 h-full flex flex-col">
                    <span className="w-9 h-9 rounded-xl grid place-items-center" style={{ background: "linear-gradient(135deg,var(--accent),var(--accent2))" }}>
                      <span className="w-2.5 h-2.5 rounded-full bg-white/90" />
                    </span>
                    <h3 className="mt-5 text-lg font-semibold tracking-tight">{a.title}</h3>
                    <p className="mt-2 text-[15px] leading-relaxed text-[var(--muted)]">{a.body}</p>
                  </article>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ---------------------------------------------- FREE ANALYSIS */}
        <section id="pricing" className="px-5 py-20 md:py-28 scroll-mt-24">
          <div className="max-w-4xl mx-auto">
            <Reveal className="text-center max-w-2xl mx-auto mb-14">
              <span className="font-mono text-xs tracking-[0.2em] uppercase grad-text font-semibold">Pricing</span>
              <h2 className="mt-3 text-3xl md:text-5xl font-semibold tracking-tight">
                Start with a free analysis.
              </h2>
              <p className="mt-4 text-[var(--muted)] text-lg">
                We run the diagnostic on your real numbers and show you exactly where you&apos;re leaking — before you spend a dollar. Pricing is scoped to your business, and we walk you through it on the call.
              </p>
            </Reveal>

            <Reveal>
              <div className="glass rounded-[32px] p-8 md:p-12 text-center">
                <span className="font-mono text-xs tracking-[0.15em] uppercase text-[var(--muted)]">Revenue leak analysis</span>
                <div className="mt-3 flex items-end justify-center gap-2.5">
                  <span className="text-6xl md:text-7xl font-semibold tracking-tight grad-text">Free</span>
                  <span className="text-[var(--muted)] mb-2 text-sm">no commitment</span>
                </div>
                <p className="mt-4 text-[15px] md:text-base text-[var(--muted)] leading-relaxed max-w-xl mx-auto">
                  Bring your data and we&apos;ll find the leaks live on a short call. If you want an agent to plug them, we scope it together — pricing depends on the work it does, and we&apos;ll lay it out for you then.
                </p>

                <ul className="mt-9 grid sm:grid-cols-2 gap-x-8 gap-y-3 border-t border-black/8 pt-8 text-left max-w-2xl mx-auto">
                  {INCLUDED.map((x) => (
                    <li key={x} className="flex gap-3 text-[15px]">
                      <span className="mt-1.5 w-1.5 h-1.5 rounded-full shrink-0" style={{ background: "linear-gradient(120deg,var(--accent),var(--accent2))" }} />
                      <span className="text-[var(--ink)]/85">{x}</span>
                    </li>
                  ))}
                </ul>

                <button onClick={openDemo} className="btn-primary justify-center w-full mt-9">
                  Get my free analysis
                </button>
                <p className="mt-4 text-xs text-[var(--muted)]">
                  20-minute call · No commitment · See the leaks before you decide
                </p>
              </div>
            </Reveal>
          </div>
        </section>

        {/* ---------------------------------------------- FINAL CTA */}
        <section className="px-5 pb-24">
          <Reveal className="max-w-4xl mx-auto">
            <div className="glass rounded-[36px] px-8 py-16 md:py-20 text-center">
              <Mark size={34} />
              <h2 className="mt-6 text-3xl md:text-5xl font-semibold tracking-tight max-w-2xl mx-auto leading-[1.08]">
                See exactly where you're losing money.
              </h2>
              <p className="mt-4 text-[var(--muted)] text-lg max-w-xl mx-auto">
                Bring your data. We'll find the leaks live and show you the agent that plugs them.
              </p>
              <button onClick={openDemo} className="btn-primary justify-center mt-8">
                Book a demo
              </button>
            </div>
          </Reveal>
        </section>

        {/* ---------------------------------------------- FOOTER */}
        <footer className="px-5 py-10 border-t border-black/5">
          <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <Mark size={18} />
              <span className="font-semibold">{BRAND}</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-[var(--muted)]">
              <a href={`mailto:${CONTACT_EMAIL}`} className="hover:text-[var(--ink)] transition">{CONTACT_EMAIL}</a>
              <span className="font-mono text-xs">© 2026 {BRAND}</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
