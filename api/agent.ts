import { handleAgentRequest } from '../server/agentHandler.ts';

// Vercel Serverless Function: POST /api/agent
// Minimal typisierte Schnittstelle, damit kein @vercel/node-Paket nötig ist.
interface VercelRequest {
  method?: string;
  body?: unknown;
}
interface VercelResponse {
  setHeader(name: string, value: string): void;
  status(code: number): VercelResponse;
  json(body: unknown): void;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    res.status(405).json({ ok: false, error: 'Method not allowed' });
    return;
  }
  const result = await handleAgentRequest(req.body, {
    apiKey: process.env.ANTHROPIC_API_KEY,
    env: process.env,
  });
  res.status(result.status).json(result.body);
}
