import Fastify from 'fastify';
import cors from '@fastify/cors';
import multipart from '@fastify/multipart';
import rateLimit from '@fastify/rate-limit';
import { env } from './env.js';
import { runMigrations } from './db/migrate.js';
import { analyzeRoutes } from './routes/analyze.routes.js';
import './worker/analyze.worker.js'; // starts DB polling loop

await runMigrations();

const app = Fastify({ logger: true, bodyLimit: 2147483648 });

await app.register(cors, { origin: env.FRONTEND_URL });
await app.register(multipart, { limits: { fileSize: env.MAX_VIDEO_SIZE_MB * 1024 * 1024 } });
await app.register(rateLimit, {
  max: 100,
  timeWindow: '1 hour',
  keyGenerator: (req) => req.ip,
});

await app.register(analyzeRoutes);

app.get('/api/health', async () => ({ ok: true }));

await app.listen({ port: env.PORT, host: '0.0.0.0' });
console.log(`ValoAI backend running on port ${env.PORT}`);
