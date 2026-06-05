"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Step = 1 | 2 | 3 | 4;
type Role = "rep" | "manager";

const businessTypes = [
  { id: "solar", label: "Solar", icon: "☀️", desc: "Residential or commercial solar sales" },
  { id: "pest", label: "Pest Control", icon: "🐛", desc: "Door-to-door pest control services" },
  { id: "security", label: "Home Security", icon: "🔒", desc: "Security systems and monitoring" },
  { id: "telecom", label: "Telecom", icon: "📡", desc: "Internet, TV, and phone services" },
  { id: "roofing", label: "Roofing", icon: "🏠", desc: "Roofing and home improvement" },
  { id: "insurance", label: "Insurance", icon: "🛡️", desc: "Life, home, or auto insurance" },
  { id: "saas", label: "SaaS / Tech", icon: "💻", desc: "Software and technology sales" },
  { id: "other", label: "Other", icon: "📦", desc: "Something else entirely" },
];

const teamSizes = [
  { id: "solo", label: "Just me", icon: "👤", desc: "Solo rep" },
  { id: "small", label: "2-5 reps", icon: "👥", desc: "Small team" },
  { id: "medium", label: "6-20 reps", icon: "🏢", desc: "Growing team" },
  { id: "large", label: "20+ reps", icon: "🏭", desc: "Large operation" },
];

