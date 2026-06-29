"use client";

import { useState, useRef, useCallback, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { analyzeUpload } from "@/app/actions/analyze";
import { syncCRM } from "@/app/actions/sync-crm";

type Provider = "hubspot" | "salesforce" | "pipedrive";

const crmConfig: Record<Provider, { name: string; logo: string; description: string; connectUrl: string }> = {
  hubspot: { name: "HubSpot", logo: "🟠", description: "Contacts, deals, and pipeline activity", connectUrl: "/api/auth/hubspot" },
  salesforce: { name: "Salesforce", logo: "☁️", description: "Opportunities, accounts, and activities", connectUrl: "/api/auth/salesforce" },
  pipedrive: { name: "Pipedrive", logo: "🟢", description: "Deals, contacts, and activity", connectUrl: "/api/auth/pipedrive" },
};

const stages = [
  "Reading your CSV...",
  "Profiling your columns...",
  "Mapping your funnel...",
  "Pricing each stage...",
  "Hunting revenue leaks...",
  "Matching agents to fixes...",
  "Generating your report...",
  "Saving your results...",
];

function UploadPageInner() {
  const searchParams = useSearchParams();
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [stageIndex, setStageIndex] = useState(0);
  const [connections, setConnections] = useState<Record<string, boolean>>({});
  const [syncing, setSyncing] = useState<Provider | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const stageInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    loadConnections();
    const err = searchParams.get("error");
    if (err) setError("Failed to connect: " + err.replace(/_/g, " "));
    const connected = searchParams.get("connected");
    if (connected) loadConnections();
  }, [searchParams]);

  async function loadConnections() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase.from("crm_connections").select("provider").eq("user_id", user.id);
    if (data) {
      const map: Record<string, boolean> = {};
      data.forEach((c: { provider: string }) => { map[c.provider] = true; });
      setConnections(map);
    }
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped?.name.endsWith(".csv")) { setFile(dropped); setError(""); }
    else setError("Only .csv files are accepted.");
  }, []);

  function startStageAnimation() {
    let i = 0;
    stageInterval.current = setInterval(() => {
      i = (i + 1) % stages.length;
      setStageIndex(i);
    }, 3000);
  }

  function stopStageAnimation() {
    if (stageInterval.current) {
      clearInterval(stageInterval.current);
      stageInterval.current = null;
    }
  }

  async function handleSubmit() {
    if (!file) return;
    setLoading(true);
    setError("");
    setStageIndex(0);
    startStageAnimation();

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: upload, error: dbError } = await supabase
        .from("uploads")
        .insert({ user_id: user.id, file_name: file.name, file_path: null, status: "pending" })
        .select()
        .single();

      if (dbError || !upload) throw new Error(dbError?.message || "Failed to create upload record");

      const fileContent = await file.text();

      await analyzeUpload(upload.id, fileContent);

    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);

      if (msg.includes("NEXT_REDIRECT") || msg.includes("redirect")) {
        window.location.href = "/dashboard";
        return;
      }

      if (msg.includes("FREE_LIMIT") || msg.includes("limit")) {
        window.location.href = "/billing?limit=uploads";
        return;
      }

      stopStageAnimation();
      setLoading(false);

      if (msg.includes("parse") || msg.includes("AI") || msg.includes("JSON")) {
        setError("Your data was uploaded but insights could not be generated. Please check your CSV format and try again.");
      } else {
        setError(msg || "Something went wrong. Please try again.");
      }
    }
  }

  async function handleSync(provider: Provider) {
    setSyncing(provider);
    setError("");
    try {
      await syncCRM(provider);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("NEXT_REDIRECT") || msg.includes("redirect")) {
        window.location.href = "/dashboard";
        return;
      }
      setError(msg || "Sync failed.");
      setSyncing(null);
    }
  }

  return (
    <div className="md-root relative min-h-screen text-[var(--ink)] antialiased p-5 md:p-7">
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />

      <style jsx global>{`
        :root { --ink:#1d1d1f; --muted:#6e6e73; --field:#f5f5f7; --accent:#0a84ff; --accent2:#6a5cff; }
        .md-root { font-family:-apple-system,BlinkMacSystemFont,"SF Pro Display","SF Pro Text","Inter",system-ui,sans-serif; letter-spacing:-0.01em; }
        .md-mono { font-family:"JetBrains Mono",ui-monospace,SFMono-Regular,Menlo,monospace; letter-spacing:0; }
        .grad-text { background:linear-gradient(120deg,var(--accent),var(--accent2)); -webkit-background-clip:text; background-clip:text; color:transparent; }
        .glass { position:relative; background:linear-gradient(135deg,rgba(255,255,255,0.72),rgba(255,255,255,0.42)); backdrop-filter:blur(22px) saturate(180%); -webkit-backdrop-filter:blur(22px) saturate(180%); border:1px solid rgba(255,255,255,0.7); box-shadow:0 10px 40px rgba(20,24,40,0.08), inset 0 1px 0 rgba(255,255,255,0.9); }
        .btn-primary { display:inline-flex; align-items:center; justify-content:center; gap:.5rem; font-size:.875rem; font-weight:600; color:#fff; padding:.8rem 1.1rem; border-radius:14px; width:100%; background:linear-gradient(120deg,var(--accent),var(--accent2)); box-shadow:0 8px 24px rgba(10,132,255,.32), inset 0 1px 0 rgba(255,255,255,.4); transition:transform .2s ease, filter .2s ease; }
        .btn-primary:hover { transform:translateY(-1px); filter:brightness(1.05); }
        @keyframes mdrift { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(28px,-36px) scale(1.07)} }
        @media (prefers-reduced-motion: no-preference){ .md-blob{animation:mdrift 22s ease-in-out infinite} }
        *:focus-visible { outline:2px solid var(--accent); outline-offset:3px; border-radius:6px; }
      `}</style>

      <div aria-hidden className="fixed inset-0 z-0 overflow-hidden" style={{ background: "var(--field)" }}>
        <div className="md-blob absolute -top-32 -left-24 w-[560px] h-[560px] rounded-full" style={{ background: "#bcd4ff", opacity: 0.4, filter: "blur(130px)" }} />
        <div className="md-blob absolute top-40 -right-32 w-[520px] h-[520px] rounded-full" style={{ background: "#e2d4ff", opacity: 0.38, filter: "blur(130px)", animationDelay: "-7s" }} />
        <div className="md-blob absolute bottom-0 left-1/3 w-[480px] h-[480px] rounded-full" style={{ background: "#cdeede", opacity: 0.32, filter: "blur(140px)", animationDelay: "-13s" }} />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto">

        {/* Header */}
        <div className="mb-7">
          <h1 className="text-2xl md:text-[28px] font-semibold tracking-tight mb-1">Upload your business data</h1>
          <p className="text-[var(--muted)] text-sm">Drop a CSV or connect your CRM and Adunda will find where revenue is leaking.</p>
        </div>

        <div className="grid md:grid-cols-5 gap-5">

          {/* Upload area */}
          <div className="md:col-span-3">
            <div className="glass rounded-[24px] p-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-9 h-9 rounded-xl grid place-items-center" style={{ background: "rgba(10,132,255,0.1)", border: "1px solid rgba(10,132,255,0.2)" }}>
                  <svg className="w-4 h-4" style={{ color: "var(--accent)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <h2 className="font-semibold text-sm tracking-tight">CSV upload</h2>
                  <p className="text-[var(--muted)] text-xs">Export from any CRM, field tool, or spreadsheet</p>
                </div>
              </div>

              {!loading ? (
                <>
                  <div
                    onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                    onDragLeave={() => setDragging(false)}
                    onDrop={handleDrop}
                    onClick={() => inputRef.current?.click()}
                    className="rounded-2xl p-10 text-center cursor-pointer transition-all duration-200"
                    style={
                      dragging ? { border: "2px dashed var(--accent)", background: "rgba(10,132,255,0.05)" }
                      : file ? { border: "2px dashed rgba(26,162,81,0.5)", background: "rgba(26,162,81,0.05)" }
                      : { border: "2px dashed rgba(0,0,0,0.12)", background: "rgba(255,255,255,0.3)" }
                    }
                  >
                    <input ref={inputRef} type="file" accept=".csv" onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f?.name.endsWith(".csv")) { setFile(f); setError(""); }
                      else setError("Only .csv files are accepted.");
                    }} className="hidden" />
                    {file ? (
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-14 h-14 rounded-2xl grid place-items-center" style={{ background: "rgba(26,162,81,0.1)", border: "1px solid rgba(26,162,81,0.2)" }}>
                          <svg className="w-7 h-7" style={{ color: "#1aa251" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        </div>
                        <div>
                          <p className="font-semibold text-sm">{file.name}</p>
                          <p className="text-[var(--muted)] text-xs mt-0.5">{(file.size / 1024).toFixed(1)} KB · Click to change</p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-14 h-14 rounded-2xl grid place-items-center" style={{ background: "rgba(255,255,255,0.6)", border: "1px solid rgba(0,0,0,0.06)" }}>
                          <svg className="w-7 h-7 text-[var(--muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" /></svg>
                        </div>
                        <div>
                          <p className="font-semibold text-sm">Drop your CSV here</p>
                          <p className="text-[var(--muted)] text-xs mt-0.5">or click to browse files</p>
                        </div>
                        <span className="text-xs text-[var(--muted)] px-3 py-1 rounded-full" style={{ background: "rgba(255,255,255,0.6)", border: "1px solid rgba(0,0,0,0.06)" }}>.csv files only</span>
                      </div>
                    )}
                  </div>

                  {error && (
                    <div className="mt-3 rounded-xl px-4 py-3 flex items-center gap-2" style={{ background: "rgba(229,72,77,0.08)", border: "1px solid rgba(229,72,77,0.2)" }}>
                      <svg className="w-4 h-4 flex-shrink-0" style={{ color: "#e5484d" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                      <p className="text-sm" style={{ color: "#c93b40" }}>{error}</p>
                    </div>
                  )}

                  {file && (
                    <button onClick={handleSubmit} className="btn-primary mt-4">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
                      Find my revenue leaks
                    </button>
                  )}
                </>
              ) : (
                <div className="py-12 flex flex-col items-center gap-6">
                  <div className="relative w-20 h-20">
                    <div className="absolute inset-0 rounded-full" style={{ border: "4px solid rgba(0,0,0,0.06)" }} />
                    <div className="absolute inset-0 rounded-full animate-spin" style={{ border: "4px solid var(--accent)", borderTopColor: "transparent" }} />
                  </div>
                  <div className="text-center">
                    <p className="font-semibold mb-1">{stages[stageIndex]}</p>
                    <p className="text-[var(--muted)] text-sm">This usually takes 30-60 seconds</p>
                  </div>
                  <div className="flex gap-1">
                    {stages.map((_, i) => (
                      <div key={i} className="h-1 rounded-full transition-all duration-300" style={{
                        width: i === stageIndex ? 32 : 24,
                        background: i === stageIndex ? "var(--accent)" : i < stageIndex ? "rgba(10,132,255,0.4)" : "rgba(0,0,0,0.1)",
                      }} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right panel */}
          <div className="md:col-span-2 space-y-4">
            <div className="glass rounded-[24px] p-5">
              <h3 className="font-semibold text-sm tracking-tight mb-1">Columns that unlock the most</h3>
              <p className="text-[var(--muted)] text-xs mb-3">Adunda reads any export — these three light up the funnel.</p>
              <div className="space-y-2">
                {[
                  { col: "status", desc: "Stage (new, quoted, won)", required: true },
                  { col: "date", desc: "Any date column", required: true },
                  { col: "amount", desc: "Job / quote / invoice $", required: true },
                  { col: "service", desc: "Service or job type", required: false },
                  { col: "customer", desc: "Customer name", required: false },
                  { col: "follow_up", desc: "Follow-up date", required: false },
                ].map((col) => (
                  <div key={col.col} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <code className="md-mono text-xs px-1.5 py-0.5 rounded" style={{ color: "var(--accent)", background: "rgba(10,132,255,0.08)", border: "1px solid rgba(10,132,255,0.15)" }}>{col.col}</code>
                      <span className="text-[var(--muted)] text-xs">{col.desc}</span>
                    </div>
                    <span className="text-xs px-1.5 py-0.5 rounded-full" style={col.required ? { color: "#c93b40", background: "rgba(229,72,77,0.08)", border: "1px solid rgba(229,72,77,0.15)" } : { color: "var(--muted)", background: "rgba(0,0,0,0.04)" }}>
                      {col.required ? "Best" : "Bonus"}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="glass rounded-[24px] p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-sm tracking-tight">Recent uploads</h3>
                <a href="/history" className="text-xs font-medium text-[var(--accent)] hover:opacity-80 transition">View all →</a>
              </div>
              <RecentUploads />
            </div>
          </div>
        </div>

        {/* CRM Integrations */}
        <div className="mt-5 glass rounded-[24px] p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 rounded-xl grid place-items-center" style={{ background: "rgba(106,92,255,0.1)", border: "1px solid rgba(106,92,255,0.2)" }}>
              <svg className="w-4 h-4" style={{ color: "var(--accent2)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
            </div>
            <div>
              <h2 className="font-semibold text-sm tracking-tight">CRM integrations</h2>
              <p className="text-[var(--muted)] text-xs">Connect your CRM for automatic daily syncing</p>
            </div>
          </div>
          <div className="grid md:grid-cols-3 gap-3">
            {(Object.keys(crmConfig) as Provider[]).map((provider) => {
              const crm = crmConfig[provider];
              const isConnected = connections[provider];
              const isSyncing = syncing === provider;
              return (
                <div key={provider} className="flex items-center gap-3 p-4 rounded-xl" style={{ background: "rgba(255,255,255,0.5)", border: isConnected ? "1px solid rgba(26,162,81,0.3)" : "1px solid rgba(0,0,0,0.06)" }}>
                  <div className="w-10 h-10 rounded-xl grid place-items-center text-xl flex-shrink-0" style={{ background: "rgba(255,255,255,0.7)", border: "1px solid rgba(0,0,0,0.06)" }}>{crm.logo}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold">{crm.name}</span>
                      {isConnected && <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#1aa251" }} />}
                    </div>
                    <p className="text-[var(--muted)] text-xs truncate">{crm.description}</p>
                  </div>
                  {isConnected ? (
                    <button onClick={() => handleSync(provider)} disabled={!!syncing} className="text-xs font-semibold px-2.5 py-1.5 rounded-lg transition disabled:opacity-50" style={{ color: "var(--accent)", background: "rgba(10,132,255,0.1)", border: "1px solid rgba(10,132,255,0.2)" }}>
                      {isSyncing ? "..." : "Sync"}
                    </button>
                  ) : (
                    <button onClick={() => { window.location.href = crm.connectUrl; }} className="text-xs font-semibold px-2.5 py-1.5 rounded-lg transition" style={{ color: "var(--ink)", background: "rgba(255,255,255,0.7)", border: "1px solid rgba(0,0,0,0.08)" }}>
                      Connect
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function RecentUploads() {
  const [uploads, setUploads] = useState<{ id: string; file_name: string; status: string; created_at: string }[]>([]);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("uploads")
        .select("id, file_name, status, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(3);
      if (data) setUploads(data);
    }
    load();
  }, []);

  if (!uploads.length) return <p className="text-[var(--muted)] text-xs">No uploads yet.</p>;

  return (
    <div className="space-y-2">
      {uploads.map((u) => (
        <div key={u.id} className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: u.status === "complete" ? "#1aa251" : u.status === "failed" ? "#e5484d" : "#e0922f" }} />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium truncate">{u.file_name}</p>
            <p className="text-[var(--muted)] text-xs">{new Date(u.created_at).toLocaleDateString()}</p>
          </div>
          <span className="text-xs font-medium" style={{ color: u.status === "complete" ? "#1aa251" : u.status === "failed" ? "#e5484d" : "#e0922f" }}>{u.status}</span>
        </div>
      ))}
    </div>
  );
}

export default function UploadPage() {
  return (
    <Suspense fallback={<div className="p-8 text-[var(--muted)] text-sm">Loading...</div>}>
      <UploadPageInner />
    </Suspense>
  );
}
