"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";

const insights = [
  {
    priority: "critical",
    category: "Time of Day",
    title: "You're knocking during dead hours",
    body: "73% of your closes happen between 4-7pm but you're spending 40% of your time knocking before noon. Shift your schedule and you could add 3-4 closes per week.",
    metric: "+3.4 closes/week potential",
  },
  {
    priority: "opportunity",
    category: "Territory",
    title: "ZIP code 78704 is underworked",
    body: "This ZIP has a 34% contact rate vs your average of 19%, but you've only knocked 12 doors there this month. This is your highest-converting area.",
    metric: "34% contact rate",
  },
  {
    priority: "critical",
    category: "Rep Performance",
    title: "Marcus is burning doors without converting",
    body: "Marcus knocked 54 doors last week with 1 close. Team average is 1 close per 11 doors. He needs coaching on his pitch, not more territory.",
    metric: "1 close per 54 doors",
  },
  {
    priority: "pattern",
    category: "Follow-Ups",
    title: "12 warm leads were never called back",
    body: "You scheduled follow-ups with 12 contacts last month and never returned. Based on your close rate, that is an estimated $28,000 in lost revenue.",
    metric: "$28,000 est. lost",
  },
  {
    priority: "opportunity",
    category: "Deal Value",
    title: "Sara closes 34% higher than team average",
    body: "Sara's average deal is $23,400 vs team average of $17,500. Her pitch approach on the initial contact is worth studying and replicating.",
    metric: "$23,400 avg deal",
  },
];

const priorityConfig = {
  critical: { label: "Critical", class: "bg-red-500/15 text-red-400 border border-red-500/20", dot: "bg-red-400", card: "border-red-500/20" },
  opportunity: { label: "Opportunity", class: "bg-green-500/15 text-green-400 border border-green-500/20", dot: "bg-green-400", card: "border-green-500/20" },
  pattern: { label: "Pattern", class: "bg-blue-500/15 text-blue-400 border border-blue-500/20", dot: "bg-blue-400", card: "border-blue-500/20" },
};

const crms = [
  { name: "Salesforce", logo: "☁️", desc: "Leads and opportunities" },
  { name: "HubSpot", logo: "🟠", desc: "Contacts and deals" },
  { name: "Pipedrive", logo: "🟢", desc: "Pipeline activity" },
  { name: "Zoho CRM", logo: "🔵", desc: "Accounts and visits" },
];

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
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setStarted(true); },
      { threshold: 0.5 }
    );
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

