import react from '@vitejs/plugin-react';
import { defineConfig, type Plugin } from 'vite';
import healthHandler from './api/health.ts';
import parseExpenseHandler from './api/parse-expense.ts';
import scanBillHandler from './api/scan-bill.ts';
import scamCheckHandler from './api/scam-check.ts';
import insightsHandler from './api/insights.ts';

// Vite Dev Server Middleware for /api/* serverless endpoints
function apiServerPlugin(): Plugin {
  return {
    name: 'api-server-middleware',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.url?.split('?')[0];
        if (!url || !url.startsWith('/api/')) {
          return next();
        }

        // Parse JSON body
        let body: any = {};
        if (req.method === 'POST') {
          const buffers: Buffer[] = [];
          for await (const chunk of req) {
            buffers.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
          }
          const raw = Buffer.concat(buffers).toString('utf8');
          try {
            body = raw ? JSON.parse(raw) : {};
          } catch {
            body = {};
          }
        }

        const mockRes = {
          status(code: number) {
            res.statusCode = code;
            return this;
          },
          json(data: any) {
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(data));
            return this;
          },
          send(text: string) {
            res.end(text);
            return this;
          },
          setHeader(key: string, val: string) {
            res.setHeader(key, val);
            return this;
          },
        };

        const mockReq = {
          ...req,
          body,
          headers: req.headers,
          query: {},
        };

        try {
          if (url === '/api/health') {
            return healthHandler(mockReq, mockRes);
          } else if (url === '/api/parse-expense') {
            return parseExpenseHandler(mockReq, mockRes);
          } else if (url === '/api/scan-bill') {
            return scanBillHandler(mockReq, mockRes);
          } else if (url === '/api/scam-check') {
            return scamCheckHandler(mockReq, mockRes);
          } else if (url === '/api/insights') {
            return insightsHandler(mockReq, mockRes);
          }
        } catch (err: any) {
          console.error('API middleware error:', err);
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: err?.message || 'Server error' }));
          return;
        }

        next();
      });
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), apiServerPlugin()],
});
