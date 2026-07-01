"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function SignupPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");
  const [strength, setStrength] = useState(0);

  useEffect(() => {
    let s = 0;
    if (password.length >= 8) s++;
    if (/[A-Z]/.test(password)) s++;
    if (/[0-9]/.test(password)) s++;
    if (/[^A-Za-z0-9]/.test(password)) s++;
    setStrength(s);
  }, [password]);

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      setLoading(false);
      return;
    }

    const supabase = createClient();
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    if (data.user) {
      await supabase.from("users").upsert({
        id: data.user.id,
        email: data.user.email,
        full_name: fullName,
        plan: "free",
        role: "rep",
      });

      try {
        await fetch("/api/send-welcome", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, name: fullName }),
        });
      } catch (err) {
        console.error("Welcome email error:", err);
      }

      router.push("/onboarding");
    }
  }

  async function handleGoogle() {
    setGoogleLoading(true);
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  }

  const insights = [
    { priority: "critical", category: "Quote & Invoice", title: "$84K in quotes sitting open with no follow-up", metric: "$84K idle" },
    { priority: "opportunity", category: "Lead Response", title: "38% of new leads never got a first response", metric: "38% of leads" },
    { priority: "pattern", category: "Reviews", title: "142 completed jobs, 0 review requests sent", metric: "142 jobs" },
  ];
  const pColor = (p: string) => (p === "critical" ? "#e5484d" : p === "opportunity" ? "#1aa251" : "#0a84ff");
  const pTint = (p: string) => (p === "critical" ? "rgba(229,72,77,0.1)" : p === "opportunity" ? "rgba(26,162,81,0.1)" : "rgba(10,132,255,0.1)");

  const strengthColors = ["", "#e5484d", "#e0922f", "#0a84ff", "#1aa251"];
  const strengthLabels = ["", "Weak", "Fair", "Good", "Strong"];

  return (
    <div className="md-root relative min-h-screen flex text-[var(--ink)] antialiased overflow-hidden">
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />

      <style jsx global>{`
        :root { --ink:#1d1d1f; --muted:#6e6e73; --field:#f5f5f7; --accent:#0a84ff; --accent2:#6a5cff; }
        .md-root { font-family:-apple-system,BlinkMacSystemFont,"SF Pro Display","SF Pro Text","Inter",system-ui,sans-serif; letter-spacing:-0.01em; }
        .md-mono { font-family:"JetBrains Mono",ui-monospace,SFMono-Regular,Menlo,monospace; letter-spacing:0; }
        .grad-text { background:linear-gradient(120deg,var(--accent),var(--accent2)); -webkit-background-clip:text; background-clip:text; color:transparent; }
        .glass { position:relative; background:linear-gradient(135deg,rgba(255,255,255,0.72),rgba(255,255,255,0.42)); backdrop-filter:blur(22px) saturate(180%); -webkit-backdrop-filter:blur(22px) saturate(180%); border:1px solid rgba(255,255,255,0.7); box-shadow:0 10px 40px rgba(20,24,40,0.08), inset 0 1px 0 rgba(255,255,255,0.9); }
        .gi { width:100%; background:rgba(255,255,255,0.6); border:1px solid rgba(0,0,0,0.1); color:var(--ink); border-radius:14px; padding:0.75rem 1rem; font-size:0.875rem; transition:all .2s ease; }
        .gi::placeholder { color:#9a9aa0; }
        .gi:focus { outline:none; border-color:transparent; box-shadow:0 0 0 2px var(--accent); background:#fff; }
        .btn-primary { display:inline-flex; align-items:center; justify-content:center; gap:.5rem; font-size:.875rem; font-weight:600; color:#fff; padding:.85rem 1.1rem; border-radius:14px; width:100%; background:linear-gradient(120deg,var(--accent),var(--accent2)); box-shadow:0 8px 24px rgba(10,132,255,.32), inset 0 1px 0 rgba(255,255,255,.4); transition:transform .2s ease, filter .2s ease; }
        .btn-primary:hover { transform:translateY(-1px); filter:brightness(1.05); }
        .btn-primary:disabled { opacity:.6; transform:none; }
        .btn-ghost { display:inline-flex; align-items:center; justify-content:center; gap:.65rem; width:100%; font-size:.875rem; font-weight:600; color:var(--ink); padding:.8rem 1.1rem; border-radius:14px; background:rgba(255,255,255,0.7); border:1px solid rgba(0,0,0,0.08); transition:all .2s ease; }
        .btn-ghost:hover { background:#fff; box-shadow:0 4px 16px rgba(20,24,40,0.06); }
        @keyframes mdrift { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(28px,-36px) scale(1.07)} }
        @media (prefers-reduced-motion: no-preference){ .md-blob{animation:mdrift 22s ease-in-out infinite} }
        *:focus-visible { outline:2px solid var(--accent); outline-offset:3px; border-radius:6px; }
      `}</style>

      {/* ambient field */}
      <div aria-hidden className="fixed inset-0 z-0 overflow-hidden" style={{ background: "var(--field)" }}>
        <div className="md-blob absolute -top-32 -left-24 w-[560px] h-[560px] rounded-full" style={{ background: "#bcd4ff", opacity: 0.45, filter: "blur(130px)" }} />
        <div className="md-blob absolute top-40 -right-32 w-[520px] h-[520px] rounded-full" style={{ background: "#e2d4ff", opacity: 0.4, filter: "blur(130px)", animationDelay: "-7s" }} />
        <div className="md-blob absolute bottom-0 left-1/3 w-[480px] h-[480px] rounded-full" style={{ background: "#cdeede", opacity: 0.36, filter: "blur(140px)", animationDelay: "-13s" }} />
      </div>

      {/* Left showcase */}
      <div className="hidden lg:flex lg:w-1/2 relative z-10 p-10 xl:p-14">
        <div className="glass rounded-[28px] w-full flex flex-col justify-between p-10 overflow-hidden">
          <Link href="/" className="inline-flex items-center gap-2.5 text-xl font-semibold tracking-tight">
            <span className="inline-grid place-items-center w-7 h-7 rounded-lg" style={{ background: "linear-gradient(135deg,var(--accent),var(--accent2))" }}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 1v12M3 4.5v5M11 4.5v5" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" /></svg>
            </span>
            Adunda
          </Link>

          <div>
            <div className="inline-flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full mb-5" style={{ background: "rgba(10,132,255,0.1)", color: "var(--accent)" }}>
              Free to start — no card required
            </div>
            <h2 className="text-[34px] leading-[1.1] font-semibold tracking-tight mb-4">
              Find the money your<br />business is leaking.
            </h2>
            <p className="text-[var(--muted)] text-base leading-relaxed mb-8 max-w-md">
              Upload your data and Adunda finds the revenue slipping through your funnel — slow lead response, cold quotes, unpaid invoices — then deploys agents to recover it. First insights in under 2 minutes.
            </p>

            <div className="space-y-3">
              {insights.map((insight, i) => (
                <div key={i} className="glass rounded-2xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full" style={{ background: pTint(insight.priority), color: pColor(insight.priority) }}>
                      <span className="w-1.5 h-1.5 rounded-full" style={{ background: pColor(insight.priority) }} />
                      {insight.priority}
                    </span>
                    <span className="text-[var(--muted)] text-[11px]">{insight.category}</span>
                    <span className="ml-auto text-xs font-semibold grad-text">{insight.metric}</span>
                  </div>
                  <p className="text-sm font-medium">{insight.title}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 pt-2">
            {[
              { value: "2 min", label: "Diagnostic" },
              { value: "5", label: "Agents" },
              { value: "24/7", label: "Always on" },
            ].map((stat) => (
              <div key={stat.label}>
                <div className="text-2xl font-semibold tracking-tight grad-text">{stat.value}</div>
                <div className="text-[var(--muted)] text-xs mt-0.5">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right form */}
      <div className="flex-1 relative z-10 flex flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <div className="lg:hidden text-center mb-8">
            <Link href="/" className="inline-flex items-center gap-2.5 text-xl font-semibold tracking-tight">
              <span className="inline-grid place-items-center w-7 h-7 rounded-lg" style={{ background: "linear-gradient(135deg,var(--accent),var(--accent2))" }}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 1v12M3 4.5v5M11 4.5v5" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" /></svg>
              </span>
              Adunda
            </Link>
          </div>

          <div className="glass rounded-[28px] p-8">
            <div className="mb-7">
              <h1 className="text-2xl font-semibold tracking-tight mb-1.5">Create your account</h1>
              <p className="text-[var(--muted)] text-sm">Free to start. No credit card required.</p>
            </div>

            <button onClick={handleGoogle} disabled={googleLoading} className="btn-ghost mb-5">
              {googleLoading ? (
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
              )}
              Continue with Google
            </button>

            <div className="relative mb-5">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-black/8" /></div>
              <div className="relative flex justify-center"><span className="px-4 text-xs text-[var(--muted)]" style={{ background: "rgba(255,255,255,0.6)" }}>or sign up with email</span></div>
            </div>

            <form onSubmit={handleSignup} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[var(--muted)] mb-1.5">Full name</label>
                <input type="text" required value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Jake Morrison" className="gi" />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--muted)] mb-1.5">Email</label>
                <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" className="gi" />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--muted)] mb-1.5">Password</label>
                <div className="relative">
                  <input type={showPassword ? "text" : "password"} required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 8 characters" className="gi pr-12" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--muted)] hover:text-[var(--ink)] transition">
                    {showPassword ? (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                    )}
                  </button>
                </div>
                {password.length > 0 && (
                  <div className="mt-2">
                    <div className="flex gap-1 mb-1">
                      {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="h-1 flex-1 rounded-full transition-all duration-300" style={{ background: i <= strength ? strengthColors[strength] : "rgba(0,0,0,0.08)" }} />
                      ))}
                    </div>
                    {strength > 0 && (
                      <p className="text-xs font-medium" style={{ color: strengthColors[strength] }}>{strengthLabels[strength]} password</p>
                    )}
                  </div>
                )}
              </div>

              {error && (
                <div className="rounded-xl px-4 py-3" style={{ background: "rgba(229,72,77,0.08)", border: "1px solid rgba(229,72,77,0.2)" }}>
                  <p className="text-sm" style={{ color: "#c93b40" }}>{error}</p>
                </div>
              )}

              <button type="submit" disabled={loading} className="btn-primary">
                {loading ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" /></svg>
                    Creating account...
                  </>
                ) : "Create free account"}
              </button>
            </form>

            <p className="text-center text-[var(--muted)] text-xs mt-4 leading-relaxed">
              By signing up you agree to our{" "}
              <Link href="/terms" className="text-[var(--accent)] hover:opacity-80 transition">Terms</Link>
              {" "}and{" "}
              <Link href="/privacy" className="text-[var(--accent)] hover:opacity-80 transition">Privacy Policy</Link>.
            </p>

            <p className="text-center text-[var(--muted)] text-sm mt-5">
              Already have an account?{" "}
              <Link href="/login" className="text-[var(--accent)] hover:opacity-80 font-medium transition">Sign in</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
