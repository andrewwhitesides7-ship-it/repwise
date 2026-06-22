"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";

/* ------------------------------------------------------------------ *
 * SalesWise — landing page  (app/page.tsx)
 * Style: Bauhaus, kinetic. Geometric primitives, primary palette,
 * bold strokes, orchestrated motion. Respects prefers-reduced-motion.
 * Palette: paper #F3EEE2  ink #15120D  red #E63327  blue #2A4BAE  yellow #F4C20D
 * ------------------------------------------------------------------ */

type FixKey = "speed" | "coaching" | "followup";

const SAMPLE_REPS = [
  { rep: "Michael Chang", leads: 60, respMin: 8, closed: 18 },
  { rep: "Sarah Jenkins", leads: 64, respMin: 22, closed: 14 },
  { rep: "Sophia Martinez", leads: 58, respMin: 47, closed: 9 },
  { rep: "Alex Rivera", leads: 70, respMin: 95, closed: 9 },
  { rep: "Emma Watson", leads: 55, respMin: 180, closed: 6 },
  { rep: "David Miller", leads: 52, respMin: 240, closed: 4 },
];

const FIXES: Record<FixKey, { title: string; monthly: number; note: string }> = {
  speed: {
    title: "Cut lead response time under 5 minutes",
    monthly: 16500,
    note: "Your slowest reps answer leads hours late and close at a third the rate. SalesWise auto-routes and pings them the second a lead lands.",
  },
  coaching: {
    title: "Coach the bottom third to team baseline",
    monthly: 19500,
    note: "Three reps close well below the team rate on the same lead volume — calculated from your own numbers, with the play to fix it.",
  },
  followup: {
    title: "Auto-sequence warm leads that go cold",
    monthly: 16500,
    note: "“Call me tomorrow” leads never get the second touch. SalesWise builds the cadence and runs it for you.",
  },
};

const FUNNEL = [
  { key: "leads", label: "Leads in", count: 1000, width: 100, leak: 0, usd: 0, fix: "" },
  { key: "fast", label: "Reached in time", count: 680, width: 72, leak: 320, usd: 96000, fix: "Speed-to-lead alerts fire the instant a lead lands, and auto-reassign if it's ignored." },
  { key: "qual", label: "Qualified", count: 520, width: 56, leak: 160, usd: 64000, fix: "Tighter discovery plays, calculated from the reps who already convert this stage." },
  { key: "won", label: "Closed", count: 190, width: 40, leak: 330, usd: 132000, fix: "Auto follow-up sequences re-touch every warm lead so none go cold." },
];

const fmtK = (n: number) => `$${Math.round(n / 1000)}K`;
const fmtResp = (m: number) => (m < 90 ? `${m}m` : `${(m / 60).toFixed(1)}h`);

/* -------------------------------------------------- animation helpers */

function useInView<T extends HTMLElement>(threshold = 0.15) {
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
  pop = false,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  pop?: boolean;
}) {
  const { ref, inView } = useInView<HTMLDivElement>();
  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={`${pop ? "reveal-pop" : "reveal"} ${inView ? "in" : ""} ${className}`}
    >
      {children}
    </div>
  );
}

function useCountUp(target: number, ms = 700) {
  const [v, setV] = useState(target);
  const from = useRef(target);
  useEffect(() => {
    const start = from.current;
    const t0 = performance.now();
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / ms);
      const eased = 1 - Math.pow(1 - p, 3);
      setV(start + (target - start) * eased);
      if (p < 1) raf = requestAnimationFrame(tick);
      else from.current = target;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, ms]);
  return v;
}

/* -------------------------------------------------- interactive funnel */

