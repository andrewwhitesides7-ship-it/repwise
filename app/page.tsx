"use client";

import { useState } from "react";
import Link from "next/link";

// 1-Month Clean baseline dataset matching your revenue intelligence engine
const SAMPLE_RECOVERY_RECORDS = [
  { rep_name: "Michael Chang", knocked: 34, closed: 11, deal_value: 1419000, time_of_day: "2pm", zip: "90210", date: "2026-05-01" },
  { rep_name: "Sarah Jenkins", knocked: 38, closed: 9, deal_value: 1042000, time_of_day: "3pm", zip: "90210", date: "2026-05-12" },
  { rep_name: "Sophia Martinez", knocked: 43, closed: 8, deal_value: 1001000, time_of_day: "11am", zip: "30301", date: "2026-05-15" },
  { rep_name: "Alex Rivera", knocked: 50, closed: 8, deal_value: 949000, time_of_day: "10am", zip: "30301", date: "2026-05-18" },
  { rep_name: "Emma Watson", knocked: 45, closed: 5, deal_value: 700000, time_of_day: "9am", zip: "75201", date: "2026-05-22" },
  { rep_name: "David Miller", knocked: 40, closed: 4, deal_value: 418000, time_of_day: "9am", zip: "75201", date: "2026-05-28" },
];

