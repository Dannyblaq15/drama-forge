import { chatCompletion } from './dashscope';

export interface HookStrategistOutput {
  title: string;
  genre: string;
  commercialAngle: string;
  targetRuntimeSeconds: number;
}

export async function generateHook(episodeId: string, premise: string): Promise<HookStrategistOutput> {
  const systemPrompt = `You are a Hook Strategist in a short-drama film studio.
Analyze the user's premise and formulate a high-converting vertical short drama strategy.
Return a JSON object exactly matching the schema:
{
  "title": "string (strictly <= 15 characters, engaging, clickbaity)",
  "genre": "string (e.g. Cyberpunk, Melodrama, Revenge, Werewolf)",
  "commercialAngle": "string (explain why this hooks vertical mobile drama viewers in 3 seconds)",
  "targetRuntimeSeconds": number (between 60 and 120)
}
Strictly output raw, valid JSON only. Do not wrap in markdown code blocks.`;

  const rawResponse = await chatCompletion(episodeId, 'Hook Strategist', 'qwen-max', [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: `Premise: ${premise}` },
  ], true);

  const parsed: HookStrategistOutput = JSON.parse(rawResponse);
  if (parsed.title.length > 15) parsed.title = parsed.title.slice(0, 15);
  if (!parsed.targetRuntimeSeconds) parsed.targetRuntimeSeconds = 90;
  return parsed;
}
