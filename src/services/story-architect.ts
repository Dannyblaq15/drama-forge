import { chatCompletion } from './dashscope';
import type { HookStrategistOutput } from './hook-strategist';

export interface Scene {
  sceneId: string;
  setting: string;
  charactersPresent: string[];
  emotionalBeat: string;
  plotLine: 'main' | 'hidden';
}

export interface StoryArchitectOutput {
  scenes: Scene[];
}

export async function generateStory(episodeId: string, hookStrategy: HookStrategistOutput): Promise<StoryArchitectOutput> {
  const systemPrompt = `You are a Story Architect in a short-drama film studio.
Take the hook strategy details and map out the narrative spine as a series of sequential scenes (typically 3 to 5 scenes).
Since vertical drama is fast-paced, we use a dual-line plot structure.
Encode a dual-line structure across the scenes:
- "main": The obvious, apparent plot line.
- "hidden": A hidden reversal or twist line that is secretly playing out and gets revealed towards the end.

Return a JSON object matching this schema:
{
  "scenes": [
    {
      "sceneId": "string (unique scene ID like scene_1, scene_2)",
      "setting": "string (physical setting description, time of day)",
      "charactersPresent": ["string (list of character names participating in this scene)"],
      "emotionalBeat": "string (description of the dramatic or emotional tone)",
      "plotLine": "string (must be 'main' or 'hidden')"
    }
  ]
}
Strictly output raw, valid JSON only. Do not wrap in markdown code blocks.`;

  const userContent = `Hook Strategy:
Title: ${hookStrategy.title}
Genre: ${hookStrategy.genre}
Commercial Angle: ${hookStrategy.commercialAngle}
Target Runtime: ${hookStrategy.targetRuntimeSeconds} seconds`;

  const rawResponse = await chatCompletion(episodeId, 'Story Architect', 'qwen-max', [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userContent },
  ], true);

  const parsed: StoryArchitectOutput = JSON.parse(rawResponse);
  return parsed;
}
