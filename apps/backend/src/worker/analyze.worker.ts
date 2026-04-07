import { execFile } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import { eq, or, sql } from 'drizzle-orm';
import { db } from '../db/index.js';
import { jobs } from '../db/schema.js';
import { fileManager, model, waitForFileActive, ANALYSIS_PROMPT } from '../lib/gemini.js';
import { env } from '../env.js';
import { AnalysisResultSchema } from '@valoai/shared';

const execFileAsync = promisify(execFile);
const MAX_CONCURRENCY = 2;
let activeJobs = 0;

async function setStatus(jobId: string, status: string) {
  await db.update(jobs).set({ status, updatedAt: new Date() }).where(eq(jobs.id, jobId));
}

async function cleanup(filePath: string) {
  try {
    await fs.unlink(filePath);
  } catch {
    // ignore — file may not exist
  }
}

async function processJob(job: typeof jobs.$inferSelect) {
  const videoPath = job.inputValue;

  try {
    // Upload to Gemini File API
    await setStatus(job.id, 'uploading');
    const fileStat = await fs.stat(videoPath);
    console.log(`[${job.id}] Video saved — size: ${(fileStat.size / 1024 / 1024).toFixed(2)} MB, mimeType: ${job.mimeType ?? 'video/mp4'}`);

    const uploadResponse = await fileManager.uploadFile(videoPath, {
      mimeType: job.mimeType ?? 'video/mp4',
      displayName: `valoai-${job.id}`,
    });
    console.log(`[${job.id}] Gemini upload complete — file name: ${uploadResponse.file.name}, initial state: ${uploadResponse.file.state}`);

    // Wait for Gemini to process the file
    const activeFile = await waitForFileActive(uploadResponse.file);
    console.log(`[${job.id}] Gemini file active — uri: ${activeFile.uri}, mimeType: ${activeFile.mimeType}`);

    // Run analysis
    await setStatus(job.id, 'analyzing');
    const contextNote = [
      job.rank ? `The player's rank is: ${job.rank}.` : '',
      job.agent ? `The agent they played is: ${job.agent}. Do not suggest a different agent — this is confirmed.` : '',
      job.map ? `The map being played is: ${job.map}. Do not suggest a different map — this is confirmed.` : '',
    ].filter(Boolean).join(' ');

    console.log(`[${job.id}] Context note: "${contextNote || '(none)'}"`);

    const prompt = contextNote
      ? `${ANALYSIS_PROMPT}\n\nPlayer context: ${contextNote} Tailor all feedback accordingly.`
      : ANALYSIS_PROMPT;

    const result = await model.generateContent([
      prompt,
      { fileData: { mimeType: activeFile.mimeType, fileUri: activeFile.uri } },
    ]);

    const responseText = result.response.text();
    console.log(`[${job.id}] Gemini raw response (first 500 chars): ${responseText.slice(0, 500)}`);

    const raw = JSON.parse(responseText);
    const parsed = AnalysisResultSchema.parse(raw);

    await db
      .update(jobs)
      .set({ status: 'complete', result: parsed, updatedAt: new Date() })
      .where(eq(jobs.id, job.id));
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await db
      .update(jobs)
      .set({ status: 'failed', error: message, updatedAt: new Date() })
      .where(eq(jobs.id, job.id));
  } finally {
    await cleanup(videoPath);
  }
}

// Atomically claim one queued job using FOR UPDATE SKIP LOCKED
async function claimNextJob(): Promise<typeof jobs.$inferSelect | null> {
  const result = await db.execute(sql`
    UPDATE jobs
    SET status = 'uploading', updated_at = NOW()
    WHERE id = (
      SELECT id FROM jobs
      WHERE status = 'queued'
      ORDER BY created_at
      LIMIT 1
      FOR UPDATE SKIP LOCKED
    )
    RETURNING *
  `);
  return (result.rows[0] as typeof jobs.$inferSelect) ?? null;
}

async function pollForJobs() {
  if (activeJobs >= MAX_CONCURRENCY) return;
  try {
    const job = await claimNextJob();
    if (!job) return;
    activeJobs++;
    processJob(job).finally(() => { activeJobs--; });
  } catch (err) {
    console.error('Poll error:', err);
  }
}

// On startup reset any jobs stuck mid-processing (e.g. from a previous crash)
await db
  .update(jobs)
  .set({ status: 'queued', updatedAt: new Date() })
  .where(or(
    eq(jobs.status, 'downloading'),
    eq(jobs.status, 'uploading'),
    eq(jobs.status, 'analyzing'),
  ));
console.log('Reset any stuck jobs to queued');

setInterval(pollForJobs, 3000);

// Temp file cleanup — delete files older than 2 hours
setInterval(async () => {
  try {
    const files = await fs.readdir(env.TEMP_DIR);
    const now = Date.now();
    for (const file of files) {
      const full = path.join(env.TEMP_DIR, file);
      const stat = await fs.stat(full);
      if (now - stat.mtimeMs > 2 * 60 * 60 * 1000) await fs.unlink(full);
    }
  } catch { /* ignore */ }
}, 30 * 60 * 1000);

console.log('Analyze worker started (DB polling mode — no Redis required)');
