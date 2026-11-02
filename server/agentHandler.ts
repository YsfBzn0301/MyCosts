import { isAgentName, type AgentName, type AgentResponse } from '../shared/agentProtocol.ts';
import { AGENT_CONFIG, resolveModel, type ServerAgentName } from './agents/config.ts';
import {
  buildCategorizerPrompt,
  parseCategorizerInput,
  parseCategorizerOutput,
} from './agents/categorizerAgent.ts';
import {
  buildAdvisorPrompt,
  parseAdvisorInput,
  parseAdvisorOutput,
} from './agents/advisorAgent.ts';

const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';
const ANTHROPIC_VERSION = '2023-06-01';
const UPSTREAM_TIMEOUT_MS = 30_000;

interface PromptSpec {
  system: string;
  user: string;
}

interface ServerAgent {
  parseInput: (raw: unknown) => unknown | null;
  buildPrompt: (input: never) => PromptSpec;
  parseOutput: (text: string) => unknown;
}

// Registry: jeder Agent kapselt Input-Validierung, Prompt und Output-Parsing.
// Der Handler kennt nur diese Schnittstelle.
const AGENTS: Record<AgentName, { server: ServerAgentName } & ServerAgent> = {
  categorizer: {
    server: 'categorizer',
    parseInput: parseCategorizerInput,
    buildPrompt: buildCategorizerPrompt as unknown as ServerAgent['buildPrompt'],
    parseOutput: parseCategorizerOutput,
  },
  advisor: {
    server: 'advisor',
    parseInput: parseAdvisorInput,
    buildPrompt: buildAdvisorPrompt as unknown as ServerAgent['buildPrompt'],
    parseOutput: parseAdvisorOutput,
  },
};

export interface HandlerDeps {
  apiKey?: string;
  env?: Record<string, string | undefined>;
  fetchImpl?: typeof fetch;
}

export interface HandlerResult {
  status: number;
  body: AgentResponse;
}

function fail(status: number, error: string): HandlerResult {
  return { status, body: { ok: false, error } };
}

export async function handleAgentRequest(body: unknown, deps: HandlerDeps): Promise<HandlerResult> {
  if (!body || typeof body !== 'object') return fail(400, 'Ungültige Anfrage.');
  const { agent, input } = body as { agent?: unknown; input?: unknown };

  if (!isAgentName(agent)) return fail(400, 'Unbekannter Agent.');
  const definition = AGENTS[agent];

  const parsedInput = definition.parseInput(input);
  if (parsedInput === null) return fail(400, 'Ungültige Eingabe für den Agenten.');

  if (!deps.apiKey) return fail(500, 'ANTHROPIC_API_KEY ist auf dem Server nicht gesetzt.');

  const env = deps.env ?? {};
  const model = resolveModel(definition.server, env);
  const { system, user } = definition.buildPrompt(parsedInput as never);
  const doFetch = deps.fetchImpl ?? fetch;

  let upstream: Response;
  try {
    upstream = await doFetch(ANTHROPIC_URL, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': deps.apiKey,
        'anthropic-version': ANTHROPIC_VERSION,
      },
      body: JSON.stringify({
        model,
        max_tokens: AGENT_CONFIG[definition.server].maxTokens,
        system,
        messages: [{ role: 'user', content: user }],
      }),
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
    });
  } catch {
    return fail(502, 'Die KI ist gerade nicht erreichbar.');
  }

  if (!upstream.ok) {
    // Details vom Upstream bewusst nicht an den Client weitergeben.
    return fail(502, `KI-Anfrage fehlgeschlagen (Status ${upstream.status}).`);
  }

  const json = (await upstream.json().catch(() => null)) as
    | { content?: Array<{ type?: string; text?: string }> }
    | null;
  const text = (json?.content ?? [])
    .filter((block) => block.type === 'text' && typeof block.text === 'string')
    .map((block) => block.text as string)
    .join('');

  return { status: 200, body: { ok: true, output: definition.parseOutput(text) } };
}
