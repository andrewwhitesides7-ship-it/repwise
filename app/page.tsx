"use client";

import { useState } from "react";
import Link from "next/link";

/* ------------------------------------------------------------------ *
 * SalesWise — landing page  (app/page.tsx)
 * Style: Bauhaus. Geometric primitives, primary palette, bold strokes.
 * Positioning: find where money leaks across the sales funnel
 *   (reps, leads, response time, follow-up), hand back the fix, and
 *   build the small systems that plug the gap automatically.
 * Signature: the three insight tags ARE the three Bauhaus primitives.
 *   Critical    -> circle    (red)
 *   Opportunity -> triangle  (yellow)
 *   Pattern     -> square    (blue)
 *
 * Palette: paper #F3EEE2  ink #15120D  red #E63327  blue #2A4BAE  yellow #F4C20D
 * ------------------------------------------------------------------ */

type FixKey = "speed" | "coaching" | "followup";

// Illustrative sample team — what a manager sees after one upload.
const SAMPLE_REPS = [
  { rep: "Michael Chang", leads: 60, respMin: 8, closed: 18, revenue: 142000 },
  { rep: "Sarah Jenkins", leads: 64, respMin: 22, closed: 14, revenue: 104000 },
  { rep: "Sophia Martinez", leads: 58, respMin: 47, closed: 9, revenue: 100000 },
  { rep: "Alex Rivera", leads: 70, respMin: 95, closed: 9, revenue: 95000 },
  { rep: "Emma Watson", leads: 55, respMin: 180, closed: 6, revenue: 70000 },
  { rep: "David Miller", leads: 52, respMin: 240, closed: 4, revenue: 42000 },
];

// Recoverable revenue per fix, per month (illustrative model on the sample team).
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

const fmtK = (n: number) => `$${Math.round(n / 1000)}K`;
const fmtResp = (m: number) => (m < 90 ? `${m}m` : `${(m / 60).toFixed(1)}h`);

