"use client";

import { useState, useRef, useCallback, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { analyzeUpload } from "@/app/actions/analyze";
import { syncCRM } from "@/app/actions/sync-crm";

type Provider = "hubspot" | "salesforce" | "pipedrive";

const crmConfig: Record<Provider, { name: string; logo: string; description: string; connectUrl: string; color: string }> = {
  hubspot: { name: "HubSpot", logo: "🟠", description: "Contacts, deals, and pipeline activity", connectUrl: "/api/auth/hubspot", color: "orange" },
  salesforce: { name: "Salesforce", logo: "☁️", description: "Opportunities, accounts, and activities", connectUrl: "/api/auth/salesforce", color: "blue" },
  pipedrive: { name: "Pipedrive", logo: "🟢", description: "Deals, contacts, and rep activity", connectUrl: "/api/auth/pipedrive", color: "green" },
};

const stages = [
  "Reading your CSV...",
  "Parsing sales records...",
  "Building activity summary...",
  "Analyzing close rates by rep...",
  "Finding time of day patterns...",
  "Identifying territory insights...",
  "Generating AI insights...",
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
    if (err) setError(`Failed to connect: ${err.replace("_", " ")}`);
  }, [searchParams]);

  async function loadConnections() {
    const supabase = createClient();
    const { data } = await supabase.from("crm_connections").select("provider");
    if (data) {
      const map: Record<string, boolean> = {};
      data.forEach(c => { map[c.provider] = true; });
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
    if (stageInterval.current) clearInterval(stageInterval.current);
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
      const result = await analyzeUpload(upload.id, fileContent);
      if (result?.error === "FREE_LIMIT_UPLOADS") throw new Error("You have used your free CSV upload. Upgrade to Essential for unlimited uploads.");
      if (result?.error === "FREE_LIMIT_INSIGHTS") throw new Error("You have used your 3 free insights. Upgrade to Essential for unlimited insights.");
    } catch (err: unknown) {
      if (err instanceof Error && err.message.includes("NEXT_REDIRECT")) return;
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setLoading(false);
      stopStageAnimation();
    }
  }

  async function handleSync(provider: Provider) {
    setSyncing(provider);
    setError("");
    try {
      await syncCRM(provider);
    } catch (err: unknown) {
      if (err instanceof Error && err.message.includes("NEXT_REDIRECT")) return;
      setError(err instanceof Error ? err.message : "Sync failed.");
      setSyncing(null);
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-1">Upload Sales Data</h1>
        <p className="text-gray-400 text-sm">Upload a CSV or connect your CRM to get AI-powered insights in minutes.</p>
      </div>

      <div className="grid md:grid-cols-5 gap-6">
        {/* Upload area */}
        <div className="md:col-span-3">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-9 h-9 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-center justify-center">
                <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <h2 className="text-white font-semibold text-sm">CSV Upload</h2>
                <p className="text-gray-500 text-xs">Export from any CRM or spreadsheet</p>
              </div>
            </div>

            {!loading ? (
              <>
                <div
                  onDragOver={e => { e.preventDefault(); setDragging(true); }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={handleDrop}
                  onClick={() => inputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all duration-200 ${
                    dragging ? "border-blue-500 bg-blue-500/5 scale-[1.01]" :
                    file ? "border-emerald-500/50 bg-emerald-500/5" :
                    "border-gray-700 hover:border-gray-600 hover:bg-gray-800/30"
                  }`}
                >
                  <input ref={inputRef} type="file" accept=".csv" onChange={e => { const f = e.target.files?.[0]; if (f?.name.endsWith(".csv")) { setFile(f); setError(""); } }} className="hidden" />
                  {file ? (
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-14 h-14 bg-emerald-500/10 rounded-2xl flex items-center justify-center">
                        <svg className="w-7 h-7 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      </div>
                      <div>
                        <p className="text-white font-semibold text-sm">{file.name}</p>
                        <p className="text-gray-500 text-xs mt-0.5">{(file.size / 1024).toFixed(1)} KB · Click to change</p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-14 h-14 bg-gray-800 rounded-2xl flex items-center justify-center border border-gray-700">
                        <svg className="w-7 h-7 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" /></svg>
                      </div>
                      <div>
                        <p className="text-white font-semibold text-sm">Drop your CSV here</p>
                        <p className="text-gray-500 text-xs mt-0.5">or click to browse files</p>
                      </div>
                      <span className="text-xs text-gray-600 bg-gray-800 border border-gray-700 px-3 py-1 rounded-full">.csv files only</span>
                    </div>
                  )}
                </div>

                {error && (
                  <div className="mt-3 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 flex items-center gap-2">
                    <svg className="w-4 h-4 text-red-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                    <p className="text-red-400 text-sm">{error}</p>
                  </div>
                )}

                {file && (
                  <button
                    onClick={handleSubmit}
                    className="mt-4 w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl px-4 py-3 text-sm transition shadow-lg shadow-blue-500/20 hover:-translate-y-0.5 duration-200 flex items-center justify-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
                    Analyze with AI
                  </button>
                )}
              </>
            ) : (
              <div className="py-12 flex flex-col items-center gap-6">
                <div className="relative w-20 h-20">
                  <div className="absolute inset-0 rounded-full border-4 border-gray-800" />
                  <div className="absolute inset-0 rounded-full border-4 border-blue-500 border-t-transparent animate-spin" />
                  <div className="absolute inset-0 flex items-center justify-center text-2xl">🧠</div>
                </div>
                <div className="text-center">
                  <p className="text-white font-semibold mb-1">{stages[stageIndex]}</p>
                  <p className="text-gray-500 text-sm">This usually takes 30-60 seconds</p>
                </div>
                <div className="flex gap-1">
                  {stages.map((_, i) => (
                    <div key={i} className={`h-1 w-6 rounded-full transition-all duration-300 ${i === stageIndex ? "bg-blue-500 w-8" : i < stageIndex ? "bg-blue-800" : "bg-gray-800"}`} />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right panel */}
        <div className="md:col-span-2 space-y-4">
          {/* CSV format guide */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
            <h3 className="text-white font-semibold text-sm mb-3">Recommended columns</h3>
            <div className="space-y-2">
              {[
                { col: "rep_name", desc: "Sales rep name", required: true },
                { col: "date", desc: "Activity date", required: true },
                { col: "knocked", desc: "Doors knocked", required: true },
                { col: "closed", desc: "Deals closed", required: true },
                { col: "deal_value", desc: "Deal amount ($)", required: false },
                { col: "zip", desc: "ZIP / territory", required: false },
                { col: "time_of_day", desc: "Time (HH:MM)", required: false },
              ].map(col => (
                <div key={col.col} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <code className="text-blue-400 text-xs bg-blue-500/10 px-1.5 py-0.5 rounded">{col.col}</code>
                    <span className="text-gray-500 text-xs">{col.desc}</span>
                  </div>
                  <span className={`text-xs px-1.5 py-0.5 rounded-full ${col.required ? "bg-red-500/10 text-red-400" : "bg-gray-800 text-gray-600"}`}>
                    {col.required ? "Required" : "Optional"}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Recent uploads */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-white font-semibold text-sm">Recent uploads</h3>
              <a href="/history" className="text-xs text-blue-400 hover:text-blue-300 transition">View all →</a>
            </div>
            <RecentUploads />
          </div>
        </div>
      </div>

      {/* CRM Integrations */}
      <div className="mt-6 bg-gray-900 border border-gray-800 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-purple-500/10 border border-purple-500/20 rounded-xl flex items-center justify-center">
              <svg className="w-4 h-4 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
            </div>
            <div>
              <h2 className="text-white font-semibold text-sm">CRM Integrations</h2>
              <p className="text-gray-500 text-xs">Connect your CRM for automatic daily syncing</p>
            </div>
          </div>
          <span className="text-xs text-yellow-400 bg-yellow-500/10 border border-yellow-500/20 px-2.5 py-1 rounded-full">Coming soon</span>
        </div>
        <div className="grid md:grid-cols-3 gap-3">
          {(Object.keys(crmConfig) as Provider[]).map(provider => {
            const crm = crmConfig[provider];
            const isConnected = connections[provider];
            const isSyncing = syncing === provider;
            return (
              <div key={provider} className={`flex items-center gap-3 p-4 rounded-xl border transition ${isConnected ? "bg-gray-800 border-green-500/20" : "bg-gray-800/50 border-gray-700/50"}`}>
                <div className="w-10 h-10 bg-gray-900 rounded-xl flex items-center justify-center text-xl border border-gray-700 flex-shrink-0">{crm.logo}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-white text-sm font-medium">{crm.name}</span>
                    {isConnected && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
                  </div>
                  <p className="text-gray-500 text-xs truncate">{crm.description}</p>
                </div>
                {isConnected ? (
                  <button onClick={() => handleSync(provider)} disabled={!!syncing} className="text-xs text-blue-400 bg-blue-500/10 border border-blue-500/20 hover:bg-blue-500/20 disabled:opacity-50 px-2.5 py-1.5 rounded-lg transition">
                    {isSyncing ? "..." : "Sync"}
                  </button>
                ) : (
                  <button onClick={() => window.location.href = crm.connectUrl} className="text-xs text-gray-400 bg-gray-800 border border-gray-700 hover:bg-gray-700 px-2.5 py-1.5 rounded-lg transition">
                    Connect
                  </button>
                )}
              </div>
            );
          })}
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
      const { data } = await supabase.from("uploads").select("id, file_name, status, created_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(3);
      if (data) setUploads(data);
    }
    load();
  }, []);

  if (!uploads.length) return <p className="text-gray-600 text-xs">No uploads yet.</p>;

  return (
    <div className="space-y-2">
      {uploads.map(u => (
        <div key={u.id} className="flex items-center gap-3">
          <div className={`w-2 h-2 rounded-full flex-shrink-0 ${u.status === "complete" ? "bg-emerald-400" : u.status === "failed" ? "bg-red-400" : "bg-yellow-400 animate-pulse"}`} />
          <div className="flex-1 min-w-0">
            <p className="text-white text-xs font-medium truncate">{u.file_name}</p>
            <p className="text-gray-600 text-xs">{new Date(u.created_at).toLocaleDateString()}</p>
          </div>
          <span className={`text-xs ${u.status === "complete" ? "text-emerald-400" : u.status === "failed" ? "text-red-400" : "text-yellow-400"}`}>{u.status}</span>
        </div>
      ))}
    </div>
  );
}

export default function UploadPage() {
  return (
    <Suspense fallback={<div className="p-8 text-gray-400 text-sm">Loading...</div>}>
      <UploadPageInner />
    </Suspense>
  );
}
