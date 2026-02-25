/**
 * Server-side plan dictionary.
 * The client sends only the planId — the backend resolves the price.
 * This prevents price tampering via intercepted requests.
 */

export interface Plan {
  id: string;
  title: string;
  description: string;
  amount: number; // in BRL (e.g. 49.90)
  currency: string;
  /** Maximum number of agents a subscriber of this plan can deploy */
  maxAgents: number;
}

export const PLANS: Record<string, Plan> = {
  "pro-monthly": {
    id: "pro-monthly",
    title: "Plano Pro – Mensal",
    description: "Deploy de agentes OpenClaw com integração Telegram",
    amount: 49.9,
    currency: "BRL",
    maxAgents: 1,
  },
};

export function getPlanById(planId: string): Plan | null {
  return PLANS[planId] ?? null;
}
