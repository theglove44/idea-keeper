import { Plugin } from 'vite';
import { invokeClaude, isClaudeAvailable } from './claudeService';

type IncomingRequest = import('http').IncomingMessage;
type ServerResponse = import('http').ServerResponse;

interface ClaudeContext {
  ideaTitle?: string;
  ideaSummary?: string;
  cardText?: string;
  columnTitle?: string;
  boardState?: string;
  recentComments?: string;
  mentionType: 'card' | 'global';
}

interface ChatRequest {
  prompt: string;
  context: ClaudeContext;
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

        const systemPrompt = buildSystemPrompt(context);
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

const buildSystemPrompt = (context: ClaudeContext): string => {
  const parts: string[] = [
    'You are Claude, an AI assistant integrated into a project management tool called "Idea Keeper".'
  ];

  if (context.ideaTitle) {
    let projectInfo = `Current project: ${context.ideaTitle}`;
    if (context.ideaSummary) {
      projectInfo += ` - ${context.ideaSummary}`;
    }
    parts.push(projectInfo);
  }

  if (context.boardState) {
    parts.push(`Board state: ${context.boardState}`);
  }

  if (context.cardText) {
    let cardInfo = `Current card: ${context.cardText}`;
    if (context.columnTitle) {
      cardInfo += ` (in column: ${context.columnTitle})`;
    }
    parts.push(cardInfo);
  }

  if (context.recentComments) {
    parts.push(`Recent comments: ${context.recentComments}`);
  }

  parts.push(`
IMPORTANT: You cannot directly modify the board. To create, move, or modify cards, you MUST include a JSON action block in your response. The user will see these as proposals they can approve or dismiss. Without action blocks, nothing will happen on the board.

To propose actions, include this exact format at the end of your response:
\`\`\`actions
[{"type": "create_card", "params": {"text": "Card title or description", "columnId": "todo"}}]
\`\`\`

Available action types:
- create_card: {"text": "...", "columnId": "todo" | "doing" | "done"}
- move_card: {"cardId": "...", "targetColumnId": "todo" | "doing" | "done"}
- modify_card: {"cardId": "...", "text": "new text"}

Always include the action block when the user asks you to create, move, or change cards. Each card needs its own action object in the array.
  `.trim());

  return parts.join('\n\n');
};