function Funnel() {
  const { ref, inView } = useInView<HTMLDivElement>(0.25);
  const [active, setActive] = useState<string | null>("won");
  const [plugged, setPlugged] = useState<Record<string, boolean>>({});

  const recovered = FUNNEL.reduce((s, st) => s + (plugged[st.key] ? st.usd : 0), 0);
  const animatedRecovered = useCountUp(recovered);
  const activeStage = FUNNEL.find((s) => s.key === active) || null;

  return (
    <div ref={ref}>
      {/* running recovered tally */}
      <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
        <div className="font-['Space_Mono'] text-xs font-bold uppercase tracking-widest text-[#2A4BAE]">
          Click a stage · seal the leak
        </div>
        <div className="font-['Space_Mono'] text-sm font-bold">
          Recovered:{" "}
          <span className="bg-[#F4C20D] px-2 py-0.5">{fmtK(animatedRecovered)}</span>
        </div>
      </div>

      <div className="space-y-4">
        {FUNNEL.map((st, i) => {
          const isActive = active === st.key;
          const isPlugged = !!plugged[st.key];
          return (
            <div key={st.key} className="relative">
              <button
                onClick={() => setActive(st.key)}
                className="block mx-auto group"
                style={{
                  width: inView ? `${st.width}%` : "0%",
                  transition: `width .9s cubic-bezier(.2,.8,.2,1) ${i * 90}ms`,
                }}
                aria-label={`${st.label}: ${st.count}`}
              >
                <div
                  className={`border-[3px] border-[#15120D] px-4 py-4 flex items-center justify-between transition-colors ${
                    isActive ? "bg-[#2A4BAE] text-white" : "bg-white text-[#15120D]"
                  } group-hover:-translate-y-0.5 transition-transform`}
                >
                  <span className="font-bold text-sm truncate">{st.label}</span>
                  <span className="font-['Space_Mono'] font-bold text-sm">{st.count}</span>
                </div>
              </button>

              {/* leak indicator */}
              {st.leak > 0 && (
                <div
                  className={`absolute right-0 top-1/2 -translate-y-1/2 translate-x-[105%] hidden lg:flex items-center gap-2 transition-opacity ${
                    isPlugged ? "opacity-40" : "opacity-100"
                  }`}
                >
                  <div className="relative w-4 h-10">
                    {!isPlugged &&
                      inView &&
                      [0, 1, 2].map((d) => (
                        <span
                          key={d}
                          aria-hidden
                          className="drip absolute left-1 w-2 h-2 bg-[#E63327]"
                          style={{ animationDelay: `${d * 0.7}s` }}
                        />
                      ))}
                  </div>
                  <span
                    className={`font-['Space_Mono'] text-xs font-bold whitespace-nowrap ${
                      isPlugged ? "line-through text-[#6b6557]" : "text-[#E63327]"
                    }`}
                  >
                    {isPlugged ? "sealed" : `−${st.leak} · ${fmtK(st.usd)}`}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* detail panel */}
      {activeStage && activeStage.leak > 0 && (
        <div key={activeStage.key} className="rise mt-8 bg-[#15120D] text-[#F3EEE2] border-[3px] border-[#15120D] p-6 md:p-8 flex flex-col md:flex-row md:items-center gap-5">
          <div className="flex-1">
            <div className="font-['Space_Mono'] text-xs font-bold uppercase tracking-widest text-[#F4C20D]">
              {activeStage.label} — leaking {fmtK(activeStage.usd)}/mo
            </div>
            <p className="mt-2 text-sm leading-relaxed opacity-90">{activeStage.fix}</p>
          </div>
          <button
            onClick={() =>
              setPlugged((p) => ({ ...p, [activeStage.key]: !p[activeStage.key] }))
            }
            className={`shrink-0 text-sm font-bold px-6 py-3 border-2 transition ${
              plugged[activeStage.key]
                ? "bg-[#F4C20D] text-[#15120D] border-[#F4C20D]"
                : "bg-[#E63327] text-white border-[#E63327] hover:bg-white hover:text-[#15120D] hover:border-white"
            }`}
          >
            {plugged[activeStage.key] ? "✓ Plugged" : "Plug this leak"}
          </button>
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------- marquee */

function Marquee() {
  const items = ["FIND THE LEAK", "FIX THE LEAK", "PLUG THE LEAK"];
  const Seq = () => (
    <div className="flex items-center">
      {items.concat(items).map((t, i) => (
        <span key={i} className="flex items-center">
          <span className="px-6 font-extrabold tracking-tight text-lg">{t}</span>
          <span aria-hidden className="flex items-center gap-1.5 px-2">
            <span className="w-3 h-3 rounded-full bg-[#E63327]" />
            <span className="w-0 h-0 border-l-[6px] border-r-[6px] border-b-[10px] border-l-transparent border-r-transparent border-b-[#F4C20D]" />
            <span className="w-3 h-3 bg-[#2A4BAE]" />
          </span>
        </span>
      ))}
    </div>
  );
  return (
    <div className="border-y-[3px] border-[#15120D] bg-[#15120D] text-[#F3EEE2] overflow-hidden py-3">
      <div className="marquee-track flex w-max">
        <Seq />
        <Seq />
      </div>
    </div>
  );
}

/* -------------------------------------------------- page */

export default function Landing() {
  const [loaded, setLoaded] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [fixes, setFixes] = useState<Record<FixKey, boolean>>({
    speed: true,
    coaching: true,
    followup: false,
  });

  const heroRef = useRef<HTMLElement>(null);
  const progRef = useRef<HTMLDivElement>(null);

  // scroll progress bar
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

  // hero cursor parallax
  const onHeroMove = (e: React.MouseEvent) => {
    const el = heroRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty("--mx", String((e.clientX - r.left) / r.width - 0.5));
    el.style.setProperty("--my", String((e.clientY - r.top) / r.height - 0.5));
  };
  const onHeroLeave = () => {
    const el = heroRef.current;
    if (!el) return;
    el.style.setProperty("--mx", "0");
    el.style.setProperty("--my", "0");
  };

  const scrollTo = (id: string) =>
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });

  const runAudit = () => {
    setScanning(true);
    setTimeout(() => {
      setLoaded(true);
      setScanning(false);
      scrollTo("audit");
    }, 800);
  };

  const toggleFix = (key: FixKey) =>
    setFixes((prev) => ({ ...prev, [key]: !prev[key] }));

  const monthlyRecovered = (Object.keys(FIXES) as FixKey[]).reduce(
    (sum, k) => sum + (fixes[k] ? FIXES[k].monthly : 0),
    0
  );
  const annualRecovered = useCountUp(monthlyRecovered * 12);

  return (
    <div className="min-h-screen bg-[#F3EEE2] text-[#15120D] font-['Poppins'] antialiased overflow-x-hidden">
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link
        href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;600;700;800&family=Space+Mono:wght@400;700&display=swap"
        rel="stylesheet"
      />

      <style jsx global>{`
        .reveal {
          opacity: 0;
          transform: translateY(26px);
          transition: opacity 0.6s cubic-bezier(0.2, 0.8, 0.2, 1),
            transform 0.6s cubic-bezier(0.2, 0.8, 0.2, 1);
        }
        .reveal.in {
          opacity: 1;
          transform: none;
        }
        .reveal-pop {
          opacity: 0;
          transform: scale(0.7) rotate(-6deg);
          transition: opacity 0.55s cubic-bezier(0.2, 0.8, 0.2, 1),
            transform 0.55s cubic-bezier(0.2, 0.8, 0.2, 1);
        }
        .reveal-pop.in {
          opacity: 1;
          transform: none;
        }
        .rise {
          animation: rise 0.55s cubic-bezier(0.2, 0.8, 0.2, 1) both;
        }
        .px1 {
          transform: translate(calc(var(--mx, 0) * 46px), calc(var(--my, 0) * 46px));
          transition: transform 0.25s ease-out;
        }
        .px2 {
          transform: translate(calc(var(--mx, 0) * -34px), calc(var(--my, 0) * 30px));
          transition: transform 0.25s ease-out;
        }
        .px3 {
          transform: translate(calc(var(--mx, 0) * 22px), calc(var(--my, 0) * -26px));
          transition: transform 0.25s ease-out;
        }
        @keyframes rise {
          from { opacity: 0; transform: translateY(22px); }
          to { opacity: 1; transform: none; }
        }
        @keyframes floaty {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-16px) rotate(8deg); }
        }
        @keyframes spinslow { to { transform: rotate(360deg); } }
        @keyframes marquee { to { transform: translateX(-50%); } }
        @keyframes drip {
          0% { transform: translateY(-6px); opacity: 0; }
          15% { opacity: 1; }
          100% { transform: translateY(34px); opacity: 0; }
        }
        @media (prefers-reduced-motion: no-preference) {
          .floaty { animation: floaty 7s ease-in-out infinite; }
          .floaty2 { animation: floaty 9s ease-in-out infinite reverse; }
          .spinslow { animation: spinslow 24s linear infinite; }
          .marquee-track { animation: marquee 26s linear infinite; }
          .drip { animation: drip 2.1s linear infinite; }
        }
        @media (prefers-reduced-motion: reduce) {
          .reveal, .reveal-pop { opacity: 1 !important; transform: none !important; }
        }
      `}</style>

      {/* scroll progress */}
      <div
        ref={progRef}
        className="fixed top-0 left-0 right-0 h-1 bg-[#E63327] z-[60] origin-left"
        style={{ transform: "scaleX(0)" }}
      />

      {/* ------------------------------------------------- NAV */}
      <nav className="sticky top-0 z-50 bg-[#F3EEE2]/90 backdrop-blur-sm border-b-[3px] border-[#15120D]">
        <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <span aria-hidden className="flex items-center gap-1">
              <span className="w-3.5 h-3.5 rounded-full bg-[#E63327] spinslow" />
              <span className="w-0 h-0 border-l-[7px] border-r-[7px] border-b-[12px] border-l-transparent border-r-transparent border-b-[#F4C20D]" />
              <span className="w-3.5 h-3.5 bg-[#2A4BAE]" />
            </span>
            <span className="text-lg font-extrabold tracking-tight">SalesWise</span>
          </Link>
          <div className="flex items-center gap-5">
            <button
              onClick={() => scrollTo("audit")}
              className="hidden sm:block text-sm font-semibold hover:text-[#E63327] transition"
            >
              See it work
            </button>
            <Link
              href="/signup"
              className="bg-[#15120D] text-[#F3EEE2] text-sm font-bold px-4 py-2 border-2 border-[#15120D] hover:bg-[#E63327] hover:border-[#E63327] transition"
            >
              Start free audit
            </Link>
          </div>
        </div>
      </nav>

      {/* ------------------------------------------------- HERO */}
      <header
        ref={heroRef}
        onMouseMove={onHeroMove}
        onMouseLeave={onHeroLeave}
        className="relative overflow-hidden border-b-[3px] border-[#15120D]"
      >
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="px1 absolute -right-16 -top-16">
            <div className="floaty w-72 h-72 rounded-full bg-[#E63327]" />
          </div>
          <div className="px2 absolute right-40 top-28 hidden md:block">
            <div className="floaty2 w-28 h-28 bg-[#2A4BAE]" />
          </div>
          <div className="px3 absolute right-4 bottom-4 hidden md:block">
            <div className="spinslow w-0 h-0 border-l-[80px] border-b-[80px] border-l-transparent border-b-[#F4C20D]" />
          </div>
        </div>

        <div className="relative max-w-6xl mx-auto px-5 pt-20 pb-24 md:pt-28 md:pb-32">
          <div className="rise inline-flex items-center gap-2 border-2 border-[#15120D] px-3 py-1 text-xs font-bold uppercase tracking-wider mb-8">
            <span className="w-2 h-2 rounded-full bg-[#E63327]" /> Find the money leaking out of your funnel
          </div>

          <h1 className="text-5xl sm:text-6xl md:text-7xl font-extrabold tracking-tight leading-[0.95] max-w-3xl">
            <span className="rise block" style={{ animationDelay: "60ms" }}>
              Your CRM stores data.
            </span>
            <span className="rise block text-[#E63327]" style={{ animationDelay: "180ms" }}>
              SalesWise recovers the cash.
            </span>
          </h1>

          <p
            className="rise mt-7 text-lg md:text-xl text-[#3b362d] max-w-xl font-normal leading-relaxed"
            style={{ animationDelay: "300ms" }}
          >
            Upload your sales data and SalesWise pinpoints exactly where you're losing money
            across the funnel — reps, leads, response time — hands you the fix, and can build
            the systems to plug the gaps automatically.
          </p>

          <div className="rise mt-9 flex flex-col sm:flex-row gap-3 max-w-md" style={{ animationDelay: "420ms" }}>
            <button
              onClick={runAudit}
              disabled={scanning}
              className="flex-1 bg-[#E63327] text-white text-sm font-bold px-7 py-4 border-2 border-[#15120D] hover:bg-[#15120D] transition disabled:opacity-70 active:translate-y-0.5"
            >
              {scanning ? "Scanning…" : "Drop your sales CSV"}
            </button>
            <Link
              href="/signup"
              className="flex-1 text-center bg-transparent text-[#15120D] text-sm font-bold px-7 py-4 border-2 border-[#15120D] hover:bg-[#15120D] hover:text-[#F3EEE2] transition"
            >
              Create account
            </Link>
          </div>
          <p className="rise mt-4 text-xs font-semibold text-[#6b6557] uppercase tracking-wider" style={{ animationDelay: "520ms" }}>
            Under 2 minutes · Any spreadsheet export · First audit free
          </p>
        </div>
      </header>

      <Marquee />

      {/* ------------------------------------------------- HOW */}
      <section className="border-b-[3px] border-[#15120D]">
        <div className="max-w-6xl mx-auto grid md:grid-cols-3 divide-y-[3px] md:divide-y-0 md:divide-x-[3px] divide-[#15120D]">
          {[
            { n: "01", t: "Upload your sales data", d: "Drag in any CSV or CRM export. We read the messy columns — reps, leads, timestamps, outcomes — so you don't clean a thing." },
            { n: "02", t: "Find every leak in the funnel", d: "The engine pinpoints exactly where money is lost: slow lead response, under-performing reps, follow-ups that never happened." },
            { n: "03", t: "Fix it — or let SalesWise plug it", d: "Every insight comes with the strategy and the play. For the biggest gaps, SalesWise builds the system that plugs them automatically." },
          ].map((s, i) => (
            <Reveal key={s.n} delay={i * 90} className="p-8 md:p-10">
              <div className="font-['Space_Mono'] text-3xl font-bold text-[#E63327]">{s.n}</div>
              <h3 className="mt-3 text-xl font-bold">{s.t}</h3>
              <p className="mt-2 text-sm text-[#3b362d] leading-relaxed">{s.d}</p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ------------------------------------------------- INSIGHT TYPES */}
      <section className="border-b-[3px] border-[#15120D] py-20 px-5">
        <div className="max-w-6xl mx-auto">
          <Reveal>
            <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight max-w-2xl leading-tight">
              Every insight gets a shape and a stake.
            </h2>
            <p className="mt-4 text-base text-[#3b362d] max-w-xl">
              Three priorities, three primitives. You always know what's bleeding and what to fix first.
            </p>
          </Reveal>

          <div className="mt-12 grid md:grid-cols-3 gap-5">
            <Reveal pop delay={0}>
              <article className="bg-white border-[3px] border-[#15120D] p-7 h-full hover:-translate-y-1 transition-transform">
                <div aria-hidden className="w-12 h-12 rounded-full bg-[#E63327] mb-5" />
                <div className="text-xs font-bold uppercase tracking-widest text-[#E63327]">Critical</div>
                <p className="mt-2 font-bold leading-snug">Your slowest responders are your weakest closers.</p>
                <p className="mt-2 text-sm text-[#3b362d] leading-relaxed">
                  David answers leads 4 hours late and closes at 8% — a third of the team baseline. Speed-to-lead is the leak.
                </p>
              </article>
            </Reveal>
            <Reveal pop delay={120}>
              <article className="bg-white border-[3px] border-[#15120D] p-7 h-full hover:-translate-y-1 transition-transform">
                <div aria-hidden className="w-0 h-0 border-l-[24px] border-r-[24px] border-b-[42px] border-l-transparent border-r-transparent border-b-[#F4C20D] mb-5" />
                <div className="text-xs font-bold uppercase tracking-widest text-[#b8900a]">Opportunity</div>
                <p className="mt-2 font-bold leading-snug">The 2pm window closes 3x faster than 9am.</p>
                <p className="mt-2 text-sm text-[#3b362d] leading-relaxed">
                  Your top reps already work it. Shift the rest of the team's hours and capture the same lift.
                </p>
              </article>
            </Reveal>
            <Reveal pop delay={240}>
              <article className="bg-white border-[3px] border-[#15120D] p-7 h-full hover:-translate-y-1 transition-transform">
                <div aria-hidden className="w-11 h-11 bg-[#2A4BAE] mb-5" />
                <div className="text-xs font-bold uppercase tracking-widest text-[#2A4BAE]">Pattern</div>
                <p className="mt-2 font-bold leading-snug">“Call me tomorrow” leads almost never get called.</p>
                <p className="mt-2 text-sm text-[#3b362d] leading-relaxed">
                  Reps chase fresh leads instead. SalesWise can build the follow-up sequence and run it automatically.
                </p>
              </article>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------- INTERACTIVE FUNNEL */}
      <section className="border-b-[3px] border-[#15120D] py-20 px-5 bg-white">
        <div className="max-w-3xl mx-auto">
          <Reveal>
            <div className="font-['Space_Mono'] text-xs font-bold uppercase tracking-widest text-[#E63327]">
              Interactive
            </div>
            <h2 className="mt-1 text-3xl md:text-5xl font-extrabold tracking-tight">
              Watch the funnel leak. Then seal it.
            </h2>
            <p className="mt-4 text-base text-[#3b362d]">
              Every stage loses revenue somewhere. Tap a stage to see the leak — and plug it.
            </p>
          </Reveal>
          <div className="mt-12">
            <Funnel />
          </div>
        </div>
      </section>

      {/* ------------------------------------------------- AUDIT */}
      <section id="audit" className="border-b-[3px] border-[#15120D] py-20 px-5 scroll-mt-20">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <Reveal>
              <div className="font-['Space_Mono'] text-xs font-bold uppercase tracking-widest text-[#E63327]">
                Live model
              </div>
              <h2 className="mt-1 text-3xl md:text-5xl font-extrabold tracking-tight">
                Run the numbers on a sample team.
              </h2>
            </Reveal>
            {loaded && (
              <button
                onClick={() => setLoaded(false)}
                className="text-sm font-bold underline underline-offset-4 hover:text-[#E63327] self-start"
              >
                Reset
              </button>
            )}
          </div>

          {!loaded ? (
            <Reveal>
              <div className="mt-10 bg-white border-[3px] border-[#15120D] p-10 md:p-16 text-center">
                <div aria-hidden className="mx-auto mb-6 flex items-center justify-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-[#E63327] spinslow" />
                  <span className="w-0 h-0 border-l-[12px] border-r-[12px] border-b-[20px] border-l-transparent border-r-transparent border-b-[#F4C20D]" />
                  <span className="w-6 h-6 bg-[#2A4BAE]" />
                </div>
                <p className="text-base font-semibold max-w-md mx-auto">
                  Load a one-month sample of six reps and see what the engine flags.
                </p>
                <button
                  onClick={runAudit}
                  disabled={scanning}
                  className="mt-7 bg-[#15120D] text-[#F3EEE2] text-sm font-bold px-7 py-4 border-2 border-[#15120D] hover:bg-[#E63327] hover:border-[#E63327] transition disabled:opacity-70"
                >
                  {scanning ? "Scanning…" : "Run the audit"}
                </button>
              </div>
            </Reveal>
          ) : (
            <div className="mt-10 grid lg:grid-cols-5 gap-5 items-start">
              <div className="lg:col-span-2 bg-white border-[3px] border-[#15120D]">
                <div className="px-5 py-3 border-b-[3px] border-[#15120D] font-['Space_Mono'] text-xs font-bold uppercase tracking-widest">
                  Sample upload · 6 reps
                </div>
                <div className="divide-y-2 divide-[#15120D]/10">
                  {SAMPLE_REPS.map((r, i) => {
                    const rate = Math.round((r.closed / r.leads) * 100);
                    const weak = rate < 14;
                    const slow = r.respMin > 60;
                    return (
                      <div
                        key={r.rep}
                        className="rise px-5 py-3 flex items-center justify-between text-sm gap-3"
                        style={{ animationDelay: `${i * 70}ms` }}
                      >
                        <div className="min-w-0">
                          <div className="font-bold truncate">{r.rep}</div>
                          <div className="font-['Space_Mono'] text-xs text-[#6b6557]">
                            {r.leads} leads ·{" "}
                            <span className={slow ? "text-[#E63327] font-bold" : ""}>
                              {fmtResp(r.respMin)} response
                            </span>
                          </div>
                        </div>
                        <span
                          className={`font-['Space_Mono'] text-sm font-bold px-2 py-0.5 whitespace-nowrap ${
                            weak ? "bg-[#E63327] text-white" : "text-[#15120D]"
                          }`}
                        >
                          {rate}%
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="lg:col-span-3 space-y-5">
                <div className="bg-[#15120D] text-[#F3EEE2] border-[3px] border-[#15120D] p-7">
                  <div className="font-['Space_Mono'] text-xs font-bold uppercase tracking-widest text-[#F4C20D]">
                    Recoverable revenue
                  </div>
                  <div className="mt-1 flex items-end gap-3 flex-wrap">
                    <span className="font-['Space_Mono'] text-5xl md:text-6xl font-bold tabular-nums">
                      {fmtK(annualRecovered)}
                    </span>
                    <span className="text-sm font-semibold mb-2 opacity-70">/ year</span>
                  </div>
                  <p className="mt-1 text-sm opacity-70 font-['Space_Mono']">
                    {fmtK(monthlyRecovered)} / month · toggle the fixes below
                  </p>
                </div>

                <div className="space-y-3">
                  {(Object.keys(FIXES) as FixKey[]).map((key) => {
                    const f = FIXES[key];
                    const on = fixes[key];
                    return (
                      <button
                        key={key}
                        onClick={() => toggleFix(key)}
                        className={`w-full text-left flex items-start gap-4 p-5 border-[3px] border-[#15120D] transition ${
                          on ? "bg-white" : "bg-transparent hover:bg-white/40"
                        }`}
                      >
                        <span
                          aria-hidden
                          className={`mt-0.5 w-6 h-6 flex-shrink-0 border-2 border-[#15120D] flex items-center justify-center font-bold transition-colors ${
                            on ? "bg-[#2A4BAE] text-white" : "bg-transparent"
                          }`}
                        >
                          {on ? "✓" : ""}
                        </span>
                        <span className="flex-1 min-w-0">
                          <span className="block font-bold leading-snug">{f.title}</span>
                          <span className="block mt-1 text-sm text-[#3b362d] leading-relaxed">{f.note}</span>
                        </span>
                        <span className="font-['Space_Mono'] text-sm font-bold text-[#E63327] whitespace-nowrap">
                          +{fmtK(f.monthly)}/mo
                        </span>
                      </button>
                    );
                  })}
                </div>
                <p className="text-xs text-[#6b6557] font-['Space_Mono']">
                  Illustrative model derived from the sample data. Your real numbers come from your own upload.
                </p>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ------------------------------------------------- AUTOMATION */}
      <section className="border-b-[3px] border-[#15120D] py-20 px-5">
        <div className="max-w-6xl mx-auto">
          <Reveal>
            <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight max-w-2xl leading-tight">
              It doesn't stop at the insight.
            </h2>
            <p className="mt-4 text-base text-[#3b362d] max-w-xl">
              For your biggest leaks, SalesWise builds the small systems that plug them — no extra tools to buy, no setup project.
            </p>
          </Reveal>

          <div className="mt-12 grid md:grid-cols-3 gap-5">
            {[
              { c: "bg-[#E63327]", round: "rounded-full", t: "Speed-to-lead alerts", d: "A new lead lands and the right rep gets pinged instantly. Ignored too long? It auto-reassigns." },
              { c: "bg-[#F4C20D]", round: "", t: "Follow-up sequences", d: "Warm leads get a scheduled multi-touch cadence, so “call me later” never turns into never." },
              { c: "bg-[#2A4BAE]", round: "", t: "Rep scorecards", d: "Weekly performance numbers generated automatically — coach off data, not gut feel." },
            ].map((x, i) => (
              <Reveal key={x.t} pop delay={i * 120}>
                <article className="border-[3px] border-[#15120D] p-7 bg-[#F3EEE2] h-full hover:-translate-y-1 transition-transform">
                  <div aria-hidden className={`w-9 h-9 mb-5 ${x.c} ${x.round}`} />
                  <h3 className="font-bold leading-snug">{x.t}</h3>
                  <p className="mt-2 text-sm text-[#3b362d] leading-relaxed">{x.d}</p>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <Marquee />

      {/* ------------------------------------------------- FOUNDER */}
      <section className="border-b-[3px] border-[#15120D] py-20 px-5">
        <Reveal className="max-w-3xl mx-auto">
          <span aria-hidden className="block w-10 h-10 rounded-full bg-[#E63327] mb-7" />
          <blockquote className="text-2xl md:text-3xl font-semibold leading-snug tracking-tight">
            I built SalesWise because I was sick of software that demanded hours of data entry
            from reps and gave back zero guidance. You don't need another CRM to babysit —
            you need to find the revenue you already earned and dropped, and plug the hole.
          </blockquote>
          <div className="mt-7 flex items-center justify-between border-t-[3px] border-[#15120D] pt-5">
            <div>
              <div className="font-bold">Andrew Whitesides</div>
              <div className="text-xs font-semibold uppercase tracking-widest text-[#6b6557]">
                Founder, SalesWise
              </div>
            </div>
            <a
              href="mailto:andrew@trysaleswise.com"
              className="text-sm font-bold text-[#2A4BAE] hover:underline underline-offset-4"
            >
              andrew@trysaleswise.com
            </a>
          </div>
        </Reveal>
      </section>

      {/* ------------------------------------------------- PRICING */}
      <section className="border-b-[3px] border-[#15120D] py-20 px-5">
        <Reveal className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight">One flat price.</h2>
          <p className="mt-3 text-base text-[#3b362d] max-w-md mx-auto">
            Whole team. Every seat. No per-rep math, no usage caps.
          </p>

          <div className="mt-12 bg-[#15120D] text-[#F3EEE2] border-[3px] border-[#15120D] p-8 md:p-10 text-left relative hover:-translate-y-1 transition-transform">
            <span className="absolute top-7 right-7 bg-[#F4C20D] text-[#15120D] text-[10px] font-bold uppercase tracking-widest px-2 py-1">
              Full recovery license
            </span>
            <span aria-hidden className="flex items-center gap-1.5 mb-6">
              <span className="w-5 h-5 rounded-full bg-[#E63327] spinslow" />
              <span className="w-0 h-0 border-l-[10px] border-r-[10px] border-b-[17px] border-l-transparent border-r-transparent border-b-[#F4C20D]" />
              <span className="w-5 h-5 bg-[#2A4BAE]" />
            </span>

            <div className="flex items-end gap-1.5">
              <span className="font-['Space_Mono'] text-6xl font-bold">$500</span>
              <span className="text-sm font-semibold mb-2 opacity-70">/month</span>
            </div>

            <ul className="mt-7 space-y-3 text-sm border-t border-white/15 pt-6">
              {[
                "Unlimited uploads + full-funnel leak analysis",
                "Reps, leads, response time, follow-up — every gap",
                "Prioritized fixes with step-by-step plays",
                "Automated systems built to plug your top leaks",
                "Unlimited seats & managers — flat, no per-seat fees",
                "CRM imports (HubSpot, Salesforce, Pipedrive)",
              ].map((x) => (
                <li key={x} className="flex gap-3">
                  <span aria-hidden className="mt-1.5 w-2 h-2 bg-[#F4C20D] flex-shrink-0" />
                  {x}
                </li>
              ))}
            </ul>

            <Link
              href="/signup"
              className="mt-8 block text-center bg-[#E63327] text-white text-sm font-bold py-4 border-2 border-[#E63327] hover:bg-[#F4C20D] hover:text-[#15120D] hover:border-[#F4C20D] transition"
            >
              Start your free audit
            </Link>
          </div>

          <p className="mt-6 text-xs text-[#6b6557] max-w-sm mx-auto leading-relaxed">
            30-day money-back guarantee. If SalesWise doesn't surface a leak worth multiples of the
            subscription, email Andrew for a refund.
          </p>
        </Reveal>
      </section>

      {/* ------------------------------------------------- FOOTER */}
      <footer className="py-12 px-5">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <span aria-hidden className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-full bg-[#E63327]" />
              <span className="w-0 h-0 border-l-[6px] border-r-[6px] border-b-[10px] border-l-transparent border-r-transparent border-b-[#F4C20D]" />
              <span className="w-3 h-3 bg-[#2A4BAE]" />
            </span>
            <span className="font-bold">SalesWise</span>
          </div>
          <p className="text-xs font-['Space_Mono'] text-[#6b6557]">
            © 2026 SalesWise · Find the leak. Fix the leak.
          </p>
        </div>
      </footer>
    </div>
  );
}
