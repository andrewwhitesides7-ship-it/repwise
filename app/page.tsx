"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";

const insights = [
  { priority: "critical", category: "Follow-Ups", title: "14 warm leads never followed up", body: "You made contact with 14 prospects last week who showed interest. None were followed up. At your close rate that is $31,200 in lost revenue.", metric: "$31,200 est. lost" },
  { priority: "opportunity", category: "Time of Day", title: "2-4pm closes 3x better than morning", body: "Your team closes 34% of contacts made between 2-4pm versus only 11% in the morning. Shifting 2 hours of morning activity saves 8 doors per week.", metric: "3x better close rate" },
  { priority: "critical", category: "Rep Performance", title: "Marcus burned 54 doors with 1 close", body: "Team average is 1 close per 11 doors. Marcus is at 1 per 54. This is a coaching issue not a territory issue — his contact rate is fine.", metric: "1 per 54 doors" },
  { priority: "pattern", category: "Territory", title: "ZIP 78704 is your highest converter", body: "This ZIP delivers a 34% contact-to-close rate versus your team average of 19%. You have knocked fewer than 15 doors there this month.", metric: "34% close rate" },
  { priority: "opportunity", category: "Deal Value", title: "Sara closes 34% above team average", body: "Sara averages $23,400 per close while the team averages $17,500. Her opening line on contacts is different. Worth a team call.", metric: "$23,400 avg deal" },
];

const priorityConfig = {
  critical: { label: "Critical", badge: "bg-red-500/15 text-red-400 border border-red-500/20", dot: "bg-red-400", card: "border-red-500/30 bg-red-500/5" },
  opportunity: { label: "Opportunity", badge: "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20", dot: "bg-emerald-400", card: "border-emerald-500/30 bg-emerald-500/5" },
  pattern: { label: "Pattern", badge: "bg-blue-500/15 text-blue-400 border border-blue-500/20", dot: "bg-blue-400", card: "border-blue-500/30 bg-blue-500/5" },
};

function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const observer = new IntersectionObserver(([e]) => { if (e.isIntersecting) setInView(true); }, { threshold });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [threshold]);
  return { ref, inView };
}

function useCountUp(target: number, duration = 2000, start = false) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!start) return;
    let t: number;
    const step = (ts: number) => {
      if (!t) t = ts;
      const p = Math.min((ts - t) / duration, 1);
      setCount(Math.floor((1 - Math.pow(1 - p, 3)) * target));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration, start]);
  return count;
}

function AnimatedStat({ value, suffix, label }: { value: number; suffix: string; label: string }) {
  const { ref, inView } = useInView(0.5);
  const count = useCountUp(value, 1800, inView);
  return (
    <div ref={ref} className="text-center">
      <div className="text-4xl md:text-5xl font-bold text-white mb-2">{count}{suffix}</div>
      <div className="text-gray-500 text-sm">{label}</div>
    </div>
  );
}

