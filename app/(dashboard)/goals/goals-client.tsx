"use client";

import { useState } from "react";
import {
  createCustomGoal,
  updateGoalProgress,
  dismissGoal,
  toggleChecklistItem,
  generateAIGoals,
} from "@/app/actions/goals";

interface ChecklistItem {
  id: string;
  title: string;
  completed: boolean;
}

interface Goal {
  id: string;
  title: string;
  description: string | null;
  target_value: number;
  current_value: number;
  unit: string;
  status: string;
  is_ai_generated: boolean;
  ai_reasoning: string | null;
  goal_checklist_items: ChecklistItem[];
  created_at: string;
}

interface GoalsClientProps {
  goals: Goal[];
  hasData: boolean;
}

const TIMELINE_STEPS = ["Not started", "In progress", "Halfway", "Almost done", "Complete"];

function getStep(current: number, target: number): number {
  if (current === 0) return 0;
  const pct = current / target;
  if (pct >= 1) return 4;
  if (pct >= 0.75) return 3;
  if (pct >= 0.5) return 2;
  return 1;
}

function getWeeks(current: number, target: number): number {
  if (current >= target) return 0;
  return Math.ceil((1 - Math.min(current / target, 1)) * 8);
}

function TimelineBar({ current, target }: { current: number; target: number }) {
  const step = getStep(current, target);
  const pct = Math.min((current / target) * 100, 100);
  return (
    <div className="mt-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-gray-600 text-xs">Progress timeline</span>
        <span className="text-white text-xs font-bold">{pct.toFixed(0)}%</span>
      </div>
      <div className="h-1.5 bg-white/6 rounded-full overflow-hidden mb-3">
        <div
          className="h-full bg-gradient-to-r from-blue-600 to-blue-400 rounded-full transition-all duration-1000"
          style={{ width: pct + "%" }}
        />
      </div>
      <div className="flex justify-between">
        {TIMELINE_STEPS.map((label, i) => {
          const stepPct = (i / (TIMELINE_STEPS.length - 1)) * 100;
          const isActive = pct >= stepPct;
          const isCurrent = step === i;
          return (
            <div key={label} className="flex flex-col items-center gap-1.5">
              <div className={"w-2 h-2 rounded-full border transition-all duration-300 " + (isActive ? "bg-blue-400 border-blue-400" : "bg-transparent border-white/20")} />
              <span className={"text-[9px] font-semibold " + (isCurrent ? "text-blue-400" : isActive ? "text-gray-500" : "text-gray-700")}>
                {label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function GoalCard({ goal, onUpdate }: { goal: Goal; onUpdate: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [newValue, setNewValue] = useState(String(goal.current_value));
  const [loading, setLoading] = useState(false);

  const pct = Math.min((goal.current_value / goal.target_value) * 100, 100);
  const weeks = getWeeks(goal.current_value, goal.target_value);
  const isComplete = goal.status === "completed" || pct >= 100;
  const completedItems = goal.goal_checklist_items?.filter(i => i.completed).length || 0;
  const totalItems = goal.goal_checklist_items?.length || 0;
  const circumference = 2 * Math.PI * 20;
  const offset = circumference - (pct / 100) * circumference;

  async function handleUpdate() {
    setLoading(true);
    await updateGoalProgress(goal.id, Number(newValue));
    setEditing(false);
    setLoading(false);
    onUpdate();
  }

  async function handleToggle(itemId: string, completed: boolean) {
    await toggleChecklistItem(itemId, !completed);
    onUpdate();
  }

  async function handleDismiss() {
    await dismissGoal(goal.id);
    onUpdate();
  }

  return (
    <div className={"bg-[#0d0d18] border rounded-2xl overflow-hidden transition-all duration-300 " + (isComplete ? "border-emerald-500/25" : "border-white/6 hover:border-white/12")}>
      <div className="p-5 cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-start gap-4">
          <div className="relative w-12 h-12 flex-shrink-0">
            <svg className="w-12 h-12 -rotate-90" viewBox="0 0 44 44">
              <circle cx="22" cy="22" r="20" fill="none" stroke="#ffffff06" strokeWidth="3" />
              <circle
                cx="22" cy="22" r="20" fill="none"
                stroke={isComplete ? "#10b981" : "#3b82f6"}
                strokeWidth="3"
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                strokeLinecap="round"
                className="transition-all duration-1000"
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-white text-[10px] font-black">
              {pct.toFixed(0)}%
            </span>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-white font-black text-sm leading-tight">{goal.title}</h3>
                {goal.is_ai_generated && (
                  <span className="text-[10px] text-blue-400 bg-blue-500/10 border border-blue-500/15 px-1.5 py-0.5 rounded-full font-bold">AI</span>
                )}
                {isComplete && (
                  <span className="text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/15 px-1.5 py-0.5 rounded-full font-bold">DONE</span>
                )}
              </div>
              <svg
                className={"w-4 h-4 text-gray-600 flex-shrink-0 transition-transform duration-200 " + (expanded ? "rotate-180" : "")}
                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </div>

            <div className="flex items-center gap-3 text-xs text-gray-600 flex-wrap">
              <span className="font-semibold text-gray-400">{goal.current_value} / {goal.target_value} {goal.unit}</span>
              {!isComplete && weeks > 0 && (
                <span>~{weeks} weeks left</span>
              )}
              {totalItems > 0 && (
                <span>{completedItems}/{totalItems} steps done</span>
              )}
            </div>

            <TimelineBar current={goal.current_value} target={goal.target_value} />
          </div>
        </div>
      </div>

      {expanded && (
        <div className="px-5 pb-5 border-t border-white/5 pt-4 space-y-4">
          {(goal.ai_reasoning || goal.description) && (
            <div className="bg-blue-500/5 border border-blue-500/10 rounded-xl p-3">
              <p className="text-blue-400 text-xs font-bold mb-1">WHY THIS GOAL</p>
              <p className="text-gray-400 text-xs leading-relaxed">{goal.ai_reasoning || goal.description}</p>
            </div>
          )}

          {goal.goal_checklist_items?.length > 0 && (
            <div>
              <p className="text-white text-xs font-black uppercase tracking-wider mb-2">Action Steps</p>
              <div className="space-y-2">
                {goal.goal_checklist_items.map((item, i) => (
                  <div
                    key={item.id}
                    onClick={() => handleToggle(item.id, item.completed)}
                    className={"flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all duration-200 " + (item.completed ? "bg-emerald-500/5 border-emerald-500/10 opacity-60" : "bg-white/2 border-white/6 hover:border-white/12")}
                  >
                    <div className={"w-5 h-5 rounded-lg border-2 flex items-center justify-center flex-shrink-0 mt-0.5 " + (item.completed ? "bg-emerald-500 border-emerald-500" : "border-white/20")}>
                      {item.completed && (
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    <p className={"text-sm font-semibold " + (item.completed ? "line-through text-gray-600" : "text-white")}>
                      Step {i + 1}: {item.title}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center gap-2 flex-wrap">
            {editing ? (
              <>
                <input
                  type="number"
                  value={newValue}
                  onChange={e => setNewValue(e.target.value)}
                  className="flex-1 min-w-0 bg-white/5 border border-white/10 text-white text-sm rounded-xl px-3 py-2 focus:outline-none focus:border-blue-500/50"
                  placeholder={"Current " + goal.unit}
                />
                <button onClick={handleUpdate} disabled={loading} className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-4 py-2 rounded-xl text-xs transition-all duration-200">
                  {loading ? "..." : "Save"}
                </button>
                <button onClick={() => setEditing(false)} className="bg-white/5 hover:bg-white/10 text-gray-400 font-bold px-4 py-2 rounded-xl text-xs transition-all duration-200">
                  Cancel
                </button>
              </>
            ) : (
              <>
                <button onClick={() => setEditing(true)} className="flex items-center gap-2 bg-white/4 hover:bg-white/8 border border-white/8 text-gray-400 hover:text-white font-bold px-4 py-2 rounded-xl text-xs transition-all duration-200">
                  Update progress
                </button>
                <button onClick={handleDismiss} className="flex items-center gap-2 bg-white/4 hover:bg-red-500/10 border border-white/8 hover:border-red-500/20 text-gray-600 hover:text-red-400 font-bold px-4 py-2 rounded-xl text-xs transition-all duration-200">
                  Dismiss
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function CreateGoalModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [target, setTarget] = useState("");
  const [unit, setUnit] = useState("closes");
  const [loading, setLoading] = useState(false);

  const presets = [
    { title: "Increase close rate to 30%", target: "30", unit: "%" },
    { title: "Close 50 deals this month", target: "50", unit: "closes" },
    { title: "Generate $100K revenue", target: "100000", unit: "dollars" },
    { title: "Knock 500 doors this week", target: "500", unit: "knocks" },
    { title: "Follow up on 20 warm leads", target: "20", unit: "follow-ups" },
    { title: "Onboard 5 new reps", target: "5", unit: "reps" },
  ];

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!title || !target) return;
    setLoading(true);
    const fd = new FormData();
    fd.append("title", title);
    fd.append("description", description);
    fd.append("target_value", target);
    fd.append("current_value", "0");
    fd.append("unit", unit);
    await createCustomGoal(fd);
    setLoading(false);
    onCreated();
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[#0d0d18] border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-white font-black text-lg">Create a goal</h2>
          <button onClick={onClose} className="text-gray-600 hover:text-white transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="mb-5">
          <p className="text-gray-600 text-xs font-semibold uppercase tracking-wider mb-2">Quick presets</p>
          <div className="grid grid-cols-2 gap-2">
            {presets.map(p => (
              <button
                key={p.title}
                type="button"
                onClick={() => { setTitle(p.title); setTarget(p.target); setUnit(p.unit); }}
                className="text-left bg-white/4 hover:bg-blue-500/10 border border-white/6 hover:border-blue-500/20 rounded-xl px-3 py-2 transition-all duration-200"
              >
                <p className="text-white text-xs font-semibold leading-tight">{p.title}</p>
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleCreate} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">Goal title</label>
            <input
              type="text"
              required
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Close 50 deals this month"
              className="w-full bg-white/4 border border-white/8 text-white placeholder-gray-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500/50 transition-all"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">Target</label>
              <input
                type="number"
                required
                value={target}
                onChange={e => setTarget(e.target.value)}
                placeholder="50"
                className="w-full bg-white/4 border border-white/8 text-white placeholder-gray-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500/50 transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">Unit</label>
              <select
                value={unit}
                onChange={e => setUnit(e.target.value)}
                className="w-full bg-white/4 border border-white/8 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500/50 transition-all"
              >
                {["closes", "knocks", "dollars", "%", "follow-ups", "reps", "days"].map(u => (
                  <option key={u} value={u} className="bg-gray-900">{u}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">Notes (optional)</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Why this goal matters..."
              rows={2}
              className="w-full bg-white/4 border border-white/8 text-white placeholder-gray-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500/50 transition-all resize-none"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-black px-4 py-3 rounded-xl text-sm transition-all duration-200 shadow-lg shadow-blue-600/25 hover:-translate-y-0.5"
          >
            {loading ? "Creating..." : "Create goal"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function GoalsClient({ goals: initialGoals, hasData }: GoalsClientProps) {
  const [showCreate, setShowCreate] = useState(false);
  const [filter, setFilter] = useState<"active" | "completed" | "all">("active");
  const [generatingAI, setGeneratingAI] = useState(false);

  function refresh() {
    window.location.reload();
  }

  async function handleGenerateAI() {
    setGeneratingAI(true);
    try {
      await generateAIGoals();
      refresh();
    } catch (err) {
      console.error(err);
      setGeneratingAI(false);
    }
  }

  const active = initialGoals.filter(g => g.status === "active" && (g.current_value / g.target_value) < 1);
  const completed = initialGoals.filter(g => g.status === "completed" || (g.current_value / g.target_value) >= 1);
  const filtered = filter === "all" ? initialGoals : filter === "active" ? active : completed;

  const totalProgress = active.length > 0
    ? active.reduce((s, g) => s + Math.min(g.current_value / g.target_value, 1), 0) / active.length * 100
    : 0;

  return (
    <div className="min-h-screen bg-[#080810] p-5 md:p-7">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-blue-600/4 rounded-full blur-[100px]" />
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-indigo-600/3 rounded-full blur-[80px]" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto">

        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-white mb-1">Goals</h1>
            <p className="text-gray-600 text-sm">
              {active.length} active · {completed.length} completed · {totalProgress.toFixed(0)}% overall progress
            </p>
          </div>
          <div className="flex items-center gap-2">
            {hasData && (
              <button
                onClick={handleGenerateAI}
                disabled={generatingAI}
                className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/8 text-gray-400 hover:text-white font-bold px-4 py-2.5 rounded-xl text-sm transition-all duration-200"
              >
                {generatingAI ? (
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                ) : (
                  <span>✨</span>
                )}
                {generatingAI ? "Generating..." : "AI goals"}
              </button>
            )}
            <button
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold px-4 py-2.5 rounded-xl text-sm transition-all duration-200 shadow-lg shadow-blue-600/25 hover:-translate-y-0.5"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              New goal
            </button>
          </div>
        </div>

        {active.length > 0 && (
          <div className="bg-[#0d0d18] border border-white/6 rounded-2xl p-5 mb-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-white font-black text-sm">Overall progress</h3>
              <span className="text-blue-400 font-black text-sm">{totalProgress.toFixed(0)}%</span>
            </div>
            <div className="w-full bg-white/5 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-blue-600 to-blue-400 h-2 rounded-full transition-all duration-1000"
                style={{ width: totalProgress + "%" }}
              />
            </div>
            <div className="flex items-center justify-between mt-3 text-xs text-gray-600">
              <span>{active.length} in progress</span>
              <span>{completed.length} completed</span>
            </div>
          </div>
        )}

        {!hasData && initialGoals.length === 0 && (
          <div className="bg-[#0d0d18] border border-white/6 border-dashed rounded-2xl p-12 text-center mb-6">
            <div className="text-4xl mb-3">🎯</div>
            <h3 className="text-white font-bold mb-2">Upload data to get AI-generated goals</h3>
            <p className="text-gray-600 text-sm mb-4">
              RepWise will analyze your team and create specific actionable goals with step-by-step plans.
            </p>
            <a
              href="/upload"
              className="inline-block bg-blue-600 hover:bg-blue-500 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition"
            >
              Upload data
            </a>
          </div>
        )}

        {initialGoals.length > 0 && (
          <div className="flex items-center gap-1 bg-[#0d0d18] border border-white/6 rounded-xl p-1 mb-5 w-fit">
            {[
              { id: "active" as const, label: "Active " + active.length },
              { id: "completed" as const, label: "Completed " + completed.length },
              { id: "all" as const, label: "All " + initialGoals.length },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setFilter(tab.id)}
                className={"px-4 py-2 rounded-lg text-sm font-bold transition-all duration-200 " + (filter === tab.id ? "bg-white/8 text-white" : "text-gray-600 hover:text-gray-300")}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}

        {filtered.length === 0 ? (
          <div className="bg-[#0d0d18] border border-white/6 border-dashed rounded-2xl p-12 text-center">
            <div className="text-4xl mb-3">{filter === "completed" ? "🏆" : "🎯"}</div>
            <h3 className="text-white font-bold mb-2">
              {filter === "completed" ? "No completed goals yet" : "No active goals"}
            </h3>
            <p className="text-gray-600 text-sm mb-4">
              {filter === "completed" ? "Keep working — completed goals show here." : "Create a goal or generate AI goals from your data."}
            </p>
            <button
              onClick={() => setShowCreate(true)}
              className="inline-block bg-blue-600 hover:bg-blue-500 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition"
            >
              Create a goal
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(goal => (
              <GoalCard key={goal.id} goal={goal} onUpdate={refresh} />
            ))}
          </div>
        )}
      </div>

      {showCreate && (
        <CreateGoalModal
          onClose={() => setShowCreate(false)}
          onCreated={refresh}
        />
      )}
    </div>
  );
}


