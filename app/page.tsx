"use client";

import { useState } from "react";
import Link from "next/link";

// 1-Month Clean baseline dataset matching the exact schema of your revenue intelligence engine
const SAMPLE_RECOVERY_RECORDS = [
  { rep_name: "Michael Chang", knocked: 34, closed: 11, deal_value: 1419000, time_of_day: "2pm", zip: "90210", date: "2026-05-01" },
  { rep_name: "Sarah Jenkins", knocked: 38, closed: 9, deal_value: 1042000, time_of_day: "3pm", zip: "90210", date: "2026-05-12" },
  { rep_name: "Sophia Martinez", knocked: 43, closed: 8, deal_value: 1001000, time_of_day: "11am", zip: "30301", date: "2026-05-15" },
  { rep_name: "Alex Rivera", knocked: 50, closed: 8, deal_value: 949000, time_of_day: "10am", zip: "30301", date: "2026-05-18" },
  { rep_name: "Emma Watson", knocked: 45, closed: 5, deal_value: 700000, time_of_day: "9am", zip: "75201", date: "2026-05-22" },
  { rep_name: "David Miller", knocked: 40, closed: 4, deal_value: 418000, time_of_day: "9am", zip: "75201", date: "2026-05-28" },
];

export default function AppleRevenueLanding() {
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

  // Base configurations derived dynamically from state
  const totalRevenue = SAMPLE_RECOVERY_RECORDS.reduce((s, r) => s + r.deal_value, 0);
  const baseline6Mo = totalRevenue * 6;

  // Impact values calculated on a true, non-compounded monthly baseline scale
  const winImpacts: Record<string, { label: string; val: number; desc: string }> = {
    coach: { label: "Coach bottom reps to team average", val: 195000, desc: "Brings David and Emma up to the 16% baseline" },
    hours: { label: "Shift route schedules to peak hours", val: 110000, desc: "Protects high-converting afternoon door blocks" },
    leads: { label: "Recover untouched warm leads", val: 165000, desc: "Picks up stalled contracts with automated touchpoints" }
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
      
      {/* Simple Navigation */}
      <nav className="border-b border-[#2d2d2f] bg-[#000000]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 h-12 flex items-center justify-between">
          <Link href="/" className="text-sm font-semibold tracking-tight text-[#f5f5f7] hover:text-white transition">
            RepWise
          </Link>
          <div className="flex items-center gap-6">
            <button 
              onClick={() => document.getElementById("sandbox")?.scrollIntoView({ behavior: "smooth" })}
              className="text-xs text-[#a1a1a6] hover:text-[#f5f5f7] transition"
            >
              Interactive Demo
            </button>
            <Link 
              href="/signup" 
              className="bg-[#f5f5f7] text-[#000000] text-xs font-medium px-3 py-1 rounded-full hover:bg-white transition"
            >
              Start Free
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Header */}
      <header className="max-w-4xl mx-auto px-6 pt-20 pb-12 text-center md:pt-28 md:pb-16">
        <h1 className="text-4xl md:text-6xl font-semibold tracking-tight text-white mb-6 leading-tight">
          You have the data. <br />
          <span className="text-[#86868b]">Stop leaving money on the table.</span>
        </h1>
        <p className="text-lg md:text-xl text-[#a1a1a6] max-w-2xl mx-auto mb-8 font-normal leading-relaxed">
          Upload your sales CSV. Discover exactly where your pipeline is losing money, and get the exact steps to claw it back. Under two minutes.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={runAuditSimulation}
            className="w-full sm:w-auto bg-[#0071e3] hover:bg-[#147ce5] text-white text-sm font-medium px-6 py-3 rounded-full transition shadow-sm"
          >
            Upload Sales Data Free
          </button>
          <button
            onClick={() => document.getElementById("sandbox")?.scrollIntoView({ behavior: "smooth" })}
            className="w-full sm:w-auto text-[#0071e3] hover:underline text-sm font-medium px-4 py-3"
          >
            See how it works &rarr;
          </button>
        </div>
        <p className="text-xs text-[#6e6e73] mt-4 font-normal">No technical configuration · Instant file processing · First upload is entirely free</p>
      </header>

      {/* Dynamic Simulation Sandbox Box */}
      <section id="sandbox" className="max-w-4xl mx-auto px-4 pb-20 scroll-mt-6">
        <div className="bg-[#1c1c1e] rounded-2xl border border-[#2d2d2f] overflow-hidden shadow-2xl">
          
          {!records.length ? (
            <div className="p-8 md:p-16 text-center space-y-4">
              <div className="text-3xl">📤</div>
              <h2 className="text-xl font-medium text-white">Try it out with sample data</h2>
              <p className="text-sm text-[#a1a1a6] max-w-md mx-auto leading-relaxed">
                See exactly how the engine processes data. Click below to run an instant simulation using a typical 1-month sales pipeline.
              </p>
              <button
                onClick={runAuditSimulation}
                disabled={loading}
                className="bg-[#2d2d2f] hover:bg-[#3a3a3c] text-white text-xs font-medium px-4 py-2 rounded-full transition"
              >
                {loading ? "Analyzing..." : "Simulate Data Upload"}
              </button>
            </div>
          ) : (
            <div className="divide-y divide-[#2d2d2f]">
              
              {/* Core Output Banner */}
              <div className="p-6 md:p-8 space-y-2">
                <p className="text-xs font-semibold text-[#ff453a] uppercase tracking-wider">Revenue Recovery Assessment</p>
                <h3 className="text-2xl md:text-3xl font-medium text-white tracking-tight">
                  You are leaving <span className="text-[#ff453a] font-semibold">${(totalPossible6MoGap / 1000000).toFixed(1)}M</span> on the table.
                </h3>
                <p className="text-sm text-[#a1a1a6] max-w-xl leading-relaxed">
                  Based on your team data over 1.0 months, your current trajectory generates ${(baseline6Mo / 1000000).toFixed(1)}M over 6 months. With the corrections mapped below, you could reach ${((baseline6Mo + totalPossible6MoGap) / 1000000).toFixed(1)}M.
                </p>
              </div>

              {/* Action Plan Checklist */}
              <div className="p-6 md:p-8 space-y-4 bg-[#121214]">
                <div>
                  <h4 className="text-sm font-semibold text-white">Build Your Recovery Action Plan</h4>
                  <p className="text-xs text-[#86868b] mt-0.5">Toggle each play to view your interactive run-rate adjust in real time</p>
                </div>

                <div className="space-y-3">
                  {Object.entries(winImpacts).map(([key, item]) => (
                    <div
                      key={key}
                      onClick={() => toggleWin(key)}
                      className={`p-4 rounded-xl border transition cursor-pointer flex items-start gap-4 ${
                        selectedWins[key]
                          ? "bg-[#30d158]/5 border-[#30d158]/30"
                          : "bg-[#1c1c1e] border-[#2d2d2f] hover:border-[#3a3a3c]"
                      }`}
                    >
                      <div className={`w-4 h-4 rounded mt-0.5 border flex items-center justify-center transition-all ${
                        selectedWins[key] ? "bg-[#30d158] border-[#30d158]" : "border-[#48484a]"
                      }`}>
                        {selectedWins[key] && <span className="text-[10px] text-black font-bold">✓</span>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white">{item.label}</p>
                        <p className="text-xs text-[#86868b] mt-0.5">{item.desc}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <span className="text-[#30d158] text-xs font-semibold">+${Math.round(item.val / 1000)}K/mo</span>
                        <p className="text-[10px] text-[#6e6e73]">+${Math.round((item.val * 6) / 1000)}K over 6mo</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Real-time calculated baseline totals block */}
                <div className="pt-2 flex items-center justify-between border-t border-[#2d2d2f]">
                  <div>
                    <p className="text-xs text-[#86868b]">Selected 6-Month Trajectory</p>
                    <p className="text-lg font-medium text-white">${((baseline6Mo + selected6MoClawback) / 1000000).toFixed(2)}M</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-[#30d158] font-medium">Clawed Back Cash</p>
                    <p className="text-lg font-semibold text-[#30d158]">+{selected6MoClawback >= 1000000 ? `$${(selected6MoClawback / 1000000).toFixed(1)}M` : `$${Math.round(selected6MoClawback / 1000)}K`}</p>
                  </div>
                </div>

              </div>

              {/* Reset Control Footer */}
              <div className="px-6 py-3 bg-[#1c1c1e] flex justify-end">
                <button 
                  onClick={() => setRecords([])}
                  className="text-xs text-[#86868b] hover:text-white transition"
                >
                  Clear Demo Data
                </button>
              </div>

            </div>
          )}

        </div>
      </section>

      {/* The 3 Core Sinks (Simple Problem Layout) */}
      <section className="border-t border-[#2d2d2f] bg-[#1c1c1e]/30 py-20 px-6">
        <div className="max-w-4xl mx-auto space-y-12">
          <div className="max-w-xl">
            <h2 className="text-3xl font-semibold tracking-tight text-white mb-4">
              Where teams lose cash.
            </h2>
            <p className="text-base text-[#a1a1a6] leading-relaxed font-normal">
              Most sales leaders treat every door, every hour, and every rep identically. Your pipeline data proves they aren't.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="text-lg text-white font-medium mb-2">1. Bad Territories</div>
              <p className="text-sm text-[#86868b] leading-relaxed">
                Some ZIP codes yield a 32% close rate. Others drop to 4%. Without active diagnostics, your reps spend equal fuel knocking dead ends.
              </p>
            </div>
            <div>
              <div className="text-lg text-white font-medium mb-2">2. Empty Hours</div>
              <p className="text-sm text-[#86868b] leading-relaxed">
                Afternoon blocks close up to 3x better than early mornings. Your field schedules should be locked to data trends, not rep routines.
              </p>
            </div>
            <div>
              <div className="text-lg text-white font-medium mb-2">3. Abandoned Leads</div>
              <p className="text-sm text-[#86868b] leading-relaxed">
                Prospects show high interest, but reps cycle to new neighborhoods. These qualified leads go cold without systematic callbacks.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Founder Voice (Andrew's Real Story) */}
      <section className="py-20 px-6 border-t border-[#2d2d2f]">
        <div className="max-w-2xl mx-auto">
          <div className="text-2xl text-white font-normal tracking-tight mb-6 leading-relaxed">
            "I spent years in field sales knocking doors and tracking routes with zero visibility. We had spreadsheets full of names and dates, but no real way to turn that data into anything useful. 
            <br /><br />
            We were making gut decisions on hundreds of thousands of dollars worth of pipeline health every quarter. So I built RepWise—the tool I needed back then."
          </div>
          <div className="flex items-center justify-between border-t border-[#2d2d2f] pt-4">
            <div>
              <p className="text-sm font-medium text-white">Andrew Whitesides</p>
              <p className="text-xs text-[#86868b]">Founder, RepWise</p>
            </div>
            <a href="mailto:andrew@tryrepwise.com" className="text-xs text-[#0071e3] hover:underline">
              andrew@tryrepwise.com
            </a>
          </div>
        </div>
      </section>

      {/* Simple Pricing Table Frame */}
      <section className="border-t border-[#2d2d2f] bg-[#1c1c1e]/40 py-20 px-6">
        <div className="max-w-4xl mx-auto text-center space-y-10">
          <div>
            <h2 className="text-3xl font-semibold tracking-tight text-white mb-2">Simple, flat pricing.</h2>
            <p className="text-sm text-[#86868b]">Audit your first dataset completely free.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left max-w-3xl mx-auto">
            {[
              { name: "Diagnostic Free", price: "$0", desc: "1 legacy data file upload to test structural pipeline health." },
              { name: "Essential", price: "$99/mo", desc: "For independent field reps needing unlimited uploads & histories." },
              { name: "Professional", price: "$199/mo", desc: "Up to 5 reps. Fully automated coaching plans and territory maps." }
            ].map(plan => (
              <div key={plan.name} className="p-6 rounded-2xl bg-[#1c1c1e] border border-[#2d2d2f] flex flex-col justify-between space-y-6">
                <div>
                  <h3 className="text-sm font-medium text-[#86868b]">{plan.name}</h3>
                  <p className="text-2xl font-semibold text-white tracking-tight mt-1">{plan.price}</p>
                  <p className="text-xs text-[#a1a1a6] mt-3 leading-relaxed">{plan.desc}</p>
                </div>
                <Link 
                  href="/signup" 
                  className="block text-center bg-[#f5f5f7] text-[#000000] hover:bg-white transition text-xs font-medium py-2 rounded-full"
                >
                  Get Started
                </Link>
              </div>
            ))}
          </div>
          <p className="text-xs text-[#6e6e73]">All subscription access points include our unconditional 30-day margin refund guarantee.</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="max-w-4xl mx-auto px-6 py-12 border-t border-[#2d2d2f] text-xs text-[#6e6e73] space-y-4">
        <p>Active revenue recovery processing software. Safe 256-bit automated table structure conversion standards apply.</p>
        <p>&copy; 2026 RepWise Systems Inc. Built strictly for hyper-efficient field sales performance mapping.</p>
      </footer>

    </div>
  );
}
