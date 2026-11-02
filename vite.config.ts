import { defineConfig, loadEnv, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { handleAgentRequest } from './server/agentHandler.ts';

/**
 * Lokaler Ersatz für /api/agent, damit `npm run dev` ohne Vercel funktioniert.
 * Nutzt exakt denselben Handler wie die Produktions-Function (api/agent.ts).
 */
function agentDevApi(): Plugin {
  return {
    name: 'agent-dev-api',
    configureServer(server) {
      const env = loadEnv(server.config.mode, process.cwd(), '');
      server.middlewares.use('/api/agent', async (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.end();
          return;
        }
        let raw = '';
        for await (const chunk of req) raw += chunk;
        let body: unknown = undefined;
        try {
          body = JSON.parse(raw);
        } catch {
          body = undefined;
        }
        const result = await handleAgentRequest(body, {
          apiKey: env.ANTHROPIC_API_KEY,
          env,
        });
        res.statusCode = result.status;
        res.setHeader('content-type', 'application/json');
        res.end(JSON.stringify(result.body));
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), agentDevApi()],
});
