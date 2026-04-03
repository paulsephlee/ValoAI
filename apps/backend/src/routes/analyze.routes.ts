import type { FastifyInstance } from 'fastify';
import fs from 'fs/promises';
import path from 'path';
import { pipeline } from 'stream/promises';
import { createWriteStream } from 'fs';
import { eq, sql } from 'drizzle-orm';
import { db } from '../db/index.js';
import { jobs } from '../db/schema.js';
import { analyzeQueue } from '../lib/queue.js';
import { env } from '../env.js';
import { SubmitUrlRequestSchema } from '@valoai/shared';

export async function analyzeRoutes(app: FastifyInstance) {
  // POST /api/analyze/url — submit a video URL for analysis
  app.post('/api/analyze/url', async (request, reply) => {
    const parsed = SubmitUrlRequestSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Invalid URL' });
    }

    const [job] = await db
      .insert(jobs)
      .values({ inputType: 'url', inputValue: parsed.data.url, status: 'queued' })
      .returning();

    analyzeQueue.add('analyze', {
      jobId: job.id,
      inputType: 'url',
      inputValue: parsed.data.url,
    }).catch((err) => console.error('Failed to enqueue job:', err));

    return reply.status(202).send({ jobId: job.id, status: 'queued' });
  });

  // POST /api/analyze/upload — submit a video file for analysis
  app.post('/api/analyze/upload', async (request, reply) => {
    const data = await request.file({
      limits: { fileSize: env.MAX_VIDEO_SIZE_MB * 1024 * 1024 },
    });

    if (!data) {
      return reply.status(400).send({ error: 'No file provided' });
    }

    if (!data.mimetype.startsWith('video/')) {
      return reply.status(400).send({ error: 'File must be a video' });
    }

    await fs.mkdir(env.TEMP_DIR, { recursive: true });

    const [job] = await db
      .insert(jobs)
      .values({ inputType: 'upload', inputValue: '', status: 'queued' })
      .returning();

    const filePath = path.join(env.TEMP_DIR, `${job.id}.mp4`);
    await pipeline(data.file, createWriteStream(filePath));

    // Update with actual file path
    await db.update(jobs).set({ inputValue: filePath }).where(eq(jobs.id, job.id));

    await analyzeQueue.add('analyze', {
      jobId: job.id,
      inputType: 'upload',
      inputValue: filePath,
    });

    return reply.status(202).send({ jobId: job.id, status: 'queued' });
  });

  // GET /api/stats — average analysis time from completed jobs
  app.get('/api/stats', async (_request, reply) => {
    const result = await db.execute(
      sql`SELECT AVG(EXTRACT(EPOCH FROM (updated_at - created_at))) AS avg_seconds
          FROM jobs WHERE status = 'complete'`
    );
    const avg = result.rows[0]?.avg_seconds;
    return reply.send({ avgSeconds: avg ? Math.round(Number(avg)) : null });
  });

  // GET /api/jobs/:id — poll job status
  app.get('/api/jobs/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const [job] = await db.select().from(jobs).where(eq(jobs.id, id));

    if (!job) return reply.status(404).send({ error: 'Job not found' });

    return {
      jobId: job.id,
      status: job.status,
      result: job.result ?? null,
      error: job.error ?? null,
      createdAt: job.createdAt.toISOString(),
    };
  });
}