export default function Landing() {
  const [loaded, setLoaded] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [fixes, setFixes] = useState<Record<FixKey, boolean>>({
    speed: true,
    coaching: true,
    followup: false,
  });

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
  const annualRecovered = monthlyRecovered * 12;

  return (
    <div className="min-h-screen bg-[#F3EEE2] text-[#15120D] font-['Poppins'] antialiased">
      {/* fonts kept in-component so this is a true drop-in — no layout.tsx edit needed */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link
        href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;600;700;800&family=Space+Mono:wght@400;700&display=swap"
        rel="stylesheet"
      />

      {/* ----------------------------------------------------------- NAV */}
      <nav className="sticky top-0 z-50 bg-[#F3EEE2]/90 backdrop-blur-sm border-b-[3px] border-[#15120D]">
        <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <span aria-hidden className="flex items-center gap-1">
              <span className="w-3.5 h-3.5 rounded-full bg-[#E63327]" />
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

      {/* ----------------------------------------------------------- HERO */}
      <header className="relative overflow-hidden border-b-[3px] border-[#15120D]">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute -right-16 -top-16 w-72 h-72 rounded-full bg-[#E63327]" />
          <div className="absolute right-40 top-28 w-28 h-28 bg-[#2A4BAE] hidden md:block" />
          <div className="absolute right-0 bottom-0 w-0 h-0 border-l-[160px] border-b-[160px] border-l-transparent border-b-[#F4C20D] hidden md:block" />
        </div>

        <div className="relative max-w-6xl mx-auto px-5 pt-20 pb-24 md:pt-28 md:pb-32">
          <div className="inline-flex items-center gap-2 border-2 border-[#15120D] px-3 py-1 text-xs font-bold uppercase tracking-wider mb-8">
            <span className="w-2 h-2 rounded-full bg-[#E63327]" /> Find the money leaking out of your funnel
          </div>

          <h1 className="text-5xl sm:text-6xl md:text-7xl font-extrabold tracking-tight leading-[0.95] max-w-3xl">
            Your CRM stores data.
            <br />
            <span className="text-[#E63327]">SalesWise recovers the cash.</span>
          </h1>

          <p className="mt-7 text-lg md:text-xl text-[#3b362d] max-w-xl font-normal leading-relaxed">
            Upload your sales data and SalesWise pinpoints exactly where you're losing money
            across the funnel — reps, leads, response time — hands you the fix, and can build
            the systems to plug the gaps automatically.
          </p>

          <div className="mt-9 flex flex-col sm:flex-row gap-3 max-w-md">
            <button
              onClick={runAudit}
              disabled={scanning}
              className="flex-1 bg-[#E63327] text-white text-sm font-bold px-7 py-4 border-2 border-[#15120D] hover:bg-[#15120D] transition disabled:opacity-70"
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
          <p className="mt-4 text-xs font-semibold text-[#6b6557] uppercase tracking-wider">
            Under 2 minutes · Any spreadsheet export · First audit free
          </p>
        </div>
      </header>

      {/* ----------------------------------------------------------- HOW (real 3-step sequence) */}
      <section className="border-b-[3px] border-[#15120D]">
        <div className="max-w-6xl mx-auto grid md:grid-cols-3 divide-y-[3px] md:divide-y-0 md:divide-x-[3px] divide-[#15120D]">
          {[
            { n: "01", t: "Upload your sales data", d: "Drag in any CSV or CRM export. We read the messy columns — reps, leads, timestamps, outcomes — so you don't clean a thing." },
            { n: "02", t: "Find every leak in the funnel", d: "The engine pinpoints exactly where money is lost: slow lead response, under-performing reps, follow-ups that never happened." },
            { n: "03", t: "Fix it — or let SalesWise plug it", d: "Every insight comes with the strategy and the play. For the biggest gaps, SalesWise builds the system that plugs them automatically." },
          ].map((s) => (
            <div key={s.n} className="p-8 md:p-10">
              <div className="font-['Space_Mono'] text-3xl font-bold text-[#E63327]">{s.n}</div>
              <h3 className="mt-3 text-xl font-bold">{s.t}</h3>
              <p className="mt-2 text-sm text-[#3b362d] leading-relaxed">{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ----------------------------------------------------------- INSIGHT TYPES (the signature) */}
      <section className="border-b-[3px] border-[#15120D] py-20 px-5">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight max-w-2xl leading-tight">
            Every insight gets a shape and a stake.
          </h2>
          <p className="mt-4 text-base text-[#3b362d] max-w-xl">
            Three priorities, three primitives. You always know what's bleeding and what to fix first.
          </p>

          <div className="mt-12 grid md:grid-cols-3 gap-5">
            {/* Critical — circle */}
            <article className="bg-white border-[3px] border-[#15120D] p-7">
              <div aria-hidden className="w-12 h-12 rounded-full bg-[#E63327] mb-5" />
              <div className="text-xs font-bold uppercase tracking-widest text-[#E63327]">Critical</div>
              <p className="mt-2 font-bold leading-snug">
                Your slowest responders are your weakest closers.
              </p>
              <p className="mt-2 text-sm text-[#3b362d] leading-relaxed">
                David answers leads 4 hours late and closes at 8% — a third of the team baseline. Speed-to-lead is the leak.
              </p>
            </article>

            {/* Opportunity — triangle */}
            <article className="bg-white border-[3px] border-[#15120D] p-7">
              <div aria-hidden className="w-0 h-0 border-l-[24px] border-r-[24px] border-b-[42px] border-l-transparent border-r-transparent border-b-[#F4C20D] mb-5" />
              <div className="text-xs font-bold uppercase tracking-widest text-[#b8900a]">Opportunity</div>
              <p className="mt-2 font-bold leading-snug">
                The 2pm window closes 3x faster than 9am.
              </p>
              <p className="mt-2 text-sm text-[#3b362d] leading-relaxed">
                Your top reps already work it. Shift the rest of the team's hours and capture the same lift.
              </p>
            </article>

            {/* Pattern — square */}
            <article className="bg-white border-[3px] border-[#15120D] p-7">
              <div aria-hidden className="w-11 h-11 bg-[#2A4BAE] mb-5" />
              <div className="text-xs font-bold uppercase tracking-widest text-[#2A4BAE]">Pattern</div>
              <p className="mt-2 font-bold leading-snug">
                “Call me tomorrow” leads almost never get called.
              </p>
              <p className="mt-2 text-sm text-[#3b362d] leading-relaxed">
                Reps chase fresh leads instead. SalesWise can build the follow-up sequence and run it automatically.
              </p>
            </article>
          </div>
        </div>
      </section>

      {/* ----------------------------------------------------------- INTERACTIVE AUDIT */}
      <section id="audit" className="border-b-[3px] border-[#15120D] py-20 px-5 scroll-mt-20">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div>
              <div className="font-['Space_Mono'] text-xs font-bold uppercase tracking-widest text-[#E63327]">
                Live model
              </div>
              <h2 className="mt-1 text-3xl md:text-5xl font-extrabold tracking-tight">
                Run the numbers on a sample team.
              </h2>
            </div>
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
            <div className="mt-10 bg-white border-[3px] border-[#15120D] p-10 md:p-16 text-center">
              <div aria-hidden className="mx-auto mb-6 flex items-center justify-center gap-2">
                <span className="w-6 h-6 rounded-full bg-[#E63327]" />
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
          ) : (
            <div className="mt-10 grid lg:grid-cols-5 gap-5 items-start">
              {/* sample table */}
              <div className="lg:col-span-2 bg-white border-[3px] border-[#15120D]">
                <div className="px-5 py-3 border-b-[3px] border-[#15120D] font-['Space_Mono'] text-xs font-bold uppercase tracking-widest">
                  Sample upload · 6 reps
                </div>
                <div className="divide-y-2 divide-[#15120D]/10">
                  {SAMPLE_REPS.map((r) => {
                    const rate = Math.round((r.closed / r.leads) * 100);
                    const weak = rate < 14;
                    const slow = r.respMin > 60;
                    return (
                      <div key={r.rep} className="px-5 py-3 flex items-center justify-between text-sm gap-3">
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

              {/* fixes + recovered */}
              <div className="lg:col-span-3 space-y-5">
                <div className="bg-[#15120D] text-[#F3EEE2] border-[3px] border-[#15120D] p-7">
                  <div className="font-['Space_Mono'] text-xs font-bold uppercase tracking-widest text-[#F4C20D]">
                    Recoverable revenue
                  </div>
                  <div className="mt-1 flex items-end gap-3 flex-wrap">
                    <span className="font-['Space_Mono'] text-5xl md:text-6xl font-bold">
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
                          className={`mt-0.5 w-6 h-6 flex-shrink-0 border-2 border-[#15120D] flex items-center justify-center font-bold ${
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

      {/* ----------------------------------------------------------- AUTOMATION */}
      <section className="border-b-[3px] border-[#15120D] py-20 px-5">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight max-w-2xl leading-tight">
            It doesn't stop at the insight.
          </h2>
          <p className="mt-4 text-base text-[#3b362d] max-w-xl">
            For your biggest leaks, SalesWise builds the small systems that plug them — no extra tools to buy, no setup project.
          </p>

          <div className="mt-12 grid md:grid-cols-3 gap-5">
            {[
              { c: "bg-[#E63327]", round: "rounded-full", t: "Speed-to-lead alerts", d: "A new lead lands and the right rep gets pinged instantly. Ignored too long? It auto-reassigns." },
              { c: "bg-[#F4C20D]", round: "", t: "Follow-up sequences", d: "Warm leads get a scheduled multi-touch cadence, so “call me later” never turns into never." },
              { c: "bg-[#2A4BAE]", round: "", t: "Rep scorecards", d: "Weekly performance numbers generated automatically — coach off data, not gut feel." },
            ].map((x) => (
              <article key={x.t} className="border-[3px] border-[#15120D] p-7 bg-[#F3EEE2]">
                <div aria-hidden className={`w-9 h-9 mb-5 ${x.c} ${x.round}`} />
                <h3 className="font-bold leading-snug">{x.t}</h3>
                <p className="mt-2 text-sm text-[#3b362d] leading-relaxed">{x.d}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ----------------------------------------------------------- FOUNDER */}
      <section className="border-b-[3px] border-[#15120D] py-20 px-5">
        <div className="max-w-3xl mx-auto">
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
        </div>
      </section>

      {/* ----------------------------------------------------------- PRICING (single flat plan) */}
      <section className="border-b-[3px] border-[#15120D] py-20 px-5">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight">One flat price.</h2>
          <p className="mt-3 text-base text-[#3b362d] max-w-md mx-auto">
            Whole team. Every seat. No per-rep math, no usage caps.
          </p>

          <div className="mt-12 bg-[#15120D] text-[#F3EEE2] border-[3px] border-[#15120D] p-8 md:p-10 text-left relative">
            <span className="absolute top-7 right-7 bg-[#F4C20D] text-[#15120D] text-[10px] font-bold uppercase tracking-widest px-2 py-1">
              Full recovery license
            </span>
            <span aria-hidden className="flex items-center gap-1.5 mb-6">
              <span className="w-5 h-5 rounded-full bg-[#E63327]" />
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
        </div>
      </section>

      {/* ----------------------------------------------------------- FOOTER */}
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
