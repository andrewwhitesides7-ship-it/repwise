"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";

const faqs = [
  { q: "What data do I need?", a: "Any CSV or spreadsheet with your sales activity. Rep names, dates, outcomes, deal values. Messy data is fine — we normalize it automatically." },
  { q: "How long does the analysis take?", a: "Under 2 minutes from upload to insights on your dashboard. No setup calls, no onboarding docs, no IT required." },
  { q: "Do I need a CRM?", a: "No. Export a CSV from any spreadsheet, HubSpot, Salesforce, or Pipedrive and drop it in. We also have direct HubSpot sync built in." },
  { q: "What if my data is messy?", a: "Our system handles any column format, messy dates, dollar signs, missing fields. It works with whatever you have. Most field sales data is imperfect and we built for that reality." },
  { q: "What is the guarantee?", a: "If you upload your data and do not find at least one insight worth more than what you paid in your first 30 days, email us and we will refund you completely. No questions asked." },
  { q: "Can I cancel anytime?", a: "Yes. Cancel from your billing page at any time. No contracts, no cancellation fees." },
];

const insights = [
  { priority: "critical", tag: "Rep Performance", metric: "+$18K/mo", title: "Marcus knocking 54 doors per close — team average is 11", body: "Reassign his leads to Sara this week." },
  { priority: "opportunity", tag: "Time of Day", metric: "+3 closes/wk", title: "2–4pm closes at 38% — morning slots closing at 11%", body: "Shift 3 hours of morning activity to afternoon." },
  { priority: "pattern", tag: "Territory", metric: "34% rate", title: "ZIP 78704 converting 3x above team average", body: "Only 15 knocks there this month. Double it." },
  { priority: "critical", tag: "Follow-Ups", metric: "$28K lost", title: "12 warm leads never followed up on", body: "Call them back today. They asked for it." },
  { priority: "opportunity", tag: "Deal Value", metric: "$23,400 avg", title: "Sara closes 34% above team average deal value", body: "Have her run a call with the whole team this week." },
];

const steps = [
  { n: "01", icon: "📤", title: "Export your data", desc: "Pull a CSV from any spreadsheet, HubSpot, Salesforce, or Pipedrive. Any format. We handle the mess." },
  { n: "02", icon: "🔍", title: "We find the patterns", desc: "RepWise calculates close rates by rep, time, territory, and follow-up status. Every pattern, surfaced automatically." },
  { n: "03", icon: "📋", title: "You get an action plan", desc: "8–10 specific insights hit your dashboard. Each one tells you what is happening and exactly what to do about it." },
];

