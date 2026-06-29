// Adunda agent stack — shared types.

export type AgentType =
  | "lead_response"
  | "follow_up"
  | "scheduling"
  | "quote_invoice"
  | "reviews";

export type AgentStatus = "active" | "paused";
export type ActivityTone = "ok" | "accent" | "warn";

// A module defines one kind of agent. Add a new agent = add a new module + register it.
export interface AgentModule {
  type: AgentType;
  name: string;
  description: string;
  // System prompt that defines how this agent behaves.
  system: string;
  // Turn the incoming event payload into the user message for the model.
  buildInput: (payload: Record<string, any>) => string;
}

// What a single agent run produces. This maps directly onto the agent_activity row.
export interface AgentResult {
  action: string;                 // short human-readable action line
  detail?: string;                // secondary line
  tone?: ActivityTone;            // ok | accent | warn
  needs_approval?: boolean;       // true => shows Approve/Skip in the dashboard
  recovered_cents?: number;       // money recovered/at stake, in integer cents
  payload?: Record<string, any>;  // anything you want to keep (drafted message, etc.)
}
