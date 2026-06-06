"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";

const faqs = [
  { q: "What data do I need?", a: "Any CSV or spreadsheet with your sales activity. Rep names, dates, outcomes. Messy data is fine — our system normalizes it automatically. If you have it in a spreadsheet you can upload it." },
  { q: "How long does the analysis take?", a: "Under 2 minutes from upload to insights on your dashboard. No setup calls, no onboarding docs, no IT required." },
  { q: "Do I need a CRM?", a: "No. Export a CSV from any spreadsheet, HubSpot, Salesforce, or Pipedrive and drop it in. We also have direct HubSpot sync built in." },
  { q: "What if my data is messy or incomplete?", a: "Our system handles any column format, messy dates, dollar signs, missing fields. It works with whatever you have. Most field sales data is imperfect and we built for that reality." },
  { q: "Is my sales data secure?", a: "Yes. All data is encrypted in transit and at rest. Row-level security means your data is only ever visible to you and team members you invite. We never sell or share your data." },
  { q: "What is the guarantee?", a: "If you upload your data and do not find at least one insight worth more than what you paid for the tool in your first 30 days, email us and we will refund you completely. No questions asked." },
  { q: "Can I cancel anytime?", a: "Yes. Cancel from your billing page at any time. No contracts, no cancellation fees." },
  { q: "What is the difference between solo and team plans?", a: "Solo is for individual reps who want insights on their own performance. Team gives managers a dashboard to see every rep, send coaching messages, and track performance across the whole team." },
];