const challenges = [
  { id: "close_rate", label: "Low close rate", icon: "📉", desc: "Not converting enough contacts" },
  { id: "follow_ups", label: "Missed follow-ups", icon: "📞", desc: "Leads going cold" },
  { id: "territory", label: "Territory optimization", icon: "🗺️", desc: "Not knowing where to focus" },
  { id: "rep_performance", label: "Rep performance gaps", icon: "👥", desc: "Inconsistent performance" },
  { id: "data_visibility", label: "No data visibility", icon: "👁️", desc: "Flying blind without metrics" },
  { id: "time_of_day", label: "Wrong timing", icon: "⏰", desc: "Knocking at the wrong hours" },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [role, setRole] = useState<Role | null>(null);
  const [businessType, setBusinessType] = useState<string | null>(null);
  const [teamSize, setTeamSize] = useState<string | null>(null);
  const [mainChallenge, setMainChallenge] = useState<string | null>(null);
  const [teamName, setTeamName] = useState("");
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
          role: role || "rep",
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

      await supabase.auth.updateUser({
        data: { onboarded: true },
      });

      if (role === "manager" && teamName.trim()) {
        const { data: existingTeam } = await supabase
          .from("teams")
          .select("id")
          .eq("owner_id", user.id)
          .single();

        if (!existingTeam) {
          const { data: team } = await supabase
            .from("teams")
            .insert({ name: teamName.trim(), owner_id: user.id })
            .select()
            .single();
          if (team) {
            await supabase
              .from("users")
              .update({ team_id: team.id })
              .eq("id", user.id);
          }
        }
      }

      router.push("/dashboard");
    } catch (err) {
      console.error("Onboarding error:", err);
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  const steps = [
    { number: 1, label: "Your role" },
    { number: 2, label: "Your business" },
    { number: 3, label: "Your challenge" },
    { number: 4, label: "Get started" },
  ];

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center px-6 py-12">
      <div className="mb-8">
        <span className="text-2xl font-bold text-white">
          Try<span className="text-blue-500">RepWise</span>
        </span>
      </div>

      <div className="flex items-center gap-2 mb-10">
        {steps.map((s, i) => (
          <div key={s.number} className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <div
                className={
                  "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 " +
                  (step > s.number
                    ? "bg-blue-600 text-white"
                    : step === s.number
                    ? "bg-blue-600 text-white ring-4 ring-blue-500/20"
                    : "bg-gray-800 text-gray-500 border border-gray-700")
                }
              >
                {step > s.number ? (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  s.number
                )}
              </div>
              <span className={"text-xs font-medium hidden sm:block " + (step === s.number ? "text-white" : "text-gray-600")}>
                {s.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className={"w-8 h-px transition-all duration-300 " + (step > s.number ? "bg-blue-600" : "bg-gray-800")} />
            )}
          </div>
        ))}
      </div>

      <div className="w-full max-w-2xl bg-gray-900 border border-gray-800 rounded-3xl p-8 shadow-2xl">

        {step === 1 && (
          <div>
            <div className="text-center mb-8">
              <div className="text-4xl mb-3">👋</div>
              <h1 className="text-2xl font-bold text-white mb-2">How do you use RepWise?</h1>
              <p className="text-gray-400 text-sm">We will personalize your experience based on your role.</p>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-8">
              {[
                {
                  value: "rep" as Role,
                  title: "Solo Rep",
                  desc: "I want insights on my own performance",
                  icon: "🎯",
                  features: ["Personal insights", "Close rate tracking", "Territory analysis"],
                },
                {
                  value: "manager" as Role,
                  title: "Manager",
                  desc: "I manage a team of reps",
                  icon: "👔",
                  features: ["Team insights", "Rep benchmarking", "Manager dashboard"],
                },
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => setRole(option.value)}
                  className={
                    "p-5 rounded-2xl border text-left transition-all duration-200 hover:-translate-y-0.5 " +
                    (role === option.value
                      ? "bg-blue-600/10 border-blue-500 shadow-lg shadow-blue-500/10"
                      : "bg-gray-800/50 border-gray-700 hover:border-gray-600")
                  }
                >
                  <div className="text-2xl mb-3">{option.icon}</div>
                  <h3 className="text-white font-bold mb-1 text-sm">{option.title}</h3>
                  <p className={"text-xs leading-relaxed mb-3 " + (role === option.value ? "text-blue-200/70" : "text-gray-500")}>
                    {option.desc}
                  </p>
                  <ul className="space-y-1">
                    {option.features.map((f) => (
                      <li key={f} className="flex items-center gap-1.5 text-xs">
                        <svg
                          className={"w-3 h-3 flex-shrink-0 " + (role === option.value ? "text-blue-400" : "text-gray-600")}
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2.5}
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                        <span className={role === option.value ? "text-blue-200/80" : "text-gray-600"}>{f}</span>
                      </li>
                    ))}
                  </ul>
                </button>
              ))}
            </div>
            <button
              onClick={() => setStep(2)}
              disabled={!role}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white font-semibold px-6 py-3.5 rounded-xl text-sm transition shadow-lg shadow-blue-500/20"
            >
              Continue
            </button>
          </div>
        )}

        {step === 2 && (
          <div>
            <div className="text-center mb-8">
              <div className="text-4xl mb-3">🏢</div>
              <h1 className="text-2xl font-bold text-white mb-2">What industry are you in?</h1>
              <p className="text-gray-400 text-sm">We will tailor your AI insights to your specific market.</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
              {businessTypes.map((type) => (
                <button
                  key={type.id}
                  onClick={() => setBusinessType(type.id)}
                  className={
                    "p-4 rounded-2xl border text-left transition-all duration-200 hover:-translate-y-0.5 " +
                    (businessType === type.id
                      ? "bg-blue-600/10 border-blue-500 shadow-lg shadow-blue-500/10"
                      : "bg-gray-800/50 border-gray-700 hover:border-gray-600")
                  }
                >
                  <div className="text-2xl mb-2">{type.icon}</div>
                  <h3 className="text-white font-bold text-xs mb-1">{type.label}</h3>
                  <p className={"text-xs leading-relaxed " + (businessType === type.id ? "text-blue-200/70" : "text-gray-600")}>
                    {type.desc}
                  </p>
                </button>
              ))}
            </div>
            {role === "manager" && (
              <div className="mb-6">
                <label className="block text-xs font-medium text-gray-400 mb-1.5">Team name</label>
                <input
                  type="text"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  placeholder="e.g. Austin Solar Team"
                  className="w-full bg-gray-800 border border-gray-700 text-white placeholder-gray-500 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                />
              </div>
            )}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setStep(1)}
                className="flex-1 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-white font-semibold px-6 py-3.5 rounded-xl text-sm transition"
              >
                Back
              </button>
              <button
                onClick={() => setStep(3)}
                disabled={!businessType}
                className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white font-semibold px-6 py-3.5 rounded-xl text-sm transition shadow-lg shadow-blue-500/20"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <div className="text-center mb-6">
              <div className="text-4xl mb-3">🎯</div>
              <h1 className="text-2xl font-bold text-white mb-2">What is your biggest challenge?</h1>
              <p className="text-gray-400 text-sm">We will prioritize insights that solve your specific problem.</p>
            </div>
            <div className="mb-6">
              <p className="text-xs font-medium text-gray-400 mb-3">Team size</p>
              <div className="grid grid-cols-4 gap-3">
                {teamSizes.map((size) => (
                  <button
                    key={size.id}
                    onClick={() => setTeamSize(size.id)}
                    className={
                      "p-3 rounded-xl border text-center transition-all " +
                      (teamSize === size.id
                        ? "bg-blue-600/10 border-blue-500"
                        : "bg-gray-800/50 border-gray-700 hover:border-gray-600")
                    }
                  >
                    <div className="text-xl mb-1">{size.icon}</div>
                    <p className="text-white text-xs font-semibold">{size.label}</p>
                    <p className={"text-xs " + (teamSize === size.id ? "text-blue-200/70" : "text-gray-600")}>{size.desc}</p>
                  </button>
                ))}
              </div>
            </div>
            <div className="mb-8">
              <p className="text-xs font-medium text-gray-400 mb-3">Main challenge</p>
              <div className="grid grid-cols-2 gap-3">
                {challenges.map((challenge) => (
                  <button
                    key={challenge.id}
                    onClick={() => setMainChallenge(challenge.id)}
                    className={
                      "flex items-center gap-3 p-3 rounded-xl border text-left transition-all " +
                      (mainChallenge === challenge.id
                        ? "bg-blue-600/10 border-blue-500"
                        : "bg-gray-800/50 border-gray-700 hover:border-gray-600")
                    }
                  >
                    <span className="text-xl">{challenge.icon}</span>
                    <div>
                      <p className="text-white text-xs font-semibold">{challenge.label}</p>
                      <p className={"text-xs " + (mainChallenge === challenge.id ? "text-blue-200/70" : "text-gray-600")}>
                        {challenge.desc}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setStep(2)}
                className="flex-1 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-white font-semibold px-6 py-3.5 rounded-xl text-sm transition"
              >
                Back
              </button>
              <button
                onClick={() => setStep(4)}
                disabled={!teamSize || !mainChallenge}
                className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white font-semibold px-6 py-3.5 rounded-xl text-sm transition shadow-lg shadow-blue-500/20"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div>
            <div className="text-center mb-8">
              <div className="text-5xl mb-3">🚀</div>
              <h1 className="text-2xl font-bold text-white mb-2">You are all set!</h1>
              <p className="text-gray-400 text-sm leading-relaxed">
                Your AI insights will be tailored to{" "}
                <span className="text-white font-semibold">
                  {businessTypes.find((b) => b.id === businessType)?.label}
                </span>{" "}
                sales with a focus on{" "}
                <span className="text-white font-semibold">
                  {challenges.find((c) => c.id === mainChallenge)?.label.toLowerCase()}
                </span>
                .
              </p>
            </div>

            <div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-5 mb-8">
              <h3 className="text-white font-semibold text-sm mb-3">Your personalized setup</h3>
              <div className="space-y-2">
                {[
                  { label: "Role", value: role === "manager" ? "Manager" : "Solo Rep", icon: role === "manager" ? "👔" : "🎯" },
                  { label: "Industry", value: businessTypes.find((b) => b.id === businessType)?.label || "", icon: businessTypes.find((b) => b.id === businessType)?.icon || "📦" },
                  { label: "Team size", value: teamSizes.find((t) => t.id === teamSize)?.label || "", icon: teamSizes.find((t) => t.id === teamSize)?.icon || "👤" },
                  { label: "Focus area", value: challenges.find((c) => c.id === mainChallenge)?.label || "", icon: challenges.find((c) => c.id === mainChallenge)?.icon || "🎯" },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between">
                    <span className="text-gray-500 text-xs">{item.label}</span>
                    <span className="text-white text-xs font-medium flex items-center gap-1.5">
                      {item.icon} {item.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 mb-4">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            <div className="flex items-center gap-3">
              <button
                onClick={() => setStep(3)}
                className="bg-gray-800 hover:bg-gray-700 border border-gray-700 text-white font-semibold px-4 py-3.5 rounded-xl text-sm transition"
              >
                Back
              </button>
              <button
                onClick={handleFinish}
                disabled={loading}
                className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold px-6 py-3.5 rounded-xl text-sm transition shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                    Setting up...
                  </>
                ) : (
                  "Go to dashboard"
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      <p className="text-gray-700 text-xs mt-6">No credit card required. Cancel anytime.</p>
    </div>
  );
}
