import { Worker } from 'bullmq';
import youtubedl from 'youtube-dl-exec';
import fs from 'fs/promises';
import path from 'path';
import { eq } from 'drizzle-orm';
import { db } from '../db/index.js';
import { jobs } from '../db/schema.js';
import { connection } from '../lib/queue.js';
import { fileManager, model, waitForFileActive, ANALYSIS_PROMPT } from '../lib/gemini.js';
import { env } from '../env.js';
import { AnalysisResultSchema } from '@valoai/shared';

async function setStatus(jobId: string, status: string) {
  await db.update(jobs).set({ status, updatedAt: new Date() }).where(eq(jobs.id, jobId));
}

async function downloadVideo(url: string, jobId: string): Promise<string> {
  await fs.mkdir(env.TEMP_DIR, { recursive: true });
  const outPath = path.join(env.TEMP_DIR, `${jobId}.mp4`);
  await youtubedl(url, {
    maxFilesize: `${env.MAX_VIDEO_SIZE_MB}m`,
    matchFilter: `duration <= ${env.MAX_VIDEO_DURATION_MINUTES * 60}`,
    format: 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best',
    output: outPath,
  });
  return outPath;
}

async function cleanup(filePath: string) {
  try {
    await fs.unlink(filePath);
  } catch {
    // ignore — file may not exist
  }
}

export const worker = new Worker(
  'analyze',
  async (job) => {
    const { jobId, inputType, inputValue } = job.data as {
      jobId: string;
      inputType: 'upload' | 'url';
      inputValue: string;
    };

    let videoPath = inputValue;

    try {
      // Step 1: Download if URL input
      if (inputType === 'url') {
        await setStatus(jobId, 'downloading');
        videoPath = await downloadVideo(inputValue, jobId);
      }

      // Step 2: Upload to Gemini File API
      await setStatus(jobId, 'uploading');
      const uploadResponse = await fileManager.uploadFile(videoPath, {
        mimeType: 'video/mp4',
        displayName: `valoai-${jobId}`,
      });

      // Step 3: Wait for Gemini to process the file
      const activeFile = await waitForFileActive(uploadResponse.file);

      // Step 4: Run analysis
      await setStatus(jobId, 'analyzing');
      const result = await model.generateContent([
        ANALYSIS_PROMPT,
        { fileData: { mimeType: activeFile.mimeType, fileUri: activeFile.uri } },
      ]);

      const raw = JSON.parse(result.response.text());
      const parsed = AnalysisResultSchema.parse(raw);

      // Step 5: Store result
      await db
        .update(jobs)
        .set({ status: 'complete', result: parsed, updatedAt: new Date() })
        .where(eq(jobs.id, jobId));
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      await db
        .update(jobs)
        .set({ status: 'failed', error: message, updatedAt: new Date() })
        .where(eq(jobs.id, jobId));
      throw err;
    } finally {
      await cleanup(videoPath);
    }
  },
  {
    connection,
    concurrency: 2,
    limiter: { max: 10, duration: 60_000 },
  }
);

// Temp file cleanup cron — delete any files older than 2 hours
setInterval(async () => {
  try {
    const files = await fs.readdir(env.TEMP_DIR);
    const now = Date.now();
    for (const file of files) {
      const full = path.join(env.TEMP_DIR, file);
      const stat = await fs.stat(full);
      if (now - stat.mtimeMs > 2 * 60 * 60 * 1000) {
        await fs.unlink(full);
      }
    }
  } catch {
    // ignore
  }
}, 30 * 60 * 1000);

console.log('Analyze worker started');