export default function LandingPage() {
  const [annual, setAnnual] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    function onScroll() {
      const el = document.documentElement;
      const progress = (el.scrollTop / (el.scrollHeight - el.clientHeight)) * 100;
      setScrollProgress(progress);
    }
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const problems = [
    { icon: "🚪", title: "Your reps are knocking the wrong doors", desc: "Some ZIP codes close at 30%. Others at 4%. Your reps treat every door the same. You are funding failure with every knock in the wrong territory." },
    { icon: "⏰", title: "You are knocking at the wrong time", desc: "2-4pm closes 3x better than morning for most field teams. But nobody on your team knows that because nobody has looked at the data." },
    { icon: "📞", title: "Warm leads are going cold", desc: "Someone showed interest. Your rep moved on. That lead never got a callback. At your close rate that is thousands of dollars walking out the door every week." },
    { icon: "👥", title: "One rep is carrying the team and you do not know it", desc: "Your top rep closes at 35%. Your bottom rep closes at 6%. Same territory, same leads. You are paying both the same and coaching neither because you cannot see the gap." },
  ];

  const features = [
    { icon: "📊", title: "Rep performance breakdown", desc: "See every rep's close rate, contact rate, and average deal value side by side. Know exactly who needs coaching and who needs more leads." },
    { icon: "⏱️", title: "Time of day analysis", desc: "Find out which hours your team closes best. Stop burning knocks during dead windows. Shift activity to peak conversion hours." },
    { icon: "🗺️", title: "Territory intelligence", desc: "See which ZIP codes convert and which ones drain time. Know where to send your best reps and where to stop knocking entirely." },
    { icon: "📋", title: "Follow-up gap finder", desc: "Automatically flags every warm lead that was never followed up on and estimates the revenue sitting uncollected in your pipeline." },
    { icon: "🎯", title: "AI coaching goals", desc: "Each insight comes with a specific action plan — not just what is wrong, but exactly what to do about it this week." },
    { icon: "📈", title: "Weekly progress tracking", desc: "Upload every week and watch your close rate move. See which changes worked and which ones did not." },
    { icon: "🔌", title: "HubSpot sync", desc: "Connect HubSpot and sync automatically. No CSV export required. Data updates daily." },
    { icon: "👔", title: "Manager dashboard", desc: "Managers get a team-wide view — every rep, every insight, coaching messages, and performance over time." },
  ];

  return (
    <div className="min-h-screen bg-gray-950 text-white">

      {/* Scroll progress */}
      <div className="fixed top-0 left-0 right-0 z-50 h-0.5 bg-gray-900">
        <div className="h-full bg-blue-500 transition-all duration-150" style={{ width: scrollProgress + "%" }} />
      </div>

      {/* Nav */}
      <nav className="fixed top-0.5 left-0 right-0 z-40 bg-gray-950/80 backdrop-blur border-b border-gray-800/50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-white">
            Try<span className="text-blue-500">RepWise</span>
          </Link>
          <div className="hidden md:flex items-center gap-8">
            <a href="#problem" className="text-gray-400 hover:text-white text-sm transition">Why RepWise</a>
            <a href="#howitworks" className="text-gray-400 hover:text-white text-sm transition">How it works</a>
            <a href="#features" className="text-gray-400 hover:text-white text-sm transition">Features</a>
            <a href="#pricing" className="text-gray-400 hover:text-white text-sm transition">Pricing</a>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-gray-400 hover:text-white text-sm transition">Sign in</Link>
            <Link href="/signup" className="bg-blue-600 hover:bg-blue-500 text-white font-semibold px-4 py-2 rounded-xl text-sm transition shadow-lg shadow-blue-500/20">
              Try free
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-medium px-4 py-2 rounded-full mb-6">
            Built by a field sales rep for field sales teams
          </div>
          <h1 className="text-5xl md:text-6xl font-bold leading-tight mb-6">
            You have the data.<br />
            <span className="text-blue-500">Stop flying blind.</span>
          </h1>
          <p className="text-gray-400 text-xl leading-relaxed mb-10 max-w-2xl mx-auto">
            Upload your sales activity and get a complete breakdown of where your team is losing deals — by rep, by hour, by ZIP code, by follow-up gap. In under 2 minutes.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-6">
            <Link href="/signup" className="w-full sm:w-auto bg-blue-600 hover:bg-blue-500 text-white font-bold px-8 py-4 rounded-xl text-base transition shadow-xl shadow-blue-500/20 hover:-translate-y-0.5 duration-200">
              Upload your data free →
            </Link>
            <Link href="/demo" className="w-full sm:w-auto bg-gray-900 hover:bg-gray-800 border border-gray-700 text-white font-semibold px-8 py-4 rounded-xl text-base transition hover:-translate-y-0.5 duration-200">
              See live demo
            </Link>
          </div>
          <p className="text-gray-600 text-sm">No credit card required. First upload free. 7-day trial to unlock everything.</p>
        </div>

        {/* Hero insight preview */}
        <div className="max-w-3xl mx-auto mt-16">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-5">
              <div className="w-2.5 h-2.5 rounded-full bg-red-400 animate-pulse" />
              <span className="text-gray-400 text-xs">Live insights — generated from real sales data</span>
            </div>
            <div className="space-y-3">
              {[
                { priority: "critical", tag: "Rep Performance", metric: "1.8% close rate", title: "Marcus is knocking 54 doors per close while the team averages 11" },
                { priority: "opportunity", tag: "Time of Day", metric: "+3 closes/week", title: "2-4pm closes at 38% — your team is spending 40% of time in morning at 11%" },
                { priority: "pattern", tag: "Territory", metric: "34% close rate", title: "ZIP 78704 converts at 3x team average but has only 15 knocks this month" },
              ].map((insight, i) => (
                <div key={i} className="flex items-start gap-3 bg-gray-950 border border-gray-800 rounded-xl p-4">
                  <div className="flex items-center gap-2 flex-shrink-0 mt-0.5">
                    <span className={"text-xs font-medium px-2 py-0.5 rounded-full border " + (
                      insight.priority === "critical" ? "bg-red-500/10 text-red-400 border-red-500/20" :
                      insight.priority === "opportunity" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                      "bg-blue-500/10 text-blue-400 border-blue-500/20"
                    )}>
                      {insight.priority === "critical" ? "Critical" : insight.priority === "opportunity" ? "Opportunity" : "Pattern"}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium leading-snug">{insight.title}</p>
                    <p className="text-gray-500 text-xs mt-0.5">{insight.tag}</p>
                  </div>
                  <span className="text-blue-400 text-xs font-semibold flex-shrink-0">{insight.metric}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Founder story */}
      <section className="py-20 px-6 bg-gray-900/50 border-y border-gray-800">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-start gap-6">
            <div className="flex-shrink-0">
  <p className="text-white font-bold text-lg">Andrew Whitesides</p>
  <p className="text-gray-500 text-sm">Founder, RepWise</p>
</div>
            <div>
            
              <div className="space-y-4 text-gray-400 text-base leading-relaxed">
                <p>
                  I spent years in medical device sales knocking doors and running field calls with zero visibility into what was actually working. I was tracking everything in spreadsheets — calls, contacts, outcomes — but I had no way to turn that data into anything useful.
                </p>
                <p>
                  I knew my close rate was somewhere around 20%. I knew some days felt better than others. I knew some territories felt easier. But I had no idea which specific hours were my best, which ZIP codes converted, or whether my follow-up timing actually mattered.
                </p>
                <p>
                  I was making gut decisions on $500,000 worth of deals every quarter. I figured there had to be a better way.
                </p>
                <p className="text-white font-medium">
                  So I built RepWise — the tool I wish I had when I was in the field.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Problem */}
      <section id="problem" className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium px-4 py-2 rounded-full mb-4">
              The problem
            </div>
            <h2 className="text-4xl font-bold mb-4">Your team is leaving money on the table every single day.</h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">The patterns are hiding in your data. You just have no way to see them.</p>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            {problems.map((p, i) => (
              <div key={i} className="bg-gray-900 border border-gray-800 rounded-2xl p-6 hover:border-gray-700 transition">
                <div className="text-3xl mb-4">{p.icon}</div>
                <h3 className="text-white font-bold text-lg mb-2">{p.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="howitworks" className="py-20 px-6 bg-gray-900/50 border-y border-gray-800">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-medium px-4 py-2 rounded-full mb-4">
              How it works
            </div>
            <h2 className="text-4xl font-bold mb-4">From spreadsheet to strategy in 2 minutes.</h2>
            <p className="text-gray-400 text-lg">No setup call. No onboarding doc. No CRM required.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { step: "01", icon: "📤", title: "Export your data", desc: "Pull a CSV from any spreadsheet, HubSpot, Salesforce, or Pipedrive. Any format works — rep names, dates, outcomes, deal values. We normalize messy data automatically.", time: "30 seconds" },
              { step: "02", icon: "🔍", title: "We analyze everything", desc: "RepWise processes your activity data and calculates close rates by rep, time of day, day of week, territory, and follow-up status. Every pattern, surfaced automatically.", time: "90 seconds" },
              { step: "03", icon: "📋", title: "Get your action plan", desc: "8-10 specific insights land on your dashboard — tagged Critical, Opportunity, or Pattern. Each one tells you exactly what is happening and what to do about it.", time: "Ongoing" },
            ].map((s, i) => (
              <div key={i} className="relative">
                <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 h-full">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-5xl font-black text-gray-800">{s.step}</span>
                    <span className="text-2xl">{s.icon}</span>
                  </div>
                  <h3 className="text-white font-bold text-lg mb-2">{s.title}</h3>
                  <p className="text-gray-400 text-sm leading-relaxed mb-4">{s.desc}</p>
                  <span className="text-blue-400 text-xs font-semibold bg-blue-500/10 border border-blue-500/20 px-3 py-1 rounded-full">{s.time}</span>
                </div>
                {i < 2 && (
                  <div className="hidden md:block absolute top-1/2 -right-3 w-6 text-gray-700 text-xl">→</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-medium px-4 py-2 rounded-full mb-4">
              Features
            </div>
            <h2 className="text-4xl font-bold mb-4">Built for the way field sales actually works.</h2>
            <p className="text-gray-400 text-lg">Not a generic BI tool. Every feature designed for door-to-door and field sales teams.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {features.map((f, i) => (
              <div key={i} className="bg-gray-900 border border-gray-800 rounded-2xl p-5 hover:border-gray-700 hover:-translate-y-0.5 transition-all duration-200">
                <div className="text-2xl mb-3">{f.icon}</div>
                <h3 className="text-white font-semibold text-sm mb-2">{f.title}</h3>
                <p className="text-gray-500 text-xs leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ROI Anchor + Guarantee */}
      <section className="py-20 px-6 bg-gray-900/50 border-y border-gray-800">
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8">

            {/* ROI calculator */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8">
              <h3 className="text-white font-bold text-xl mb-2">What one insight is worth</h3>
              <p className="text-gray-400 text-sm mb-6">If RepWise helps your team close just one extra deal per month it pays for itself many times over.</p>
              <div className="space-y-4">
                {[
                  { label: "Average deal value", value: "$8,500", sub: "typical solar or security deal" },
                  { label: "RepWise cost", value: "$99/mo", sub: "Essential plan" },
                  { label: "ROI on one extra close", value: "85x", sub: "in the first month alone" },
                ].map(row => (
                  <div key={row.label} className="flex items-center justify-between py-3 border-b border-gray-800 last:border-0">
                    <div>
                      <p className="text-white text-sm font-medium">{row.label}</p>
                      <p className="text-gray-600 text-xs">{row.sub}</p>
                    </div>
                    <span className="text-blue-400 font-bold text-lg">{row.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Guarantee */}
            <div className="bg-gradient-to-br from-blue-600/20 to-indigo-600/10 border border-blue-500/20 rounded-2xl p-8 flex flex-col justify-between">
              <div>
                <div className="text-4xl mb-4">🛡️</div>
                <h3 className="text-white font-bold text-xl mb-3">The RepWise guarantee</h3>
                <p className="text-gray-300 text-sm leading-relaxed mb-6">
                  Upload your data and use RepWise for 30 days. If you do not find at least one insight that is worth more than what you paid for the tool — we will refund you completely.
                </p>
                <p className="text-gray-300 text-sm leading-relaxed">
                  No questions asked. No hoops to jump through. Just email us and we send it back.
                </p>
              </div>
              <div className="mt-6 pt-6 border-t border-blue-500/20">
                <p className="text-blue-300 text-xs font-medium">Why we can offer this:</p>
                <p className="text-gray-400 text-xs mt-1">Because every field sales team has patterns hiding in their data. We have never seen a dataset that did not surface at least one actionable insight worth more than $99.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

  

      {/* Pricing */}
      <section id="pricing" className="py-20 px-6 bg-gray-900/50 border-y border-gray-800">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-medium px-4 py-2 rounded-full mb-4">
              Pricing
            </div>
            <h2 className="text-4xl font-bold mb-4">Simple pricing. No surprises.</h2>
            <p className="text-gray-400 text-lg mb-6">Start free. Upgrade when you are ready. Cancel anytime.</p>
            <div className="inline-flex items-center gap-1 bg-gray-900 border border-gray-800 rounded-xl p-1">
              <button onClick={() => setAnnual(false)} className={"px-4 py-2 rounded-lg text-sm font-medium transition " + (!annual ? "bg-gray-800 text-white" : "text-gray-500")}>Monthly</button>
              <button onClick={() => setAnnual(true)} className={"px-4 py-2 rounded-lg text-sm font-medium transition " + (annual ? "bg-gray-800 text-white" : "text-gray-500")}>
                Annual <span className="text-emerald-400 text-xs font-bold ml-1">Save 20%</span>
              </button>
            </div>
          </div>

          <div className="grid md:grid-cols-4 gap-4">
            {[
              {
                name: "Free",
                price: "$0",
                period: "/month",
                desc: "See what RepWise can do.",
                features: ["1 free upload", "First batch of insights", "Basic dashboard"],
                cta: "Start free",
                href: "/signup",
                highlight: false,
              },
              {
                name: "Essential",
                price: annual ? "$79" : "$99",
                period: "/month",
                desc: "For solo reps who want an edge.",
                features: ["Unlimited uploads", "Unlimited insights", "Goal tracking", "30-day history", "7-day free trial"],
                cta: "Start 7-day trial",
                href: "/signup",
                highlight: false,
              },
              {
                name: "Professional",
                price: annual ? "$159" : "$199",
                period: "/month",
                desc: "For growing teams.",
                features: ["Everything in Essential", "Up to 5 reps", "AI coaching plans", "Custom goals", "90-day history", "7-day free trial"],
                cta: "Start 7-day trial",
                href: "/signup",
                highlight: true,
              },
              {
                name: "Team",
                price: annual ? "$399" : "$499",
                period: "/month",
                desc: "Unlimited seats.",
                features: ["Everything in Pro", "Unlimited reps", "Manager dashboard", "Team messaging", "HubSpot sync", "7-day free trial"],
                cta: "Start 7-day trial",
                href: "/signup",
                highlight: false,
              },
            ].map((plan, i) => (
              <div key={i} className={"rounded-2xl border p-6 flex flex-col " + (plan.highlight ? "bg-blue-600/10 border-blue-500 shadow-lg shadow-blue-500/10" : "bg-gray-900 border-gray-800")}>
                {plan.highlight && (
                  <div className="text-center mb-3">
                    <span className="text-xs font-bold text-blue-400 bg-blue-500/10 border border-blue-500/20 px-3 py-1 rounded-full">Most Popular</span>
                  </div>
                )}
                <h3 className="text-white font-bold text-lg mb-1">{plan.name}</h3>
                <div className="flex items-end gap-1 mb-1">
                  <span className="text-3xl font-black text-white">{plan.price}</span>
                  <span className="text-gray-500 text-sm mb-1">{plan.period}</span>
                </div>
                <p className="text-gray-500 text-xs mb-5">{plan.desc}</p>
                <ul className="space-y-2 mb-6 flex-1">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-center gap-2 text-xs text-gray-400">
                      <svg className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link href={plan.href} className={"block text-center font-semibold px-4 py-3 rounded-xl text-sm transition " + (plan.highlight ? "bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20" : "bg-gray-800 hover:bg-gray-700 border border-gray-700 text-white")}>
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>

          <div className="mt-6 bg-gray-900 border border-gray-800 rounded-2xl p-6 flex items-center justify-between">
            <div>
              <h3 className="text-white font-bold mb-1">Enterprise</h3>
              <p className="text-gray-400 text-sm">50+ reps. Custom pricing, API access, white-label, dedicated account manager, SLA guarantee.</p>
            </div>
            <Link href="/contact" className="flex-shrink-0 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition">
              Contact us
            </Link>
          </div>

          <p className="text-center text-gray-600 text-xs mt-4">All paid plans include a 7-day free trial. Card required. Cancel anytime. 30-day money-back guarantee.</p>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-20 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Common questions.</h2>
          </div>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <div key={i} className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between px-6 py-4 text-left"
                >
                  <span className="text-white font-medium text-sm">{faq.q}</span>
                  <svg className={"w-4 h-4 text-gray-500 flex-shrink-0 transition-transform " + (openFaq === i ? "rotate-180" : "")} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {openFaq === i && (
                  <div className="px-6 pb-4">
                    <p className="text-gray-400 text-sm leading-relaxed">{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 px-6 bg-gray-900/50 border-t border-gray-800">
        <div className="max-w-3xl mx-auto text-center">
          <div className="text-5xl mb-6">🚀</div>
          <h2 className="text-4xl font-bold mb-4">Your next deal is waiting for insights.</h2>
          <p className="text-gray-400 text-lg mb-8">Upload your sales data today. See exactly where you are losing deals. It takes less time than a cold call.</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-4">
            <Link href="/signup" className="w-full sm:w-auto bg-blue-600 hover:bg-blue-500 text-white font-bold px-8 py-4 rounded-xl text-base transition shadow-xl shadow-blue-500/20 hover:-translate-y-0.5 duration-200">
              Upload your data free →
            </Link>
            <Link href="/demo" className="w-full sm:w-auto bg-gray-900 hover:bg-gray-800 border border-gray-700 text-white font-semibold px-8 py-4 rounded-xl text-base transition hover:-translate-y-0.5 duration-200">
              See live demo
            </Link>
          </div>
          <p className="text-gray-600 text-sm">No credit card required. First upload free. 30-day money-back guarantee.</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-gray-800">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-10">
            <div className="md:col-span-2">
              <Link href="/" className="text-xl font-bold text-white block mb-3">
                Try<span className="text-blue-500">RepWise</span>
              </Link>
              <p className="text-gray-500 text-sm leading-relaxed max-w-xs">
                Sales performance intelligence for field sales reps and door-to-door teams. Built by a rep, for reps.
              </p>
            </div>
            <div>
              <p className="text-white font-semibold text-sm mb-4">Product</p>
              <div className="space-y-2">
                {[["#features", "Features"], ["#pricing", "Pricing"], ["#howitworks", "How it works"], ["/demo", "Live demo"]].map(([href, label]) => (
                  <Link key={label} href={href} className="block text-gray-500 hover:text-gray-300 text-sm transition">{label}</Link>
                ))}
              </div>
            </div>
            <div>
              <p className="text-white font-semibold text-sm mb-4">Company</p>
              <div className="space-y-2">
                {[["/help", "Help Center"], ["/contact", "Contact"], ["/privacy", "Privacy Policy"], ["/terms", "Terms of Service"]].map(([href, label]) => (
                  <Link key={label} href={href} className="block text-gray-500 hover:text-gray-300 text-sm transition">{label}</Link>
                ))}
              </div>
            </div>
          </div>
          <div className="pt-8 border-t border-gray-800 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-gray-600 text-sm">{"© 2026 TryRepWise. All rights reserved."}</p>
            <div className="flex items-center gap-6">
              <Link href="/privacy" className="text-gray-600 hover:text-gray-400 text-sm transition">Privacy</Link>
              <Link href="/terms" className="text-gray-600 hover:text-gray-400 text-sm transition">Terms</Link>
              <Link href="/contact" className="text-gray-600 hover:text-gray-400 text-sm transition">Contact</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
