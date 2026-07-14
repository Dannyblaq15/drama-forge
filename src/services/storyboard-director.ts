import { chatCompletion } from './dashscope';
import type { ScriptwriterOutput } from './scriptwriter';

export interface Shot {
  shotId: string;
  composition: string;
  characterPositions: string;
  cameraAngle: string;
  durationSeconds: number;
}

export interface StoryboardDirectorOutput {
  sceneId?: string;
  shots: Shot[];
}

export async function generateSceneStoryboard(episodeId: string, script: ScriptwriterOutput): Promise<StoryboardDirectorOutput> {
  const systemPrompt = `You are a Storyboard Director specializing in vertical cinematic composition for mobile screens.
Given a scene's script (dialogue, action lines, and camera directions), break it down into a sequence of discrete shots (typically 2 to 4 shots per scene).
Focus on vertical optimization (framing, positioning characters in a 9:16 layout).

Return a JSON object exactly matching this schema:
{
  "shots": [
    {
      "shotId": "string (unique shot ID like shot_1_1, shot_1_2, etc.)",
      "composition": "string (e.g. Extreme Close-up, Close-up, Medium Shot, Over-the-shoulder)",
      "characterPositions": "string (where characters stand/sit on screen in 9:16 frame, e.g. 'A on left facing right, B center')",
      "cameraAngle": "string (e.g. Eye level, Low angle, High angle, Dutch angle)",
      "durationSeconds": number (duration of the shot, between 2 and 6 seconds)
    }
  ]
}
Strictly output raw, valid JSON only. Do not wrap in markdown code blocks.`;

  const userContent = `Scene Script:
Scene ID: ${script.sceneId}
Action Lines:
${script.actionLines.map(line => `- ${line}`).join('\n')}
Dialogue:
${script.dialogue.map(d => `${d.character}: "${d.line}"`).join('\n')}
Camera Direction: ${script.cameraDirection}`;

  const rawResponse = await chatCompletion(episodeId, `Storyboard Director - Scene ${script.sceneId}`, 'qwen-max', [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userContent },
  ], false);

  const parsed: StoryboardDirectorOutput = JSON.parse(rawResponse);
  parsed.sceneId = script.sceneId;
  parsed.shots.forEach((shot, index) => {
    if (!shot.shotId) shot.shotId = `${script.sceneId}_shot_${index + 1}`;
    if (!shot.durationSeconds || shot.durationSeconds <= 0) shot.durationSeconds = 4;
  });

  return parsed;
}

export async function generateAllStoryboards(episodeId: string, scripts: ScriptwriterOutput[]): Promise<StoryboardDirectorOutput[]> {
  return Promise.all(scripts.map(script => generateSceneStoryboard(episodeId, script)));
}