export default function LandingPage() {
  const [activeInsight, setActiveInsight] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    setIsVisible(true);
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveInsight((prev) => (prev + 1) % insights.length);
    }, 3500);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-gray-950 text-white overflow-x-hidden">

      <nav className={`fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 py-4 transition-all duration-300 ${scrolled ? "bg-gray-950/90 backdrop-blur-md border-b border-gray-800/50" : ""}`}>
        <span className="text-xl font-bold tracking-tight">Rep<span className="text-blue-500">Wise</span></span>
        <div className="flex items-center gap-4">
          <Link href="/login" className="text-sm text-gray-400 hover:text-white transition">Sign in</Link>
          <Link href="/signup" className="text-sm bg-blue-600 hover:bg-blue-500 text-white font-semibold px-4 py-2 rounded-lg transition">Get started free</Link>
        </div>
      </nav>

      <section className="relative min-h-screen flex items-center justify-center px-8 pt-20">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-3xl" />
          <div className="absolute top-1/3 left-1/4 w-[300px] h-[300px] bg-blue-800/10 rounded-full blur-3xl" />
        </div>
        <div className={`max-w-6xl mx-auto w-full grid md:grid-cols-2 gap-16 items-center transition-all duration-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
          <div>
            <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-medium px-3 py-1.5 rounded-full mb-6">
              <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse" />
              New insights generated every day
            </div>
            <h1 className="text-5xl font-bold tracking-tight leading-tight mb-6">
              Stop guessing why you are <span className="text-blue-500">losing deals</span>
            </h1>
            <p className="text-gray-400 text-lg leading-relaxed mb-6">
              RepWise analyzes your sales activity daily and surfaces exactly where you are leaving money on the table. Connect your CRM or upload a CSV and get insights in minutes.
            </p>
            <div className="flex items-center gap-3 mb-8">
              <span className="text-xs text-gray-500">Connects with</span>
              <div className="flex items-center gap-2">
                {crms.map((crm) => (
                  <div key={crm.name} title={crm.name} className="w-8 h-8 bg-gray-800 border border-gray-700 rounded-lg flex items-center justify-center text-sm hover:border-gray-600 transition cursor-default">
                    {crm.logo}
                  </div>
                ))}
              </div>
              <span className="text-xs text-gray-600">+ CSV upload</span>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link href="/signup" className="text-center bg-blue-600 hover:bg-blue-500 text-white font-semibold px-8 py-3.5 rounded-xl text-sm transition">Start free trial</Link>
              <Link href="/login" className="text-center bg-gray-800 hover:bg-gray-700 text-white font-semibold px-8 py-3.5 rounded-xl text-sm transition">Sign in</Link>
            </div>
            <p className="text-gray-600 text-xs mt-4">No credit card required. Setup in 2 minutes.</p>
          </div>

          <div className="relative">
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 shadow-2xl">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-800">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-green-400 animate-pulse" />
                  <span className="text-xs text-gray-400 font-medium">Live insights. Updated today.</span>
                </div>
                <span className="text-xs text-gray-600">{insights.length} insights found</span>
              </div>
              <div className="space-y-2">
                {insights.map((insight, i) => {
                  const config = priorityConfig[insight.priority as keyof typeof priorityConfig];
                  return (
                    <div key={i} onClick={() => setActiveInsight(i)} className={`p-3 rounded-xl border cursor-pointer transition-all duration-300 ${activeInsight === i ? `bg-gray-800 ${config.card} shadow-lg` : "bg-gray-900 border-gray-800/50 hover:bg-gray-800/50"}`}>
                      <div className="flex items-start gap-3">
                        <div className="flex-1 min-w-0">
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
                              <p className="text-xs text-gray-400 leading-relaxed mb-2">{insight.body}</p>
                              <span className="text-xs font-semibold text-blue-400">{insight.metric}</span>
                            </div>
                          )}
                        </div>
                      </div>
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
            <div className="absolute -top-4 -right-4 bg-green-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg animate-bounce">+$28k recovered</div>
            <div className="absolute -bottom-4 -left-4 bg-gray-800 border border-gray-700 text-white text-xs font-medium px-3 py-1.5 rounded-full shadow-lg">3.4 more closes/week</div>
          </div>
        </div>
      </section>

      <section className="border-y border-gray-800 py-16 bg-gray-900/30">
        <div className="max-w-4xl mx-auto px-8 grid grid-cols-2 md:grid-cols-4 gap-8">
          <StatCard value={8} suffix="-10" label="Insights per upload" delay={0} />
          <StatCard value={2} suffix=" min" label="Analysis time" delay={100} />
          <StatCard value={200} suffix="/mo" label="Solo rep plan" delay={200} />
          <StatCard value={150} suffix="/seat" label="Team plan" delay={300} />
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-8 py-24">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Works with your existing tools</h2>
          <p className="text-gray-400">Connect your CRM for automatic daily syncing, or upload a CSV anytime. No changes to your workflow.</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { name: "Salesforce", logo: "☁️", desc: "Leads and opportunities" },
            { name: "HubSpot", logo: "🟠", desc: "Contacts and deals" },
            { name: "Pipedrive", logo: "🟢", desc: "Pipeline activity" },
            { name: "Zoho CRM", logo: "🔵", desc: "Accounts and visits" },
          ].map((crm) => (
            <div key={crm.name} className="bg-gray-900 border border-gray-800 rounded-2xl p-5 text-center hover:border-gray-700 transition-all hover:-translate-y-1 duration-300">
              <div className="text-3xl mb-3">{crm.logo}</div>
              <div className="text-white font-semibold text-sm mb-1">{crm.name}</div>
              <div className="text-gray-500 text-xs">{crm.desc}</div>
              <div className="mt-3 text-xs text-blue-400 bg-blue-500/10 border border-blue-500/20 rounded-full px-2 py-0.5 inline-block">Coming soon</div>
            </div>
          ))}
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-gray-800 rounded-xl flex items-center justify-center text-xl">📄</div>
            <div>
              <div className="text-white font-semibold text-sm">CSV Upload</div>
              <div className="text-gray-400 text-xs">Export from any tool and upload in seconds. Available right now.</div>
            </div>
          </div>
          <Link href="/signup" className="text-sm bg-blue-600 hover:bg-blue-500 text-white font-semibold px-4 py-2 rounded-lg transition whitespace-nowrap">Try it free</Link>
        </div>
      </section>

      <section className="bg-gray-900/30 border-y border-gray-800 py-24">
        <div className="max-w-4xl mx-auto px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Up and running in minutes</h2>
            <p className="text-gray-400">No setup call. No onboarding doc. Just connect and go.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: "01", title: "Connect or upload", body: "Link your CRM for automatic syncing or drop in a CSV from any tool. We handle the rest.", icon: "📤" },
              { step: "02", title: "AI analyzes your data", body: "Our Claude-powered engine processes your activity and finds patterns humans miss in seconds.", icon: "🧠" },
              { step: "03", title: "Get daily insights", body: "Wake up to fresh insights every morning tagged Critical, Opportunity, or Pattern.", icon: "📊" },
            ].map((item) => (
              <div key={item.step} className="bg-gray-900 border border-gray-800 rounded-2xl p-6 hover:border-gray-700 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-black/20">
                <div className="text-3xl mb-4">{item.icon}</div>
                <div className="text-xs font-bold text-blue-500 mb-2 tracking-widest">{item.step}</div>
                <h3 className="text-white font-semibold mb-2">{item.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-8 py-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold mb-4">Everything you need to close more</h2>
          <p className="text-gray-400">Built specifically for field sales and door-to-door teams.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { emoji: "⏰", title: "Time of Day Analysis", body: "Know which hours your team closes best and stop wasting knocks at the wrong time." },
            { emoji: "🗺️", title: "Territory Insights", body: "Find your highest-converting ZIP codes and double down where it matters most." },
            { emoji: "👥", title: "Rep Benchmarking", body: "See who is outperforming and who needs coaching before numbers slip." },
            { emoji: "🔔", title: "Daily Fresh Insights", body: "New AI-generated insights every morning so you are never making decisions on stale data." },
            { emoji: "🏷️", title: "Priority Tags", body: "Every insight is tagged Critical, Opportunity, or Pattern so you fix the right thing first." },
            { emoji: "🔌", title: "Easy Integrations", body: "Connect Salesforce, HubSpot, Pipedrive, or Zoho. Or just drop in a CSV. Your choice." },
          ].map((f) => (
            <div key={f.title} className="bg-gray-900 border border-gray-800 rounded-2xl p-6 hover:border-gray-700 hover:-translate-y-1 transition-all duration-300">
              <div className="text-2xl mb-3">{f.emoji}</div>
              <h3 className="text-white font-semibold mb-2 text-sm">{f.title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-gray-900/30 border-y border-gray-800 py-24">
        <div className="max-w-4xl mx-auto px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Simple, transparent pricing</h2>
            <p className="text-gray-400">Cancel any time. No contracts. No surprises.</p>
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
                description: "For managers running a team of field reps.",
                features: ["Everything in Solo", "Daily team insights", "Rep leaderboard", "Rep-by-rep breakdowns", "Manager dashboard", "Invite unlimited reps", "Priority support"],
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

      <section className="px-8 py-24">
        <div className="max-w-2xl mx-auto text-center bg-gradient-to-br from-blue-600 to-blue-700 rounded-3xl p-12 shadow-2xl shadow-blue-500/20">
          <h2 className="text-3xl font-bold mb-4">Ready to close more?</h2>
          <p className="text-blue-100 mb-8">Connect your CRM or upload your first CSV today and get insights in under 2 minutes.</p>
          <Link href="/signup" className="inline-block bg-white text-blue-600 font-bold px-8 py-3.5 rounded-xl text-sm hover:bg-blue-50 transition">
            Start free trial. No card required.
          </Link>
        </div>
      </section>

      <footer className="border-t border-gray-800 px-8 py-8">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-sm font-bold text-white">Rep<span className="text-blue-500">Wise</span></span>
          <p className="text-xs text-gray-600">2025 RepWise. All rights reserved.</p>
        </div>
      </footer>

    </div>
  );
}
