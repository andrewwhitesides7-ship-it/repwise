"use client";

import { useState } from "react";
import {
  generateAIGoals,
  createCustomGoal,
  updateGoalProgress,
  completeGoal,
  dismissGoal,
  toggleChecklistItem,
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
  target_value: number | null;
  current_value: number;
  unit: string | null;
  status: "active" | "completed" | "dismissed";
  is_ai_generated: boolean;
  ai_reasoning: string | null;
  created_at: string;
  goal_checklist_items: ChecklistItem[];
}

export default function GoalsClient({ goals, hasData }: { goals: Goal[]; hasData: boolean }) {
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState("");
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [expandedGoal, setExpandedGoal] = useState<string | null>(null);
  const [updatingProgress, setUpdatingProgress] = useState<string | null>(null);
  const [progressValues, setProgressValues] = useState<Record<string, string>>({});

  const activeGoals = goals.filter(g => g.status === "active");
  const completedGoals = goals.filter(g => g.status === "completed");
  const aiGoals = activeGoals.filter(g => g.is_ai_generated);
  const customGoals = activeGoals.filter(g => !g.is_ai_generated);

  async function handleGenerateGoals() {
    setGenerating(true);
    setGenError("");
    try {
      await generateAIGoals();
    } catch (err) {
      setGenError(err instanceof Error ? err.message : "Failed to generate goals");
    } finally {
      setGenerating(false);
    }
  }

  async function handleCreateCustom(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setCreating(true);
    try {
      await createCustomGoal(new FormData(e.currentTarget));
      setShowCustomForm(false);
      (e.target as HTMLFormElement).reset();
    } catch {
      // ignore
    } finally {
      setCreating(false);
    }
  }

  async function handleUpdateProgress(goalId: string) {
    const val = parseFloat(progressValues[goalId] || "0");
    if (isNaN(val)) return;
    setUpdatingProgress(goalId);
    await updateGoalProgress(goalId, val);
    setUpdatingProgress(null);
  }

  function getProgress(goal: Goal) {
    if (!goal.target_value) return 0;
    return Math.min((goal.current_value / goal.target_value) * 100, 100);
  }

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Goals</h1>
          <p className="text-gray-400 text-sm">Track progress, get AI-recommended goals, and stay focused on what moves the needle.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowCustomForm(true)}
            className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-white font-semibold px-4 py-2.5 rounded-xl text-sm transition"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Add goal
          </button>
          <button
            onClick={handleGenerateGoals}
            disabled={generating || !hasData}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold px-4 py-2.5 rounded-xl text-sm transition shadow-lg shadow-blue-500/20"
          >
            {generating ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
                Generating...
              </>
            ) : (
              <>
                <span>🧠</span>
                Generate AI goals
              </>
            )}
          </button>
        </div>
      </div>

      {genError && (
        <div className="mb-6 bg-red-500/10 border border-red-500/30 rounded-xl px-5 py-4">
          <p className="text-red-400 text-sm">{genError}</p>
        </div>
      )}

      {!hasData && (
        <div className="mb-6 bg-blue-500/5 border border-blue-500/20 rounded-2xl p-5 flex items-center gap-4">
          <div className="text-2xl">📊</div>
          <div>
            <p className="text-white text-sm font-medium">Upload data to get AI goal recommendations</p>
            <p className="text-gray-400 text-xs mt-0.5">AI goals are generated based on your actual sales data. Upload a CSV first.</p>
          </div>
          <a href="/upload" className="ml-auto bg-blue-600 hover:bg-blue-500 text-white font-semibold px-4 py-2 rounded-xl text-sm transition whitespace-nowrap">
            Upload data
          </a>
        </div>
      )}

      {/* Custom goal form */}
      {showCustomForm && (
        <div className="mb-6 bg-gray-900 border border-gray-800 rounded-2xl p-6">
          <h3 className="text-white font-semibold mb-4">Create custom goal</h3>
          <form onSubmit={handleCreateCustom} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">Goal title</label>
                <input name="title" required placeholder="e.g. Hit 25% close rate" className="w-full bg-gray-800 border border-gray-700 text-white placeholder-gray-500 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition" />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">Description (optional)</label>
                <input name="description" placeholder="Why this goal matters..." className="w-full bg-gray-800 border border-gray-700 text-white placeholder-gray-500 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition" />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">Target value</label>
                <input name="target_value" type="number" step="0.1" placeholder="e.g. 25" className="w-full bg-gray-800 border border-gray-700 text-white placeholder-gray-500 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition" />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">Unit</label>
                <input name="unit" placeholder="e.g. % or closes/week or $" className="w-full bg-gray-800 border border-gray-700 text-white placeholder-gray-500 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition" />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button type="submit" disabled={creating} className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition">
                {creating ? "Creating..." : "Create goal"}
              </button>
              <button type="button" onClick={() => setShowCustomForm(false)} className="text-gray-500 hover:text-gray-300 text-sm transition">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* AI Goals */}
      {aiGoals.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-lg">🧠</span>
            <h2 className="text-white font-semibold">AI Recommended Goals</h2>
            <span className="text-xs text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded-full">{aiGoals.length} goals</span>
          </div>
          <div className="space-y-4">
            {aiGoals.map(goal => (
              <GoalCard
                key={goal.id}
                goal={goal}
                expanded={expandedGoal === goal.id}
                onToggle={() => setExpandedGoal(expandedGoal === goal.id ? null : goal.id)}
                progressValue={progressValues[goal.id] || ""}
                onProgressChange={val => setProgressValues(p => ({ ...p, [goal.id]: val }))}
                onUpdateProgress={() => handleUpdateProgress(goal.id)}
                updatingProgress={updatingProgress === goal.id}
                onComplete={() => completeGoal(goal.id)}
                onDismiss={() => dismissGoal(goal.id)}
                getProgress={getProgress}
              />
            ))}
          </div>
        </div>
      )}

      {/* Custom Goals */}
      {customGoals.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-lg">🎯</span>
            <h2 className="text-white font-semibold">Custom Goals</h2>
            <span className="text-xs text-gray-400 bg-gray-800 border border-gray-700 px-2 py-0.5 rounded-full">{customGoals.length} goals</span>
          </div>
          <div className="space-y-4">
            {customGoals.map(goal => (
              <GoalCard
                key={goal.id}
                goal={goal}
                expanded={expandedGoal === goal.id}
                onToggle={() => setExpandedGoal(expandedGoal === goal.id ? null : goal.id)}
                progressValue={progressValues[goal.id] || ""}
                onProgressChange={val => setProgressValues(p => ({ ...p, [goal.id]: val }))}
                onUpdateProgress={() => handleUpdateProgress(goal.id)}
                updatingProgress={updatingProgress === goal.id}
                onComplete={() => completeGoal(goal.id)}
                onDismiss={() => dismissGoal(goal.id)}
                getProgress={getProgress}
              />
            ))}
          </div>
        </div>
      )}

      {/* Completed Goals */}
      {completedGoals.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <span className="text-lg">✅</span>
            <h2 className="text-white font-semibold">Completed</h2>
            <span className="text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">{completedGoals.length} done</span>
          </div>
          <div className="space-y-3">
            {completedGoals.map(goal => (
              <div key={goal.id} className="bg-gray-900/50 border border-gray-800 rounded-2xl p-5 flex items-center justify-between opacity-60">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-emerald-500/10 rounded-xl flex items-center justify-center">
                    <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                  </div>
                  <div>
                    <p className="text-white font-medium text-sm line-through">{goal.title}</p>
                    {goal.target_value && <p className="text-gray-600 text-xs">Target: {goal.target_value} {goal.unit}</p>}
                  </div>
                </div>
                <span className="text-xs text-emerald-400">Completed</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {goals.length === 0 && (
        <div className="bg-gray-900 border border-gray-800 border-dashed rounded-2xl p-16 text-center">
          <div className="text-5xl mb-4">🎯</div>
          <h3 className="text-white font-semibold text-lg mb-2">No goals yet</h3>
          <p className="text-gray-400 text-sm mb-6 max-w-sm mx-auto">
            {hasData
              ? "Generate AI-recommended goals based on your sales data, or create your own."
              : "Upload your sales data first, then generate AI goals based on your actual performance."}
          </p>
          <div className="flex items-center justify-center gap-3">
            {hasData && (
              <button onClick={handleGenerateGoals} disabled={generating} className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold px-6 py-3 rounded-xl text-sm transition">
                {generating ? "Generating..." : "Generate AI goals"}
              </button>
            )}
            <button onClick={() => setShowCustomForm(true)} className="bg-gray-800 hover:bg-gray-700 border border-gray-700 text-white font-semibold px-6 py-3 rounded-xl text-sm transition">
              Add custom goal
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function GoalCard({
  goal,
  expanded,
  onToggle,
  progressValue,
  onProgressChange,
  onUpdateProgress,
  updatingProgress,
  onComplete,
  onDismiss,
  getProgress,
}: {
  goal: Goal;
  expanded: boolean;
  onToggle: () => void;
  progressValue: string;
  onProgressChange: (val: string) => void;
  onUpdateProgress: () => void;
  updatingProgress: boolean;
  onComplete: () => void;
  onDismiss: () => void;
  getProgress: (goal: Goal) => number;
}) {
  const progress = getProgress(goal);
  const checklistItems = goal.goal_checklist_items || [];
  const completedItems = checklistItems.filter(i => i.completed).length;

  return (
    <div className={`bg-gray-900 border rounded-2xl overflow-hidden transition-all duration-200 ${expanded ? "border-blue-500/30" : "border-gray-800 hover:border-gray-700"}`}>
      <div className="p-5 cursor-pointer" onClick={onToggle}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              {goal.is_ai_generated && (
                <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-400 border border-blue-500/20">
                  🧠 AI Goal
                </span>
              )}
              {checklistItems.length > 0 && (
                <span className="text-xs text-gray-500">
                  {completedItems}/{checklistItems.length} steps done
                </span>
              )}
            </div>
            <h3 className="text-white font-semibold text-sm mb-1">{goal.title}</h3>
            {goal.description && <p className="text-gray-500 text-xs leading-relaxed">{goal.description}</p>}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {goal.target_value && (
              <div className="text-right">
                <p className="text-white text-sm font-bold">{goal.current_value}<span className="text-gray-500 text-xs"> / {goal.target_value} {goal.unit}</span></p>
                <p className="text-gray-600 text-xs">{progress.toFixed(0)}% complete</p>
              </div>
            )}
            <svg className={`w-4 h-4 text-gray-600 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
          </div>
        </div>

        {goal.target_value && (
          <div className="mt-3 w-full bg-gray-800 rounded-full h-1.5">
            <div
              className={`h-1.5 rounded-full transition-all duration-500 ${progress >= 100 ? "bg-emerald-500" : progress >= 50 ? "bg-blue-500" : "bg-blue-600"}`}
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
      </div>

      {expanded && (
        <div className="border-t border-gray-800 p-5 space-y-5">
          {goal.ai_reasoning && (
            <div className="bg-blue-500/5 border border-blue-500/10 rounded-xl p-4">
              <p className="text-xs text-blue-400 font-medium mb-1">Why this goal?</p>
              <p className="text-gray-400 text-xs leading-relaxed">{goal.ai_reasoning}</p>
            </div>
          )}

          {checklistItems.length > 0 && (
            <div>
              <p className="text-white text-xs font-semibold mb-3">Action steps</p>
              <div className="space-y-2">
                {checklistItems.map(item => (
                  <label key={item.id} className="flex items-start gap-3 cursor-pointer group">
                    <div className="relative flex-shrink-0 mt-0.5">
                      <input
                        type="checkbox"
                        checked={item.completed}
                        onChange={e => toggleChecklistItem(item.id, e.target.checked)}
                        className="sr-only"
                      />
                      <div className={`w-4 h-4 rounded border transition-all ${item.completed ? "bg-blue-600 border-blue-600" : "border-gray-600 group-hover:border-gray-500"}`}>
                        {item.completed && (
                          <svg className="w-3 h-3 text-white m-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                        )}
                      </div>
                    </div>
                    <span className={`text-xs leading-relaxed ${item.completed ? "text-gray-600 line-through" : "text-gray-300"}`}>{item.title}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {goal.target_value && (
            <div>
              <p className="text-white text-xs font-semibold mb-3">Update progress</p>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  step="0.1"
                  value={progressValue}
                  onChange={e => onProgressChange(e.target.value)}
                  placeholder={`Current value (${goal.unit || "number"})`}
                  className="flex-1 bg-gray-800 border border-gray-700 text-white placeholder-gray-500 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                />
                <button
                  onClick={onUpdateProgress}
                  disabled={updatingProgress}
                  className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold px-4 py-2.5 rounded-xl text-sm transition whitespace-nowrap"
                >
                  {updatingProgress ? "Saving..." : "Update"}
                </button>
              </div>
            </div>
          )}

          <div className="flex items-center gap-3 pt-2 border-t border-gray-800">
            <button
              onClick={onComplete}
              className="flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 px-3 py-2 rounded-xl transition"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
              Mark complete
            </button>
            <button
              onClick={onDismiss}
              className="text-xs text-gray-600 hover:text-gray-400 px-3 py-2 rounded-xl hover:bg-gray-800 transition"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
