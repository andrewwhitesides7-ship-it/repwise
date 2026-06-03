"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";

const insights = [
  { priority: "critical", category: "Time of Day", title: "You're knocking during dead hours", body: "73% of your closes happen between 4-7pm but you're spending 40% of your time knocking before noon.", metric: "+3.4 closes/week" },
  { priority: "opportunity", category: "Territory", title: "ZIP 78704 is your goldmine", body: "This ZIP has a 34% contact rate vs your average of 19%. You've only knocked 12 doors there this month.", metric: "34% contact rate" },
  { priority: "critical", category: "Rep Performance", title: "Marcus is burning doors", body: "Marcus knocked 54 doors last week with 1 close. Team average is 1 per 11 doors.", metric: "1 per 54 doors" },
  { priority: "pattern", category: "Follow-Ups", title: "12 warm leads ghosted", body: "You scheduled follow-ups with 12 contacts and never returned. Estimated $28,000 in lost revenue.", metric: "$28k est. lost" },
  { priority: "opportunity", category: "Deal Value", title: "Sara closes 34% above average", body: "Sara's average deal is $23,400 vs team average of $17,500. Her approach is worth replicating.", metric: "$23,400 avg deal" },
];

const priorityConfig = {
  critical: { label: "Critical", class: "bg-red-500/15 text-red-400 border border-red-500/20", dot: "bg-red-400", card: "border-red-500/20" },
  opportunity: { label: "Opportunity", class: "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20", dot: "bg-emerald-400", card: "border-emerald-500/20" },
  pattern: { label: "Pattern", class: "bg-blue-500/15 text-blue-400 border border-blue-500/20", dot: "bg-blue-400", card: "border-blue-500/20" },
};

function useCountUp(target: number, duration: number = 2000, start: boolean = false) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!start) return;
    let startTime: number;
    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration, start]);
  return count;
}

function StatCard({ value, suffix, label, delay }: { value: number; suffix: string; label: string; delay: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [started, setStarted] = useState(false);
  const count = useCountUp(value, 1800, started);
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) setStarted(true); }, { threshold: 0.5 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);
  return (
    <div ref={ref} className="text-center" style={{ animationDelay: `${delay}ms` }}>
      <div className="text-4xl font-bold text-white mb-1">{count}{suffix}</div>
      <div className="text-sm text-gray-500">{label}</div>
    </div>
  );
}

function EmailCapture({ source }: { source: string }) {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    await new Promise(r => setTimeout(r, 800));
    setSubmitted(true);
    setLoading(false);
  }

  if (submitted) {
    return (
      <div className="flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl px-6 py-4">
        <div className="w-8 h-8 bg-emerald-500/20 rounded-full flex items-center justify-center text-emerald-400">✓</div>
        <div>
          <p className="text-emerald-400 font-semibold text-sm">You're on the list</p>
          <p className="text-gray-500 text-xs">We'll reach out within 24 hours.</p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="your@email.com"
        className="flex-1 bg-white/5 border border-white/10 text-white placeholder-gray-500 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition backdrop-blur"
      />
      <button
        type="submit"
        disabled={loading}
        className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold px-6 py-3 rounded-xl text-sm transition whitespace-nowrap shadow-lg shadow-blue-500/20"
      >
        {loading ? "Joining..." : "Get early access"}
      </button>
    </form>
  );
}

