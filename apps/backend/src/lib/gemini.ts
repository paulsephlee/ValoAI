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
    overall_rating: { type: 'number' },
  },
  required: ['summary', 'positives', 'mistakes', 'improvements', 'team_improvements', 'overall_rating'],
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

export const ANALYSIS_PROMPT = `You are an expert Valorant coach reviewing a gameplay clip.
Analyze the footage and provide detailed, actionable feedback.

Focus on:
- Crosshair placement and pre-aiming common angles
- Peeking mechanics (wide peeks, shoulder peeks, jiggle peeks)
- Trading angles and supporting teammates
- Utility usage (timing, placement, coordination)
- Positioning (map control, off-angles, exposed positions)
- Game sense (rotations, information usage, economy decisions)
- Communication indicators (rushing alone, failing to trade)
- Minimap awareness (top-left corner of the screen): watch how often the player checks the minimap, whether they react to teammate positions shown on it, whether they rotate or adjust based on where allies are clustered or spread, and whether they leave teammates isolated by not grouping or trading
- Team positioning (for team_improvements): observe all 5 players visible on the minimap and in the footage — identify positioning mistakes made by the team as a whole, such as being spread too far apart, multiple players holding the same angle, no one covering a flank, or the team not stacking onto a winning fight

Be specific — reference timestamps, locations, and what the player did vs. what they should have done.
Rate the overall performance from 1–10 where 5 is average for the rank shown.

Return structured JSON following the provided schema.`;
