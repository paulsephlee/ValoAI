import { z } from 'zod';

// ── Job status ────────────────────────────────────────────────────────────────

export const JobStatus = {
  QUEUED: 'queued',
  DOWNLOADING: 'downloading',
  UPLOADING: 'uploading',
  ANALYZING: 'analyzing',
  COMPLETE: 'complete',
  FAILED: 'failed',
} as const;

export type JobStatus = (typeof JobStatus)[keyof typeof JobStatus];

// ── Analysis result schema ────────────────────────────────────────────────────

export const MistakeSchema = z.object({
  timestamp: z.string(),
  description: z.string(),
  severity: z.enum(['low', 'medium', 'high']),
});

export const ImprovementSchema = z.object({
  category: z.enum(['positioning', 'utility', 'aim', 'game-sense', 'communication']),
  advice: z.string(),
  timestamp: z.string().nullable(),
});

export const TeamImprovementSchema = z.object({
  advice: z.string(),
  timestamp: z.string().nullable(),
});

export const AnalysisResultSchema = z.object({
  summary: z.string(),
  positives: z.array(z.string()),
  mistakes: z.array(MistakeSchema),
  improvements: z.array(ImprovementSchema),
  team_improvements: z.array(TeamImprovementSchema),
});

export type AnalysisResult = z.infer<typeof AnalysisResultSchema>;
export type Mistake = z.infer<typeof MistakeSchema>;
export type Improvement = z.infer<typeof ImprovementSchema>;
export type TeamImprovement = z.infer<typeof TeamImprovementSchema>;

// ── API response types ────────────────────────────────────────────────────────

export const JobResponseSchema = z.object({
  jobId: z.string(),
  status: z.enum(['queued', 'downloading', 'uploading', 'analyzing', 'complete', 'failed']),
  result: AnalysisResultSchema.nullable(),
  error: z.string().nullable(),
  createdAt: z.string(),
});

export type JobResponse = z.infer<typeof JobResponseSchema>;

export const SubmitUrlRequestSchema = z.object({
  url: z.string().url(),
});

export type SubmitUrlRequest = z.infer<typeof SubmitUrlRequestSchema>;
