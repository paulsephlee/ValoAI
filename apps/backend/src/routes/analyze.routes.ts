import type { FastifyInstance } from 'fastify';
import fs from 'fs/promises';
import path from 'path';
import { pipeline } from 'stream/promises';
import { createWriteStream } from 'fs';
import { eq, sql } from 'drizzle-orm';
import { db } from '../db/index.js';
import { jobs } from '../db/schema.js';
import { analyzeQueue } from '../lib/queue.js';
import { startAnalysisChat } from '../lib/gemini.js';
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
    const parts = request.parts({ limits: { fileSize: env.MAX_VIDEO_SIZE_MB * 1024 * 1024 } });

    let fileData: Awaited<ReturnType<typeof request.file>> | null = null;
    let rank: string | undefined;
    let agent: string | undefined;

    for await (const part of parts) {
      if (part.type === 'file') {
        fileData = part;
        await fs.mkdir(env.TEMP_DIR, { recursive: true });
        const [job] = await db
          .insert(jobs)
          .values({ inputType: 'upload', inputValue: '', status: 'queued', rank, agent })
          .returning();
        const filePath = path.join(env.TEMP_DIR, `${job.id}.mp4`);
        await pipeline(part.file, createWriteStream(filePath));
        await db.update(jobs).set({ inputValue: filePath }).where(eq(jobs.id, job.id));
        await analyzeQueue.add('analyze', {
          jobId: job.id,
          inputType: 'upload',
          inputValue: filePath,
          rank,
          agent,
        });
        return reply.status(202).send({ jobId: job.id, status: 'queued' });
      } else {
        if (part.fieldname === 'rank') rank = part.value as string;
        if (part.fieldname === 'agent') agent = part.value as string;
      }
    }

    if (!fileData) return reply.status(400).send({ error: 'No file provided' });
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

  // POST /api/jobs/:id/chat — chat about a completed analysis
  app.post('/api/jobs/:id/chat', async (request, reply) => {
    const { id } = request.params as { id: string };
    const { message, history = [] } = request.body as {
      message: string;
      history: { role: 'user' | 'model'; parts: { text: string }[] }[];
    };

    if (!message?.trim()) return reply.status(400).send({ error: 'Message is required' });

    const [job] = await db.select().from(jobs).where(eq(jobs.id, id));
    if (!job || job.status !== 'complete' || !job.result) {
      return reply.status(404).send({ error: 'Analysis not found' });
    }

    const chat = startAnalysisChat(job.result, history);
    const result = await chat.sendMessage(message);
    return reply.send({ response: result.response.text() });
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
