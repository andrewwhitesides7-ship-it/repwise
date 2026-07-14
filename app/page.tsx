"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import Link from "next/link";

/* ------------------------------------------------------------------ *
 * Adunda — landing page  (app/page.tsx)
 * Interactive rebuild. Three conversion engines:
 *   1. HERO — a live, self-running agent feed (the product IS the hero)
 *   2. LEAK CALCULATOR — visitor plugs in their numbers, sees their
 *      own annual leak animate up (personalized pain → CTA)
 *   3. AGENT PICKER — toggle agents on/off, price updates live,
 *      bundle snaps to $1,000 (transparent pricing + anchoring)
 * Keeps the light liquid-glass system + meridian spine.
 * Respects prefers-reduced-motion throughout.
 * ------------------------------------------------------------------ */

/* ----------------------------- CONFIG ------------------------------ */
const BRAND = "Adunda";
const CALENDLY_URL = "https://calendly.com/andrewwhitesides7/30min"; // ← your real Calendly link
const CONTACT_EMAIL = "andrewwhitesides7@gmail.com"; // ← your real inbox
const AGENT_PRICE = 250;
const BUNDLE_PRICE = 1000;
/* ------------------------------------------------------------------- */

type Step = { k: string; n: string; eyebrow: string; title: string; body: string };

const STEPS: Step[] = [
  {
    k: "connect",
    n: "01",
    eyebrow: "Connect",
    title: "Bring your business data",
    body: "Leads, sales, invoices, quotes, schedules, customer lists — exported however you have them. Messy spreadsheets are fine. Adunda reads it, no cleanup from you.",
  },
  {
    k: "diagnose",
    n: "02",
    eyebrow: "Diagnose",
    title: "Get a free diagnostic of where money leaks out",
    body: "The engine pinpoints exactly where revenue and hours disappear: leads never answered, quotes never chased, invoices aging, customers going quiet. Real dollar amounts, from your real numbers.",
  },
  {
    k: "deploy",
    n: "03",
    eyebrow: "Deploy",
    title: "Turn on the agents that plug the leaks",
    body: "Each leak maps to an agent — $250 each, or all of them for $1,000. Tuned to your data and live in days, not quarters.",
  },
  {
    k: "operate",
    n: "04",
    eyebrow: "Operate",
    title: "Watch it work, stay in control",
    body: "Your dashboard shows every action every agent takes, in real time, with the dollars it recovered. Approve, pause, or hand it more.",
  },
];

const FINDINGS = [
  {
    tag: "Revenue leak",
    title: "1 in 3 leads never gets a reply",
    body: "Calls missed after hours, web forms sitting in an inbox, DMs nobody saw. The agent answers and qualifies every one in seconds — around the clock.",
  },
  {
    tag: "System gap",
    title: "Quotes go out and go quiet",
    body: "No second touch, no third. Won business slips to whoever followed up first. Adunda runs the cadence automatically until they book or decline.",
  },
  {
    tag: "Hidden cash",
    title: "Invoices age while you work",
    body: "Unpaid invoices and empty calendar slots are margin you already earned. The agents chase the money and backfill the gaps before the day starts.",
  },
];

const AGENTS = [
  { id: "lead", title: "Lead Response", body: "Answers, qualifies, and books every new lead in seconds — 24/7, across phone, text, and web." },
  { id: "followup", title: "Follow-Up & Reactivation", body: "Works \u201cget back to me later\u201d and dormant customers on a cadence until they convert or opt out." },
  { id: "schedule", title: "Scheduling & Dispatch", body: "Books, confirms, and reshuffles the calendar — and fills gaps the moment they open." },
  { id: "quote", title: "Quote & Invoice", body: "Chases open quotes and unpaid invoices on a schedule so cash stops slipping through." },
  { id: "reviews", title: "Reviews & Reputation", body: "Requests a review after every completed sale, routes the happy ones, flags the unhappy ones." },
];

/* -------------------------------------------------- helpers */

