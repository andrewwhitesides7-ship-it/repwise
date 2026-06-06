"use client";

import { useState } from "react";
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

  const benefits = [
    { icon: "⏱️", text: "First insights in under 2 minutes" },
    { icon: "📊", text: "8-10 specific insights per upload" },
    { icon: "🎯", text: "Know exactly which reps need coaching" },
    { icon: "🗺️", text: "Find your highest converting territories" },
    { icon: "💰", text: "30-day money-back guarantee" },
    { icon: "🔒", text: "Your data is encrypted and never sold" },
  ];

  return (
    <div className="min-h-screen bg-gray-950 flex">

      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 bg-gradient-to-br from-gray-900 via-gray-950 to-gray-900 border-r border-gray-800 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-20 w-72 h-72 bg-blue-600/5 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-indigo-600/5 rounded-full blur-3xl" />
        </div>

        <div className="relative">
          <Link href="/" className="text-2xl font-bold text-white">
            Try<span className="text-blue-500">RepWise</span>
          </Link>
        </div>

        <div className="relative">
          <div className="mb-8">
            <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-medium px-3 py-1.5 rounded-full mb-4">
              Free to start — no card required
            </div>
            <h2 className="text-4xl font-bold text-white leading-tight mb-4">
              Stop guessing.<br />Start knowing.
            </h2>
            <p className="text-gray-400 text-lg leading-relaxed">
              Upload your sales data and find out exactly where your team is losing deals. In under 2 minutes.
            </p>
          </div>

          <div className="space-y-3 mb-8">
            {benefits.map((b, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-lg">{b.icon}</span>
                <span className="text-gray-300 text-sm">{b.text}</span>
              </div>
            ))}
          </div>

          <div className="bg-gray-900/80 border border-gray-800 rounded-2xl p-5">
            <p className="text-gray-300 text-sm leading-relaxed italic mb-3">
              "I built this after years in field sales with no way to see what was actually working. I wish I had it back then."
            </p>
            <div>
              <p className="text-white text-sm font-semibold">Andrew Whitesides</p>
              <p className="text-gray-500 text-xs">Founder, RepWise</p>
            </div>
          </div>
        </div>

        <div className="relative grid grid-cols-3 gap-4">
          {[
            { value: "2 min", label: "Analysis time" },
            { value: "8-10", label: "Insights per upload" },
            { value: "30 day", label: "Money-back guarantee" },
          ].map(stat => (
            <div key={stat.label} className="text-center">
              <div className="text-2xl font-bold text-blue-400">{stat.value}</div>
              <div className="text-gray-500 text-xs">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <div className="lg:hidden text-center mb-8">
            <Link href="/" className="text-2xl font-bold text-white">
              Try<span className="text-blue-500">RepWise</span>
            </Link>
          </div>

          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Create your account</h1>
            <p className="text-gray-400">Free to start. No credit card required.</p>
          </div>

          <button
            onClick={handleGoogle}
            disabled={googleLoading}
            className="w-full flex items-center justify-center gap-3 bg-gray-900 hover:bg-gray-800 border border-gray-700 text-white font-semibold px-6 py-3.5 rounded-xl text-sm transition mb-6"
          >
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

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-800" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-gray-950 px-4 text-xs text-gray-600">or sign up with email</span>
            </div>
          </div>

          <form onSubmit={handleSignup} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Full name</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                placeholder="Jake Morrison"
                className="w-full bg-gray-900 border border-gray-800 text-white placeholder-gray-600 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="jake@company.com"
                className="w-full bg-gray-900 border border-gray-800 text-white placeholder-gray-600 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  className="w-full bg-gray-900 border border-gray-800 text-white placeholder-gray-600 rounded-xl px-4 py-3 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition"
                >
                  {showPassword ? (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold px-6 py-3.5 rounded-xl text-sm transition shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  Creating account...
                </>
              ) : "Create free account"}
            </button>
          </form>

          <p className="text-center text-gray-500 text-xs mt-4 leading-relaxed">
            By signing up you agree to our{" "}
            <Link href="/terms" className="text-gray-400 hover:text-white transition">Terms</Link>
            {" "}and{" "}
            <Link href="/privacy" className="text-gray-400 hover:text-white transition">Privacy Policy</Link>.
          </p>

          <p className="text-center text-gray-500 text-sm mt-6">
            Already have an account?{" "}
            <Link href="/login" className="text-blue-400 hover:text-blue-300 font-medium transition">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
