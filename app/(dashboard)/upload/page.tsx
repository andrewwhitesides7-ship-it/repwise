"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { analyzeUpload } from "@/app/actions/analyze";
import { syncCRM } from "@/app/actions/sync-crm";

type Provider = "hubspot" | "salesforce" | "pipedrive";

const crmConfig = {
  hubspot: {
    name: "HubSpot",
    logo: "🟠",
    description: "Contacts, deals, and pipeline activity",
    connectUrl: "/api/auth/hubspot",
    color: "orange",
  },
  salesforce: {
    name: "Salesforce",
    logo: "☁️",
    description: "Opportunities, accounts, and activities",
    connectUrl: "/api/auth/salesforce",
    color: "blue",
  },
  pipedrive: {
    name: "Pipedrive",
    logo: "🟢",
    description: "Deals, contacts, and rep activity",
    connectUrl: "/api/auth/pipedrive",
    color: "green",
  },
};

export default function UploadPage() {
  const searchParams = useSearchParams();
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [stage, setStage] = useState("");
  const [connections, setConnections] = useState<Record<string, boolean>>({});
  const [syncing, setSyncing] = useState<Provider | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadConnections();
    const connected = searchParams.get("connected");
    if (connected) {
      loadConnections();
    }
    const err = searchParams.get("error");
    if (err) setError(`Failed to connect: ${err.replace("_", " ")}`);
  }, [searchParams]);

  async function loadConnections() {
    const supabase = createClient();
    const { data } = await supabase
      .from("crm_connections")
      .select("provider");
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
    if (dropped && dropped.name.endsWith(".csv")) {
      setFile(dropped);
      setError("");
    } else {
      setError("Only .csv files are accepted.");
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected && selected.name.endsWith(".csv")) {
      setFile(selected);
      setError("");
    } else {
      setError("Only .csv files are accepted.");
    }
  };

  async function handleSubmit() {
    if (!file) return;
    setLoading(true);
    setError("");
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      setStage("Saving upload record...");
      const { data: upload, error: dbError } = await supabase
        .from("uploads")
        .insert({ user_id: user.id, file_name: file.name, file_path: null, status: "pending" })
        .select()
        .single();

      if (dbError || !upload) throw new Error(dbError?.message || "Failed to create upload record");

      setStage("Reading CSV data...");
      const fileContent = await file.text();

      setStage("AI is analyzing your sales data...");
      await analyzeUpload(upload.id, fileContent);
    } catch (err: unknown) {
      if (err instanceof Error && err.message.includes("NEXT_REDIRECT")) return;
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setLoading(false);
      setStage("");
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
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-1">Upload Sales Data</h1>
        <p className="text-gray-400 text-sm">Upload a CSV or connect your CRM to get AI-powered insights.</p>
      </div>

      {/* CSV Upload */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 mb-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-8 h-8 bg-blue-500/10 rounded-lg flex items-center justify-center text-sm">📄</div>
          <div>
            <h2 className="text-white font-semibold">Upload CSV</h2>
            <p className="text-gray-500 text-xs">Export from any CRM or spreadsheet and upload here</p>
          </div>
        </div>

        {!loading ? (
          <>
            <div
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              onClick={() => inputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all duration-200 ${
                dragging ? "border-blue-500 bg-blue-500/5" :
                file ? "border-green-500/50 bg-green-500/5" :
                "border-gray-700 hover:border-gray-600 hover:bg-gray-800/30"
              }`}
            >
              <input ref={inputRef} type="file" accept=".csv" onChange={handleFileChange} className="hidden" />
              {file ? (
                <div className="flex flex-col items-center gap-3">
                  <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-white font-medium text-sm">{file.name}</p>
                    <p className="text-gray-500 text-xs mt-0.5">{(file.size / 1024).toFixed(1)} KB · Click to change</p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3">
                  <div className="w-12 h-12 bg-gray-800 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-white font-medium text-sm">Drop your CSV here</p>
                    <p className="text-gray-500 text-xs mt-0.5">or click to browse files</p>
                  </div>
                  <span className="text-xs text-gray-600 bg-gray-800 px-3 py-1 rounded-full">.csv files only</span>
                </div>
              )}
            </div>

            {error && (
              <div className="mt-3 bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            {file && (
              <button
                onClick={handleSubmit}
                className="mt-4 w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl px-4 py-3 text-sm transition flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Analyze with AI
              </button>
            )}
          </>
        ) : (
          <div className="py-12 flex flex-col items-center gap-5">
            <div className="relative">
              <div className="w-16 h-16 rounded-full border-4 border-gray-800" />
              <div className="w-16 h-16 rounded-full border-4 border-blue-500 border-t-transparent animate-spin absolute inset-0" />
            </div>
            <div className="text-center">
              <p className="text-white font-semibold mb-1">{stage || "Processing..."}</p>
              <p className="text-gray-500 text-sm">This usually takes 30–60 seconds</p>
            </div>
          </div>
        )}
      </div>

      {/* CRM Connections */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-8 h-8 bg-purple-500/10 rounded-lg flex items-center justify-center text-sm">🔌</div>
          <div>
            <h2 className="text-white font-semibold">CRM Integrations</h2>
            <p className="text-gray-500 text-xs">Connect your CRM for one-click data syncing and AI analysis</p>
          </div>
        </div>

        <div className="space-y-3">
          {(Object.keys(crmConfig) as Provider[]).map((provider) => {
            const crm = crmConfig[provider];
            const isConnected = connections[provider];
            const isSyncing = syncing === provider;

            return (
              <div key={provider} className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
                isConnected ? "bg-gray-800/80 border-green-500/20" : "bg-gray-800/50 border-gray-700/50"
              }`}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-800 rounded-xl flex items-center justify-center text-xl border border-gray-700">
                    {crm.logo}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-white text-sm font-medium">{crm.name}</span>
                      {isConnected && (
                        <span className="flex items-center gap-1 text-xs text-green-400 bg-green-500/10 border border-green-500/20 px-2 py-0.5 rounded-full">
                          <span className="w-1.5 h-1.5 bg-green-400 rounded-full" />
                          Connected
                        </span>
                      )}
                    </div>
                    <div className="text-gray-500 text-xs">{crm.description}</div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {isConnected ? (
                    <>
                      <button
                        onClick={() => handleSync(provider)}
                        disabled={!!syncing}
                        className="flex items-center gap-1.5 text-xs text-blue-400 bg-blue-500/10 border border-blue-500/20 hover:bg-blue-500/20 disabled:opacity-50 px-3 py-1.5 rounded-lg transition font-medium"
                      >
                        {isSyncing ? (
                          <>
                            <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24" fill="none">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                            </svg>
                            Syncing...
                          </>
                        ) : (
                          <>
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            Sync Now
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => window.location.href = crm.connectUrl}
                        className="text-xs text-gray-500 hover:text-gray-300 px-3 py-1.5 rounded-lg transition"
                      >
                        Reconnect
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => window.location.href = crm.connectUrl}
                      className="text-xs text-white bg-gray-700 hover:bg-gray-600 border border-gray-600 px-3 py-1.5 rounded-lg transition font-medium"
                    >
                      Connect
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-4 p-4 bg-blue-500/5 border border-blue-500/10 rounded-xl">
          <div className="flex items-start gap-3">
            <svg className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-blue-300 text-xs leading-relaxed">
              Connect your CRM and click Sync Now to pull your latest data and generate fresh AI insights. Your tokens are encrypted and stored securely.
            </p>
          </div>
        </div>
      </div>

      <p className="text-center text-gray-600 text-xs mt-6">
        Your data is encrypted and never shared. Each sync generates a fresh set of AI insights.
      </p>
    </div>
  );
}
