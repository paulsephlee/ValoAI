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

export const TeamCommunicationSchema = z.object({
  observation: z.string(),
  timestamp: z.string().nullable(),
  type: z.enum(['positive', 'negative']),
});

export const RoundSchema = z.object({
  round_number: z.number(),
  outcome: z.enum(['win', 'loss']),
  summary: z.string(),
  key_moment: z.string(),
  economy: z.string().nullable(),
});

export const EconomyIssueSchema = z.object({
  round_number: z.number(),
  issue: z.string(),
  impact: z.string(),
});

export const AgentCoachingSchema = z.object({
  ability: z.string(),
  advice: z.string(),
  timestamp: z.string().nullable(),
});

export const MapMetaSchema = z.object({
  detected_map: z.string(),
  pro_meta_notes: z.array(z.string()),
  player_deviation: z.array(z.string()),
});

export const AnalysisResultSchema = z.object({
  summary: z.string(),
  positives: z.array(z.string()),
  mistakes: z.array(MistakeSchema),
  improvements: z.array(ImprovementSchema),
  team_improvements: z.array(TeamImprovementSchema),
  team_communication: z.array(TeamCommunicationSchema),
  rounds: z.array(RoundSchema).optional().default([]),
  economy_issues: z.array(EconomyIssueSchema).optional().default([]),
  agent_coaching: z.array(AgentCoachingSchema).optional().default([]),
  map_meta: MapMetaSchema.nullable().optional().default(null),
});

export type AnalysisResult = z.infer<typeof AnalysisResultSchema>;
export type Mistake = z.infer<typeof MistakeSchema>;
export type Improvement = z.infer<typeof ImprovementSchema>;
export type TeamImprovement = z.infer<typeof TeamImprovementSchema>;
export type TeamCommunication = z.infer<typeof TeamCommunicationSchema>;
export type Round = z.infer<typeof RoundSchema>;
export type EconomyIssue = z.infer<typeof EconomyIssueSchema>;
export type AgentCoaching = z.infer<typeof AgentCoachingSchema>;
export type MapMeta = z.infer<typeof MapMetaSchema>;

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
