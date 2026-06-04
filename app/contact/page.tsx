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
    await new Promise(r => setTimeout(r, 1000));
    setSubmitted(true);
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-4xl mx-auto px-6 py-16">
        <Link href="/" className="text-xl font-bold text-white block mb-10">
          Try<span className="text-blue-500">RepWise</span>
        </Link>

        <div className="grid md:grid-cols-2 gap-16">
          <div>
            <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-medium px-3 py-1.5 rounded-full mb-4">Contact us</div>
            <h1 className="text-4xl font-bold mb-4">Get in touch</h1>
            <p className="text-gray-400 text-lg leading-relaxed mb-8">
              Have a question, need help, or want to talk about Enterprise pricing? We respond within a few hours.
            </p>

            <div className="space-y-5">
              {[
                { icon: "💬", title: "General support", desc: "Questions about the product or your account", email: "support@tryrepwise.com" },
                { icon: "💰", title: "Sales and pricing", desc: "Enterprise plans and custom pricing", email: "sales@tryrepwise.com" },
                { icon: "🔒", title: "Privacy and security", desc: "Data requests and security concerns", email: "privacy@tryrepwise.com" },
              ].map(item => (
                <div key={item.title} className="flex items-start gap-4 bg-gray-900 border border-gray-800 rounded-2xl p-4">
                  <div className="text-xl mt-0.5">{item.icon}</div>
                  <div>
                    <p className="text-white font-semibold text-sm">{item.title}</p>
                    <p className="text-gray-500 text-xs mb-1">{item.desc}</p>
                    <a href={`mailto:${item.email}`} className="text-blue-400 text-xs hover:text-blue-300 transition">{item.email}</a>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            {submitted ? (
              <div className="bg-gray-900 border border-gray-800 rounded-3xl p-10 text-center h-full flex flex-col items-center justify-center">
                <div className="text-5xl mb-4">🎉</div>
                <h3 className="text-white font-bold text-xl mb-2">Message sent!</h3>
                <p className="text-gray-400 text-sm">We will get back to you within a few hours.</p>
              </div>
            ) : (
              <div className="bg-gray-900 border border-gray-800 rounded-3xl p-8">
                <h2 className="text-white font-bold text-xl mb-6">Send us a message</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-400 mb-1.5">Name</label>
                      <input
                        type="text"
                        required
                        value={form.name}
                        onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                        placeholder="Jake Morrison"
                        className="w-full bg-gray-800 border border-gray-700 text-white placeholder-gray-600 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-400 mb-1.5">Email</label>
                      <input
                        type="email"
                        required
                        value={form.email}
                        onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                        placeholder="jake@company.com"
                        className="w-full bg-gray-800 border border-gray-700 text-white placeholder-gray-600 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1.5">Subject</label>
                    <select
                      value={form.subject}
                      onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
                      className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                    >
                      <option value="">Select a topic</option>
                      <option value="support">Product support</option>
                      <option value="billing">Billing question</option>
                      <option value="enterprise">Enterprise pricing</option>
                      <option value="bug">Report a bug</option>
                      <option value="feature">Feature request</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1.5">Message</label>
                    <textarea
                      required
                      rows={5}
                      value={form.message}
                      onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                      placeholder="Tell us how we can help..."
                      className="w-full bg-gray-800 border border-gray-700 text-white placeholder-gray-600 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition resize-none"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold px-6 py-3.5 rounded-xl text-sm transition flex items-center justify-center gap-2"
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
            )}
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-800 flex items-center justify-between">
          <Link href="/" className="text-gray-600 text-sm hover:text-gray-400 transition">← Back to home</Link>
          <div className="flex items-center gap-6">
            <Link href="/privacy" className="text-gray-600 text-sm hover:text-gray-400 transition">Privacy Policy</Link>
            <Link href="/terms" className="text-gray-600 text-sm hover:text-gray-400 transition">Terms of Service</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
