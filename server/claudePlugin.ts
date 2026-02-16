import { Plugin } from 'vite';
import { invokeClaude, isClaudeAvailable } from './claudeService';
import { buildClaudeSystemPrompt, ClaudePromptContext } from '../utils/claudeSystemPrompt';

type IncomingRequest = import('http').IncomingMessage;
type ServerResponse = import('http').ServerResponse;

interface ChatRequest {
  prompt: string;
  context: ClaudePromptContext;
}

export const createClaudePlugin = (): Plugin => {
  const registerHandlers = (app: { use: Function }) => {
    // POST /api/claude/chat
    app.use('/api/claude/chat', async (req: IncomingRequest, res: ServerResponse) => {
      if (req.method !== 'POST') {
        res.statusCode = 405;
        res.end('Method Not Allowed');
        return;
      }

      try {
        const body: ChatRequest = await readJsonBody(req);
        const { prompt, context } = body;

        if (!prompt || typeof prompt !== 'string') {
          res.statusCode = 400;
          res.end('Invalid prompt');
          return;
        }

        const systemPrompt = buildClaudeSystemPrompt(context);
        const response = await invokeClaude(prompt, systemPrompt);

        res.setHeader('Content-Type', 'application/json');
        if (response.error) {
          res.statusCode = 502;
          res.end(JSON.stringify({ message: '', error: response.error }));
        } else {
          res.end(JSON.stringify({ message: response.result }));
        }
      } catch (error) {
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({
          message: '',
          error: error instanceof Error ? error.message : 'Unknown error'
        }));
      }
    });

    // GET /api/claude/health
    app.use('/api/claude/health', async (req: IncomingRequest, res: ServerResponse) => {
      if (req.method !== 'GET') {
        res.statusCode = 405;
        res.end('Method Not Allowed');
        return;
      }

      try {
        const result = await isClaudeAvailable();
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(result));
      } catch (error) {
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({
          available: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        }));
      }
    });
  };

  return {
    name: 'claude-api-plugin',
    configureServer(server) {
      registerHandlers(server.middlewares);
    },
    configurePreviewServer(server) {
      registerHandlers(server.middlewares);
    },
  };
};

const readJsonBody = (req: IncomingRequest): Promise<any> => {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk) => {
      data += chunk;
      if (data.length > 1e6) {
        req.socket.destroy();
        reject(new Error('Payload too large'));
      }
    });
    req.on('end', () => {
      try {
        resolve(data ? JSON.parse(data) : {});
      } catch (error) {
        reject(error);
      }
    });
    req.on('error', reject);
  });
};
