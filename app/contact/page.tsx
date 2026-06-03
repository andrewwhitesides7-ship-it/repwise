"use client";

import { useState } from "react";
import Link from "next/link";

export default function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1000));
    setSubmitted(true);
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Nav */}
      <nav className="flex items-center justify-between px-8 py-5 border-b border-gray-800">
        <Link href="/" className="text-xl font-bold tracking-tight">
          Try<span className="text-blue-500">RepWise</span>
        </Link>
        <div className="flex items-center gap-4">
          <Link href="/help" className="text-sm text-gray-400 hover:text-white transition">Help</Link>
          <Link href="/login" className="text-sm text-gray-400 hover:text-white transition">Sign in</Link>
          <Link href="/signup" className="text-sm bg-blue-600 hover:bg-blue-500 text-white font-semibold px-4 py-2 rounded-lg transition">Get started</Link>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-8 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Contact Us</h1>
          <p className="text-gray-400">We typically respond within a few hours during business hours.</p>
        </div>

        {/* Contact options */}
        <div className="grid grid-cols-3 gap-4 mb-10">
          {[
            { icon: "✉️", label: "Email", value: "hello@tryrepwise.com" },
            { icon: "💬", label: "Response time", value: "Under 4 hours" },
            { icon: "🕐", label: "Hours", value: "Mon–Fri 9–6 CST" },
          ].map((item) => (
            <div key={item.label} className="bg-gray-900 border border-gray-800 rounded-2xl p-5 text-center">
              <div className="text-2xl mb-2">{item.icon}</div>
              <div className="text-xs text-gray-500 mb-1">{item.label}</div>
              <div className="text-white text-xs font-medium">{item.value}</div>
            </div>
          ))}
        </div>

        {/* Form */}
        {!submitted ? (
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">Name</label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Jake Morrison"
                    className="w-full bg-gray-800 border border-gray-700 text-white placeholder-gray-500 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">Email</label>
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="you@example.com"
                    className="w-full bg-gray-800 border border-gray-700 text-white placeholder-gray-500 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Subject</label>
                <select
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  required
                  className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                >
                  <option value="">Select a topic</option>
                  <option value="general">General question</option>
                  <option value="billing">Billing issue</option>
                  <option value="bug">Report a bug</option>
                  <option value="feature">Feature request</option>
                  <option value="enterprise">Enterprise inquiry</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Message</label>
                <textarea
                  required
                  rows={5}
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  placeholder="Tell us how we can help..."
                  className="w-full bg-gray-800 border border-gray-700 text-white placeholder-gray-500 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition resize-none"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold rounded-xl px-4 py-3 text-sm transition flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                    Sending...
                  </>
                ) : "Send message"}
              </button>
            </form>
          </div>
        ) : (
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-12 text-center">
            <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center text-3xl mx-auto mb-4">✅</div>
            <h3 className="text-white font-bold text-xl mb-2">Message sent!</h3>
            <p className="text-gray-400 text-sm mb-6">We will get back to you within a few hours.</p>
            <Link href="/" className="text-blue-400 hover:text-blue-300 text-sm transition">Back to home</Link>
          </div>
        )}
      </div>

      <footer className="border-t border-gray-800 px-8 py-8">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <span className="text-sm font-bold">Try<span className="text-blue-500">RepWise</span></span>
          <p className="text-xs text-gray-600">2025 RepWise. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