export default function LandingPage() {
  const [annual, setAnnual] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [scrollY, setScrollY] = useState(0);
  const [insightIdx, setInsightIdx] = useState(0);
  const [visibleSections, setVisibleSections] = useState<Set<string>>(new Set());
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setInsightIdx(i => (i + 1) % insights.length);
    }, 2800);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            setVisibleSections(prev => new Set([...prev, entry.target.id]));
          }
        });
      },
      { threshold: 0.15 }
    );
    document.querySelectorAll("[data-animate]").forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const scrollProgress = typeof window !== "undefined"
    ? Math.min((scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100, 100)
    : 0;

  const priorityStyles: Record<string, string> = {
    critical: "bg-red-500/10 text-red-400 border-red-500/20",
    opportunity: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    pattern: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  };

  const priorityDot: Record<string, string> = {
    critical: "bg-red-400",
    opportunity: "bg-emerald-400",
    pattern: "bg-blue-400",
  };

  return (
    <div className="min-h-screen bg-[#080810] text-white overflow-x-hidden">

      {/* Scroll progress */}
      <div className="fixed top-0 left-0 right-0 z-50 h-[2px] bg-transparent">
        <div
          className="h-full bg-gradient-to-r from-blue-500 via-indigo-400 to-blue-600 transition-all duration-100"
          style={{ width: scrollProgress + "%" }}
        />
      </div>

      {/* Ambient background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-blue-600/8 rounded-full blur-[120px]" />
        <div className="absolute top-[30%] right-[-15%] w-[500px] h-[500px] bg-indigo-600/6 rounded-full blur-[100px]" />
        <div className="absolute bottom-[10%] left-[20%] w-[400px] h-[400px] bg-blue-500/5 rounded-full blur-[80px]" />
        <div
          className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage: "radial-gradient(circle, #ffffff 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />
      </div>

      {/* Nav */}
      <nav className={`fixed top-0.5 left-0 right-0 z-40 transition-all duration-300 ${scrollY > 60 ? "bg-[#080810]/90 backdrop-blur-xl border-b border-white/5 shadow-2xl shadow-black/50" : "bg-transparent"}`}>
        <div className="max-w-6xl mx-auto px-5 py-4 flex items-center justify-between">
          <Link href="/" className="text-xl font-black text-white tracking-tight">
            Try<span className="text-blue-400">RepWise</span>
          </Link>
          <div className="hidden md:flex items-center gap-8">
            {[["#problem", "Why RepWise"], ["#howitworks", "How it works"], ["#features", "Features"], ["#pricing", "Pricing"]].map(([href, label]) => (
              <a key={label} href={href} className="text-gray-500 hover:text-white text-sm font-medium transition-colors duration-200">{label}</a>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-gray-500 hover:text-white text-sm font-medium transition-colors duration-200 hidden sm:block">Sign in</Link>
            <Link href="/signup" className="relative group bg-blue-600 hover:bg-blue-500 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-all duration-200 shadow-lg shadow-blue-600/30 hover:shadow-blue-500/40 hover:-translate-y-0.5">
              Try free
              <span className="absolute inset-0 rounded-xl bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section ref={heroRef} className="relative pt-32 pb-12 px-5 min-h-screen flex flex-col justify-center">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-blue-500/8 border border-blue-500/15 text-blue-400 text-xs font-semibold px-4 py-2 rounded-full mb-8 animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-ping" />
            Built by a field sales rep — for field sales teams
          </div>

          <h1 className="text-5xl sm:text-6xl md:text-7xl font-black leading-[0.95] tracking-tight mb-6">
            <span className="block text-white">You have the data.</span>
            <span className="block relative">
              <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-blue-500 bg-clip-text text-transparent">
                Stop flying blind.
              </span>
            </span>
          </h1>

          <p className="text-gray-400 text-lg sm:text-xl leading-relaxed mb-10 max-w-2xl mx-auto">
            Upload your sales CSV and get a complete breakdown of where your team is losing deals — by rep, by hour, by ZIP. In under 2 minutes.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-4">
            <Link
              href="/signup"
              className="group relative w-full sm:w-auto overflow-hidden bg-blue-600 hover:bg-blue-500 text-white font-black px-8 py-4 rounded-2xl text-base transition-all duration-300 shadow-2xl shadow-blue-600/30 hover:shadow-blue-500/50 hover:-translate-y-1"
            >
              <span className="relative z-10">Upload your data free →</span>
              <span className="absolute inset-0 bg-gradient-to-r from-blue-500 to-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </Link>
            <Link
              href="/demo"
              className="w-full sm:w-auto bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-white font-bold px-8 py-4 rounded-2xl text-base transition-all duration-300 hover:-translate-y-1 backdrop-blur-sm"
            >
              See live demo
            </Link>
          </div>
          <p className="text-gray-600 text-xs">No credit card required · First upload free · 7-day trial</p>
        </div>

        {/* Animated insight card */}
        <div className="max-w-2xl mx-auto mt-16 w-full">
          <div className="relative">
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-600/20 via-indigo-600/10 to-blue-600/20 rounded-3xl blur-xl" />
            <div className="relative bg-gray-900/80 border border-white/8 rounded-3xl p-5 backdrop-blur-xl">
              <div className="flex items-center gap-2 mb-5">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500/60" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
                  <div className="w-3 h-3 rounded-full bg-emerald-500/60" />
                </div>
                <span className="text-gray-600 text-xs font-medium ml-2">RepWise — AI Insights</span>
                <div className="ml-auto flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-emerald-400 text-xs">Live</span>
                </div>
              </div>

              <div className="space-y-2.5">
                {insights.map((insight, i) => (
                  <div
                    key={i}
                    className={`relative overflow-hidden rounded-xl border transition-all duration-500 ${
                      i === insightIdx
                        ? "border-blue-500/30 bg-blue-500/5 shadow-lg shadow-blue-500/10"
                        : "border-white/5 bg-white/2 opacity-50"
                    }`}
                    style={{ padding: i === insightIdx ? "14px 16px" : "10px 16px" }}
                  >
                    {i === insightIdx && (
                      <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-400 to-indigo-400 rounded-full" />
                    )}
                    <div className="flex items-start gap-3">
                      <div className="flex items-center gap-2 flex-shrink-0 mt-0.5">
                        <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${priorityDot[insight.priority]}`} />
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${priorityStyles[insight.priority]}`}>
                          {insight.priority}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-semibold leading-snug transition-all duration-500 ${i === insightIdx ? "text-white" : "text-gray-500"}`}>
                          {insight.title}
                        </p>
                        {i === insightIdx && (
                          <p className="text-gray-500 text-xs mt-1 leading-relaxed">{insight.body}</p>
                        )}
                      </div>
                      <span className="text-blue-400 text-xs font-bold flex-shrink-0">{insight.metric}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-center gap-1.5 mt-4">
                {insights.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setInsightIdx(i)}
                    className={`rounded-full transition-all duration-300 ${i === insightIdx ? "w-4 h-1.5 bg-blue-400" : "w-1.5 h-1.5 bg-gray-700 hover:bg-gray-500"}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="max-w-2xl mx-auto mt-12 grid grid-cols-3 gap-4 w-full">
          {[
            { value: "2 min", label: "Analysis time" },
            { value: "8–10", label: "Insights per upload" },
            { value: "30 day", label: "Money-back guarantee" },
          ].map(stat => (
            <div key={stat.label} className="text-center bg-white/3 border border-white/6 rounded-2xl py-4 px-2">
              <div className="text-2xl font-black text-blue-400 mb-1">{stat.value}</div>
              <div className="text-gray-600 text-xs font-medium">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Founder story */}
      <section className="py-16 px-5 border-y border-white/5 bg-white/[0.01]">
        <div className="max-w-3xl mx-auto">
          <div className="bg-gradient-to-br from-gray-900/80 to-gray-900/40 border border-white/8 rounded-3xl p-8 backdrop-blur-sm">
            <div className="flex items-start gap-2 mb-5">
              <div className="text-4xl">"</div>
            </div>
            <div className="space-y-4 text-gray-400 text-base leading-relaxed">
              <p>I spent years in medical device sales knocking doors and running field calls with zero visibility into what was actually working. Tracking everything in spreadsheets — calls, contacts, outcomes — but no way to turn that data into anything useful.</p>
              <p>I knew my close rate was around 20%. I knew some days felt better. Some territories felt easier. But I had no idea which specific hours were my best, which ZIPs converted, or whether my follow-up timing mattered.</p>
              <p>I was making gut decisions on $500,000 worth of deals every quarter.</p>
              <p className="text-white font-bold">So I built RepWise — the tool I wish I had in the field.</p>
              <p>I built it entirely by myself. No team, no funding. If you try it and think of a feature that would help — email me at <a href="mailto:andrew@tryrepwise.com" className="text-blue-400 hover:text-blue-300 transition underline">andrew@tryrepwise.com</a>. I read every email and I will build it for you.</p>
            </div>
            <div className="mt-6 pt-5 border-t border-white/8">
              <p className="text-white font-bold">Andrew Whitesides</p>
              <p className="text-gray-500 text-sm">Founder, RepWise</p>
            </div>
          </div>
        </div>
      </section>

      {/* Problem */}
      <section id="problem" className="py-20 px-5">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14" id="problem-header" data-animate>
            <div className="inline-flex items-center gap-2 bg-red-500/8 border border-red-500/15 text-red-400 text-xs font-semibold px-4 py-2 rounded-full mb-5">
              The problem
            </div>
            <h2 className="text-4xl sm:text-5xl font-black leading-tight mb-4">
              Your team is leaving<br />
              <span className="text-red-400">money on the table.</span>
            </h2>
            <p className="text-gray-500 text-lg max-w-xl mx-auto">The patterns are hiding in your data. You just have no way to see them.</p>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              { icon: "🚪", title: "Knocking the wrong doors", desc: "Some ZIPs close at 30%. Others at 4%. Your reps treat every door the same. You are funding failure with every knock in the wrong territory." },
              { icon: "⏰", title: "Knocking at the wrong time", desc: "2–4pm closes 3x better than morning for most field teams. But nobody on your team knows that because nobody has looked at the data." },
              { icon: "📞", title: "Warm leads going cold", desc: "Someone showed interest. Your rep moved on. That lead never got a callback. At your close rate that is thousands of dollars walking out the door." },
              { icon: "👥", title: "One rep carrying the team", desc: "Your top rep closes at 35%. Your bottom closes at 6%. Same territory. You are paying both the same and coaching neither because you cannot see the gap." },
            ].map((p, i) => (
              <div
                key={i}
                className="group bg-gray-900/50 border border-white/6 rounded-2xl p-6 hover:border-red-500/20 hover:bg-red-500/3 transition-all duration-300 hover:-translate-y-0.5"
              >
                <div className="text-3xl mb-4">{p.icon}</div>
                <h3 className="text-white font-bold text-lg mb-2">{p.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="howitworks" className="py-20 px-5 border-y border-white/5 bg-white/[0.01]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 bg-blue-500/8 border border-blue-500/15 text-blue-400 text-xs font-semibold px-4 py-2 rounded-full mb-5">
              How it works
            </div>
            <h2 className="text-4xl sm:text-5xl font-black leading-tight mb-4">
              Spreadsheet to strategy.<br />
              <span className="text-blue-400">In 2 minutes.</span>
            </h2>
            <p className="text-gray-500 text-lg">No setup call. No onboarding doc. No CRM required.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            {steps.map((s, i) => (
              <div key={i} className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-b from-blue-600/10 to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative bg-gray-900/60 border border-white/6 rounded-2xl p-6 h-full group-hover:border-blue-500/20 transition-all duration-300">
                  <div className="flex items-center justify-between mb-5">
                    <span className="text-6xl font-black text-white/5 leading-none">{s.n}</span>
                    <span className="text-3xl">{s.icon}</span>
                  </div>
                  <h3 className="text-white font-bold text-lg mb-2">{s.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{s.desc}</p>
                </div>
                {i < 2 && (
                  <div className="hidden md:flex absolute top-1/2 -right-2 z-10 w-4 items-center justify-center">
                    <span className="text-gray-700 text-lg">→</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 px-5">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 bg-blue-500/8 border border-blue-500/15 text-blue-400 text-xs font-semibold px-4 py-2 rounded-full mb-5">
              Features
            </div>
            <h2 className="text-4xl sm:text-5xl font-black leading-tight mb-4">
              Built for the way<br />
              <span className="text-blue-400">field sales actually works.</span>
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: "📊", title: "Rep benchmarking", desc: "Every rep's close rate side by side. Know exactly who needs coaching." },
              { icon: "⏱️", title: "Time of day analysis", desc: "Which hours close best. Stop burning knocks in dead windows." },
              { icon: "🗺️", title: "Territory intelligence", desc: "Which ZIPs convert and which drain time. Know where to send your best reps." },
              { icon: "📋", title: "Follow-up gap finder", desc: "Every warm lead that was never called back. Revenue sitting uncollected." },
              { icon: "🎯", title: "AI coaching goals", desc: "Not just what is wrong — exactly what to do about it this week." },
              { icon: "📈", title: "Weekly tracking", desc: "Upload every week and watch your close rate move." },
              { icon: "🔌", title: "HubSpot sync", desc: "Connect HubSpot and sync automatically. No export required." },
              { icon: "👔", title: "Manager dashboard", desc: "Team-wide view. Every rep, every insight, coaching messages." },
            ].map((f, i) => (
              <div
                key={i}
                className="group bg-gray-900/50 border border-white/6 rounded-2xl p-5 hover:border-blue-500/20 hover:bg-blue-500/3 transition-all duration-300 hover:-translate-y-1"
              >
                <div className="text-2xl mb-3 group-hover:scale-110 transition-transform duration-300">{f.icon}</div>
                <h3 className="text-white font-bold text-sm mb-2">{f.title}</h3>
                <p className="text-gray-600 text-xs leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ROI + Guarantee */}
      <section className="py-20 px-5 border-y border-white/5 bg-white/[0.01]">
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-gray-900/60 border border-white/8 rounded-3xl p-8">
              <h3 className="text-white font-black text-xl mb-2">What one insight is worth</h3>
              <p className="text-gray-500 text-sm mb-6">If RepWise helps your team close just one extra deal per month it pays for itself many times over.</p>
              <div className="space-y-0">
                {[
                  { label: "Average deal value", value: "$8,500", sub: "typical solar or security deal" },
                  { label: "RepWise cost", value: "$99/mo", sub: "Essential plan" },
                  { label: "ROI on one extra close", value: "85x", sub: "in the first month alone", highlight: true },
                ].map(row => (
                  <div key={row.label} className={`flex items-center justify-between py-4 border-b border-white/5 last:border-0 ${row.highlight ? "bg-blue-500/5 -mx-8 px-8 rounded-2xl" : ""}`}>
                    <div>
                      <p className={`text-sm font-semibold ${row.highlight ? "text-white" : "text-gray-300"}`}>{row.label}</p>
                      <p className="text-gray-600 text-xs">{row.sub}</p>
                    </div>
                    <span className={`font-black text-lg ${row.highlight ? "text-blue-400 text-2xl" : "text-white"}`}>{row.value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative overflow-hidden bg-gradient-to-br from-blue-600/15 via-indigo-600/8 to-transparent border border-blue-500/20 rounded-3xl p-8">
              <div className="absolute top-4 right-4 text-5xl opacity-20">🛡️</div>
              <div className="text-4xl mb-5">🛡️</div>
              <h3 className="text-white font-black text-xl mb-3">The RepWise guarantee</h3>
              <p className="text-gray-300 text-sm leading-relaxed mb-4">
                Use RepWise for 30 days. If you do not find at least one insight worth more than what you paid — we will refund you completely.
              </p>
              <p className="text-gray-300 text-sm leading-relaxed mb-6">
                No questions asked. No hoops. Just email us and we send it back.
              </p>
              <div className="bg-white/5 border border-white/8 rounded-2xl p-4">
                <p className="text-blue-300 text-xs font-bold mb-1">Why we can offer this:</p>
                <p className="text-gray-500 text-xs leading-relaxed">Every field sales team has patterns hiding in their data. We have never seen a dataset that did not surface at least one insight worth more than $99.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 px-5">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 bg-blue-500/8 border border-blue-500/15 text-blue-400 text-xs font-semibold px-4 py-2 rounded-full mb-5">
              Pricing
            </div>
            <h2 className="text-4xl sm:text-5xl font-black mb-4">Simple pricing.<br />No surprises.</h2>
            <p className="text-gray-500 text-lg mb-6">Start free. Upgrade when you are ready.</p>
            <div className="inline-flex items-center gap-1 bg-gray-900/80 border border-white/8 rounded-xl p-1">
              <button onClick={() => setAnnual(false)} className={"px-4 py-2 rounded-lg text-sm font-bold transition-all duration-200 " + (!annual ? "bg-white/10 text-white" : "text-gray-600 hover:text-gray-400")}>Monthly</button>
              <button onClick={() => setAnnual(true)} className={"px-4 py-2 rounded-lg text-sm font-bold transition-all duration-200 " + (annual ? "bg-white/10 text-white" : "text-gray-600 hover:text-gray-400")}>
                Annual <span className="text-emerald-400 text-xs font-black ml-1">−20%</span>
              </button>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { name: "Free", price: "$0", period: "/month", desc: "See what RepWise can do.", features: ["1 free upload", "First insights", "Basic dashboard"], cta: "Start free", href: "/signup", hot: false },
              { name: "Essential", price: annual ? "$79" : "$99", period: "/month", desc: "For solo reps.", features: ["Unlimited uploads", "Unlimited insights", "Goal tracking", "30-day history", "7-day free trial"], cta: "Start 7-day trial", href: "/signup", hot: false },
              { name: "Professional", price: annual ? "$159" : "$199", period: "/month", desc: "For growing teams.", features: ["Everything in Essential", "Up to 5 reps", "AI coaching plans", "90-day history", "7-day free trial"], cta: "Start 7-day trial", href: "/signup", hot: true },
              { name: "Team", price: annual ? "$399" : "$499", period: "/month", desc: "Unlimited seats.", features: ["Everything in Pro", "Unlimited reps", "Manager dashboard", "Team messaging", "HubSpot sync", "7-day free trial"], cta: "Start 7-day trial", href: "/signup", hot: false },
            ].map((plan, i) => (
              <div
                key={i}
                className={`relative rounded-3xl border flex flex-col transition-all duration-300 hover:-translate-y-1 ${
                  plan.hot
                    ? "bg-blue-600/10 border-blue-500/40 shadow-2xl shadow-blue-500/10"
                    : "bg-gray-900/50 border-white/6 hover:border-white/12"
                }`}
              >
                {plan.hot && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-blue-600 text-white text-xs font-black px-3 py-1 rounded-full shadow-lg shadow-blue-600/30">Most Popular</span>
                  </div>
                )}
                <div className="p-6 flex-1">
                  <h3 className="text-white font-black text-lg mb-1">{plan.name}</h3>
                  <div className="flex items-end gap-1 mb-1">
                    <span className="text-3xl font-black text-white">{plan.price}</span>
                    <span className="text-gray-600 text-sm mb-1">{plan.period}</span>
                  </div>
                  <p className="text-gray-600 text-xs mb-5">{plan.desc}</p>
                  <ul className="space-y-2">
                    {plan.features.map(f => (
                      <li key={f} className="flex items-center gap-2 text-xs text-gray-400">
                        <svg className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="p-6 pt-0">
                  <Link
                    href={plan.href}
                    className={`block text-center font-black px-4 py-3 rounded-2xl text-sm transition-all duration-200 hover:-translate-y-0.5 ${
                      plan.hot
                        ? "bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/30"
                        : "bg-white/5 hover:bg-white/10 border border-white/8 text-white"
                    }`}
                  >
                    {plan.cta}
                  </Link>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-5 bg-gray-900/50 border border-white/6 rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-white font-bold mb-1">Enterprise</h3>
              <p className="text-gray-500 text-sm">50+ reps. Custom pricing, API access, white-label, dedicated account manager.</p>
            </div>
            <Link href="/contact" className="flex-shrink-0 bg-white/5 hover:bg-white/10 border border-white/8 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition">
              Contact us
            </Link>
          </div>

          <p className="text-center text-gray-700 text-xs mt-4">All paid plans include a 7-day free trial · Card required · Cancel anytime · 30-day money-back guarantee</p>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 px-5 border-t border-white/5 bg-white/[0.01]">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl sm:text-5xl font-black mb-4">Common questions.</h2>
          </div>
          <div className="space-y-2">
            {faqs.map((faq, i) => (
              <div
                key={i}
                className={`border rounded-2xl overflow-hidden transition-all duration-300 ${openFaq === i ? "border-blue-500/25 bg-blue-500/3" : "border-white/6 bg-gray-900/40 hover:border-white/10"}`}
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between px-6 py-4 text-left"
                >
                  <span className="text-white font-semibold text-sm pr-4">{faq.q}</span>
                  <div className={`flex-shrink-0 w-6 h-6 rounded-full border border-white/10 flex items-center justify-center transition-all duration-300 ${openFaq === i ? "bg-blue-600 border-blue-500 rotate-180" : ""}`}>
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </button>
                {openFaq === i && (
                  <div className="px-6 pb-5">
                    <p className="text-gray-400 text-sm leading-relaxed">{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 px-5">
        <div className="max-w-3xl mx-auto text-center">
          <div className="relative">
            <div className="absolute -inset-4 bg-gradient-to-r from-blue-600/10 via-indigo-600/5 to-blue-600/10 rounded-[40px] blur-2xl" />
            <div className="relative bg-gray-900/60 border border-white/8 rounded-3xl p-10 sm:p-14 backdrop-blur-xl">
              <div className="text-5xl mb-6">🚀</div>
              <h2 className="text-4xl sm:text-5xl font-black mb-4 leading-tight">
                Your next deal is<br />
                <span className="text-blue-400">waiting for insights.</span>
              </h2>
              <p className="text-gray-400 text-lg mb-8 leading-relaxed">
                Upload your sales data today. See exactly where you are losing deals. It takes less time than a cold call.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-4">
                <Link
                  href="/signup"
                  className="group relative w-full sm:w-auto overflow-hidden bg-blue-600 hover:bg-blue-500 text-white font-black px-8 py-4 rounded-2xl text-base transition-all duration-300 shadow-2xl shadow-blue-600/30 hover:-translate-y-1"
                >
                  Upload your data free →
                </Link>
                <Link
                  href="/demo"
                  className="w-full sm:w-auto bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold px-8 py-4 rounded-2xl text-base transition-all duration-300 hover:-translate-y-1"
                >
                  See live demo
                </Link>
              </div>
              <p className="text-gray-600 text-xs">No credit card required · 30-day money-back guarantee</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-5 border-t border-white/5">
        <div className="max-w-5xl mx-auto">
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-8 mb-10">
            <div className="sm:col-span-2">
              <Link href="/" className="text-xl font-black text-white block mb-3">
                Try<span className="text-blue-400">RepWise</span>
              </Link>
              <p className="text-gray-600 text-sm leading-relaxed max-w-xs">
                Sales performance intelligence for field sales reps and door-to-door teams. Built by a rep, for reps.
              </p>
            </div>
            <div>
              <p className="text-white font-bold text-sm mb-4">Product</p>
              <div className="space-y-2">
                {[["#features", "Features"], ["#pricing", "Pricing"], ["#howitworks", "How it works"], ["/demo", "Live demo"]].map(([href, label]) => (
                  <Link key={label} href={href} className="block text-gray-600 hover:text-gray-300 text-sm transition-colors duration-200">{label}</Link>
                ))}
              </div>
            </div>
            <div>
              <p className="text-white font-bold text-sm mb-4">Company</p>
              <div className="space-y-2">
                {[["/help", "Help Center"], ["/contact", "Contact"], ["/privacy", "Privacy Policy"], ["/terms", "Terms"]].map(([href, label]) => (
                  <Link key={label} href={href} className="block text-gray-600 hover:text-gray-300 text-sm transition-colors duration-200">{label}</Link>
                ))}
              </div>
            </div>
          </div>
          <div className="pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-gray-700 text-xs">{"© 2026 TryRepWise. All rights reserved."}</p>
            <div className="flex items-center gap-6">
              <Link href="/privacy" className="text-gray-700 hover:text-gray-400 text-xs transition-colors duration-200">Privacy</Link>
              <Link href="/terms" className="text-gray-700 hover:text-gray-400 text-xs transition-colors duration-200">Terms</Link>
              <Link href="/contact" className="text-gray-700 hover:text-gray-400 text-xs transition-colors duration-200">Contact</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
