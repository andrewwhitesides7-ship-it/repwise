"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";

const insights = [
  { priority: "critical", category: "Time of Day", title: "You are knocking during dead hours", body: "73% of your closes happen between 4-7pm but you are spending 40% of your time knocking before noon.", metric: "+3.4 closes/week" },
  { priority: "opportunity", category: "Territory", title: "ZIP 78704 is your goldmine", body: "This ZIP has a 34% contact rate vs your average of 19%. You have only knocked 12 doors there this month.", metric: "34% contact rate" },
  { priority: "critical", category: "Rep Performance", title: "Marcus is burning doors", body: "Marcus knocked 54 doors last week with 1 close. Team average is 1 per 11 doors.", metric: "1 per 54 doors" },
  { priority: "pattern", category: "Follow-Ups", title: "12 warm leads ghosted", body: "You scheduled follow-ups with 12 contacts and never returned. Estimated $28,000 in lost revenue.", metric: "$28k est. lost" },
  { priority: "opportunity", category: "Deal Value", title: "Sara closes 34% above average", body: "Sara average deal is $23,400 vs team average of $17,500. Her approach is worth replicating.", metric: "$23,400 avg deal" },
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

function WelcomePopup({ onClose }: { onClose: () => void }) {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await new Promise(r => setTimeout(r, 800));
    setSubmitted(true);
    setLoading(false);
    setTimeout(onClose, 2500);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-gray-900 border border-gray-700 rounded-3xl p-8 max-w-md w-full shadow-2xl">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-600 hover:text-gray-400 transition p-1">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        {submitted ? (
          <div className="text-center py-6">
            <div className="text-5xl mb-4">🎉</div>
            <h3 className="text-white font-bold text-xl mb-2">You are in!</h3>
            <p className="text-gray-400 text-sm">Check your inbox. We will be in touch within 24 hours.</p>
          </div>
        ) : (
          <>
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-blue-500/10 border border-blue-500/20 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4">🧠</div>
              <h3 className="text-white font-bold text-xl mb-2">Get a free sales analysis</h3>
              <p className="text-gray-400 text-sm leading-relaxed">Drop your email and we will show you exactly where your team is losing deals. Completely free.</p>
            </div>
            <form onSubmit={handleSubmit} className="space-y-3">
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="your@email.com" className="w-full bg-gray-800 border border-gray-700 text-white placeholder-gray-500 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition" autoFocus />
              <button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold px-6 py-3 rounded-xl text-sm transition shadow-lg shadow-blue-500/20">
                {loading ? "Sending..." : "Get my free analysis"}
              </button>
            </form>
            <div className="flex items-center justify-center gap-4 mt-4">
              <p className="text-gray-600 text-xs">No spam. No credit card.</p>
              <span className="text-gray-800">·</span>
              <button onClick={onClose} className="text-gray-600 hover:text-gray-400 text-xs transition">Skip for now</button>
            </div>
          </>
        )}
      </div>
    </div>
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
            <h3 className="text-white font-bold text-lg mb-1">You are in!</h3>
            <p className="text-gray-400 text-sm">We will reach out within 24 hours.</p>
          </div>
        ) : (
          <>
            <div className="text-center mb-6">
              <div className="text-3xl mb-3">👋</div>
              <h3 className="text-white font-bold text-xl mb-2">Wait before you go</h3>
              <p className="text-gray-400 text-sm leading-relaxed">Get a free analysis of your sales data. We will show you exactly where you are losing deals.</p>
            </div>
            <form onSubmit={handleSubmit} className="space-y-3">
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="your@email.com" className="w-full bg-gray-800 border border-gray-700 text-white placeholder-gray-500 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition" />
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
  const [showWelcomePopup, setShowWelcomePopup] = useState(false);
  const [showExitPopup, setShowExitPopup] = useState(false);
  const [hasShownExit, setHasShownExit] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  function closeWelcome() {
    setShowWelcomePopup(false);
    localStorage.setItem("repwise_popup_seen", "true");
  }

  function closeExit() {
    setShowExitPopup(false);
    localStorage.setItem("repwise_popup_seen", "true");
  }

  useEffect(() => {
    setIsVisible(true);

    const hasSeenPopup = localStorage.getItem("repwise_popup_seen");
    let welcomeTimer: ReturnType<typeof setTimeout>;
    if (!hasSeenPopup) {
      welcomeTimer = setTimeout(() => setShowWelcomePopup(true), 2000);
    }

    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
      const total = document.body.scrollHeight - window.innerHeight;
      setScrollProgress(total > 0 ? (window.scrollY / total) * 100 : 0);
    };

    const handleMouseLeave = (e: MouseEvent) => {
      const hasSeenPopupNow = localStorage.getItem("repwise_popup_seen");
      if (e.clientY <= 0 && !hasShownExit && !hasSeenPopupNow) {
        setShowExitPopup(true);
        setHasShownExit(true);
      }
    };

    window.addEventListener("scroll", handleScroll);
    document.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      clearTimeout(welcomeTimer);
      window.removeEventListener("scroll", handleScroll);
      document.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [hasShownExit]);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveInsight((prev) => (prev + 1) % insights.length);
    }, 3500);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-gray-950 text-white overflow-x-hidden">

      <div className="fixed top-0 left-0 z-50 h-0.5 bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-150" style={{ width: `${scrollProgress}%` }} />

      {showWelcomePopup && <WelcomePopup onClose={closeWelcome} />}
      {showExitPopup && <ExitPopup onClose={closeExit} />}

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
            Get started free
          </Link>
        </div>
      </nav>

      <section className="relative min-h-screen flex items-center justify-center px-8 pt-20">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-blue-600/8 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/4 w-[400px] h-[400px] bg-indigo-600/8 rounded-full blur-3xl" />
        </div>

        <div className={`max-w-6xl mx-auto w-full grid md:grid-cols-2 gap-16 items-center transition-all duration-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
          <div>
            <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-medium px-3 py-1.5 rounded-full mb-6">
              <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse" />
              AI-powered. Updated daily. 14-day free trial.
            </div>
            <h1 className="text-5xl md:text-6xl font-bold tracking-tight leading-[1.1] mb-6">
              Stop guessing.<br />
              Start{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">closing more.</span>
            </h1>
            <p className="text-gray-400 text-lg leading-relaxed mb-8">
              RepWise analyzes your field sales data and surfaces exactly where you are leaving money on the table. Upload a CSV and get 8-10 actionable insights in under 2 minutes.
            </p>
            <div className="flex items-center gap-3 mb-8">
              <span className="text-xs text-gray-500">Works with</span>
              {["☁️", "🟠", "🟢", "🔵"].map((logo, i) => (
                <div key={i} className="w-8 h-8 bg-gray-800 border border-gray-700 rounded-lg flex items-center justify-center text-sm hover:border-gray-600 transition">{logo}</div>
              ))}
              <span className="text-xs text-gray-600">+ CSV</span>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              <Link href="/signup" className="text-center bg-blue-600 hover:bg-blue-500 text-white font-semibold px-8 py-3.5 rounded-xl text-sm transition shadow-lg shadow-blue-500/20 hover:-translate-y-0.5 duration-200">
                Start free. No card needed.
              </Link>
              <a href="#pricing" className="text-center bg-gray-800 hover:bg-gray-700 text-white font-semibold px-8 py-3.5 rounded-xl text-sm transition hover:-translate-y-0.5 duration-200">
                See pricing
              </a>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex -space-x-2">
                {["J", "S", "M", "P", "T"].map((l, i) => (
                  <div key={i} className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 border-2 border-gray-950 flex items-center justify-center text-white text-xs font-bold">{l}</div>
                ))}
              </div>
              <p className="text-gray-500 text-xs">Trusted by 500+ field sales reps</p>
            </div>
          </div>

          <div className="relative">
            <div className="bg-gray-900/90 backdrop-blur border border-gray-800 rounded-2xl p-4 shadow-2xl ring-1 ring-white/5">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-800">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-xs text-gray-400 font-medium">Live insights. Updated today.</span>
                </div>
                <span className="text-xs text-gray-600">{insights.length} found</span>
              </div>
              <div className="space-y-2">
                {insights.map((insight, i) => {
                  const config = priorityConfig[insight.priority as keyof typeof priorityConfig];
                  return (
                    <div key={i} onClick={() => setActiveInsight(i)} className={`p-3 rounded-xl border cursor-pointer transition-all duration-300 ${activeInsight === i ? `bg-gray-800 ${config.card} shadow-lg` : "bg-gray-900/50 border-gray-800/50 hover:bg-gray-800/50"}`}>
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

      <section className="border-y border-gray-800/50 py-16 bg-gray-900/20">
        <div className="max-w-4xl mx-auto px-8 grid grid-cols-2 md:grid-cols-4 gap-8">
          <StatCard value={8} suffix="-10" label="Insights per upload" delay={0} />
          <StatCard value={2} suffix=" min" label="Analysis time" delay={100} />
          <StatCard value={500} suffix="+" label="Reps using RepWise" delay={200} />
          <StatCard value={14} suffix=" day" label="Free trial" delay={300} />
        </div>
      </section>

      <section id="features" className="max-w-5xl mx-auto px-8 py-24">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4 tracking-tight">Built for field sales teams</h2>
          <p className="text-gray-400 text-lg max-w-xl mx-auto">Every feature designed specifically for door-to-door and field sales workflows.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-5">
          {[
            { emoji: "⏰", title: "Time of Day Analysis", body: "Know which hours close best. Stop wasting knocks at the wrong time of day." },
            { emoji: "🗺️", title: "Territory Intelligence", body: "Find your highest-converting ZIP codes and double down where it matters." },
            { emoji: "👥", title: "Rep Benchmarking", body: "See who is outperforming and who needs coaching before numbers slip." },
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

      <section id="pricing" className="bg-gray-900/30 border-y border-gray-800/50 py-24">
        <div className="max-w-5xl mx-auto px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4 tracking-tight">Simple, transparent pricing</h2>
            <p className="text-gray-400">Start free. Upgrade when you are ready. Cancel anytime.</p>
          </div>
          <div className="grid md:grid-cols-4 gap-4 mb-6">
            {[
              { name: "Free", price: "$0", period: "/month", desc: "Try it risk-free. No card required.", features: ["3 insights/month", "1 CSV upload", "Basic dashboard"], cta: "Start free", href: "/signup", highlight: false, badge: null },
              { name: "Essential", price: "$99", period: "/month", desc: "For solo reps serious about improving.", features: ["Unlimited insights", "Unlimited uploads", "Goal tracking", "Weekly reports", "PDF exports"], cta: "Start 14-day trial", href: "/signup", highlight: false, badge: null },
              { name: "Professional", price: "$199", period: "/month", desc: "For growing teams who want to collaborate.", features: ["Everything in Essential", "5-person collaboration", "AI coaching", "Custom goals", "90-day history"], cta: "Start 14-day trial", href: "/signup", highlight: true, badge: "Recommended" },
              { name: "Team", price: "$499", period: "/month", desc: "Unlimited seats. Full manager control.", features: ["Unlimited members", "Manager dashboard", "Leaderboards", "CRM integrations", "Slack support"], cta: "Start 14-day trial", href: "/signup", highlight: false, badge: null },
            ].map((plan) => (
              <div key={plan.name} className={`relative rounded-2xl p-6 border flex flex-col hover:-translate-y-1 transition-all duration-300 ${plan.highlight ? "bg-blue-600 border-blue-500 shadow-xl shadow-blue-500/20" : "bg-gray-900 border-gray-800 hover:border-gray-700"}`}>
                {plan.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-white text-blue-600 text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap">{plan.badge}</div>
                )}
                <h3 className="text-white font-bold mb-1">{plan.name}</h3>
                <div className="flex items-end gap-1 mb-2">
                  <span className="text-3xl font-bold text-white">{plan.price}</span>
                  <span className={`text-xs mb-1 ${plan.highlight ? "text-blue-200" : "text-gray-500"}`}>{plan.period}</span>
                </div>
                <p className={`text-xs mb-4 leading-relaxed ${plan.highlight ? "text-blue-100" : "text-gray-500"}`}>{plan.desc}</p>
                <ul className="space-y-1.5 mb-6 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-xs">
                      <svg className={`w-3.5 h-3.5 flex-shrink-0 ${plan.highlight ? "text-blue-200" : "text-blue-500"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      <span className={plan.highlight ? "text-blue-50" : "text-gray-400"}>{f}</span>
                    </li>
                  ))}
                </ul>
                <Link href={plan.href} className={`block text-center font-semibold px-4 py-2.5 rounded-xl text-sm transition ${plan.highlight ? "bg-white text-blue-600 hover:bg-blue-50" : "bg-blue-600 hover:bg-blue-500 text-white"}`}>
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
          <div className="text-center">
            <p className="text-gray-600 text-sm">Need 50+ reps? <Link href="/contact" className="text-blue-400 hover:text-blue-300">Contact us for Enterprise pricing</Link></p>
          </div>
        </div>
      </section>

      <section className="max-w-2xl mx-auto px-8 py-24 text-center">
        <div className="bg-gradient-to-br from-blue-600/20 via-indigo-600/10 to-transparent border border-blue-500/20 rounded-3xl p-12">
          <div className="text-4xl mb-4">🚀</div>
          <h2 className="text-3xl font-bold mb-4 tracking-tight">Ready to close more deals?</h2>
          <p className="text-gray-400 mb-8 leading-relaxed">Join 500+ field sales reps who use RepWise to find and fix exactly where they are losing deals.</p>
          <Link href="/signup" className="inline-block bg-blue-600 hover:bg-blue-500 text-white font-bold px-8 py-4 rounded-xl text-sm transition shadow-lg shadow-blue-500/20 hover:-translate-y-0.5 duration-200">
            Start free. 14-day trial. No card needed.
          </Link>
          <p className="text-gray-600 text-xs mt-4">No credit card required. Cancel anytime.</p>
        </div>
      </section>

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