function ExitPopup({ onClose }: { onClose: () => void }) {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await new Promise(r => setTimeout(r, 600));
    setSubmitted(true);
    setTimeout(onClose, 2000);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-gray-900 border border-gray-700 rounded-3xl p-8 max-w-md w-full shadow-2xl">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-600 hover:text-gray-400 transition">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        {submitted ? (
          <div className="text-center py-4">
            <div className="text-4xl mb-3">🎉</div>
            <h3 className="text-white font-bold text-lg mb-1">You're in!</h3>
            <p className="text-gray-400 text-sm">We'll be in touch soon.</p>
          </div>
        ) : (
          <>
            <div className="text-center mb-6">
              <div className="text-3xl mb-3">👋</div>
              <h3 className="text-white font-bold text-xl mb-2">Wait — before you go</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                Get a free analysis of your sales data. Drop your email and we'll show you exactly where you're losing deals.
              </p>
            </div>
            <form onSubmit={handleSubmit} className="space-y-3">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="w-full bg-gray-800 border border-gray-700 text-white placeholder-gray-500 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              />
              <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold px-6 py-3 rounded-xl text-sm transition">
                Send me the free analysis
              </button>
            </form>
            <p className="text-gray-600 text-xs text-center mt-3">No spam. Unsubscribe anytime.</p>
          </>
        )}
      </div>
    </div>
  );
}

