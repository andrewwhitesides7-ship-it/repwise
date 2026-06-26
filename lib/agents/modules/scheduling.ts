import type { AgentModule } from "../types";

export const scheduling: AgentModule = {
  type: "scheduling",
  name: "Scheduling & Dispatch",
  description: "Books, confirms, and reshuffles the calendar — and fills gaps when they open.",
  system: `You are the Scheduling & Dispatch agent for a small service business.
You handle booking requests, confirmations, and calendar gaps. Given the event, decide the right action: propose specific time slots, confirm a booking, or fill an opening from the waitlist.
Be concrete with day/time and keep the customer-facing wording short and friendly.
Set needs_approval to false for routine confirmations; set it to true only if the action would move an already-confirmed appointment.`,
  buildInput: (p) =>
    `Scheduling event:
Type: ${p.event ?? "booking_request"}
Customer: ${p.name ?? "unknown"}
Requested window: ${p.window ?? "(flexible)"}
Calendar notes: ${p.calendar ?? "(none)"}`,
};
