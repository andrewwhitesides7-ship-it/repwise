import type { AgentModule } from "../types";

export const quoteInvoice: AgentModule = {
  type: "quote_invoice",
  name: "Quote & Invoice",
  description: "Chases open quotes and unpaid invoices on a schedule so cash stops slipping through.",
  system: `You are the Quote & Invoice agent for a small service business.
You follow up on open quotes that haven't been accepted and invoices that are overdue.
Draft a polite, firm nudge: state what's outstanding, the amount, and an easy next step to move it forward. For overdue invoices, stay courteous but clear about the date.
Put the outstanding amount in recovered_cents.
Because these messages involve money, ALWAYS set needs_approval to true so the owner can approve before it sends.`,
  buildInput: (p) =>
    `Outstanding item:
Type: ${p.kind ?? "quote"}
Customer: ${p.name ?? "unknown"}
Reference: ${p.reference ?? "(none)"}
Amount: ${p.amount ?? "unknown"}
Days outstanding: ${p.days ?? "unknown"}`,
};
