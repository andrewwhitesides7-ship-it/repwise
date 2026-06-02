"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Step = 1 | 2 | 3;
type Role = "rep" | "manager";

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [role, setRole] = useState<Role | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleRoleSelect(selectedRole: Role) {
    setLoading(true);
    setRole(selectedRole);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from("users").update({ role: selectedRole }).eq("id", user.id);
    }
    setLoading(false);
    setStep(2);
  }

  async function handleFinish() {
    setLoading(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from("users").update({ onboarding_completed: true }).eq("id", user.id);
    }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">

        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Rep<span className="text-blue-500">Wise</span>
          </h1>
          <p className="text-gray-500 text-sm mt-1">Let us get you set up</p>
        </div>

        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center gap-3 flex-1">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all flex-shrink-0 ${
                  step > s ? "bg-blue-600 text-white" :
                  step === s ? "bg-blue-600 text-white ring-4 ring-blue-600/20" :
                  "bg-gray-800 text-gray-500"
                }`}>
                  {step > s ? (
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : s}
                </div>
                {s < 3 && <div className={`flex-1 h-px transition-all ${step > s ? "bg-blue-600" : "bg-gray-800"}`} />}
              </div>
            ))}
          </div>
          <div className="w-full bg-gray-800 rounded-full h-1">
            <div className="bg-blue-600 h-1 rounded-full transition-all duration-500" style={{ width: `${((step - 1) / 2) * 100}%` }} />
          </div>
        </div>
        {step === 1 && (
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8">
            <h2 className="text-xl font-semibold text-white mb-2">What is your role?</h2>
            <p className="text-gray-400 text-sm mb-8">We will personalize RepWise based on how you work.</p>
            <div className="grid grid-cols-2 gap-4">
              <button onClick={() => handleRoleSelect("rep")} disabled={loading} className="group flex flex-col items-center gap-4 p-6 bg-gray-800 border border-gray-700 hover:border-blue-500 rounded-2xl transition-all disabled:opacity-50">
                <div className="w-14 h-14 bg-blue-500/10 rounded-2xl flex items-center justify-center text-3xl group-hover:scale-110 transition-transform">🧑‍💼</div>
                <div className="text-center">
                  <div className="text-white font-semibold mb-1">I am a Rep</div>
                  <div className="text-gray-400 text-xs leading-relaxed">I work in the field and want insights on my own performance</div>
                </div>
              </button>
              <button onClick={() => handleRoleSelect("manager")} disabled={loading} className="group flex flex-col items-center gap-4 p-6 bg-gray-800 border border-gray-700 hover:border-blue-500 rounded-2xl transition-all disabled:opacity-50">
                <div className="w-14 h-14 bg-blue-500/10 rounded-2xl flex items-center justify-center text-3xl group-hover:scale-110 transition-transform">👔</div>
                <div className="text-center">
                  <div className="text-white font-semibold mb-1">I am a Manager</div>
                  <div className="text-gray-400 text-xs leading-relaxed">I manage a team and want team-wide analytics</div>
                </div>
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8">
            <h2 className="text-xl font-semibold text-white mb-2">Connect your data</h2>
            <p className="text-gray-400 text-sm mb-8">Choose how to bring your sales data into RepWise. You can change this later.</p>
            <div className="space-y-3 mb-6">
              <a href="/upload" className="flex items-center gap-4 p-4 bg-gray-800 border border-gray-700 hover:border-blue-500 rounded-xl transition-all group">
                <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center text-xl group-hover:scale-110 transition-transform">📄</div>
                <div className="flex-1">
                  <div className="text-white font-medium text-sm">Upload a CSV</div>
                  <div className="text-gray-500 text-xs">Export from any CRM and upload in seconds</div>
                </div>
                <svg className="w-4 h-4 text-gray-600 group-hover:text-blue-400 transition" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
              </a>
              <div className="flex items-center gap-4 p-4 bg-gray-800/50 border border-gray-700/50 rounded-xl opacity-60 cursor-not-allowed">
                <div className="w-10 h-10 bg-orange-500/10 rounded-xl flex items-center justify-center text-xl">🟠</div>
                <div className="flex-1">
                  <div className="text-white font-medium text-sm flex items-center gap-2">Connect HubSpot <span className="text-xs text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded-full">Coming soon</span></div>
                  <div className="text-gray-500 text-xs">Sync contacts, deals, and call logs</div>
                </div>
              </div>
              <div className="flex items-center gap-4 p-4 bg-gray-800/50 border border-gray-700/50 rounded-xl opacity-60 cursor-not-allowed">
                <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center text-xl">☁️</div>
                <div className="flex-1">
                  <div className="text-white font-medium text-sm flex items-center gap-2">Connect Salesforce <span className="text-xs text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded-full">Coming soon</span></div>
                  <div className="text-gray-500 text-xs">Sync opportunities, accounts, and activities</div>
                </div>
              </div>
            </div>
            <button onClick={() => setStep(3)} className="w-full text-center text-gray-500 hover:text-gray-300 text-sm transition py-2">Skip for now</button>
          </div>
        )}

        {step === 3 && (
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 text-center">
            <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center text-4xl mx-auto mb-6">🎉</div>
            <h2 className="text-2xl font-bold text-white mb-3">You are all set</h2>
            <p className="text-gray-400 text-sm mb-2">Welcome to RepWise{role === "manager" ? ", Manager" : ""}.</p>
            <p className="text-gray-500 text-sm mb-8">Upload your first CSV to get AI-powered insights in under 2 minutes.</p>
            <button onClick={handleFinish} disabled={loading} className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold rounded-xl px-6 py-3 text-sm transition flex items-center justify-center gap-2">
              {loading ? "Loading..." : "Go to Dashboard"}
            </button>
          </div>
        )}

        {step > 1 && step < 3 && (
          <button onClick={() => setStep((s) => (s - 1) as Step)} className="flex items-center gap-1 text-gray-500 hover:text-gray-300 text-sm mt-4 mx-auto transition">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
            Back
          </button>
        )}

      </div>
    </div>
  );
}