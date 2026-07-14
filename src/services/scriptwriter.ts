import { chatCompletion } from './dashscope';
import type { Scene } from './story-architect';

export interface DialogueLine {
  character: string;
  line: string;
}

export interface ScriptwriterOutput {
  sceneId: string;
  dialogue: DialogueLine[];
  actionLines: string[];
  cameraDirection: string;
}

export async function generateSceneScript(episodeId: string, scene: Scene): Promise<ScriptwriterOutput> {
  const systemPrompt = `You are an expert Scriptwriter specializing in snappy, dramatic mobile vertical dramas.
Given a scene outline (setting, characters, emotional beat, and plot line type), generate the actual screenplay for that scene.
The scene should contain brief, high-tension verbal dialogue and explicit physical actions.

Return a JSON object matching this schema:
{
  "sceneId": "string (should match the input sceneId)",
  "dialogue": [
    {
      "character": "string (name of the character speaking)",
      "line": "string (the exact dialogue line)"
    }
  ],
  "actionLines": ["string (physical actions of the characters, facial expressions)"],
  "cameraDirection": "string (description of camera framing, zoom, or focus)"
}
Strictly output raw, valid JSON only. Do not wrap in markdown code blocks.`;

  const userContent = `Scene Details:
Scene ID: ${scene.sceneId}
Setting: ${scene.setting}
Characters Present: ${scene.charactersPresent.join(', ')}
Emotional Beat: ${scene.emotionalBeat}
Plot Line: ${scene.plotLine}`;

  const rawResponse = await chatCompletion(episodeId, `Scriptwriter - Scene ${scene.sceneId}`, 'qwen-plus', [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userContent },
  ], false);

  const parsed: ScriptwriterOutput = JSON.parse(rawResponse);
  return parsed;
}

export async function generateAllScripts(episodeId: string, scenes: Scene[]): Promise<ScriptwriterOutput[]> {
  return Promise.all(scenes.map(scene => generateSceneScript(episodeId, scene)));
}