const clamp = (n: number, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, n));
const fmt = (n: number) => "$" + Math.round(n).toLocaleString("en-US");

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const fn = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener("change", fn);
    return () => mq.removeEventListener("change", fn);
  }, []);
  return reduced;
}

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

/** Animates a number toward `target` whenever target changes. */
function useCountUp(target: number, duration = 700) {
  const reduced = usePrefersReducedMotion();
  const [value, setValue] = useState(target);
  const fromRef = useRef(target);
  const rafRef = useRef(0);

  useEffect(() => {
    if (reduced) {
      setValue(target);
      fromRef.current = target;
      return;
    }
    const from = fromRef.current;
    const start = performance.now();
    cancelAnimationFrame(rafRef.current);
    const tick = (now: number) => {
      const t = clamp((now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      const v = from + (target - from) * eased;
      setValue(v);
      if (t < 1) rafRef.current = requestAnimationFrame(tick);
      else fromRef.current = target;
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target, duration, reduced]);

  return value;
}

/* -------------------------------------------------- LIVE agent feed (hero) */

type FeedEvent = { a: string; m: string; tone: "ok" | "accent" | "warn"; amt?: number };

const EVENT_POOL: FeedEvent[] = [
  { a: "Answered + qualified inbound lead", m: "Web form · 9 seconds", tone: "ok" },
  { a: "Booked appointment · Thu 2:00 PM", m: "Auto-confirmed via text", tone: "ok" },
  { a: "Follow-up sent on open quote", m: "Quote #4471 · $3,200", tone: "accent", amt: 3200 },
  { a: "Reactivated dormant customer", m: "Quiet 38 days · replied", tone: "accent", amt: 480 },
  { a: "Invoice reminder delivered", m: "Invoice #2210 · 14 days late", tone: "warn", amt: 1150 },
  { a: "Missed call returned by text", m: "After hours · 11:42 PM", tone: "ok" },
  { a: "Filled cancelled slot from waitlist", m: "Fri 10:00 AM · confirmed", tone: "accent", amt: 260 },
  { a: "Review request sent", m: "5-star received", tone: "ok" },
  { a: "Second touch on aging quote", m: "Quote #4468 · accepted", tone: "accent", amt: 1900 },
  { a: "Payment link re-sent", m: "Invoice #2214 · paid", tone: "ok", amt: 640 },
];

function timeStamp(offsetSec = 0) {
  const d = new Date(Date.now() - offsetSec * 1000);
  return d.toTimeString().slice(0, 8);
}

function LiveDashboard() {
  const reduced = usePrefersReducedMotion();
  const [rows, setRows] = useState(() =>
    EVENT_POOL.slice(0, 5).map((e, i) => ({ ...e, t: timeStamp((i + 1) * 47), id: i }))
  );
  const [handled, setHandled] = useState(42);
  const [recoveredTarget, setRecoveredTarget] = useState(18400);
  const recovered = useCountUp(recoveredTarget, 900);
  const idRef = useRef(5);
  const poolRef = useRef(5);

  useEffect(() => {
    const iv = setInterval(() => {
      const e = EVENT_POOL[poolRef.current % EVENT_POOL.length];
      poolRef.current += 1;
      idRef.current += 1;
      setRows((prev) => [{ ...e, t: timeStamp(), id: idRef.current }, ...prev].slice(0, 5));
      setHandled((h) => h + 1);
      if (e.amt) setRecoveredTarget((r) => r + e.amt!);
    }, 3200);
    return () => clearInterval(iv);
  }, []);

  return (
    <div className="glass glass-lift rounded-[28px] p-2 md:p-3">
      <div className="rounded-[22px] bg-white/55 border border-white/60 overflow-hidden">
        {/* window bar */}
        <div className="flex items-center gap-2 px-5 py-3 border-b border-black/5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
          <span className="w-2.5 h-2.5 rounded-full bg-[#febc2e]" />
          <span className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
          <span className="ml-3 font-mono text-[11px] text-[var(--muted)]">adunda · agent activity</span>
          <span className="ml-auto inline-flex items-center gap-1.5 font-mono text-[11px] text-[var(--muted)]">
            <span className="live-dot" /> live
          </span>
        </div>

        {/* stat strip */}
        <div className="grid grid-cols-3 divide-x divide-black/5 border-b border-black/5">
          <div className="px-5 py-4">
            <div className="text-xl md:text-2xl font-semibold tracking-tight tabular-nums">{handled}</div>
            <div className="mt-0.5 text-[11px] text-[var(--muted)]">Actions today</div>
          </div>
          <div className="px-5 py-4">
            <div className="text-xl md:text-2xl font-semibold tracking-tight tabular-nums">11s</div>
            <div className="mt-0.5 text-[11px] text-[var(--muted)]">Avg response</div>
          </div>
          <div className="px-5 py-4">
            <div className="text-xl md:text-2xl font-semibold tracking-tight tabular-nums grad-text">
              {fmt(recovered)}
            </div>
            <div className="mt-0.5 text-[11px] text-[var(--muted)]">Recovered this week</div>
          </div>
        </div>

        {/* activity feed */}
        <div className="divide-y divide-black/5" aria-live="off">
          {rows.map((r, i) => (
            <div
              key={r.id}
              className={`flex items-center gap-4 px-5 py-3 ${i === 0 && !reduced ? "feed-in" : ""}`}
            >
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

/* -------------------------------------------------- LEAK CALCULATOR */

function Slider({
  label,
  value,
  min,
  max,
  step,
  onChange,
  format,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  format: (v: number) => string;
}) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <label className="block">
      <div className="flex items-baseline justify-between">
        <span className="text-sm font-medium">{label}</span>
        <span className="font-mono text-sm font-semibold tabular-nums grad-text">{format(value)}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="slider mt-3 w-full"
        style={{ "--fill": `${pct}%` } as React.CSSProperties}
        aria-label={label}
      />
    </label>
  );
}

function LeakCalculator({ onBook }: { onBook: () => void }) {
  const [leads, setLeads] = useState(60); // new leads or inquiries / month
  const [value, setValue] = useState(900); // average sale value
  const [close, setClose] = useState(35); // close rate %

  // Conservative model: ~27% of inquiries never get a timely reply (industry
  // missed-call/slow-response data), and roughly half of those are winnable
  // at the stated close rate. Plus unchased quotes ≈ 12% of closed volume.
  const leak = useMemo(() => {
    const missed = leads * 0.27;
    const winnable = missed * 0.5 * (close / 100) * value;
    const unchased = leads * (close / 100) * value * 0.12;
    return (winnable + unchased) * 12;
  }, [leads, value, close]);

  const animated = useCountUp(leak, 650);
  const perMonth = animated / 12;

  return (
    <div className="glass rounded-[32px] p-7 md:p-12">
      <div className="grid lg:grid-cols-2 gap-10 lg:gap-14 items-center">
        {/* inputs */}
        <div className="space-y-8">
          <Slider
            label="New leads or inquiries per month"
            value={leads}
            min={10}
            max={400}
            step={5}
            onChange={setLeads}
            format={(v) => String(v)}
          />
          <Slider
            label="Average sale value"
            value={value}
            min={50}
            max={10000}
            step={50}
            onChange={setValue}
            format={(v) => fmt(v)}
          />
          <Slider
            label="Your close rate"
            value={close}
            min={5}
            max={80}
            step={5}
            onChange={setClose}
            format={(v) => `${v}%`}
          />
          <p className="text-xs text-[var(--muted)] leading-relaxed">
            Conservative estimate: assumes 27% of inquiries never get a timely reply, half of those
            were winnable, plus quotes lost to zero follow-up. Your free diagnostic replaces these
            assumptions with your real numbers.
          </p>
        </div>

        {/* output */}
        <div className="text-center lg:text-left">
          <span className="font-mono text-xs tracking-[0.2em] uppercase text-[var(--muted)]">
            Estimated annual leak
          </span>
          <div
            className="mt-2 text-5xl sm:text-6xl md:text-7xl font-semibold tracking-tight grad-text tabular-nums"
            aria-live="polite"
          >
            {fmt(animated)}
          </div>
          <p className="mt-3 text-[var(--muted)]">
            ≈ <span className="font-semibold text-[var(--ink)] tabular-nums">{fmt(perMonth)}</span> walking
            out the door every month.
          </p>
          <button onClick={onBook} className="btn-primary mt-7 inline-flex justify-center">
            Find my real number — free
          </button>
          <p className="mt-3 text-xs text-[var(--muted)]">
            The diagnostic runs on your actual data. No commitment.
          </p>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------- AGENT PICKER + PRICING */

function AgentPicker({ onBook }: { onBook: () => void }) {
  const [selected, setSelected] = useState<Record<string, boolean>>({
    lead: true,
    followup: true,
    schedule: false,
    quote: false,
    reviews: false,
  });

  const count = Object.values(selected).filter(Boolean).length;
  const allSelected = count === AGENTS.length;
  const rawTotal = count * AGENT_PRICE;
  const total = allSelected ? BUNDLE_PRICE : rawTotal;
  const savings = allSelected ? rawTotal - BUNDLE_PRICE : 0;
  const animatedTotal = useCountUp(total, 400);

  const toggle = useCallback((id: string) => {
    setSelected((s) => ({ ...s, [id]: !s[id] }));
  }, []);

  const selectAll = useCallback(() => {
    setSelected(Object.fromEntries(AGENTS.map((a) => [a.id, true])));
  }, []);

  return (
    <div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {AGENTS.map((a, i) => {
          const on = selected[a.id];
          return (
            <Reveal key={a.id} delay={(i % 3) * 80}>
              <button
                onClick={() => toggle(a.id)}
                aria-pressed={on}
                className={`agent-card glass rounded-[26px] p-7 h-full flex flex-col text-left w-full ${on ? "agent-on" : ""}`}
              >
                <span className="flex items-center justify-between">
                  <span
                    className="w-9 h-9 rounded-xl grid place-items-center"
                    style={{ background: "linear-gradient(135deg,var(--accent),var(--accent2))" }}
                  >
                    <span className="w-2.5 h-2.5 rounded-full bg-white/90" />
                  </span>
                  <span className={`agent-check ${on ? "checked" : ""}`} aria-hidden>
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path d="M2 6.2 5 9l5-6" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                </span>
                <h3 className="mt-5 text-lg font-semibold tracking-tight">{a.title}</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-[var(--muted)] flex-1">{a.body}</p>
                <span className="mt-4 font-mono text-sm font-semibold tabular-nums">
                  {fmt(AGENT_PRICE)}<span className="text-[var(--muted)] font-normal">/mo</span>
                </span>
              </button>
            </Reveal>
          );
        })}

        {/* custom slot */}
        <Reveal delay={160}>
          <div className="rounded-[26px] p-7 h-full flex flex-col border border-dashed border-black/15 bg-white/25">
            <span className="w-9 h-9 rounded-xl grid place-items-center border border-black/10 bg-white/60">
              <span className="text-lg leading-none text-[var(--muted)]">+</span>
            </span>
            <h3 className="mt-5 text-lg font-semibold tracking-tight">Custom workflow</h3>
            <p className="mt-2 text-[15px] leading-relaxed text-[var(--muted)] flex-1">
              Have a workflow that bleeds time? We tune a module to your data and plug it into the same dashboard.
            </p>
            <span className="mt-4 font-mono text-sm text-[var(--muted)]">Scoped on your call</span>
          </div>
        </Reveal>
      </div>

      {/* sticky-feel total bar */}
      <Reveal className="mt-8">
        <div className="glass rounded-[26px] px-6 py-5 md:px-8 flex flex-col sm:flex-row items-center gap-5">
          <div className="flex-1 text-center sm:text-left">
            <div className="text-sm text-[var(--muted)]">
              {count === 0
                ? "Select the agents that match your leaks"
                : allSelected
                ? "All agents — bundle price applied"
                : `${count} agent${count > 1 ? "s" : ""} selected`}
            </div>
            <div className="mt-1 flex items-baseline justify-center sm:justify-start gap-3">
              <span className="text-3xl md:text-4xl font-semibold tracking-tight tabular-nums grad-text">
                {fmt(animatedTotal)}<span className="text-base text-[var(--muted)] font-normal">/mo</span>
              </span>
              {savings > 0 && (
                <>
                  <span className="text-sm text-[var(--muted)] line-through tabular-nums">{fmt(rawTotal)}</span>
                  <span className="text-xs font-semibold px-2 py-1 rounded-full text-white" style={{ background: "linear-gradient(120deg,var(--accent),var(--accent2))" }}>
                    Save {fmt(savings)}
                  </span>
                </>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            {!allSelected && (
              <button onClick={selectAll} className="btn-ghost !text-sm">
                Select all · {fmt(BUNDLE_PRICE)}
              </button>
            )}
            <button onClick={onBook} className="btn-primary !text-sm justify-center">
              Start with the free diagnostic
            </button>
          </div>
        </div>
        <p className="mt-4 text-center text-xs text-[var(--muted)]">
          Every plan starts with the free diagnostic — you only turn on agents for leaks that actually exist.
        </p>
      </Reveal>
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
      <div className="meridian-track" aria-hidden />
      <div className="meridian-fill" style={{ height: `${p * 100}%` }} aria-hidden />

      <div className="relative space-y-16 md:space-y-24">
        {STEPS.map((s, i) => {
          const on = i <= activeIdx;
          return (
            <div key={s.k} className="relative flex flex-col items-center text-center">
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
                    Get my free diagnostic
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
          display: inline-flex;
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

        /* ---- live feed entrance ---- */
        .feed-in {
          animation: feedIn 0.5s cubic-bezier(0.2, 0.8, 0.2, 1);
        }
        @keyframes feedIn {
          from { opacity: 0; transform: translateY(-10px); background: rgba(10, 132, 255, 0.06); }
          to { opacity: 1; transform: none; background: transparent; }
        }

        /* ---- sliders ---- */
        .slider {
          -webkit-appearance: none;
          appearance: none;
          height: 6px;
          border-radius: 999px;
          background: linear-gradient(
              90deg,
              var(--accent) 0%,
              var(--accent2) var(--fill, 50%),
              rgba(0, 0, 0, 0.1) var(--fill, 50%)
            );
          outline-offset: 6px;
          cursor: pointer;
        }
        .slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 24px;
          height: 24px;
          border-radius: 999px;
          background: #fff;
          border: 1px solid rgba(0, 0, 0, 0.08);
          box-shadow: 0 3px 10px rgba(20, 24, 40, 0.22), 0 0 0 4px rgba(10, 132, 255, 0.1);
          transition: transform 0.15s ease, box-shadow 0.15s ease;
        }
        .slider::-webkit-slider-thumb:hover {
          transform: scale(1.12);
          box-shadow: 0 4px 14px rgba(20, 24, 40, 0.28), 0 0 0 6px rgba(10, 132, 255, 0.16);
        }
        .slider::-moz-range-thumb {
          width: 24px;
          height: 24px;
          border-radius: 999px;
          background: #fff;
          border: 1px solid rgba(0, 0, 0, 0.08);
          box-shadow: 0 3px 10px rgba(20, 24, 40, 0.22), 0 0 0 4px rgba(10, 132, 255, 0.1);
        }

        /* ---- agent picker ---- */
        .agent-card {
          cursor: pointer;
          transition: transform 0.35s cubic-bezier(0.2, 0.8, 0.2, 1),
            box-shadow 0.35s cubic-bezier(0.2, 0.8, 0.2, 1);
        }
        .agent-card:hover {
          transform: translateY(-4px);
        }
        .agent-card.agent-on {
          box-shadow: 0 0 0 2px var(--accent), 0 18px 50px rgba(10, 132, 255, 0.18),
            inset 0 1px 0 rgba(255, 255, 255, 0.9);
        }
        .agent-check {
          width: 24px;
          height: 24px;
          border-radius: 999px;
          border: 1.5px solid rgba(0, 0, 0, 0.15);
          display: grid;
          place-items: center;
          background: rgba(255, 255, 255, 0.6);
          transition: background 0.25s ease, border-color 0.25s ease, transform 0.25s ease;
        }
        .agent-check.checked {
          background: linear-gradient(120deg, var(--accent), var(--accent2));
          border-color: transparent;
          transform: scale(1.05);
        }
        .agent-check svg {
          opacity: 0;
          transform: scale(0.5);
          transition: opacity 0.2s ease, transform 0.2s ease;
        }
        .agent-check.checked svg {
          opacity: 1;
          transform: scale(1);
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
          .feed-in { animation: none; }
        }
        *:focus-visible {
          outline: 2px solid var(--accent);
          outline-offset: 3px;
          border-radius: 4px;
        }
      `}</style>

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
              <button onClick={() => scrollTo("calculator")} className="hover:text-[var(--ink)] transition">Your leak</button>
              <button onClick={() => scrollTo("pricing")} className="hover:text-[var(--ink)] transition">Pricing</button>
            </div>
            <div className="flex items-center gap-1 sm:gap-3">
              <Link href="/login" className="text-sm font-medium text-[var(--muted)] hover:text-[var(--ink)] transition px-2.5 py-2">Log in</Link>
              <button onClick={openDemo} className="btn-primary !py-2 !px-3.5 sm:!px-4 !text-sm whitespace-nowrap">Free diagnostic</button>
            </div>
          </div>
        </nav>

        {/* ---------------------------------------------- HERO */}
        <header className="px-5 pt-20 pb-16 md:pt-28 md:pb-24">
          <div className="max-w-5xl mx-auto text-center">
            <Reveal>
              <span className="inline-flex items-center gap-2 glass rounded-full px-4 py-1.5 text-xs font-medium text-[var(--muted)]">
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: "linear-gradient(120deg,var(--accent),var(--accent2))" }} />
                {BRAND} · AI revenue recovery for small business
              </span>
            </Reveal>

            <Reveal delay={80}>
              <h1 className="mt-7 text-[2.7rem] sm:text-6xl md:text-7xl font-semibold tracking-tight leading-[1.04]">
                Find the money your
                <br className="hidden sm:block" /> business is leaking.
                <span className="block grad-text">Then deploy agents that recover it.</span>
              </h1>
            </Reveal>

            <Reveal delay={180}>
              <p className="mt-7 text-lg md:text-xl text-[var(--muted)] max-w-2xl mx-auto leading-relaxed">
                {BRAND} runs a free diagnostic on your real numbers, shows you exactly where revenue
                slips out, then deploys tuned AI agents to close the gaps — {fmt(AGENT_PRICE)} per agent,
                or {fmt(BUNDLE_PRICE)} for all of them.
              </p>
            </Reveal>

            <Reveal delay={280}>
              <div className="mt-9 flex flex-col sm:flex-row gap-3 justify-center">
                <button onClick={openDemo} className="btn-primary justify-center">Get my free diagnostic</button>
                <button onClick={() => scrollTo("calculator")} className="btn-ghost justify-center">Estimate my leak</button>
              </div>
              <p className="mt-5 text-xs font-medium text-[var(--muted)]">
                Built for small business owners · Diagnostic is free · Agents live in days, not quarters
              </p>
            </Reveal>

            <Reveal delay={380} className="mt-16 md:mt-20 max-w-3xl mx-auto text-left">
              <LiveDashboard />
            </Reveal>
          </div>
        </header>

        {/* ---------------------------------------------- HOW / JOURNEY */}
        <section id="how" className="px-5 py-20 md:py-28 scroll-mt-24">
          <Reveal className="max-w-2xl mx-auto text-center mb-16 md:mb-24">
            <span className="font-mono text-xs tracking-[0.2em] uppercase grad-text font-semibold">The path</span>
            <h2 className="mt-3 text-3xl md:text-5xl font-semibold tracking-tight">
              From raw data to working agents.
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
                Same patterns across contractors, clinics, shops, and small B2B teams — invisible until someone counts them.
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

        {/* ---------------------------------------------- LEAK CALCULATOR */}
        <section id="calculator" className="px-5 py-20 md:py-28 scroll-mt-24">
          <div className="max-w-5xl mx-auto">
            <Reveal className="max-w-2xl mx-auto text-center mb-12">
              <span className="font-mono text-xs tracking-[0.2em] uppercase grad-text font-semibold">Your leak</span>
              <h2 className="mt-3 text-3xl md:text-5xl font-semibold tracking-tight">
                How much are you losing right now?
              </h2>
              <p className="mt-4 text-[var(--muted)] text-lg">
                Drag the sliders to your numbers. This is the rough estimate — the free diagnostic finds the exact figure.
              </p>
            </Reveal>
            <Reveal>
              <LeakCalculator onBook={openDemo} />
            </Reveal>
          </div>
        </section>

        {/* ---------------------------------------------- AGENTS + PRICING */}
        <section id="pricing" className="px-5 py-20 md:py-28 scroll-mt-24">
          <div className="max-w-5xl mx-auto">
            <Reveal className="max-w-2xl mb-14">
              <span className="font-mono text-xs tracking-[0.2em] uppercase grad-text font-semibold">Agents & pricing</span>
              <h2 className="mt-3 text-3xl md:text-5xl font-semibold tracking-tight">
                Pick your agents. Simple pricing.
              </h2>
              <p className="mt-4 text-[var(--muted)] text-lg">
                {fmt(AGENT_PRICE)}/month per agent, or {fmt(BUNDLE_PRICE)}/month for all of them. Tap the
                leaks you recognize — the price updates as you go.
              </p>
            </Reveal>
            <AgentPicker onBook={openDemo} />
          </div>
        </section>

        {/* ---------------------------------------------- FREE DIAGNOSTIC */}
        <section className="px-5 py-20 md:py-28">
          <div className="max-w-4xl mx-auto">
            <Reveal>
              <div className="glass rounded-[32px] p-8 md:p-12 text-center">
                <span className="font-mono text-xs tracking-[0.15em] uppercase text-[var(--muted)]">Step one, always</span>
                <div className="mt-3 flex items-end justify-center gap-2.5">
                  <span className="text-6xl md:text-7xl font-semibold tracking-tight grad-text">Free</span>
                  <span className="text-[var(--muted)] mb-2 text-sm">diagnostic · no commitment</span>
                </div>
                <p className="mt-4 text-[15px] md:text-base text-[var(--muted)] leading-relaxed max-w-xl mx-auto">
                  Bring your data and we run the full diagnostic on your real numbers — every leak, in
                  dollars, before you spend one. Then you decide which agents to turn on. Only pay for
                  leaks that actually exist.
                </p>
                <button onClick={openDemo} className="btn-primary justify-center w-full mt-9 max-w-md mx-auto">
                  Get my free diagnostic
                </button>
                <p className="mt-4 text-xs text-[var(--muted)]">
                  20-minute call · See your leaks before you decide · Agents from {fmt(AGENT_PRICE)}/mo
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
                Bring your data. We'll find the leaks live and show you the agents that plug them.
              </p>
              <button onClick={openDemo} className="btn-primary justify-center mt-8">
                Get my free diagnostic
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
