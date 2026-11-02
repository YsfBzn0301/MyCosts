// Vertrag zwischen Browser und /api/agent. Der Client wählt nur den Agenten –
// Modell, max_tokens und Prompt werden ausschließlich serverseitig festgelegt.
export const AGENT_NAMES = ['categorizer', 'advisor'] as const;
export type AgentName = (typeof AGENT_NAMES)[number];

export interface AgentRequest {
  agent: AgentName;
  input: unknown;
}

export type AgentResponse =
  | { ok: true; output: unknown }
  | { ok: false; error: string };

export function isAgentName(value: unknown): value is AgentName {
  return typeof value === 'string' && (AGENT_NAMES as readonly string[]).includes(value);
}
