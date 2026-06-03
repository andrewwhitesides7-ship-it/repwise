"use client";

import { useState } from "react";
import Link from "next/link";

const faqs = [
  {
    category: "Getting Started",
    questions: [
      {
        q: "How do I get started with RepWise?",
        a: "Sign up for a free account, complete the 3-step onboarding, then upload your first CSV file. Our AI will analyze your data and generate 8-10 insights within 60 seconds.",
      },
      {
        q: "What format does my CSV need to be in?",
        a: "Your CSV should include columns like rep_name, date, time_of_day, knocked, contacted, pitched, closed, deal_value. Download our sample CSV template to get started quickly.",
      },
      {
        q: "How long does analysis take?",
        a: "Typically 30-60 seconds. Our AI reads every row of your data, builds a statistical summary, and generates specific actionable insights with real numbers from your data.",
      },
      {
        q: "Do I need a CRM to use RepWise?",
        a: "No CRM required. You can export a CSV from any spreadsheet, CRM, or field sales app and upload it directly. CRM integrations are coming soon.",
      },
    ],
  },
  {
    category: "AI Insights",
    questions: [
      {
        q: "How does the AI generate insights?",
        a: "We send a structured summary of your sales data to Claude (Anthropic's AI) with a specialized prompt built for field sales analysis. It identifies patterns in time-of-day performance, rep comparison, territory gaps, follow-up leakage, and deal value trends.",
      },
      {
        q: "What do Critical, Opportunity, and Pattern mean?",
        a: "Critical means something is actively hurting your revenue and needs immediate action. Opportunity means there is untapped potential you should pursue. Pattern means a consistent trend worth knowing about.",
      },
      {
        q: "Can I get new insights without uploading again?",
        a: "Once CRM integrations are live, your data will sync daily and fresh insights will be generated every morning automatically. For now, upload a new CSV whenever you want updated insights.",
      },
      {
        q: "How specific are the insights?",
        a: "Very specific. Instead of 'improve your close rate', RepWise tells you 'Late afternoon (3-6pm) has a 10% close rate vs 37% in early afternoon. Shift 2 hours earlier and you gain an estimated 3 closes per week.'",
      },
    ],
  },
  {
    category: "Team & Billing",
    questions: [
      {
        q: "What is the difference between Solo Rep and Team plans?",
        a: "Solo Rep is $200/month for one individual rep. Team is $150/seat/month and gives managers a team dashboard, rep-by-rep breakdowns, and the ability to invite unlimited reps.",
      },
      {
        q: "How do I invite my reps?",
        a: "Go to the Team page, create your team, then enter each rep's email address. They'll receive an invite email with a signup link. Once they join, you can view their insight history.",
      },
      {
        q: "Can I cancel at any time?",
        a: "Yes. No contracts, no cancellation fees. Go to Billing and click Manage Subscription to cancel. Your access continues until the end of your billing period.",
      },
      {
        q: "Is my sales data secure?",
        a: "Yes. Your data is stored in a private Supabase database with row-level security — meaning only you can access your own data. We never share or sell your data to anyone.",
      },
    ],
  },
];

export default function HelpPage() {
  const [openQuestion, setOpenQuestion] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const filtered = faqs.map((cat) => ({
    ...cat,
    questions: cat.questions.filter(
      (q) =>
        q.q.toLowerCase().includes(search.toLowerCase()) ||
        q.a.toLowerCase().includes(search.toLowerCase())
    ),
  })).filter((cat) => cat.questions.length > 0);

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Nav */}
      <nav className="flex items-center justify-between px-8 py-5 border-b border-gray-800">
        <Link href="/" className="text-xl font-bold tracking-tight">
          Try<span className="text-blue-500">RepWise</span>
        </Link>
        <div className="flex items-center gap-4">
          <Link href="/contact" className="text-sm text-gray-400 hover:text-white transition">Contact</Link>
          <Link href="/login" className="text-sm text-gray-400 hover:text-white transition">Sign in</Link>
          <Link href="/signup" className="text-sm bg-blue-600 hover:bg-blue-500 text-white font-semibold px-4 py-2 rounded-lg transition">Get started</Link>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-8 py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Help Center</h1>
          <p className="text-gray-400 mb-8">Everything you need to know about RepWise.</p>
          <div className="relative">
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search questions..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-gray-900 border border-gray-700 text-white placeholder-gray-500 rounded-xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            />
          </div>
        </div>

        {/* FAQs */}
        <div className="space-y-8">
          {filtered.map((cat) => (
            <div key={cat.category}>
              <h2 className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-4">{cat.category}</h2>
              <div className="space-y-2">
                {cat.questions.map((item) => {
                  const isOpen = openQuestion === item.q;
                  return (
                    <div key={item.q} className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden hover:border-gray-700 transition">
                      <button
                        onClick={() => setOpenQuestion(isOpen ? null : item.q)}
                        className="w-full flex items-center justify-between px-6 py-4 text-left"
                      >
                        <span className="text-white font-medium text-sm pr-4">{item.q}</span>
                        <svg className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      {isOpen && (
                        <div className="px-6 pb-5">
                          <p className="text-gray-400 text-sm leading-relaxed">{item.a}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Still need help */}
        <div className="mt-16 bg-gradient-to-br from-blue-600 to-blue-700 rounded-3xl p-8 text-center">
          <h3 className="text-xl font-bold mb-2">Still need help?</h3>
          <p className="text-blue-100 text-sm mb-6">Our team typically responds within a few hours.</p>
          <Link href="/contact" className="inline-block bg-white text-blue-600 font-bold px-6 py-3 rounded-xl text-sm hover:bg-blue-50 transition">
            Contact Support
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-800 px-8 py-8 mt-8">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <span className="text-sm font-bold">Try<span className="text-blue-500">RepWise</span></span>
          <p className="text-xs text-gray-600">2025 RepWise. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
