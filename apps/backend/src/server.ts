import Fastify from 'fastify';
import cors from '@fastify/cors';
import multipart from '@fastify/multipart';
import rateLimit from '@fastify/rate-limit';
import { env } from './env.js';
import { analyzeRoutes } from './routes/analyze.routes.js';
import './worker/analyze.worker.js';

const app = Fastify({ logger: true });

await app.register(cors, { origin: env.FRONTEND_URL });
await app.register(multipart);
await app.register(rateLimit, {
  max: 5,
  timeWindow: '1 hour',
  keyGenerator: (req) => req.ip,
});

await app.register(analyzeRoutes);

app.get('/api/health', async () => ({ ok: true }));

await app.listen({ port: env.PORT, host: '0.0.0.0' });
console.log(`ValoAI backend running on port ${env.PORT}`);
