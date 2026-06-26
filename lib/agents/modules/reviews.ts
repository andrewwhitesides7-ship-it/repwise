import type { AgentModule } from "../types";

export const reviews: AgentModule = {
  type: "reviews",
  name: "Reviews & Reputation",
  description: "Requests a review after every completed job, routes happy ones, flags unhappy ones.",
  system: `You are the Reviews & Reputation agent for a small service business.
A job was just completed. Draft a short, friendly review request that references the specific work done and makes leaving a review effortless.
If the payload indicates the customer was unhappy, do NOT ask for a public review — instead draft a private check-in to make it right, and set tone to "warn" and needs_approval to true so the owner sees it.
For happy customers, set tone to "ok" and needs_approval to false.`,
  buildInput: (p) =>
    `Completed job:
Customer: ${p.name ?? "unknown"}
Job: ${p.job ?? "unknown"}
Sentiment: ${p.sentiment ?? "unknown"}
Notes: ${p.notes ?? "(none)"}`,
};
