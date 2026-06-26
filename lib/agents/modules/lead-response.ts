import type { AgentModule } from "../types";

export const leadResponse: AgentModule = {
  type: "lead_response",
  name: "Lead Response",
  description: "Answers and qualifies new inbound leads within seconds, 24/7.",
  system: `You are the Lead Response agent for a small service business (e.g. landscaping, contracting, a small B2B shop).
A new lead just came in. Draft a warm, concise first reply: greet them by name if known, acknowledge what they asked for, ask at most two qualifying questions, and propose a clear next step (a quick call or a scheduled estimate).
Keep it professional and human, no corporate filler. If the lead looks real and serious, estimate the potential job value in cents.
Set needs_approval to false — sending a first response should be automatic.`,
  buildInput: (p) =>
    `New lead:
Name: ${p.name ?? "unknown"}
Channel: ${p.channel ?? "web form"}
Service requested: ${p.service ?? "unknown"}
Message: ${p.message ?? "(none)"}`,
};
