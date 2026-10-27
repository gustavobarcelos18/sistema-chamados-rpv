import http from 'node:http';
import type { Plugin } from 'vite';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Em desenvolvimento, /api é encaminhado para a API NestJS (porta 3000),
// então o backend não precisa de CORS. Para outra API: API_PROXY=http://host:porta npm run dev
const alvo = new URL(process.env.API_PROXY ?? 'http://localhost:3000');

// Proxy próprio, em vez do embutido do Vite: o embutido imprime um stack de
// ECONNREFUSED para cada requisição quando a API está fora do ar.
function apiProxy(): Plugin {
  return {
    name: 'api-proxy',
    configureServer(server) {
      let avisado = false;

      server.middlewares.use('/api', (req, res) => {
        const upstream = http.request(
          {
            hostname: alvo.hostname,
            port: alvo.port,
            method: req.method,
            path: req.url,
            headers: { ...req.headers, host: alvo.host },
          },
          (resposta) => {
            avisado = false;
            res.writeHead(resposta.statusCode ?? 502, resposta.headers);
            resposta.pipe(res);
          },
        );

        upstream.on('error', () => {
          if (!avisado) {
            avisado = true;
            console.warn(`[api] ${alvo.origin} não responde. Suba o backend (npm run start:dev na raiz).`);
          }
          if (!res.headersSent) {
            res.writeHead(503, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ message: 'API indisponível. Ela está rodando?' }));
          }
        });

        req.pipe(upstream);
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), apiProxy()],
  server: {
    port: 5173,
  },
});
