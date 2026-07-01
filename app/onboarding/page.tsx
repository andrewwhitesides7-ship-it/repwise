"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Step = 1 | 2 | 3;

// Vertical IDs align 1:1 with verticalContext keys in app/actions/analyze.ts
const businessTypes = [
  { id: "hvac", label: "HVAC", icon: "🌡️" },
  { id: "plumbing", label: "Plumbing", icon: "🔧" },
  { id: "roofing", label: "Roofing", icon: "🏠" },
  { id: "electrical", label: "Electrical", icon: "⚡" },
  { id: "pest", label: "Pest Control", icon: "🐛" },
  { id: "landscaping", label: "Landscaping", icon: "🌿" },
  { id: "cleaning", label: "Cleaning", icon: "🧽" },
  { id: "solar", label: "Solar", icon: "☀️" },
  { id: "other", label: "Other service biz", icon: "📦" },
];

const teamSizes = [
  { id: "solo", label: "Just me", desc: "Owner-operator" },
  { id: "small", label: "2–5", desc: "Small crew" },
  { id: "medium", label: "6–15", desc: "Growing" },
  { id: "large", label: "16+", desc: "Established" },
];

// Challenge IDs map to the agent that plugs that leak
const challenges = [
  { id: "slow_response", label: "Leads I don't get back to fast enough", icon: "⚡", agent: "Lead Response" },
  { id: "cold_quotes", label: "Quotes that go out and go quiet", icon: "📄", agent: "Follow-Up & Reactivation" },
  { id: "no_shows", label: "No-shows & cancellations", icon: "📅", agent: "Scheduling & Dispatch" },
  { id: "unpaid", label: "Unpaid or overdue invoices", icon: "💸", agent: "Quote & Invoice" },
  { id: "no_reviews", label: "No reviews or repeat business", icon: "⭐", agent: "Reviews & Reputation" },
  { id: "not_sure", label: "Not sure — find it for me", icon: "🔍", agent: "Diagnostic" },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [businessType, setBusinessType] = useState<string | null>(null);
  const [teamSize, setTeamSize] = useState<string | null>(null);
  const [mainChallenge, setMainChallenge] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleFinish() {
    setLoading(true);
    setError("");
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }

      const { error: updateError } = await supabase
        .from("users")
        .update({
          // role kept as a known-valid value to avoid the legacy DB check constraint.
          // If you widen the column to allow "owner", switch this.
          role: "rep",
          business_type: businessType,
          team_size: teamSize,
          main_challenge: mainChallenge,
          onboarded: true,
        })
        .eq("id", user.id);

      if (updateError) {
        console.error("Update error:", updateError);
        setError("Something went wrong. Please try again.");
        setLoading(false);
        return;
      }

      await supabase.auth.updateUser({ data: { onboarded: true } });

      // Route new owners straight into the upload flow — that's the first value moment.
      router.push("/upload");
    } catch (err) {
      console.error("Onboarding error:", err);
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  const steps = [
    { number: 1, label: "Your work" },
    { number: 2, label: "Your size" },
    { number: 3, label: "The leak" },
  ];

  const canContinue = (step === 1 && businessType) || (step === 2 && teamSize) || (step === 3 && mainChallenge);

  return (
    <div className="md-root relative min-h-screen text-[var(--ink)] antialiased flex flex-col items-center justify-center px-5 py-12">
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />

      <style jsx global>{`
        :root { --ink:#1d1d1f; --muted:#6e6e73; --field:#f5f5f7; --accent:#0a84ff; --accent2:#6a5cff; }
        .md-root { font-family:-apple-system,BlinkMacSystemFont,"SF Pro Display","SF Pro Text","Inter",system-ui,sans-serif; letter-spacing:-0.01em; }
        .grad-text { background:linear-gradient(120deg,var(--accent),var(--accent2)); -webkit-background-clip:text; background-clip:text; color:transparent; }
        .glass { position:relative; background:linear-gradient(135deg,rgba(255,255,255,0.72),rgba(255,255,255,0.42)); backdrop-filter:blur(22px) saturate(180%); -webkit-backdrop-filter:blur(22px) saturate(180%); border:1px solid rgba(255,255,255,0.7); box-shadow:0 10px 40px rgba(20,24,40,0.08), inset 0 1px 0 rgba(255,255,255,0.9); }
        .btn-primary { display:inline-flex; align-items:center; justify-content:center; gap:.5rem; font-size:.9rem; font-weight:600; color:#fff; padding:.85rem 1.1rem; border-radius:14px; width:100%; background:linear-gradient(120deg,var(--accent),var(--accent2)); box-shadow:0 8px 24px rgba(10,132,255,.32), inset 0 1px 0 rgba(255,255,255,.4); transition:transform .2s ease, filter .2s ease; }
        .btn-primary:hover { transform:translateY(-1px); filter:brightness(1.05); }
        .btn-primary:disabled { opacity:.4; transform:none; filter:none; cursor:not-allowed; }
        .btn-ghost { display:inline-flex; align-items:center; justify-content:center; font-size:.9rem; font-weight:600; color:var(--ink); padding:.85rem 1.1rem; border-radius:14px; background:rgba(255,255,255,0.7); border:1px solid rgba(0,0,0,0.08); transition:background .2s ease; }
        .btn-ghost:hover { background:rgba(255,255,255,0.95); }
        @keyframes mdrift { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(28px,-36px) scale(1.07)} }
        @media (prefers-reduced-motion: no-preference){ .md-blob{animation:mdrift 22s ease-in-out infinite} }
        *:focus-visible { outline:2px solid var(--accent); outline-offset:3px; border-radius:6px; }
      `}</style>

      {/* Ambient background */}
      <div aria-hidden className="fixed inset-0 z-0 overflow-hidden" style={{ background: "var(--field)" }}>
        <div className="md-blob absolute -top-32 -left-24 w-[560px] h-[560px] rounded-full" style={{ background: "#bcd4ff", opacity: 0.4, filter: "blur(130px)" }} />
        <div className="md-blob absolute top-40 -right-32 w-[520px] h-[520px] rounded-full" style={{ background: "#e2d4ff", opacity: 0.38, filter: "blur(130px)", animationDelay: "-7s" }} />
        <div className="md-blob absolute bottom-0 left-1/3 w-[480px] h-[480px] rounded-full" style={{ background: "#cdeede", opacity: 0.32, filter: "blur(140px)", animationDelay: "-13s" }} />
      </div>

      <div className="relative z-10 w-full max-w-2xl">
        {/* Wordmark */}
        <div className="text-center mb-7">
          <span className="text-2xl font-semibold tracking-tight">
            <span className="grad-text">Adunda</span>
          </span>
        </div>

        {/* Progress */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {steps.map((s, i) => (
            <div key={s.number} className="flex items-center gap-2">
              <div className="flex items-center gap-2">
                <div
                  className="w-8 h-8 rounded-full grid place-items-center text-xs font-bold transition-all duration-300"
                  style={
                    step > s.number
                      ? { background: "linear-gradient(120deg,var(--accent),var(--accent2))", color: "#fff" }
                      : step === s.number
                      ? { background: "linear-gradient(120deg,var(--accent),var(--accent2))", color: "#fff", boxShadow: "0 0 0 4px rgba(10,132,255,0.15)" }
                      : { background: "rgba(255,255,255,0.7)", color: "var(--muted)", border: "1px solid rgba(0,0,0,0.08)" }
                  }
                >
                  {step > s.number ? (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                  ) : s.number}
                </div>
                <span className="text-xs font-medium hidden sm:block" style={{ color: step === s.number ? "var(--ink)" : "var(--muted)" }}>{s.label}</span>
              </div>
              {i < steps.length - 1 && (
                <div className="w-8 h-px transition-all duration-300" style={{ background: step > s.number ? "var(--accent)" : "rgba(0,0,0,0.12)" }} />
              )}
            </div>
          ))}
        </div>

        <div className="glass rounded-[24px] p-7">
          {/* STEP 1 — vertical */}
          {step === 1 && (
            <div>
              <div className="text-center mb-7">
                <h1 className="text-2xl font-semibold tracking-tight mb-1.5">What kind of work do you do?</h1>
                <p className="text-[var(--muted)] text-sm">We tune the diagnostic to how your business actually makes money.</p>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-7">
                {businessTypes.map((type) => {
                  const active = businessType === type.id;
                  return (
                    <button
                      key={type.id}
                      onClick={() => setBusinessType(type.id)}
                      className="p-4 rounded-2xl text-left transition-all duration-200"
                      style={active
                        ? { background: "rgba(10,132,255,0.08)", border: "1px solid var(--accent)", boxShadow: "0 6px 18px rgba(10,132,255,0.12)" }
                        : { background: "rgba(255,255,255,0.5)", border: "1px solid rgba(0,0,0,0.07)" }}
                    >
                      <div className="text-2xl mb-2">{type.icon}</div>
                      <h3 className="font-semibold text-sm tracking-tight">{type.label}</h3>
                    </button>
                  );
                })}
              </div>
              <button onClick={() => setStep(2)} disabled={!businessType} className="btn-primary">Continue</button>
            </div>
          )}

          {/* STEP 2 — size */}
          {step === 2 && (
            <div>
              <div className="text-center mb-7">
                <h1 className="text-2xl font-semibold tracking-tight mb-1.5">How big is your business?</h1>
                <p className="text-[var(--muted)] text-sm">Just so we scope the numbers to your world.</p>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-7">
                {teamSizes.map((size) => {
                  const active = teamSize === size.id;
                  return (
                    <button
                      key={size.id}
                      onClick={() => setTeamSize(size.id)}
                      className="p-4 rounded-2xl text-center transition-all duration-200"
                      style={active
                        ? { background: "rgba(10,132,255,0.08)", border: "1px solid var(--accent)", boxShadow: "0 6px 18px rgba(10,132,255,0.12)" }
                        : { background: "rgba(255,255,255,0.5)", border: "1px solid rgba(0,0,0,0.07)" }}
                    >
                      <p className="font-semibold text-sm">{size.label}</p>
                      <p className="text-[var(--muted)] text-xs mt-0.5">{size.desc}</p>
                    </button>
                  );
                })}
              </div>
              <div className="flex items-center gap-3">
                <button onClick={() => setStep(1)} className="btn-ghost flex-1">Back</button>
                <button onClick={() => setStep(3)} disabled={!teamSize} className="btn-primary flex-1">Continue</button>
              </div>
            </div>
          )}

          {/* STEP 3 — leak */}
          {step === 3 && (
            <div>
              <div className="text-center mb-7">
                <h1 className="text-2xl font-semibold tracking-tight mb-1.5">Where does money slip out most?</h1>
                <p className="text-[var(--muted)] text-sm">Pick the one that stings — we'll prioritize the agent that plugs it.</p>
              </div>
              <div className="grid gap-2.5 mb-6">
                {challenges.map((c) => {
                  const active = mainChallenge === c.id;
                  return (
                    <button
                      key={c.id}
                      onClick={() => setMainChallenge(c.id)}
                      className="flex items-center gap-3 p-3.5 rounded-2xl text-left transition-all duration-200"
                      style={active
                        ? { background: "rgba(10,132,255,0.08)", border: "1px solid var(--accent)", boxShadow: "0 6px 18px rgba(10,132,255,0.12)" }
                        : { background: "rgba(255,255,255,0.5)", border: "1px solid rgba(0,0,0,0.07)" }}
                    >
                      <span className="text-xl flex-shrink-0">{c.icon}</span>
                      <span className="text-sm font-medium flex-1">{c.label}</span>
                      {c.agent !== "Diagnostic" && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full hidden sm:block" style={{ color: "var(--accent)", background: "rgba(10,132,255,0.1)", border: "1px solid rgba(10,132,255,0.18)" }}>
                          {c.agent}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {error && (
                <div className="rounded-xl px-4 py-3 mb-4" style={{ background: "rgba(229,72,77,0.08)", border: "1px solid rgba(229,72,77,0.2)" }}>
                  <p className="text-sm" style={{ color: "#c93b40" }}>{error}</p>
                </div>
              )}

              <div className="flex items-center gap-3">
                <button onClick={() => setStep(2)} className="btn-ghost flex-1">Back</button>
                <button onClick={handleFinish} disabled={loading || !mainChallenge} className="btn-primary flex-1">
                  {loading ? (
                    <>
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                      </svg>
                      Setting up...
                    </>
                  ) : "Find my leaks"}
                </button>
              </div>
            </div>
          )}
        </div>

        <p className="text-center text-[var(--muted)] text-xs mt-6">Free analysis · No credit card · See the leaks before you decide</p>
      </div>
    </div>
  );
}
