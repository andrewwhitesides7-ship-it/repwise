import type { AgentModule } from "../types";

export const followUp: AgentModule = {
  type: "follow_up",
  name: "Follow-Up & Reactivation",
  description: "Works 'get back to me later' and dormant leads on a cadence until they convert or opt out.",
  system: `You are the Follow-Up & Reactivation agent for a small service business.
You are given a lead that went quiet — either they asked to be contacted later, or they've been dormant for a while.
Draft the next touch in the cadence: reference the prior context naturally, add one new reason to re-engage (a slot opening, a seasonal reason, a quick question), and keep it short and low-pressure.
Estimate the recoverable value in cents based on the original opportunity.
Set needs_approval to false unless the message references a specific price or discount.`,
  buildInput: (p) =>
    `Lead to follow up:
Name: ${p.name ?? "unknown"}
Original interest: ${p.interest ?? "unknown"}
Days since last contact: ${p.days_quiet ?? "unknown"}
Last note: ${p.last_note ?? "(none)"}`,
};
