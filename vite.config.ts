import path from 'path';
import fs from 'fs/promises';
import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';

type IncomingRequest = import('http').IncomingMessage;
type ServerResponse = import('http').ServerResponse;

const REPORT_DIRS = {
  mi: path.resolve(__dirname, 'MI Reports'),
  upgrade: path.resolve(__dirname, 'Upgrade Reports'),
};

const createReportPlugin = (): Plugin => {
  const registerHandlers = (app: { use: Function }, rootDir: string) => {
    const handler = async (
      req: IncomingRequest,
      res: ServerResponse,
      type: 'mi' | 'upgrade'
    ) => {
      if (req.method !== 'POST') {
        res.statusCode = 405;
        res.end('Method Not Allowed');
        return;
      }

      try {
        const body = await readJsonBody(req);
        const result = await saveReport(type, body, rootDir);
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(result));
      } catch (error) {
        res.statusCode = 400;
        res.end(error instanceof Error ? error.message : 'Invalid request');
      }
    };

    app.use('/api/reports/mi', (req: IncomingRequest, res: ServerResponse) =>
      handler(req, res, 'mi')
    );
    app.use('/api/reports/upgrade', (req: IncomingRequest, res: ServerResponse) =>
      handler(req, res, 'upgrade')
    );
  };

  return {
    name: 'report-api-plugin',
    configureServer(server) {
      registerHandlers(server.middlewares, server.config.root);
    },
    configurePreviewServer(server) {
      registerHandlers(server.middlewares, server.config.root);
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

const saveReport = async (
  type: 'mi' | 'upgrade',
  payload: any,
  rootDir: string
) => {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();
  const idPrefix = type === 'mi' ? 'MI' : 'UPG';
  const id = `${idPrefix}-${timestamp}-${suffix}`;

  if (type === 'mi') {
    validateMIPayload(payload);
  } else {
    validateUpgradePayload(payload);
  }

  const dir = REPORT_DIRS[type];
  await fs.mkdir(dir, { recursive: true });

  const record = {
    id,
    ...payload,
    checklist:
      type === 'upgrade'
        ? (payload.checklist || []).map((label: string) => ({ label, completed: false }))
        : undefined,
    createdAt: new Date().toISOString(),
  };

  const filePath = path.join(dir, `${id}.json`);
  await fs.writeFile(filePath, JSON.stringify(record, null, 2), 'utf-8');

  return { id, filePath };
};

const assertString = (value: any, field: string) => {
  if (!value || typeof value !== 'string' || !value.trim()) {
    throw new Error(`Field "${field}" is required.`);
  }
};

const validateMIPayload = (payload: any) => {
  ['ideaId', 'ideaTitle', 'columnId', 'columnTitle', 'cardId', 'cardText', 'summary', 'details'].forEach((field) =>
    assertString(payload[field], field)
  );
};

const validateUpgradePayload = (payload: any) => {
  ['ideaId', 'ideaTitle', 'columnId', 'columnTitle', 'cardId', 'cardText', 'description', 'plan', 'estimate'].forEach((field) =>
    assertString(payload[field], field)
  );
  if (!Array.isArray(payload.checklist)) {
    throw new Error('Checklist must be an array.');
  }
};

export default defineConfig(({ mode }) => {
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      test: {
        globals: true,
        environment: 'jsdom',
        setupFiles: './vitest.setup.ts'
      }
    };
});