export default function PremiumRevenueLanding() {
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedWins, setSelectedWins] = useState<Record<string, boolean>>({
    coach: true,
    hours: false,
    leads: false
  });

  const runAuditSimulation = () => {
    setLoading(true);
    setTimeout(() => {
      setRecords(SAMPLE_RECOVERY_RECORDS);
      setLoading(false);
    }, 600);
  };

  const totalRevenue = SAMPLE_RECOVERY_RECORDS.reduce((s, r) => s + r.deal_value, 0);
  const baseline6Mo = totalRevenue * 6;

  const winImpacts: Record<string, { label: string; val: number; desc: string }> = {
    coach: { label: "Fix execution variance across reps", val: 195000, desc: "Brings under-performing reps up to your current team baseline" },
    hours: { label: "Lock route distribution to high-converting hours", val: 110000, desc: "Shifts morning drop-offs into premium afternoon blocks" },
    leads: { label: "Claw back untouched warm interest leads", val: 165000, desc: "Enforces multi-touch systematic follow-up automatically" }
  };

  const currentMonthlyImpact = Object.entries(selectedWins)
    .reduce((sum, [key, active]) => sum + (active ? winImpacts[key].val : 0), 0);

  const totalPossible6MoGap = Object.values(winImpacts).reduce((sum, w) => sum + (w.val * 6), 0);
  const selected6MoClawback = currentMonthlyImpact * 6;

  const toggleWin = (key: string) => {
    setSelectedWins(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="min-h-screen bg-[#000000] text-[#f5f5f7] font-sans antialiased">
      
      {/* Navigation */}
      <nav className="border-b border-[#1c1c1e] bg-[#000000]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/" className="text-base font-bold tracking-tight text-white transition hover:text-red-400">
            RepWise
          </Link>
          <div className="flex items-center gap-6">
            <button 
              onClick={() => document.getElementById("sandbox")?.scrollIntoView({ behavior: "smooth" })}
              className="text-xs text-[#a1a1a6] hover:text-[#f5f5f7] transition"
            >
              Interactive Audit
            </button>
            <Link 
              href="/signup" 
              className="bg-white text-black text-xs font-semibold px-4 py-1.5 rounded-full hover:bg-[#f5f5f7] transition"
            >
              Recover Revenue
            </Link>
          </div>
        </div>
      </nav>

      {/* High-Impact Hero Header */}
      <header className="max-w-5xl mx-auto px-6 pt-24 pb-12 text-center md:pt-36 md:pb-16">
        <div className="inline-flex items-center gap-2 bg-[#1c1c1e] border border-[#2d2d2f] text-red-400 text-xs font-semibold px-4 py-1.5 rounded-full mb-8">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
          The Revenue Recovery Engine for Sales Leaders
        </div>

        <h1 className="text-4xl sm:text-6xl md:text-7xl font-black tracking-tight text-white mb-6 leading-[1.05]">
          Your sales reps are leaving <br />
          <span className="bg-gradient-to-r from-red-500 via-rose-400 to-amber-300 bg-clip-text text-transparent">
            fortunes on the doorstep.
          </span>
        </h1>
        
        <p className="text-lg md:text-2xl text-[#a1a1a6] max-w-3xl mx-auto mb-10 font-medium leading-relaxed">
          You spend thousands on data, software, and marketing—and then fly blind on execution. Drop in your pipeline CSV to instantly spot exactly where money is evaporating, who is burning it, and how to track it down.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto">
          <button
            onClick={runAuditSimulation}
            className="w-full bg-[#ff453a] hover:bg-[#ff3b30] text-white text-sm font-bold px-8 py-4 rounded-full transition shadow-lg shadow-red-950/40 transform hover:-translate-y-0.5"
          >
            Drop Your Sales CSV Here
          </button>
          <button
            onClick={() => document.getElementById("sandbox")?.scrollIntoView({ behavior: "smooth" })}
            className="w-full text-white bg-[#1c1c1e] hover:bg-[#2c2c2e] border border-[#2d2d2f] text-sm font-medium px-6 py-4 rounded-full transition"
          >
            See Live Breakdown &rarr;
          </button>
        </div>
        <p className="text-xs text-[#6e6e73] mt-5 font-medium">Takes less than 120 seconds · Secure encryption · Your first baseline audit is 100% free</p>
      </header>

      {/* Interactive Assessment Simulation Sandbox */}
      <section id="sandbox" className="max-w-4xl mx-auto px-4 pb-24 scroll-mt-6">
        <div className="bg-[#1c1c1e] rounded-2xl border border-[#2d2d2f] overflow-hidden shadow-2xl">
          
          {!records.length ? (
            <div className="p-10 md:p-20 text-center space-y-6">
              <div className="text-4xl animate-bounce">📊</div>
              <h2 className="text-2xl font-bold text-white tracking-tight">Don't guess your conversion leaks. Map them.</h2>
              <p className="text-sm text-[#a1a1a6] max-w-md mx-auto leading-relaxed font-medium">
                Want to see the logic live? Click below to populate the simulator with a standard real-world 1-month sales log. Watch how fast leaks get pinned.
              </p>
              <button
                onClick={runAuditSimulation}
                disabled={loading}
                className="bg-white text-black hover:bg-[#f5f5f7] text-xs font-bold px-6 py-3 rounded-full transition shadow-md"
              >
                {loading ? "Parsing Pipeline Variances..." : "Simulate Live Pipe Process"}
              </button>
            </div>
          ) : (
            <div className="divide-y divide-[#2d2d2f]">
              
              {/* Dynamic Assessment Notification Frame */}
              <div className="p-6 md:p-10 space-y-3">
                <div className="inline-flex items-center gap-1.5 bg-red-500/10 text-red-400 border border-red-500/20 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-widest">
                  Leakage Confirmed
                </div>
                <h3 className="text-3xl md:text-4xl font-black text-white tracking-tight leading-tight">
                  You are leaving <span className="text-[#ff453a]">${(totalPossible6MoGap / 1000000).toFixed(1)}M</span> on the table.
                </h3>
                <p className="text-sm md:text-base text-[#a1a1a6] max-w-2xl leading-relaxed font-medium">
                  Based on a normalized analysis over your 1.0-month test timeline, your current path yields ${(baseline6Mo / 1000000).toFixed(1)}M over 6 months. By correcting the structural operational leaks identified below, you unlock a run-rate potential of ${((baseline6Mo + totalPossible6MoGap) / 1000000).toFixed(1)}M.
                </p>
              </div>

              {/* Dynamic Action Checklist Interactive Grid */}
              <div className="p-6 md:p-10 space-y-6 bg-[#0c0c0d]">
                <div>
                  <h4 className="text-base font-bold text-white">Your Automated Capital Recovery Plan</h4>
                  <p className="text-xs text-[#86868b] mt-0.5">Check or uncheck individual operational targets to see the revenue shift in real time.</p>
                </div>

                <div className="space-y-3">
                  {Object.entries(winImpacts).map(([key, item]) => (
                    <div
                      key={key}
                      onClick={() => toggleWin(key)}
                      className={`p-5 rounded-xl border transition cursor-pointer flex items-start gap-4 ${
                        selectedWins[key]
                          ? "bg-[#30d158]/5 border-[#30d158]/40 shadow-inner"
                          : "bg-[#1c1c1e] border-[#2d2d2f] hover:border-[#3a3a3c]"
                      }`}
                    >
                      <div className={`w-5 h-5 rounded mt-0.5 border flex items-center justify-center transition-all ${
                        selectedWins[key] ? "bg-[#30d158] border-[#30d158]" : "border-[#48484a]"
                      }`}>
                        {selectedWins[key] && <span className="text-xs text-black font-black">✓</span>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-white">{item.label}</p>
                        <p className="text-xs text-[#86868b] mt-1 font-medium">{item.desc}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <span className="text-[#30d158] text-sm font-black">+${Math.round(item.val / 1000)}K/mo</span>
                        <p className="text-[10px] text-[#6e6e73] font-medium">+${Math.round((item.val * 6) / 1000)}K over 6mo</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Real-Time Run-Rate Totals Box */}
                <div className="pt-5 flex items-center justify-between border-t border-[#2d2d2f]">
                  <div>
                    <p className="text-xs text-[#86868b] font-medium uppercase tracking-wider">Projected 6-Mo Baseline + Wins</p>
                    <p className="text-xl md:text-2xl font-black text-white tracking-tight">${((baseline6Mo + selected6MoClawback) / 1000000).toFixed(2)}M</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-[#30d158] font-bold uppercase tracking-wider">Recaptured Cashflow</p>
                    <p className="text-xl md:text-2xl font-black text-[#30d158]">
                      {selected6MoClawback >= 1000000 ? `+$${(selected6MoClawback / 1000000).toFixed(1)}M` : `+$${Math.round(selected6MoClawback / 1000)}K`}
                    </p>
                  </div>
                </div>

              </div>

              {/* Reset Control Banner Bar */}
              <div className="px-6 py-4 bg-[#1c1c1e] flex justify-end">
                <button 
                  onClick={() => setRecords([])}
                  className="text-xs text-[#86868b] hover:text-white transition font-medium"
                >
                  Clear Environment Reset
                </button>
              </div>

            </div>
          )}

        </div>
      </section>

      {/* Simple, Punchy 3-Column Problem Focus Section */}
      <section className="border-t border-[#1c1c1e] bg-[#1c1c1e]/20 py-24 px-6">
        <div className="max-w-4xl mx-auto space-y-16">
          <div className="max-w-2xl">
            <h2 className="text-3xl md:text-5xl font-black tracking-tight text-white mb-4 leading-tight">
              Where your cash is walking away.
            </h2>
            <p className="text-base md:text-lg text-[#a1a1a6] leading-relaxed font-medium">
              If your team treats every door, every zip code, and every operating hour identically, you are actively funding performance drops.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-2">
              <div className="text-lg text-white font-bold tracking-tight">1. Ghost Territories</div>
              <p className="text-sm text-[#86868b] leading-relaxed font-medium">
                Elite tracking sectors hit up to a 32% win rate. Dead zones crawl under 4%. Without diagnostic visibility, your field personnel waste maximum fuel hitting dead blocks.
              </p>
            </div>
            <div className="space-y-2">
              <div className="text-lg text-white font-bold tracking-tight">2. Burned Window Opportunities</div>
              <p className="text-sm text-[#86868b] leading-relaxed font-medium">
                Mid-afternoon door routes convert up to 3.1x higher than standard early mornings. Your active field routing should be locked strictly to data margins, not rep habits.
              </p>
            </div>
            <div className="space-y-2">
              <div className="text-lg text-white font-bold tracking-tight">3. Stalled Pipeline Drops</div>
              <p className="text-sm text-[#86868b] leading-relaxed font-medium">
                Prospects express explicit initial interest, but reps roll out to fresh sectors. These hyper-qualified pipeline contacts go cold instantly without systematic automated touchpoints.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Founder Voice Profile Block */}
      <section className="py-24 px-6 border-t border-[#1c1c1e]">
        <div className="max-w-2xl mx-auto">
          <div className="text-xl md:text-3xl text-white font-normal tracking-tight mb-8 leading-relaxed">
            "I spent years in high-ticket field sales knocking doors and tracking routes with absolute blind spots into actual pipeline health. We had tables full of contacts and dates, but no framework to turn that into immediate field strategy. 
            <br /><br />
            We were making pure gut decisions on hundreds of thousands of dollars of capital every quarter. I built RepWise to strip the guesswork out of field management entirely."
          </div>
          <div className="flex items-center justify-between border-t border-[#1c1c1e] pt-5">
            <div>
              <p className="text-base font-bold text-white">Andrew Whitesides</p>
              <p className="text-xs text-[#86868b] uppercase tracking-wider font-semibold mt-0.5">Founder, RepWise</p>
            </div>
            <a href="mailto:andrew@tryrepwise.com" className="text-xs text-[#0071e3] hover:underline font-bold">
              andrew@tryrepwise.com
            </a>
          </div>
        </div>
      </section>

      {/* Radical Single Tier Pricing Focus Grid Block */}
      <section className="border-t border-[#1c1c1e] bg-[#1c1c1e]/40 py-28 px-6">
        <div className="max-w-3xl mx-auto text-center space-y-12">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-1.5 bg-[#ff453a]/10 text-[#ff453a] text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider">
              One Flat Rate
            </div>
            <h2 className="text-4xl md:text-5xl font-black tracking-tight text-white leading-tight">One simple plan. Built to scale your whole team.</h2>
            <p className="text-sm md:text-base text-[#86868b] max-w-md mx-auto font-medium">No per-user licensing penalties. No restrictive data tiers. Full platform capabilities unlock instantly.</p>
          </div>

          <div className="max-w-md mx-auto p-8 rounded-2xl bg-[#1c1c1e] border-2 border-[#ff453a]/40 text-left space-y-6 shadow-2xl relative">
            <div className="absolute -top-3 right-6">
              <span className="bg-[#ff453a] text-white text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full">Unlimited Seats</span>
            </div>
            
            <div className="space-y-1">
              <h3 className="text-base font-bold text-[#86868b] uppercase tracking-wider">The Revenue Recovery Plan</h3>
              <div className="flex items-end gap-1">
                <span className="text-4xl font-black text-white tracking-tight">$500</span>
                <span className="text-gray-500 text-sm font-bold mb-1">/month</span>
              </div>
            </div>

            <div className="space-y-3 border-y border-[#2d2d2f] py-5">
              {[
                "Unlimited team member seats & manager dashboards",
                "Unlimited pipelines, logs, and monthly CSV processing",
                "Full interactive diagnostics & localized ZIP metrics",
                "Automated weekly step-by-step coaching cards",
                "Secure 1-click native CRM synchronization loops"
              ].map(f => (
                <div key={f} className="flex items-center gap-2.5 text-xs text-[#f5f5f7] font-medium">
                  <span className="text-[#30d158] font-black text-sm">✓</span>
                  {f}
                </div>
              ))}
            </div>

            <Link 
              href="/signup" 
              className="block text-center bg-[#ff453a] hover:bg-[#ff3b30] text-white transition text-sm font-bold py-3 rounded-full shadow-lg shadow-red-950"
            >
              Deploy to Your Sales Team Risk-Free
            </Link>
          </div>
          
          <p className="text-xs text-[#6e6e73] font-medium max-w-sm mx-auto leading-relaxed">
            Backed by our unconditional 30-day money-back guarantee. If you don't catch a pipeline leakage block worth multiple times your subscription value, email Andrew for a complete refund.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="max-w-4xl mx-auto px-6 py-12 border-t border-[#1c1c1e] text-xs text-[#6e6e73] space-y-4">
        <p className="font-medium">Active automated calculation normalization architecture. High-ticket distributed field sales performance data verification loops apply.</p>
        <p className="font-semibold">&copy; 2026 RepWise Systems Inc. All rights reserved. Built intentionally for net margin protection.</p>
      </footer>

    </div>
  );
}
