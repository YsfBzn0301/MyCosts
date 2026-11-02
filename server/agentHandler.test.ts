import { describe, expect, it, vi } from 'vitest';
import { handleAgentRequest } from './agentHandler.ts';
import { resolveModel, AGENT_CONFIG } from './agents/config.ts';
import { parseAdvisorOutput } from './agents/advisorAgent.ts';

function fakeFetch(text: string, status = 200) {
  return vi.fn(async () =>
    new Response(JSON.stringify({ content: [{ type: 'text', text }] }), {
      status,
      headers: { 'content-type': 'application/json' },
    }),
  ) as unknown as typeof fetch & ReturnType<typeof vi.fn>;
}

describe('handleAgentRequest', () => {
  it('lehnt unbekannte Agenten ab, ohne Upstream aufzurufen', async () => {
    const f = fakeFetch('x');
    const r = await handleAgentRequest({ agent: 'hacker', input: {} }, { apiKey: 'k', fetchImpl: f });
    expect(r.status).toBe(400);
    expect(f).not.toHaveBeenCalled();
  });

  it('validiert die Eingabe', async () => {
    const r = await handleAgentRequest({ agent: 'categorizer', input: { name: 'x' } }, { apiKey: 'k', fetchImpl: fakeFetch('') });
    expect(r.status).toBe(400);
  });

  it('verweigert ohne API-Key', async () => {
    const r = await handleAgentRequest({ agent: 'categorizer', input: { name: 'Netflix' } }, {});
    expect(r.status).toBe(500);
  });

  it('kategorisiert mit Haiku und begrenzt max_tokens aus der Config', async () => {
    const f = fakeFetch('subscriptions');
    const r = await handleAgentRequest({ agent: 'categorizer', input: { name: 'Streamingdienst X' } }, { apiKey: 'sk-test', fetchImpl: f });
    expect(r).toEqual({ status: 200, body: { ok: true, output: { category: 'subscriptions' } } });

    const [url, init] = (f as unknown as { mock: { calls: [string, RequestInit][] } }).mock.calls[0];
    expect(url).toBe('https://api.anthropic.com/v1/messages');
    const sent = JSON.parse(init.body as string);
    expect(sent.model).toBe(AGENT_CONFIG.categorizer.model);
    expect(sent.max_tokens).toBe(AGENT_CONFIG.categorizer.maxTokens);
    expect((init.headers as Record<string, string>)['x-api-key']).toBe('sk-test');
  });

  it('verwirft ungültige Kategorie-IDs der KI', async () => {
    const r = await handleAgentRequest({ agent: 'categorizer', input: { name: 'Zeug' } }, { apiKey: 'k', fetchImpl: fakeFetch('Keine Ahnung') });
    expect(r.body).toEqual({ ok: true, output: { category: null } });
  });

  it('gibt bei Upstream-Fehlern keine Details an den Client weiter', async () => {
    const r = await handleAgentRequest({ agent: 'categorizer', input: { name: 'Netflix' } }, { apiKey: 'k', fetchImpl: fakeFetch('{"secret":1}', 500) });
    expect(r.status).toBe(502);
    expect(JSON.stringify(r.body)).not.toContain('secret');
  });

  it('nutzt Sonnet für den Advisor und liefert strukturierten Report', async () => {
    const report = { summary: 'ok', budgetTip: 'tip', suggestions: [] };
    const f = fakeFetch(`Hier:\n${JSON.stringify(report)}`);
    const r = await handleAgentRequest(
      {
        agent: 'advisor',
        input: { costs: [{ name: 'Netflix', category: 'subscriptions', interval: 'monthly', amountEUR: 12.99, monthlyEquivalentEUR: 12.99, dueDay: 5 }], totalMonthlyEUR: 12.99, totalYearlyEUR: 155.88 },
      },
      { apiKey: 'k', fetchImpl: f },
    );
    expect(r.body).toEqual({ ok: true, output: { report } });
    const sent = JSON.parse((f as unknown as { mock: { calls: [string, RequestInit][] } }).mock.calls[0][1].body as string);
    expect(sent.model).toBe(AGENT_CONFIG.advisor.model);
  });

  it('erlaubt Modell-Override per Env, Standard sonst', () => {
    expect(resolveModel('advisor', {})).toBe(AGENT_CONFIG.advisor.model);
    expect(resolveModel('advisor', { ADVISOR_MODEL: 'claude-3-5-sonnet-latest' })).toBe('claude-3-5-sonnet-latest');
  });

  it('fällt bei Nicht-JSON-Antworten auf Rohtext zurück', () => {
    expect(parseAdvisorOutput('kein json')).toEqual({ raw: 'kein json' });
  });
});