export default function LandingPage() {
  const [activeInsight, setActiveInsight] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [showExitPopup, setShowExitPopup] = useState(false);
  const [hasShownPopup, setHasShownPopup] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    setIsVisible(true);
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
      const total = document.body.scrollHeight - window.innerHeight;
      setScrollProgress(total > 0 ? (window.scrollY / total) * 100 : 0);
    };
    window.addEventListener("scroll", handleScroll);

    const handleMouseLeave = (e: MouseEvent) => {
      if (e.clientY <= 0 && !hasShownPopup) {
        setShowExitPopup(true);
        setHasShownPopup(true);
      }
    };
    document.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      document.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [hasShownPopup]);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveInsight((prev) => (prev + 1) % insights.length);
    }, 3500);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-gray-950 text-white overflow-x-hidden">

      {/* Scroll progress bar */}
      <div className="fixed top-0 left-0 z-50 h-0.5 bg-blue-500 transition-all duration-150" style={{ width: `${scrollProgress}%` }} />

      {/* Exit popup */}
      {showExitPopup && <ExitPopup onClose={() => setShowExitPopup(false)} />}

      {/* Nav */}
      <nav className={`fixed top-0.5 left-0 right-0 z-40 flex items-center justify-between px-8 py-4 transition-all duration-300 ${scrolled ? "bg-gray-950/80 backdrop-blur-xl border-b border-white/5" : ""}`}>
        <Link href="/" className="text-xl font-bold tracking-tight">
          Try<span className="text-blue-500">RepWise</span>
        </Link>
        <div className="hidden md:flex items-center gap-8">
          <a href="#features" className="text-sm text-gray-400 hover:text-white transition">Features</a>
          <a href="#pricing" className="text-sm text-gray-400 hover:text-white transition">Pricing</a>
          <Link href="/help" className="text-sm text-gray-400 hover:text-white transition">Help</Link>
          <Link href="/contact" className="text-sm text-gray-400 hover:text-white transition">Contact</Link>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/login" className="text-sm text-gray-400 hover:text-white transition">Sign in</Link>
          <Link href="/signup" className="text-sm bg-blue-600 hover:bg-blue-500 text-white font-semibold px-4 py-2 rounded-xl transition shadow-lg shadow-blue-500/20">
            Get started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative min-h-screen flex items-center justify-center px-8 pt-20">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-blue-600/8 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/4 w-[400px] h-[400px] bg-indigo-600/8 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] bg-blue-400/5 rounded-full blur-3xl" />
        </div>

        <div className={`max-w-6xl mx-auto w-full grid md:grid-cols-2 gap-16 items-center transition-all duration-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
          <div>
            <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-medium px-3 py-1.5 rounded-full mb-6">
              <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse" />
              AI-powered sales intelligence
            </div>
            <h1 className="text-5xl md:text-6xl font-bold tracking-tight leading-[1.1] mb-6">
              Stop guessing.<br />
              Start{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-blue-600">closing more.</span>
            </h1>
            <p className="text-gray-400 text-lg leading-relaxed mb-8">
              RepWise analyzes your field sales data and surfaces exactly where you are leaving money on the table. Upload a CSV and get 8-10 actionable insights in under 2 minutes.
            </p>

            <div className="flex items-center gap-3 mb-8">
              <span className="text-xs text-gray-500">Works with</span>
              {["☁️", "🟠", "🟢", "🔵"].map((logo, i) => (
                <div key={i} className="w-8 h-8 bg-gray-800 border border-gray-700 rounded-lg flex items-center justify-center text-sm hover:border-gray-600 transition">
                  {logo}
                </div>
              ))}
              <span className="text-xs text-gray-600">+ CSV</span>
            </div>

            <EmailCapture source="hero" />

            <div className="flex items-center gap-6 mt-6">
              <div className="flex -space-x-2">
                {["J", "S", "M", "P"].map((l, i) => (
                  <div key={i} className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 border-2 border-gray-950 flex items-center justify-center text-white text-xs font-bold">
                    {l}
                  </div>
                ))}
              </div>
              <p className="text-gray-500 text-xs">Trusted by 500+ field sales reps</p>
            </div>
          </div>

          {/* Live preview */}
          <div className="relative">
            <div className="bg-gray-900/90 backdrop-blur border border-gray-800 rounded-2xl p-4 shadow-2xl ring-1 ring-white/5">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-800">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-xs text-gray-400 font-medium">Live insights</span>
                </div>
                <span className="text-xs text-gray-600">{insights.length} found</span>
              </div>
              <div className="space-y-2">
                {insights.map((insight, i) => {
                  const config = priorityConfig[insight.priority as keyof typeof priorityConfig];
                  return (
                    <div
                      key={i}
                      onClick={() => setActiveInsight(i)}
                      className={`p-3 rounded-xl border cursor-pointer transition-all duration-300 ${activeInsight === i ? `bg-gray-800 ${config.card} shadow-lg` : "bg-gray-900/50 border-gray-800/50 hover:bg-gray-800/50"}`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${config.class}`}>
                          <span className={`w-1 h-1 rounded-full ${config.dot}`} />
                          {config.label}
                        </span>
                        <span className="text-xs text-gray-600">{insight.category}</span>
                      </div>
                      <p className="text-sm font-medium text-white leading-snug">{insight.title}</p>
                      {activeInsight === i && (
                        <div className="mt-2">
                          <p className="text-xs text-gray-400 leading-relaxed mb-1">{insight.body}</p>
                          <span className="text-xs font-semibold text-blue-400">{insight.metric}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              <div className="mt-3 flex gap-1">
                {insights.map((_, i) => (
                  <button key={i} onClick={() => setActiveInsight(i)} className={`h-1 rounded-full flex-1 transition-all ${i === activeInsight ? "bg-blue-500" : "bg-gray-800"}`} />
                ))}
              </div>
            </div>
            <div className="absolute -top-4 -right-4 bg-emerald-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg animate-bounce">+$28k found</div>
            <div className="absolute -bottom-4 -left-4 bg-gray-800 border border-gray-700 text-white text-xs font-medium px-3 py-1.5 rounded-full shadow-lg">3.4 more closes/week</div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-gray-800/50 py-16 bg-gray-900/20">
        <div className="max-w-4xl mx-auto px-8 grid grid-cols-2 md:grid-cols-4 gap-8">
          <StatCard value={8} suffix="-10" label="Insights per upload" delay={0} />
          <StatCard value={2} suffix=" min" label="Analysis time" delay={100} />
          <StatCard value={200} suffix="/mo" label="Solo rep plan" delay={200} />
          <StatCard value={150} suffix="/seat" label="Team plan" delay={300} />
        </div>
      </section>

      {/* Features */}
      <section id="features" className="max-w-5xl mx-auto px-8 py-24">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4 tracking-tight">Built for field sales teams</h2>
          <p className="text-gray-400 text-lg max-w-xl mx-auto">Every feature designed specifically for door-to-door and field sales workflows.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-5">
          {[
            { emoji: "⏰", title: "Time of Day Analysis", body: "Know which hours close best. Stop wasting knocks at the wrong time of day." },
            { emoji: "🗺️", title: "Territory Intelligence", body: "Find your highest-converting ZIP codes and double down where it matters." },
            { emoji: "👥", title: "Rep Benchmarking", body: "See who's outperforming and who needs coaching before numbers slip." },
            { emoji: "🔔", title: "Daily Fresh Insights", body: "New AI insights every morning. Never make decisions on stale data again." },
            { emoji: "🏷️", title: "Priority Tags", body: "Every insight tagged Critical, Opportunity, or Pattern. Fix the right thing first." },
            { emoji: "🔌", title: "Easy Integrations", body: "Connect Salesforce, HubSpot, Pipedrive, or just drop in a CSV." },
          ].map((f) => (
            <div key={f.title} className="group bg-gray-900 border border-gray-800 rounded-2xl p-6 hover:border-gray-700 hover:-translate-y-1 transition-all duration-300 hover:shadow-xl hover:shadow-black/20">
              <div className="text-2xl mb-4 group-hover:scale-110 transition-transform duration-300 inline-block">{f.emoji}</div>
              <h3 className="text-white font-semibold mb-2">{f.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="bg-gray-900/30 border-y border-gray-800/50 py-24">
        <div className="max-w-4xl mx-auto px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4 tracking-tight">Up and running in 2 minutes</h2>
            <p className="text-gray-400">No setup call. No onboarding doc. Just connect and go.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: "01", title: "Connect or upload", body: "Link your CRM for automatic syncing or drop in a CSV from any tool.", icon: "📤" },
              { step: "02", title: "AI analyzes your data", body: "Claude processes your activity and finds patterns humans miss in seconds.", icon: "🧠" },
              { step: "03", title: "Get daily insights", body: "Fresh insights every morning tagged Critical, Opportunity, or Pattern.", icon: "📊" },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-14 h-14 bg-blue-500/10 border border-blue-500/20 rounded-2xl flex items-center justify-center text-2xl mx-auto mb-4">{item.icon}</div>
                <div className="text-xs font-bold text-blue-500 mb-2 tracking-widest">{item.step}</div>
                <h3 className="text-white font-semibold mb-2">{item.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Integrations */}
      <section className="max-w-4xl mx-auto px-8 py-24">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4 tracking-tight">Works with your existing tools</h2>
          <p className="text-gray-400">Connect your CRM for automatic syncing or upload a CSV anytime.</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { name: "Salesforce", logo: "☁️", desc: "Leads and opportunities" },
            { name: "HubSpot", logo: "🟠", desc: "Contacts and deals" },
            { name: "Pipedrive", logo: "🟢", desc: "Pipeline activity" },
            { name: "Zoho CRM", logo: "🔵", desc: "Accounts and visits" },
          ].map((crm) => (
            <div key={crm.name} className="bg-gray-900 border border-gray-800 rounded-2xl p-5 text-center hover:border-gray-700 hover:-translate-y-1 transition-all duration-300">
              <div className="text-3xl mb-3">{crm.logo}</div>
              <div className="text-white font-semibold text-sm mb-1">{crm.name}</div>
              <div className="text-gray-600 text-xs">{crm.desc}</div>
              <div className="mt-3 text-xs text-blue-400 bg-blue-500/10 border border-blue-500/20 rounded-full px-2 py-0.5 inline-block">Coming soon</div>
            </div>
          ))}
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-gray-800 rounded-xl flex items-center justify-center text-xl">📄</div>
            <div>
              <div className="text-white font-semibold text-sm">CSV Upload</div>
              <div className="text-gray-500 text-xs">Export from any tool. Available right now.</div>
            </div>
          </div>
          <Link href="/signup" className="text-sm bg-blue-600 hover:bg-blue-500 text-white font-semibold px-4 py-2 rounded-xl transition">Try it free</Link>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="bg-gray-900/30 border-y border-gray-800/50 py-24">
        <div className="max-w-4xl mx-auto px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4 tracking-tight">Simple pricing</h2>
            <p className="text-gray-400">Cancel anytime. No contracts. No surprises.</p>
          </div>
          <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">
            {[
              {
                name: "Solo Rep", price: "$200", period: "/month",
                description: "For individual field reps who want a competitive edge.",
                features: ["Unlimited CSV uploads", "CRM integration (coming soon)", "8-10 AI insights per upload", "Daily fresh insights", "Time of day analysis", "Priority tagging", "Email support"],
                cta: "Get started", highlight: false,
              },
              {
                name: "Team", price: "$150", period: "/seat/month",
                description: "For managers running a team of reps.",
                features: ["Everything in Solo", "Daily team insights", "Rep leaderboard", "Rep breakdowns", "Manager dashboard", "Invite unlimited reps", "Priority support"],
                cta: "Start team trial", highlight: true,
              },
            ].map((plan) => (
              <div key={plan.name} className={`rounded-2xl p-8 border transition-all duration-300 hover:-translate-y-1 ${plan.highlight ? "bg-blue-600 border-blue-500 shadow-xl shadow-blue-500/20" : "bg-gray-900 border-gray-800 hover:border-gray-700"}`}>
                <h3 className="text-lg font-bold text-white mb-1">{plan.name}</h3>
                <div className="flex items-end gap-1 mb-3">
                  <span className="text-4xl font-bold text-white">{plan.price}</span>
                  <span className={`text-sm mb-1 ${plan.highlight ? "text-blue-200" : "text-gray-400"}`}>{plan.period}</span>
                </div>
                <p className={`text-sm mb-6 ${plan.highlight ? "text-blue-100" : "text-gray-400"}`}>{plan.description}</p>
                <ul className="space-y-2.5 mb-8">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm">
                      <svg className={`w-4 h-4 flex-shrink-0 ${plan.highlight ? "text-blue-200" : "text-blue-500"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      <span className={plan.highlight ? "text-blue-50" : "text-gray-300"}>{f}</span>
                    </li>
                  ))}
                </ul>
                <Link href="/signup" className={`block text-center font-semibold px-6 py-3 rounded-xl text-sm transition ${plan.highlight ? "bg-white text-blue-600 hover:bg-blue-50" : "bg-blue-600 hover:bg-blue-500 text-white"}`}>
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Email capture section */}
      <section className="max-w-2xl mx-auto px-8 py-24 text-center">
        <div className="bg-gradient-to-br from-blue-600/20 to-indigo-600/10 border border-blue-500/20 rounded-3xl p-12">
          <div className="text-4xl mb-4">🚀</div>
          <h2 className="text-3xl font-bold mb-4 tracking-tight">Ready to close more deals?</h2>
          <p className="text-gray-400 mb-8 leading-relaxed">
            Join 500+ field sales reps who use RepWise to find and fix exactly where they're losing deals.
          </p>
          <EmailCapture source="cta" />
          <p className="text-gray-600 text-xs mt-4">Or <Link href="/signup" className="text-blue-400 hover:text-blue-300">create an account</Link> and start right now.</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-800/50 px-8 py-10">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <span className="text-lg font-bold text-white">Try<span className="text-blue-500">RepWise</span></span>
          <div className="flex items-center gap-8">
            <a href="#features" className="text-sm text-gray-500 hover:text-gray-300 transition">Features</a>
            <a href="#pricing" className="text-sm text-gray-500 hover:text-gray-300 transition">Pricing</a>
            <Link href="/help" className="text-sm text-gray-500 hover:text-gray-300 transition">Help</Link>
            <Link href="/contact" className="text-sm text-gray-500 hover:text-gray-300 transition">Contact</Link>
          </div>
          <p className="text-xs text-gray-700">2025 TryRepWise. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
