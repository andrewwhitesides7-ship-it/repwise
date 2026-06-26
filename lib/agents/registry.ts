// Meridian agent stack — registry. Register every agent module here.
import type { AgentModule, AgentType } from "./types";
import { leadResponse } from "./modules/lead-response";
import { followUp } from "./modules/follow-up";
import { scheduling } from "./modules/scheduling";
import { quoteInvoice } from "./modules/quote-invoice";
import { reviews } from "./modules/reviews";

const MODULES: Record<AgentType, AgentModule> = {
  lead_response: leadResponse,
  follow_up: followUp,
  scheduling,
  quote_invoice: quoteInvoice,
  reviews,
};

export function getModule(type: AgentType): AgentModule | undefined {
  return MODULES[type];
}

export function allModules(): AgentModule[] {
  return Object.values(MODULES);
}
