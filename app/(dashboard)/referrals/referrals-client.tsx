"use client";

import { useState } from "react";
import Link from "next/link";
import { updateVenmo } from "@/app/actions/referrals";

interface Referral { full_name: string; email: string; plan: string; created_at: string; }
interface Profile { referral_code: string; venmo_username: string | null; referral_credits: number; referral_paid_out: number; plan: string; }
interface ReferralStats { profile: Profile | null; referrals: Referral[]; activeReferrals: Referral[]; pendingPayout: number; }

export default function ReferralsClient({ stats, isPaid }: { stats: ReferralStats; isPaid: boolean }) {
  const [venmo, setVenmo] = useState(stats.profile?.venmo_username || "");
  const [savingVenmo, setSavingVenmo] = useState(false);
  const [copied, setCopied] = useState(false);
  const [venmoSaved, setVenmoSaved] = useState(false);

  const code = stats.profile?.referral_code || "";
  const link = "https://tryrepwise.com/signup?ref=" + code;
  const monthly = stats.activeReferrals.length * 20;
  const pending = stats.profile?.referral_credits || 0;
  const paidOut = stats.profile?.referral_paid_out || 0;

  function copyLink() {
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleSaveVenmo(e: React.FormEvent) {
    e.preventDefault();
    setSavingVenmo(true);
    try { await updateVenmo(venmo); setVenmoSaved(true); setTimeout(() => setVenmoSaved(false), 2000); }
    catch (err) { console.error(err); }
    finally { setSavingVenmo(false); }
  }

  if (!isPaid) {
    return (
      <div className="p-4 md:p-8 max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold text-white mb-1">Refer and Earn</h1>
        <p className="text-gray-400 text-sm mb-8">Earn 20 dollars per month cash for every person you refer who pays.</p>
        <div className="bg-gray-900 border border-gray-800 border-dashed rounded-2xl p-12 text-center">
          <div className="text-5xl mb-4">💰</div>
          <h3 className="text-white font-bold text-xl mb-2">Upgrade to start earning</h3>
          <p className="text-gray-400 text-sm mb-6">You need a paid plan to get your referral code and start earning per referral paid to your Venmo.</p>
          <Link href="/billing" className="inline-block bg-blue-600 hover:bg-blue-500 text-white font-semibold px-6 py-3 rounded-xl text-sm transition">Upgrade now</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-1">Refer and Earn</h1>
        <p className="text-gray-400 text-sm">Share Adunda and earn 20 dollars per month cash via Venmo for every person who stays subscribed.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total referrals", value: String(stats.referrals.length), icon: "👥", color: "text-blue-400" },
          { label: "Active paying", value: String(stats.activeReferrals.length), icon: "💳", color: "text-emerald-400" },
          { label: "Monthly earnings", value: "$ " + String(monthly), icon: "💰", color: "text-yellow-400" },
          { label: "Total paid out", value: "$ " + String(paidOut), icon: "✅", color: "text-purple-400" },
        ].map((stat) => (
          <div key={stat.label} className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-500">{stat.label}</span>
              <span>{stat.icon}</span>
            </div>
            <div className={"text-2xl font-bold " + stat.color}>{stat.value}</div>
          </div>
        ))}
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 mb-5">
        <h2 className="text-white font-semibold mb-1">Your referral link</h2>
        <p className="text-gray-400 text-sm mb-4">Share this link. When someone signs up and pays you earn 20 dollars per month sent to your Venmo.</p>
        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-sm text-gray-300 truncate">{link}</div>
          <button onClick={copyLink} className={(copied ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-blue-600 hover:bg-blue-500 text-white border-transparent") + " flex-shrink-0 font-semibold px-4 py-3 rounded-xl text-sm transition border"}>
            {copied ? "Copied!" : "Copy link"}
          </button>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <a href={"https://reddit.com/submit?url=" + encodeURIComponent(link)} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 py-2.5 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-xl text-xs text-gray-300 font-medium transition">🟠 Reddit</a>
          <a href={"https://facebook.com/sharer/sharer.php?u=" + encodeURIComponent(link)} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 py-2.5 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-xl text-xs text-gray-300 font-medium transition">🔵 Facebook</a>
          <a href={"https://linkedin.com/sharing/share-offsite/?url=" + encodeURIComponent(link)} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 py-2.5 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-xl text-xs text-gray-300 font-medium transition">💼 LinkedIn</a>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 mb-5">
        <h2 className="text-white font-semibold mb-1">Get paid via Venmo</h2>
        <p className="text-gray-400 text-sm mb-4">Add your Venmo username and we will send your earnings on the 1st of each month.</p>
        {pending > 0 && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3 mb-4 flex items-center justify-between">
            <div>
              <p className="text-emerald-400 text-sm font-semibold">Pending payout</p>
              <p className="text-gray-400 text-xs">Will be sent to your Venmo on the 1st</p>
            </div>
            <span className="text-emerald-400 text-2xl font-bold">{"$ "}{pending}</span>
          </div>
        )}
        <form onSubmit={handleSaveVenmo} className="flex items-center gap-3">
          <div className="relative flex-1">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm">@</span>
            <input type="text" value={venmo} onChange={(e) => setVenmo(e.target.value)} placeholder="yourvenmo" className="w-full bg-gray-800 border border-gray-700 text-white placeholder-gray-500 rounded-xl pl-8 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition" />
          </div>
          <button type="submit" disabled={savingVenmo} className={(venmoSaved ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-blue-600 hover:bg-blue-500 text-white") + " flex-shrink-0 font-semibold px-4 py-3 rounded-xl text-sm transition"}>
            {savingVenmo ? "Saving..." : venmoSaved ? "Saved!" : "Save Venmo"}
          </button>
        </form>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 mb-5">
        <h2 className="text-white font-semibold mb-4">How it works</h2>
        <div className="space-y-4">
          {[
            { icon: "🔗", title: "Share your link", desc: "Send your unique link to anyone in field sales who could use Adunda." },
            { icon: "💳", title: "They sign up and pay", desc: "When they start a paid plan using your link you earn 20 dollars added to your balance." },
            { icon: "🔄", title: "Earn every month", desc: "As long as they stay subscribed you keep earning 20 dollars per month. No cap on referrals." },
            { icon: "💸", title: "Get paid via Venmo", desc: "We send your balance to your Venmo on the 1st of each month automatically." },
          ].map((item) => (
            <div key={item.title} className="flex items-start gap-3">
              <span className="text-xl flex-shrink-0">{item.icon}</span>
              <div>
                <p className="text-white text-sm font-semibold">{item.title}</p>
                <p className="text-gray-500 text-xs leading-relaxed">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {stats.referrals.length > 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-800">
            <h2 className="text-white font-semibold">Your referrals</h2>
          </div>
          <div className="divide-y divide-gray-800">
            {stats.referrals.map((ref, i) => (
              <div key={i} className="flex items-center justify-between px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-400 text-xs font-bold">
                    {(ref.full_name || ref.email || "?")[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="text-white text-sm font-medium">{ref.full_name || "Unknown"}</p>
                    <p className="text-gray-500 text-xs">{ref.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={(ref.plan !== "free" ? "bg-emerald-500/10 text-emerald-400" : "bg-gray-800 text-gray-500") + " text-xs font-medium px-2.5 py-1 rounded-full"}>
                    {ref.plan !== "free" ? "Paying - earning 20/mo" : "Free - not yet paying"}
                  </span>
                  <span className="text-gray-600 text-xs">{new Date(ref.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
