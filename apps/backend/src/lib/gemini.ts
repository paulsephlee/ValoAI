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
    rounds: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          round_number: { type: 'integer' },
          outcome: { type: 'string', enum: ['win', 'loss'] },
          summary: { type: 'string' },
          key_moment: { type: 'string' },
          economy: { type: 'string', nullable: true },
        },
        required: ['round_number', 'outcome', 'summary', 'key_moment'],
      },
    },
    economy_issues: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          round_number: { type: 'integer' },
          issue: { type: 'string' },
          impact: { type: 'string' },
        },
        required: ['round_number', 'issue', 'impact'],
      },
    },
    agent_coaching: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          ability: { type: 'string' },
          advice: { type: 'string' },
          timestamp: { type: 'string', nullable: true },
        },
        required: ['ability', 'advice'],
      },
    },
    map_meta: {
      type: 'object',
      nullable: true,
      properties: {
        detected_map: { type: 'string' },
        pro_meta_notes: { type: 'array', items: { type: 'string' } },
        player_deviation: { type: 'array', items: { type: 'string' } },
      },
      required: ['detected_map', 'pro_meta_notes', 'player_deviation'],
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

export const ANALYSIS_PROMPT = `IMPORTANT: You are analyzing an actual video file that has been provided to you. Only describe what you can directly see and hear in this specific video. Do not invent gameplay, agents, maps, rounds, or events that are not visible in the footage. If you cannot clearly see a specific detail (e.g. the map, agent, or round number), leave those optional fields as empty arrays or null — never guess or fabricate.

You are an elite Valorant coach with deep knowledge of professional VCT play.
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

Round-by-round breakdown (for rounds): identify each visible round from the HUD — the round number is shown in the top center of the screen. For each round provide: round_number (integer), outcome (win or loss based on which team's score increments), a short summary of what happened, the single most impactful key_moment, and any notable economy note (or null if economy was standard). List every round you can identify in order.

Economy tracking (for economy_issues): watch the buy phase HUD at the start of each round — note the player's and teammates' credits and loadouts. Flag situations such as: buying full when the team is eco/force (breaking economy), force buying after a loss when credits are too low for a proper buy, buying a rifle while teammates run pistols on a force round, or saving when the team could have full bought. For each issue specify round_number, what the issue was (issue), and how it likely impacted the round outcome (impact).

Agent-specific coaching (for agent_coaching): based on the agent the player is using, evaluate every ability (including ultimate). For each ability flag any misuse, underuse, missed opportunities, or excellent usage. Cite pro-level usage of that ability where relevant. Provide the ability name, coaching advice, and timestamp if available.

Map meta (for map_meta): identify the map from the in-game visuals (minimap shape, site layouts, skybox, landmarks). Set detected_map to the map name (e.g. "Ascent", "Bind", "Haven", etc.). In pro_meta_notes list 3-5 key pro meta facts about this specific map in VCT 2025 (dominant site, standard default, common execute patterns, typical sentinel setups). In player_deviation list specific moments where the player or team deviated from the pro meta on this map — be precise about location and round.

Where relevant, mention specific pro-level concepts by name (e.g. "pro teams run a standard default here", "this is a common VCT execute pattern", "pros would use [utility] to clear this corner before committing").

Be specific — reference timestamps, locations, and what the player did vs. what they should have done.

Return structured JSON following the provided schema.`;
