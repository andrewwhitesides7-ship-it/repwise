"use client";

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, AreaChart, Area
} from "recharts";

interface SalesRecord {
  knocked: number;
  contacted: number;
  pitched: number;
  closed: number;
  deal_value: number;
  rep_name: string | null;
  date: string | null;
  time_of_day: string | null;
  zip: string | null;
}

interface TooltipPayload {
  color: string;
  name: string;
  value: number;
}

interface TooltipProps {
  active?: boolean;
  payload?: TooltipPayload[];
  label?: string;
}

function CustomTooltip({ active, payload, label }: TooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 shadow-xl">
      <p className="text-gray-400 text-xs mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="text-sm font-semibold" style={{ color: p.color }}>
          {p.name}: {p.name === "Revenue" ? `$${Number(p.value).toLocaleString()}` : p.name === "Close Rate" ? `${p.value}%` : p.value}
        </p>
      ))}
    </div>
  );
}

export function TimeOfDayChart({ records }: { records: SalesRecord[] }) {
  const slots = [
    { name: "Morning", label: "8–12pm", min: 8, max: 12 },
    { name: "Early PM", label: "12–3pm", min: 12, max: 15 },
    { name: "Late PM", label: "3–6pm", min: 15, max: 18 },
    { name: "Evening", label: "6pm+", min: 18, max: 24 },
  ];

  const data = slots.map((slot) => {
    const slotRecords = records.filter((r) => {
      if (!r.time_of_day) return false;
      const hour = parseInt(r.time_of_day.split(":")[0]);
      return hour >= slot.min && hour < slot.max;
    });
    const knocked = slotRecords.reduce((s, r) => s + (r.knocked || 0), 0);
    const closed = slotRecords.reduce((s, r) => s + (r.closed || 0), 0);
    const rate = knocked > 0 ? parseFloat(((closed / knocked) * 100).toFixed(1)) : 0;
    return { name: slot.name, sub: slot.label, "Close Rate": rate, Closes: closed };
  });

  const max = Math.max(...data.map((d) => d["Close Rate"]));

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
      <h3 className="text-white font-semibold mb-1">Close Rate by Time of Day</h3>
      <p className="text-gray-500 text-xs mb-5">When your team closes best</p>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
          <XAxis dataKey="name" tick={{ fill: "#6b7280", fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: "#6b7280", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="Close Rate" radius={[6, 6, 0, 0]} maxBarSize={48}>
            {data.map((entry, i) => (
              <Cell key={i} fill={entry["Close Rate"] === max ? "#3b82f6" : "#1e3a5f"} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function RepPerformanceChart({ records }: { records: SalesRecord[] }) {
  const repMap: Record<string, { knocked: number; closed: number; value: number }> = {};
  records.forEach((r) => {
    const rep = r.rep_name || "Unknown";
    if (!repMap[rep]) repMap[rep] = { knocked: 0, closed: 0, value: 0 };
    repMap[rep].knocked += r.knocked || 0;
    repMap[rep].closed += r.closed || 0;
    repMap[rep].value += r.deal_value || 0;
  });

  const colors = ["#3b82f6", "#6366f1", "#8b5cf6", "#a78bfa", "#c4b5fd"];
  const data = Object.entries(repMap)
    .map(([name, stats]) => ({
      name: name.split(" ")[0],
      Closes: stats.closed,
      "Close Rate": stats.knocked > 0 ? parseFloat(((stats.closed / stats.knocked) * 100).toFixed(1)) : 0,
    }))
    .sort((a, b) => b.Closes - a.Closes);

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
      <h3 className="text-white font-semibold mb-1">Rep Performance</h3>
      <p className="text-gray-500 text-xs mb-5">Closes per rep this period</p>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} layout="vertical" margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" horizontal={false} />
          <XAxis type="number" tick={{ fill: "#6b7280", fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis type="category" dataKey="name" tick={{ fill: "#9ca3af", fontSize: 12 }} axisLine={false} tickLine={false} width={50} />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="Closes" radius={[0, 6, 6, 0]} maxBarSize={28}>
            {data.map((_, i) => <Cell key={i} fill={colors[i] || "#374151"} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function RevenueOverTimeChart({ records }: { records: SalesRecord[] }) {
  const dayMap: Record<string, number> = {};
  records.forEach((r) => {
    if (!r.date || !r.closed) return;
    const date = r.date.split("T")[0];
    dayMap[date] = (dayMap[date] || 0) + (r.deal_value || 0);
  });

  const data = Object.entries(dayMap)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, value]) => ({
      date: new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      Revenue: Math.round(value),
    }));

  if (!data.length) return null;

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
      <h3 className="text-white font-semibold mb-1">Revenue Over Time</h3>
      <p className="text-gray-500 text-xs mb-5">Daily revenue from closed deals</p>
      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
          <defs>
            <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25} />
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
          <XAxis dataKey="date" tick={{ fill: "#6b7280", fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: "#6b7280", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
          <Tooltip content={<CustomTooltip />} />
          <Area type="monotone" dataKey="Revenue" stroke="#3b82f6" strokeWidth={2} fill="url(#revGrad)" dot={{ fill: "#3b82f6", r: 3 }} activeDot={{ r: 5 }} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function SalesFunnelChart({ records }: { records: SalesRecord[] }) {
  const knocked = records.reduce((s, r) => s + (r.knocked || 0), 0);
  const contacted = records.reduce((s, r) => s + (r.contacted || 0), 0);
  const pitched = records.reduce((s, r) => s + (r.pitched || 0), 0);
  const closed = records.reduce((s, r) => s + (r.closed || 0), 0);

  const stages = [
    { name: "Knocked", value: knocked },
    { name: "Contacted", value: contacted },
    { name: "Pitched", value: pitched },
    { name: "Closed", value: closed },
  ];

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
      <h3 className="text-white font-semibold mb-1">Sales Funnel</h3>
      <p className="text-gray-500 text-xs mb-5">Drop-off at each stage</p>
      <div className="space-y-4">
        {stages.map((stage, i) => {
          const pct = knocked > 0 ? (stage.value / knocked) * 100 : 0;
          const prev = i > 0 ? stages[i - 1].value : stage.value;
          const dropoff = i > 0 && prev > 0 ? (((prev - stage.value) / prev) * 100).toFixed(0) : null;
          return (
            <div key={stage.name}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-gray-400 text-xs font-medium">{stage.name}</span>
                <div className="flex items-center gap-3">
                  {dropoff && <span className="text-red-400 text-xs font-medium">-{dropoff}%</span>}
                  <span className="text-white text-sm font-bold">{stage.value.toLocaleString()}</span>
                </div>
              </div>
              <div className="w-full bg-gray-800 rounded-full h-2">
                <div
                  className="h-2 rounded-full transition-all duration-700"
                  style={{
                    width: `${pct}%`,
                    background: `linear-gradient(90deg, #1e3a5f, #3b82f6)`,
                    opacity: 0.4 + (i * 0.2),
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function TopZipsChart({ records }: { records: SalesRecord[] }) {
  const zipMap: Record<string, { knocked: number; closed: number }> = {};
  records.forEach((r) => {
    if (!r.zip) return;
    if (!zipMap[r.zip]) zipMap[r.zip] = { knocked: 0, closed: 0 };
    zipMap[r.zip].knocked += r.knocked || 0;
    zipMap[r.zip].closed += r.closed || 0;
  });

  const data = Object.entries(zipMap)
    .map(([zip, stats]) => ({
      zip,
      rate: stats.knocked > 0 ? parseFloat(((stats.closed / stats.knocked) * 100).toFixed(1)) : 0,
      closes: stats.closed,
    }))
    .sort((a, b) => b.rate - a.rate)
    .slice(0, 6);

  if (!data.length) return null;
  const maxRate = data[0].rate;

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
      <h3 className="text-white font-semibold mb-1">Top ZIP Codes</h3>
      <p className="text-gray-500 text-xs mb-5">Best performing territories</p>
      <div className="space-y-3">
        {data.map((zip, i) => (
          <div key={zip.zip} className="flex items-center gap-3">
            <span className={`text-xs font-bold w-4 ${i === 0 ? "text-yellow-400" : "text-gray-600"}`}>{i + 1}</span>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <span className="text-white text-sm font-medium">ZIP {zip.zip}</span>
                <span className="text-blue-400 text-xs font-bold">{zip.rate}%</span>
              </div>
              <div className="w-full bg-gray-800 rounded-full h-1.5">
                <div className="h-1.5 rounded-full bg-gradient-to-r from-blue-600 to-blue-400" style={{ width: `${(zip.rate / maxRate) * 100}%` }} />
              </div>
            </div>
            <span className="text-gray-500 text-xs w-14 text-right">{zip.closes} closes</span>
          </div>
        ))}
      </div>
    </div>
  );
}

