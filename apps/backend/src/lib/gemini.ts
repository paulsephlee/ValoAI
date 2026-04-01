import {
  GoogleGenerativeAI,
  SchemaType,
  type FileMetadataResponse,
} from '@google/generative-ai';
import { GoogleAIFileManager } from '@google/generative-ai/server';
import { env } from '../env.js';

const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
export const fileManager = new GoogleAIFileManager(env.GEMINI_API_KEY);

export const model = genAI.getGenerativeModel({
  model: 'gemini-1.5-pro',
  generationConfig: {
    responseMimeType: 'application/json',
    responseSchema: {
      type: SchemaType.OBJECT,
      properties: {
        summary: { type: SchemaType.STRING },
        positives: {
          type: SchemaType.ARRAY,
          items: { type: SchemaType.STRING },
        },
        mistakes: {
          type: SchemaType.ARRAY,
          items: {
            type: SchemaType.OBJECT,
            properties: {
              timestamp: { type: SchemaType.STRING },
              description: { type: SchemaType.STRING },
              severity: {
                type: SchemaType.STRING,
                enum: ['low', 'medium', 'high'],
              },
            },
            required: ['timestamp', 'description', 'severity'],
          },
        },
        improvements: {
          type: SchemaType.ARRAY,
          items: {
            type: SchemaType.OBJECT,
            properties: {
              category: {
                type: SchemaType.STRING,
                enum: ['positioning', 'utility', 'aim', 'game-sense', 'communication'],
              },
              advice: { type: SchemaType.STRING },
              timestamp: { type: SchemaType.STRING, nullable: true },
            },
            required: ['category', 'advice'],
          },
        },
        overall_rating: { type: SchemaType.NUMBER },
      },
      required: ['summary', 'positives', 'mistakes', 'improvements', 'overall_rating'],
    },
  },
});

export async function waitForFileActive(file: FileMetadataResponse) {
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

Be specific — reference timestamps, locations, and what the player did vs. what they should have done.
Rate the overall performance from 1–10 where 5 is average for the rank shown.

Return structured JSON following the provided schema.`;
