import { GoogleGenerativeAI } from '@google/generative-ai';
import { GoogleAIFileManager } from '@google/generative-ai/server';
import { env } from '../env.js';

const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
export const fileManager = new GoogleAIFileManager(env.GEMINI_API_KEY);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const responseSchema: any = {
  type: 'object',
  properties: {
    summary: { type: 'string' },
    positives: {
      type: 'array',
      items: { type: 'string' },
    },
    mistakes: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          timestamp: { type: 'string' },
          description: { type: 'string' },
          severity: { type: 'string', enum: ['low', 'medium', 'high'] },
        },
        required: ['timestamp', 'description', 'severity'],
      },
    },
    improvements: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          category: {
            type: 'string',
            enum: ['positioning', 'utility', 'aim', 'game-sense', 'communication'],
          },
          advice: { type: 'string' },
          timestamp: { type: 'string', nullable: true },
        },
        required: ['category', 'advice'],
      },
    },
    team_improvements: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          advice: { type: 'string' },
          timestamp: { type: 'string', nullable: true },
        },
        required: ['advice'],
      },
    },
    team_communication: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          observation: { type: 'string' },
          timestamp: { type: 'string', nullable: true },
          type: { type: 'string', enum: ['positive', 'negative'] },
        },
        required: ['observation', 'type'],
      },
    },
  },
  required: ['summary', 'positives', 'mistakes', 'improvements', 'team_improvements', 'team_communication'],
};

export const model = genAI.getGenerativeModel({
  model: 'gemini-2.5-flash',
  generationConfig: {
    responseMimeType: 'application/json',
    responseSchema,
  },
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function waitForFileActive(file: any) {
  let current = file;
  while (current.state === 'PROCESSING') {
    await new Promise((r) => setTimeout(r, 3000));
    current = await fileManager.getFile(file.name);
  }
  if (current.state !== 'ACTIVE') {
    throw new Error(`Gemini file processing failed: ${current.state}`);
  }
  return current;
}

const chatModel = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

export function startAnalysisChat(
  analysisResult: object,
  history: { role: 'user' | 'model'; parts: { text: string }[] }[]
) {
  const systemPrompt = `You are an expert Valorant coach. The player has just received this AI analysis of their gameplay clip:\n\n${JSON.stringify(analysisResult, null, 2)}\n\nAnswer any questions they have about this specific clip. Be concise, specific, and reference the analysis above. Use Valorant terminology and refer to VCT pro play where relevant.`;

  return chatModel.startChat({
    history: [
      { role: 'user', parts: [{ text: systemPrompt }] },
      { role: 'model', parts: [{ text: 'I\'ve reviewed your analysis. What would you like to know about your gameplay?' }] },
      ...history,
    ],
  });
}

export const ANALYSIS_PROMPT = `You are an elite Valorant coach with deep knowledge of professional VCT play.
You have studied the 2025 VCT international events — Masters Bangkok, Masters Toronto, and Champions 2025 — including the strategies, rotations, utility setups, and team coordination used by top teams such as Sentinels, Team Liquid, FNATIC, EDG, NRE, Leviatán, LOUD, T1, and others.

Use professional VCT 2025 standards as your benchmark when evaluating the clip. Reference how pro teams handle the same situations — e.g. how pros execute onto a site with coordinated utility, how initiators create space, how sentinels hold flanks, how teams rotate based on info.

Analyze the footage and provide detailed, actionable feedback.

Focus on:
- Crosshair placement and pre-aiming common angles
- Peeking mechanics (wide peeks, shoulder peeks, jiggle peeks)
- Trading angles and supporting teammates
- Utility usage (timing, placement, coordination) — compare to how pro teams use the same agents' kits
- Positioning (map control, off-angles, exposed positions) — compare to pro-level map control standards
- Game sense (rotations, information usage, economy decisions)
- Communication indicators (rushing alone, failing to trade)
- Minimap awareness (top-left corner of the screen): watch how often the player checks the minimap, whether they react to teammate positions shown on it, whether they rotate or adjust based on where allies are clustered or spread, and whether they leave teammates isolated by not grouping or trading
- Team positioning (for team_improvements): observe all 5 players on the minimap and in the footage — identify positioning mistakes the team makes as a whole, comparing to how VCT pro teams structure their setups, defaults, and executes on the same map
- Team communication (for team_communication): listen closely to the audio for actual player voice comms — note both positives (clear callouts, good info sharing, calm shot-calling) and negatives (vague callouts, silence during executes, arguing after deaths, players not calling their status like low HP or abilities used, talking over each other)

Where relevant, mention specific pro-level concepts by name (e.g. "pro teams run a standard default here", "this is a common VCT execute pattern", "pros would use [utility] to clear this corner before committing").

Be specific — reference timestamps, locations, and what the player did vs. what they should have done.

Return structured JSON following the provided schema.`;