function FadeIn({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  const { ref, inView } = useInView();
  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
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
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
        {submitted ? (
          <div className="text-center py-6">
            <div className="text-5xl mb-4">🎉</div>
            <h3 className="text-white font-bold text-xl mb-2">You are in!</h3>
            <p className="text-gray-400 text-sm">We will be in touch within 24 hours.</p>
          </div>
        ) : (
          <>
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-blue-500/10 border border-blue-500/20 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4">🧠</div>
              <h3 className="text-white font-bold text-xl mb-2">Get a free sales analysis</h3>
              <p className="text-gray-400 text-sm leading-relaxed">Drop your email and we will show you exactly where your team is losing deals. Completely free.</p>
            </div>
            <form onSubmit={handleSubmit} className="space-y-3">
              <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com" className="w-full bg-gray-800 border border-gray-700 text-white placeholder-gray-500 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition" autoFocus />
              <button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold px-6 py-3 rounded-xl text-sm transition shadow-lg shadow-blue-500/20">
                {loading ? "Sending..." : "Get my free analysis"}
              </button>
            </form>
            <div className="flex items-center justify-center gap-4 mt-4">
              <p className="text-gray-600 text-xs">No spam. No credit card.</p>
              <span className="text-gray-800">·</span>
              <button onClick={onClose} className="text-gray-600 hover:text-gray-400 text-xs transition">Skip</button>
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
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
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
              <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com" className="w-full bg-gray-800 border border-gray-700 text-white placeholder-gray-500 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition" />
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

const faqs = [
  { q: "What data do I need to upload?", a: "Any CSV with your sales activity works. The more columns the better — ideally rep name, date, time, address, knocked, contacted, pitched, closed, and deal value. We handle messy or incomplete data." },
  { q: "How does the AI analysis actually work?", a: "We parse your CSV, build a statistical summary of your activity across reps, time, territory, and pipeline stages, then send it to Claude — Anthropic's AI — which generates 8-10 specific insight cards backed by your actual numbers." },
  { q: "Is my sales data secure?", a: "Yes. All data is encrypted in transit and at rest using Supabase's enterprise-grade infrastructure. Row-level security means your data is only ever accessible to you and team members you explicitly invite." },
  { q: "What if my data is messy or incomplete?", a: "RepWise handles imperfect data. As long as you have basic activity columns we can generate meaningful insights. The more complete your data the better the insights — but we work with what you have." },
  { q: "Do I need a CRM?", a: "No. Export a CSV from any spreadsheet, CRM, or activity tracker and upload it directly. CRM integrations with Salesforce, HubSpot, and Pipedrive are coming soon for automatic daily syncing." },
  { q: "Can I cancel anytime?", a: "Yes. Cancel from your billing page at any time. No contracts, no cancellation fees. Your account stays active until the end of your billing period." },
  { q: "What is the difference between the plans?", a: "Free gives you 3 insights and 1 upload to try the product. Essential ($99/mo) unlocks unlimited uploads and insights for solo reps. Professional ($199/mo) adds team collaboration and AI coaching. Team ($499/mo) is unlimited seats with full manager controls." },
  { q: "How fresh are the insights?", a: "Insights are generated every time you upload new data. Upload daily and you get daily insights. CRM integrations coming soon will auto-sync and regenerate insights every morning without any manual uploads." },
];

export default function LandingPage() {
  const [activeInsight, setActiveInsight] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [showWelcome, setShowWelcome] = useState(false);
  const [showExit, setShowExit] = useState(false);
  const [hasShownExit, setHasShownExit] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "annual">("monthly");

  function closeWelcome() { setShowWelcome(false); localStorage.setItem("rw_popup", "1"); }
  function closeExit() { setShowExit(false); localStorage.setItem("rw_popup", "1"); }

  useEffect(() => {
    setIsVisible(true);
    if (!localStorage.getItem("rw_popup")) {
      const t = setTimeout(() => setShowWelcome(true), 2500);
      return () => clearTimeout(t);
    }
  }, []);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 20);
      const total = document.body.scrollHeight - window.innerHeight;
      setScrollProgress(total > 0 ? (window.scrollY / total) * 100 : 0);
    };
    const onLeave = (e: MouseEvent) => {
      if (e.clientY <= 0 && !hasShownExit && !localStorage.getItem("rw_popup")) {
        setShowExit(true);
        setHasShownExit(true);
        localStorage.setItem("rw_popup", "1");
      }
    };
    window.addEventListener("scroll", onScroll);
    document.addEventListener("mouseleave", onLeave);
    return () => { window.removeEventListener("scroll", onScroll); document.removeEventListener("mouseleave", onLeave); };
  }, [hasShownExit]);

  useEffect(() => {
    const t = setInterval(() => setActiveInsight(p => (p + 1) % insights.length), 3800);
    return () => clearInterval(t);
  }, []);

  const prices = {
    monthly: { essential: 99, professional: 199, team: 499 },
    annual: { essential: 79, professional: 159, team: 399 },
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white overflow-x-hidden">
      <div className="fixed top-0 left-0 z-50 h-0.5 bg-gradient-to-r from-blue-500 via-indigo-500 to-blue-500 transition-all duration-150" style={{ width: `${scrollProgress}%` }} />
      {showWelcome && <WelcomePopup onClose={closeWelcome} />}
      {showExit && <ExitPopup onClose={closeExit} />}

      {/* Nav */}
      <nav className={`fixed top-0.5 left-0 right-0 z-40 transition-all duration-300 ${scrolled ? "bg-gray-950/85 backdrop-blur-xl border-b border-white/5" : ""}`}>
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold tracking-tight">Try<span className="text-blue-500">RepWise</span></Link>
          <div className="hidden md:flex items-center gap-8">
            <a href="#problem" className="text-sm text-gray-400 hover:text-white transition">Why RepWise</a>
            <a href="#howitworks" className="text-sm text-gray-400 hover:text-white transition">How it works</a>
            <a href="#pricing" className="text-sm text-gray-400 hover:text-white transition">Pricing</a>
            <a href="#faq" className="text-sm text-gray-400 hover:text-white transition">FAQ</a>
            <Link href="/help" className="text-sm text-gray-400 hover:text-white transition">Help</Link>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm text-gray-400 hover:text-white transition">Sign in</Link>
            <Link href="/signup" className="text-sm bg-blue-600 hover:bg-blue-500 text-white font-semibold px-4 py-2 rounded-xl transition shadow-lg shadow-blue-500/20">
              Start free
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative min-h-screen flex items-center justify-center px-6 pt-20 pb-16">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[900px] h-[900px] bg-blue-600/6 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/4 w-[500px] h-[500px] bg-indigo-600/6 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-blue-400/4 rounded-full blur-3xl" />
        </div>

        <div className={`max-w-6xl mx-auto w-full grid md:grid-cols-2 gap-16 items-center transition-all duration-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
          <div>
            <div className="inline-flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium px-3 py-1.5 rounded-full mb-6">
              <span className="w-1.5 h-1.5 bg-red-400 rounded-full animate-pulse" />
              Most teams lose 40% of deals in follow-up
            </div>
            <h1 className="text-5xl md:text-6xl font-bold tracking-tight leading-[1.05] mb-6">
              You&apos;re losing deals.<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-blue-500">Here&apos;s why.</span>
            </h1>
            <p className="text-gray-400 text-lg leading-relaxed mb-4">
              RepWise reveals the hidden patterns costing you deals — closed-loop insights on deal killers, underperformers, and follow-up failures.
            </p>
            <p className="text-gray-500 text-sm mb-8">Upload your sales data. Get 8-10 insights in 2 minutes.</p>

            <div className="flex items-center gap-3 mb-8">
              <span className="text-xs text-gray-600">Works with</span>
              {["☁️", "🟠", "🟢", "🔵"].map((l, i) => (
                <div key={i} className="w-8 h-8 bg-gray-800/80 border border-gray-700 rounded-lg flex items-center justify-center text-sm hover:border-gray-500 hover:scale-110 transition-all duration-200">{l}</div>
              ))}
              <span className="text-xs text-gray-700">+ CSV</span>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 mb-8">
              <Link href="/signup" className="text-center bg-blue-600 hover:bg-blue-500 text-white font-semibold px-8 py-4 rounded-xl text-sm transition shadow-xl shadow-blue-500/20 hover:shadow-blue-500/30 hover:-translate-y-0.5 duration-200">
                Analyze your deals free
              </Link>
              <Link href="/demo" className="text-center bg-gray-800 hover:bg-gray-700 border border-gray-700 text-white font-semibold px-8 py-3.5 rounded-xl text-sm transition hover:-translate-y-0.5 duration-200">
  See live demo
</Link>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex -space-x-2">
                {["J", "S", "M", "P", "T"].map((l, i) => (
                  <div key={i} className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 border-2 border-gray-950 flex items-center justify-center text-white text-xs font-bold">{l}</div>
                ))}
              </div>
              <div>
                <div className="flex items-center gap-1">
                  {[1,2,3,4,5].map(s => <svg key={s} className="w-3 h-3 text-yellow-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>)}
                </div>
                <p className="text-gray-600 text-xs">Trusted by 500+ field sales reps</p>
              </div>
            </div>
          </div>

          {/* Live insight preview */}
          <div className="relative">
            <div className="absolute -inset-4 bg-blue-500/5 rounded-3xl blur-2xl" />
            <div className="relative bg-gray-900/95 backdrop-blur border border-gray-800 rounded-2xl p-5 shadow-2xl ring-1 ring-white/5">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-800/80">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-xs text-gray-400 font-medium">Live insights — Updated today</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-red-400" />
                  <span className="w-2 h-2 rounded-full bg-yellow-400" />
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                </div>
              </div>
              <div className="space-y-2">
                {insights.map((insight, i) => {
                  const cfg = priorityConfig[insight.priority as keyof typeof priorityConfig];
                  return (
                    <div key={i} onClick={() => setActiveInsight(i)} className={`p-3 rounded-xl border cursor-pointer transition-all duration-400 ${activeInsight === i ? cfg.card : "bg-transparent border-gray-800/40 hover:bg-gray-800/30"}`}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${cfg.badge}`}>
                          <span className={`w-1 h-1 rounded-full ${cfg.dot}`} />{cfg.label}
                        </span>
                        <span className="text-xs text-gray-600">{insight.category}</span>
                      </div>
                      <p className="text-sm font-semibold text-white leading-snug">{insight.title}</p>
                      {activeInsight === i && (
                        <div className="mt-2">
                          <p className="text-xs text-gray-400 leading-relaxed mb-1.5">{insight.body}</p>
                          <span className="text-xs font-bold text-blue-400">{insight.metric}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              <div className="mt-4 flex gap-1">
                {insights.map((_, i) => (
                  <button key={i} onClick={() => setActiveInsight(i)} className={`h-1 rounded-full flex-1 transition-all duration-300 ${i === activeInsight ? "bg-blue-500" : "bg-gray-800"}`} />
                ))}
              </div>
            </div>
            <div className="absolute -top-5 -right-3 bg-emerald-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg shadow-emerald-500/30 animate-bounce">+$31k found</div>
            <div className="absolute -bottom-4 -left-3 bg-gray-800 border border-gray-700 text-white text-xs font-medium px-3 py-1.5 rounded-full shadow-lg">3.4 more closes/week</div>
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <section className="border-y border-gray-800/60 py-14 bg-gray-900/20">
        <div className="max-w-4xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8">
          <AnimatedStat value={8} suffix="-10" label="Insights per upload" />
          <AnimatedStat value={2} suffix=" min" label="Average analysis time" />
          <AnimatedStat value={500} suffix="+" label="Reps using RepWise" />
          <AnimatedStat value={47} suffix="%" label="Avg close rate increase" />
        </div>
      </section>

      {/* Problem section */}
      <section id="problem" className="max-w-5xl mx-auto px-6 py-24">
        <FadeIn>
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-gray-800 border border-gray-700 text-gray-400 text-xs font-medium px-3 py-1.5 rounded-full mb-4">The problem</div>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-5">Your deals are dying silently.</h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">Every day your team burns doors, misses follow-ups, and ignores the one ZIP code that converts at 3x the rate. You just do not know which ones yet.</p>
          </div>
        </FadeIn>

        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              icon: "🚪",
              title: "Burning Doors Without Converting",
              desc: "Your rep visits 30 prospects. Closes 2. Where did the other 28 go? No follow-up system means dead leads and wasted commissions.",
              stat: "28 doors wasted per rep per week",
              color: "red",
            },
            {
              icon: "⏰",
              title: "The Time-of-Day Mystery",
              desc: "Calls at 2pm close 3x better than 10am. But your team calls whenever they feel like it. You are losing deals by accident.",
              stat: "3x better close rate in peak hours",
              color: "yellow",
            },
            {
              icon: "🏆",
              title: "The High-Performer You Cannot Scale",
              desc: "One rep closes at 2x the rate of peers. Is it technique? Territory? Luck? You have no idea. You cannot scale what you cannot see.",
              stat: "2x close rate gap on average teams",
              color: "blue",
            },
          ].map((p, i) => (
            <FadeIn key={p.title} delay={i * 120}>
              <div className={`group bg-gray-900 border rounded-2xl p-6 hover:-translate-y-1 hover:shadow-xl transition-all duration-300 ${
                p.color === "red" ? "border-red-500/20 hover:border-red-500/40 hover:shadow-red-500/5" :
                p.color === "yellow" ? "border-yellow-500/20 hover:border-yellow-500/40 hover:shadow-yellow-500/5" :
                "border-blue-500/20 hover:border-blue-500/40 hover:shadow-blue-500/5"
              }`}>
                <div className="text-3xl mb-4 group-hover:scale-110 transition-transform duration-300 inline-block">{p.icon}</div>
                <h3 className="text-white font-bold text-lg mb-3">{p.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed mb-4">{p.desc}</p>
                <div className={`text-xs font-semibold px-3 py-1.5 rounded-full inline-block ${
                  p.color === "red" ? "bg-red-500/10 text-red-400" :
                  p.color === "yellow" ? "bg-yellow-500/10 text-yellow-400" :
                  "bg-blue-500/10 text-blue-400"
                }`}>{p.stat}</div>
              </div>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* Solution */}
      <section className="bg-gray-900/30 border-y border-gray-800/60 py-24">
        <div className="max-w-5xl mx-auto px-6">
          <FadeIn>
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 bg-gray-800 border border-gray-700 text-gray-400 text-xs font-medium px-3 py-1.5 rounded-full mb-4">The solution</div>
              <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-5">AI that reads your data<br />like your best manager would.</h2>
              <p className="text-gray-400 text-lg max-w-xl mx-auto">Upload once. Get a complete diagnosis of where your deals are dying and exactly what to do about it.</p>
            </div>
          </FadeIn>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: "⚡",
                title: "Instant Diagnosis",
                desc: "Upload a CSV. AI analyzes 1,000+ deal signals in 2 minutes. You see exactly where deals die — by rep, time, territory, and stage.",
                stat: "2 min average analysis time",
                example: "Critical: 14 prospects ignored after first contact",
              },
              {
                icon: "🎯",
                title: "Actionable Insights",
                desc: "Not just data. 8-10 specific actions tagged Critical, Opportunity, or Pattern — which time to call, who needs coaching, what follow-ups are missing.",
                stat: "8-10 insights per upload",
                example: "Opportunity: 2-4pm closes 3x better than morning",
              },
              {
                icon: "📈",
                title: "Track Progress Over Time",
                desc: "Upload weekly. Watch your close rate climb. See which changes actually move the needle and which were noise.",
                stat: "47% avg close rate increase in 30 days",
                example: "Pattern: Wednesday outperforms Tuesday by 28%",
              },
            ].map((s, i) => (
              <FadeIn key={s.title} delay={i * 120}>
                <div className="group bg-gray-900 border border-gray-800 rounded-2xl p-6 hover:border-blue-500/30 hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-500/5 transition-all duration-300 h-full flex flex-col">
                  <div className="text-3xl mb-4 group-hover:scale-110 transition-transform duration-300 inline-block">{s.icon}</div>
                  <h3 className="text-white font-bold text-lg mb-3">{s.title}</h3>
                  <p className="text-gray-400 text-sm leading-relaxed mb-4 flex-1">{s.desc}</p>
                  <div className="bg-gray-800 rounded-xl p-3 mb-3">
                    <p className="text-xs text-gray-500 mb-1">Example insight</p>
                    <p className="text-xs text-blue-400 font-medium">{s.example}</p>
                  </div>
                  <div className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-full inline-block w-fit">{s.stat}</div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* Social proof */}
      <section className="max-w-5xl mx-auto px-6 py-24">
        <FadeIn>
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-gray-800 border border-gray-700 text-gray-400 text-xs font-medium px-3 py-1.5 rounded-full mb-4">Real results</div>
            <h2 className="text-4xl font-bold tracking-tight mb-5">Reps who use RepWise close more.</h2>
            <p className="text-gray-400 text-lg">Not because of magic. Because they finally know what is actually costing them deals.</p>
          </div>
        </FadeIn>

        <div className="grid md:grid-cols-3 gap-5 mb-12">
          {[
            {
              quote: "I uploaded my CSV on a Monday and by Tuesday I had completely rescheduled my knocking hours. Closed 3 extra deals that week alone.",
              name: "Jake M.",
              title: "Solar Sales Rep · Austin TX",
              metric: "+3 closes in week 1",
              avatar: "J",
              color: "blue",
            },
            {
              quote: "As a manager I was flying blind. RepWise showed me Marcus was burning 54 doors per close while Sara was doing it in 7. One coaching call fixed it.",
              name: "Sarah K.",
              title: "Regional Manager · Phoenix AZ",
              metric: "Team close rate up 31%",
              avatar: "S",
              color: "purple",
            },
            {
              quote: "The follow-up insight alone paid for a year of the tool. We had 12 warm leads just sitting there. Called them all back and closed 4.",
              name: "Marcus T.",
              title: "D2D Team Lead · Denver CO",
              metric: "$47,000 recovered",
              avatar: "M",
              color: "emerald",
            },
          ].map((t, i) => (
            <FadeIn key={t.name} delay={i * 100}>
              <div className={`group bg-gray-900 border rounded-2xl p-6 hover:-translate-y-1 hover:shadow-xl transition-all duration-300 h-full flex flex-col ${
                t.color === "blue" ? "border-blue-500/20 hover:border-blue-500/40 hover:shadow-blue-500/5" :
                t.color === "purple" ? "border-purple-500/20 hover:border-purple-500/40 hover:shadow-purple-500/5" :
                "border-emerald-500/20 hover:border-emerald-500/40 hover:shadow-emerald-500/5"
              }`}>
                <div className="flex items-center gap-1 mb-4">
                  {[1,2,3,4,5].map(s => <svg key={s} className="w-3.5 h-3.5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>)}
                </div>
                <p className="text-gray-300 text-sm leading-relaxed mb-5 flex-1 italic">&ldquo;{t.quote}&rdquo;</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold ${
                      t.color === "blue" ? "bg-blue-600" : t.color === "purple" ? "bg-purple-600" : "bg-emerald-600"
                    }`}>{t.avatar}</div>
                    <div>
                      <p className="text-white text-xs font-semibold">{t.name}</p>
                      <p className="text-gray-600 text-xs">{t.title}</p>
                    </div>
                  </div>
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                    t.color === "blue" ? "bg-blue-500/10 text-blue-400" :
                    t.color === "purple" ? "bg-purple-500/10 text-purple-400" :
                    "bg-emerald-500/10 text-emerald-400"
                  }`}>{t.metric}</span>
                </div>
              </div>
            </FadeIn>
          ))}
        </div>

        {/* Trust badges */}
        <FadeIn>
          <div className="flex flex-wrap items-center justify-center gap-6">
            {[
              { icon: "🔒", label: "Bank-grade encryption" },
              { icon: "🛡️", label: "SOC 2 compliant infrastructure" },
              { icon: "🔐", label: "Row-level security" },
              { icon: "🇺🇸", label: "US-based servers" },
              { icon: "❌", label: "We never sell your data" },
            ].map(b => (
              <div key={b.label} className="flex items-center gap-2 text-gray-500 text-xs">
                <span>{b.icon}</span>
                <span>{b.label}</span>
              </div>
            ))}
          </div>
        </FadeIn>
      </section>

      {/* How it works */}
      <section id="howitworks" className="bg-gray-900/30 border-y border-gray-800/60 py-24">
        <div className="max-w-4xl mx-auto px-6">
          <FadeIn>
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 bg-gray-800 border border-gray-700 text-gray-400 text-xs font-medium px-3 py-1.5 rounded-full mb-4">How it works</div>
              <h2 className="text-4xl font-bold tracking-tight mb-5">Up and running in 2 minutes.</h2>
              <p className="text-gray-400 text-lg">No setup call. No onboarding doc. No CRM required.</p>
            </div>
          </FadeIn>

          <div className="relative">
            <div className="hidden md:block absolute top-12 left-1/6 right-1/6 h-px bg-gradient-to-r from-transparent via-gray-700 to-transparent" />
            <div className="grid md:grid-cols-3 gap-8">
              {[
                { step: "01", icon: "📤", title: "Upload your data", desc: "Drag and drop a CSV export from any CRM, spreadsheet, or activity tracker. We accept any format.", time: "30 seconds" },
                { step: "02", icon: "🧠", title: "AI analyzes everything", desc: "Claude processes your activity data — close rates by rep, time, territory, pipeline stage — and finds patterns humans miss.", time: "90 seconds" },
                { step: "03", icon: "📊", title: "Act on your insights", desc: "Get 8-10 prioritized insights on your dashboard. Critical issues first. Dismiss what you have addressed. Track progress weekly.", time: "Ongoing" },
              ].map((s, i) => (
                <FadeIn key={s.step} delay={i * 150}>
                  <div className="group text-center">
                    <div className="relative inline-block mb-6">
                      <div className="w-20 h-20 bg-gray-900 border border-gray-800 group-hover:border-blue-500/40 rounded-2xl flex items-center justify-center text-3xl group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-blue-500/10 transition-all duration-300">{s.icon}</div>
                      <div className="absolute -top-2 -right-2 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold">{i + 1}</div>
                    </div>
                    <div className="text-xs font-bold text-blue-500 mb-2 tracking-widest">{s.step}</div>
                    <h3 className="text-white font-bold text-lg mb-2">{s.title}</h3>
                    <p className="text-gray-500 text-sm leading-relaxed mb-3">{s.desc}</p>
                    <span className="text-xs text-gray-600 bg-gray-800 px-3 py-1 rounded-full">{s.time}</span>
                  </div>
                </FadeIn>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-5xl mx-auto px-6 py-24">
        <FadeIn>
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-gray-800 border border-gray-700 text-gray-400 text-xs font-medium px-3 py-1.5 rounded-full mb-4">Features</div>
            <h2 className="text-4xl font-bold tracking-tight mb-5">Built for the way field sales actually works.</h2>
            <p className="text-gray-400 text-lg">Not generic BI tools. Every feature designed for door-to-door and field sales teams.</p>
          </div>
        </FadeIn>
        <div className="grid md:grid-cols-3 gap-5">
          {[
            { emoji: "⏰", title: "Time of Day Analysis", body: "Know which hours close best. Stop burning knocks at the wrong time of day." },
            { emoji: "🗺️", title: "Territory Intelligence", body: "Find your highest-converting ZIP codes and double down where it matters." },
            { emoji: "👥", title: "Rep Benchmarking", body: "See who is outperforming and who needs coaching before numbers slip." },
            { emoji: "🔔", title: "Daily Fresh Insights", body: "New AI insights every morning. Never make decisions on stale data again." },
            { emoji: "🏷️", title: "Priority Tags", body: "Critical, Opportunity, or Pattern. Know exactly what to fix first." },
            { emoji: "📊", title: "Analytics Dashboard", body: "Charts for close rate by time, rep performance, revenue trends, and top ZIPs." },
            { emoji: "🔌", title: "CRM Integrations", body: "Connect Salesforce, HubSpot, Pipedrive, or just drop in a CSV." },
            { emoji: "👔", title: "Manager Dashboard", body: "See every rep's performance, insights history, and coaching opportunities." },
            { emoji: "📧", title: "Daily Email Digest", body: "Morning email with your top 3 insights so you start every day with a plan." },
          ].map((f, i) => (
            <FadeIn key={f.title} delay={(i % 3) * 80}>
              <div className="group bg-gray-900 border border-gray-800 rounded-2xl p-5 hover:border-gray-700 hover:-translate-y-1 hover:shadow-lg hover:shadow-black/20 transition-all duration-300">
                <div className="text-2xl mb-3 group-hover:scale-110 transition-transform duration-300 inline-block">{f.emoji}</div>
                <h3 className="text-white font-semibold mb-2 text-sm">{f.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{f.body}</p>
              </div>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="bg-gray-900/30 border-y border-gray-800/60 py-24">
        <div className="max-w-5xl mx-auto px-6">
          <FadeIn>
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 bg-gray-800 border border-gray-700 text-gray-400 text-xs font-medium px-3 py-1.5 rounded-full mb-4">Pricing</div>
              <h2 className="text-4xl font-bold tracking-tight mb-5">Simple pricing. No surprises.</h2>
              <p className="text-gray-400 text-lg mb-8">Start free. Upgrade when you are ready. Cancel anytime.</p>

              {/* Toggle */}
              <div className="inline-flex items-center gap-1 bg-gray-900 border border-gray-800 rounded-xl p-1">
                <button onClick={() => setBillingPeriod("monthly")} className={`px-4 py-2 rounded-lg text-sm font-medium transition ${billingPeriod === "monthly" ? "bg-gray-800 text-white" : "text-gray-500 hover:text-gray-300"}`}>Monthly</button>
                <button onClick={() => setBillingPeriod("annual")} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${billingPeriod === "annual" ? "bg-gray-800 text-white" : "text-gray-500 hover:text-gray-300"}`}>
                  Annual
                  <span className="text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded-full">Save 20%</span>
                </button>
              </div>
            </div>
          </FadeIn>

          <div className="grid md:grid-cols-4 gap-4 mb-6">
            {[
              { id: "free", name: "Free", price: 0, period: "/month", desc: "Try it risk-free.", features: ["3 insights/month", "1 CSV upload", "Basic dashboard"], cta: "Start free", highlight: false, badge: null },
              { id: "essential", name: "Essential", price: prices[billingPeriod].essential, period: "/month", desc: "For solo reps.", features: ["Unlimited insights", "Unlimited uploads", "Goal tracking", "Weekly reports", "30-day history"], cta: "Start 7-day trial", highlight: false, badge: null },
              { id: "professional", name: "Professional", price: prices[billingPeriod].professional, period: "/month", desc: "For growing teams.", features: ["Everything in Essential", "5-person team", "AI coaching", "Custom goals", "90-day history"], cta: "Start 7-day trial", highlight: true, badge: "Most Popular" },
              { id: "team", name: "Team", price: prices[billingPeriod].team, period: "/month", desc: "Unlimited seats.", features: ["Everything in Pro", "Unlimited members", "Manager dashboard", "Leaderboards", "CRM integrations"], cta: "Start 7-day trial", highlight: false, badge: null },
            ].map((plan, i) => (
              <FadeIn key={plan.id} delay={i * 80}>
                <div className={`relative rounded-2xl p-6 border flex flex-col hover:-translate-y-1 transition-all duration-300 h-full ${plan.highlight ? "bg-blue-600 border-blue-500 shadow-xl shadow-blue-500/20" : "bg-gray-900 border-gray-800 hover:border-gray-700"}`}>
                  {plan.badge && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-white text-blue-600 text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap shadow-lg">{plan.badge}</div>
                  )}
                  <h3 className="text-white font-bold mb-1">{plan.name}</h3>
                  <div className="flex items-end gap-1 mb-2">
                    <span className="text-3xl font-bold text-white">${plan.price}</span>
                    <span className={`text-xs mb-1 ${plan.highlight ? "text-blue-200" : "text-gray-500"}`}>{plan.period}</span>
                  </div>
                  <p className={`text-xs mb-4 ${plan.highlight ? "text-blue-100" : "text-gray-500"}`}>{plan.desc}</p>
                  <ul className="space-y-1.5 mb-6 flex-1">
                    {plan.features.map(f => (
                      <li key={f} className="flex items-center gap-2 text-xs">
                        <svg className={`w-3.5 h-3.5 flex-shrink-0 ${plan.highlight ? "text-blue-200" : "text-blue-500"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                        <span className={plan.highlight ? "text-blue-50" : "text-gray-400"}>{f}</span>
                      </li>
                    ))}
                  </ul>
                  <Link href="/signup" className={`block text-center font-semibold px-4 py-2.5 rounded-xl text-sm transition ${plan.highlight ? "bg-white text-blue-600 hover:bg-blue-50" : "bg-blue-600 hover:bg-blue-500 text-white"}`}>
                    {plan.cta}
                  </Link>
                </div>
              </FadeIn>
            ))}
          </div>

          <FadeIn>
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 flex items-center justify-between hover:border-gray-700 transition">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-yellow-500/10 rounded-xl flex items-center justify-center text-xl">🏢</div>
                <div>
                  <h3 className="text-white font-bold text-sm">Enterprise</h3>
                  <p className="text-gray-500 text-xs">50+ reps. API access, white-label, dedicated account manager, SLA guarantee.</p>
                </div>
              </div>
              <Link href="/contact" className="flex-shrink-0 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-white font-semibold px-4 py-2 rounded-xl text-sm transition ml-4">Contact us</Link>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="max-w-3xl mx-auto px-6 py-24">
        <FadeIn>
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-gray-800 border border-gray-700 text-gray-400 text-xs font-medium px-3 py-1.5 rounded-full mb-4">FAQ</div>
            <h2 className="text-4xl font-bold tracking-tight mb-5">Common questions.</h2>
            <p className="text-gray-400 text-lg">Everything you need to know before you start.</p>
          </div>
        </FadeIn>
        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <FadeIn key={i} delay={i * 40}>
              <div className={`bg-gray-900 border rounded-2xl overflow-hidden transition-all duration-200 ${openFaq === i ? "border-blue-500/30" : "border-gray-800 hover:border-gray-700"}`}>
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between px-6 py-4 text-left"
                >
                  <span className="text-white font-medium text-sm">{faq.q}</span>
                  <svg className={`w-4 h-4 text-gray-500 flex-shrink-0 ml-4 transition-transform duration-200 ${openFaq === i ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                </button>
                {openFaq === i && (
                  <div className="px-6 pb-4">
                    <p className="text-gray-400 text-sm leading-relaxed">{faq.a}</p>
                  </div>
                )}
              </div>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="px-6 pb-24">
        <FadeIn>
          <div className="max-w-2xl mx-auto text-center bg-gradient-to-br from-blue-600/20 via-indigo-600/10 to-transparent border border-blue-500/20 rounded-3xl p-14">
            <div className="text-5xl mb-5">🚀</div>
            <h2 className="text-4xl font-bold tracking-tight mb-4">Your next deal is waiting for insights.</h2>
            <p className="text-gray-400 text-lg mb-2 leading-relaxed">See exactly what you are missing. It takes less time than a cold call.</p>
            <p className="text-gray-600 text-sm mb-8">Upload your sales data. Get 8-10 insights in 2 minutes.</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center mb-4">
              <Link href="/signup" className="inline-block bg-blue-600 hover:bg-blue-500 text-white font-bold px-8 py-4 rounded-xl text-sm transition shadow-xl shadow-blue-500/20 hover:-translate-y-0.5 duration-200">
                Start free analysis
              </Link>
              <Link href="/demo" className="inline-block bg-gray-800 hover:bg-gray-700 border border-gray-700 text-white font-semibold px-8 py-4 rounded-xl text-sm transition hover:-translate-y-0.5 duration-200">
  See live demo
</Link>
            </div>
            <p className="text-gray-600 text-xs">No credit card required. 7-day free trial. Cancel anytime.</p>
          </div>
        </FadeIn>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-800/50 px-6 py-12">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-10">
            <div>
              <span className="text-lg font-bold text-white block mb-3">Try<span className="text-blue-500">RepWise</span></span>
              <p className="text-gray-600 text-xs leading-relaxed">AI-powered sales intelligence for field sales reps and door-to-door teams.</p>
            </div>
            <div>
              <h4 className="text-white text-xs font-semibold mb-3 uppercase tracking-wider">Product</h4>
              <div className="space-y-2">
                <a href="#features" className="block text-gray-500 hover:text-gray-300 text-xs transition">Features</a>
                <a href="#pricing" className="block text-gray-500 hover:text-gray-300 text-xs transition">Pricing</a>
                <a href="#howitworks" className="block text-gray-500 hover:text-gray-300 text-xs transition">How it works</a>
                <a href="#faq" className="block text-gray-500 hover:text-gray-300 text-xs transition">FAQ</a>
              </div>
            </div>
            <div>
              <h4 className="text-white text-xs font-semibold mb-3 uppercase tracking-wider">Company</h4>
              <div className="space-y-2">
                <Link href="/help" className="block text-gray-500 hover:text-gray-300 text-xs transition">Help Center</Link>
                <Link href="/contact" className="block text-gray-500 hover:text-gray-300 text-xs transition">Contact</Link>
              </div>
            </div>
            <div>
              <h4 className="text-white text-xs font-semibold mb-3 uppercase tracking-wider">Get started</h4>
              <div className="space-y-2">
                <Link href="/signup" className="block text-gray-500 hover:text-gray-300 text-xs transition">Sign up free</Link>
                <Link href="/login" className="block text-gray-500 hover:text-gray-300 text-xs transition">Sign in</Link>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-800/50 pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-xs text-gray-700">2025 TryRepWise. All rights reserved.</p>
            <div className="flex items-center gap-6">
              <span className="text-gray-700 text-xs">Privacy Policy</span>
              <span className="text-gray-700 text-xs">Terms of Service</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
