// Transport zu /api/agent. Alle KI-Agenten laufen über diesen einen Weg.
import type { AgentName, AgentResponse } from '../../shared/agentProtocol';

export type AgentCallResult<T> = { ok: true; output: T } | { ok: false; error: string };

export async function callAgent<T = unknown>(
  agent: AgentName,
  input: unknown,
  signal?: AbortSignal,
): Promise<AgentCallResult<T>> {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return { ok: false, error: 'Du bist offline. KI-Funktionen sind nicht verfügbar.' };
  }
  try {
    const res = await fetch('/api/agent', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ agent, input }),
      signal,
    });
    const data = (await res.json().catch(() => null)) as AgentResponse | null;
    if (!data || typeof data !== 'object' || !('ok' in data)) {
      return { ok: false, error: `Unerwartete Antwort (Status ${res.status}).` };
    }
    if (!data.ok) return { ok: false, error: data.error };
    return { ok: true, output: data.output as T };
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      return { ok: false, error: 'Abgebrochen.' };
    }
    return { ok: false, error: 'Netzwerkfehler. Bitte später erneut versuchen.' };
  }
}
