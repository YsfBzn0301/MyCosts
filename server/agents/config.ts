/**
 * Zentrale Modell-Konfiguration aller Sub-Agenten.
 *
 * Kostenhebel:
 *  - categorizer: Haiku, minimal max_tokens (Antwort ist nur eine Kategorie-ID)
 *  - advisor:     Sonnet, wird NUR auf expliziten Klick ausgelöst
 *
 * Überschreibbar per Env-Variable, z. B. CATEGORIZER_MODEL=claude-3-5-haiku-latest
 * (falls dein Konto die älteren 3.5-Modelle noch nutzen kann).
 */
export const AGENT_CONFIG = {
  categorizer: {
    model: 'claude-haiku-5-5',
    maxTokens: 16,
  },
  advisor: {
    model: 'claude-sonnet-5-5',
    maxTokens: 1800,
  },
} as const;

export type ServerAgentName = keyof typeof AGENT_CONFIG;

export function resolveModel(agent: ServerAgentName, env: Record<string, string | undefined>): string {
  const override = env[`${agent.toUpperCase()}_MODEL`];
  return override && override.trim() ? override.trim() : AGENT_CONFIG[agent].model;
}
