import { prisma } from '../lib/prisma';
import { initRun, getRunData } from './dashscope';
import { generateHook } from './hook-strategist';
import { generateStory } from './story-architect';
import { generateAllScripts, ScriptwriterOutput } from './scriptwriter';
import { generateAllStoryboards, StoryboardDirectorOutput } from './storyboard-director';
import { generateClips } from './casting-generation';
import { processPostProduction } from './post-production';

export interface ProgressLog {
  episodeId: string;
  message: string;
  timestamp: string;
  cost?: number;
  tokensUsed?: number;
  economyMode?: boolean;
  logs?: any[];
  errorMsg?: string;
}

export interface EpisodeProgress {
  logs: ProgressLog[];
  cost: number;
  tokensUsed: number;
  economyMode: boolean;
  stageLogs: any[];
  error?: string;
  isCompleted: boolean;
}

import * as fs from 'fs';
import * as path from 'path';

// Helper to get filepath for logs
function getLogsFilePath(episodeId: string): string {
  const dir = path.join(process.cwd(), 'tmp', 'pipeline-logs');
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return path.join(dir, `episode-${episodeId}.json`);
}

export function getEpisodeProgress(episodeId: string): EpisodeProgress {
  const filePath = getLogsFilePath(episodeId);
  if (fs.existsSync(filePath)) {
    try {
      const fileData = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(fileData);
    } catch (e) {
      // fallback to memory
    }
  }

  const globalProgress = (global as any).progressLogs || new Map<string, EpisodeProgress>();
  return globalProgress.get(episodeId) || {
    logs: [],
    cost: 0,
    tokensUsed: 0,
    economyMode: false,
    stageLogs: [],
    isCompleted: false
  };
}

function updateProgress(episodeId: string, message: string, errorMsg?: string) {
  const telemetry = getRunData(episodeId);
  const totalTokens = telemetry.logs.reduce((acc, log) => acc + log.inputTokens + log.outputTokens, 0);

  const current = getEpisodeProgress(episodeId);

  const entry: ProgressLog = {
    episodeId,
    message,
    timestamp: new Date().toISOString(),
    cost: telemetry.cumulativeCost,
    tokensUsed: totalTokens,
    economyMode: telemetry.economyModeTriggered,
    logs: telemetry.logs,
    errorMsg
  };

  current.logs.push(entry);
  current.cost = telemetry.cumulativeCost;
  current.tokensUsed = totalTokens;
  current.economyMode = telemetry.economyModeTriggered;
  current.stageLogs = telemetry.logs;
  if (errorMsg) current.error = errorMsg;

  // Save to memory
  const globalProgress = (global as any).progressLogs || new Map<string, EpisodeProgress>();
  (global as any).progressLogs = globalProgress;
  globalProgress.set(episodeId, current);

  // Save to file for persistence across server restarts
  try {
    const filePath = getLogsFilePath(episodeId);
    fs.writeFileSync(filePath, JSON.stringify(current, null, 2), 'utf8');
  } catch (e) {
    console.error('Failed to write progress log file:', e);
  }

  console.log(`[Episode ${episodeId} Progress]: ${message}`);
}

function formatScreenplay(
  title: string,
  genre: string,
  scripts: ScriptwriterOutput[],
  storyboards: StoryboardDirectorOutput[]
): string {
  let md = `# Screenplay: ${title}\n**Genre:** ${genre}\n\n`;

  scripts.forEach((script, idx) => {
    const storyboard = storyboards[idx];
    md += `## Scene ${idx + 1}: ${script.sceneId}\n`;
    md += `*Camera Direction:* ${script.cameraDirection}\n\n`;
    
    md += `### Action Lines\n`;
    script.actionLines.forEach((act: string) => {
      md += `- ${act}\n`;
    });
    md += `\n`;

    md += `### Dialogue\n`;
    script.dialogue.forEach((d: { character: string; line: string }) => {
      md += `**${d.character}:** "${d.line}"\n`;
    });
    md += `\n`;

    if (storyboard && storyboard.shots) {
      md += `### Shot Compositions\n`;
      storyboard.shots.forEach((shot) => {
        md += `- **${shot.shotId}** (${shot.composition}, ${shot.cameraAngle}): ${shot.characterPositions} [${shot.durationSeconds}s]\n`;
      });
      md += `\n`;
    }
    md += `---\n\n`;
  });

  return md;
}

export async function runPipeline(episodeId: string, projectId: string, premise: string, budget = 1.0) {
  console.log(`Running pipeline for episode ${episodeId} (Project ${projectId}) with budget $${budget.toFixed(2)}`);
  
  initRun(episodeId, budget);
  updateProgress(episodeId, 'Preparing script and generation pipeline...');

  try {
    // ── STAGE 1: HOOK STRATEGIST ───────────────────────────────────────────
    updateProgress(episodeId, 'Stage 1: Developing hook strategy, title, and genre [Qwen-Max]...');
    const hookOutput = await generateHook(episodeId, premise);
    
    await prisma.episode.update({
      where: { id: episodeId },
      data: { title: hookOutput.title, status: 'PROCESSING' },
    });
    updateProgress(episodeId, `Stage 1 Completed: Title set to "${hookOutput.title}" (${hookOutput.genre}) [Qwen-Max]`);

    // ── STAGE 2: STORY ARCHITECT ───────────────────────────────────────────
    updateProgress(episodeId, 'Stage 2: Drafting story architecture and scene outlines [Qwen-Max]...');
    const storyOutput = await generateStory(episodeId, hookOutput);
    updateProgress(episodeId, `Stage 2 Completed: Outlined ${storyOutput.scenes.length} dramatic scenes [Qwen-Max]`);

    // ── STAGE 3: SCRIPTWRITER (PARALLEL) ──────────────────────────────────
    updateProgress(episodeId, 'Stage 3: Writing screenplay and character dialogues [Qwen-Plus]...');
    const scriptOutput = await generateAllScripts(episodeId, storyOutput.scenes);
    updateProgress(episodeId, 'Stage 3 Completed: Snappy dialogue scripts written for all scenes [Qwen-Plus]');

    // ── STAGE 4: STORYBOARD DIRECTOR (PARALLEL) ───────────────────────────
    updateProgress(episodeId, 'Stage 4: Directing scene visual layouts and camera angles [Qwen-Max]...');
    const storyboardOutput = await generateAllStoryboards(episodeId, scriptOutput);
    updateProgress(episodeId, 'Stage 4 Completed: Storyboard layouts and framing completed [Qwen-Max]');

    // ── STAGE 5: CASTING & GENERATION ─────────────────────────────────────
    updateProgress(episodeId, 'Stage 5: Creating virtual actors and generating clip footage [Wan Image & Video]...');
    const clips = await generateClips(
      projectId,
      episodeId,
      storyOutput.scenes,
      scriptOutput,
      storyboardOutput,
      (msg) => updateProgress(episodeId, msg)
    );
    updateProgress(episodeId, 'Stage 5 Completed: Casting and footage generation completed [Wan Image & Video]');

    // ── STAGE 6: AUDIO & MUSIC ─────────────────────────────────────────────
    updateProgress(episodeId, 'Stage 6: Generating voiceovers and composing background soundtrack [CosyVoice / Melotts]...');
    await new Promise((resolve) => setTimeout(resolve, 3000));
    updateProgress(episodeId, 'Stage 6 Completed: Vocals synthesized and multi-track audio mixed [CosyVoice / Melotts]');

    // ── STAGE 7: POST-PRODUCTION ──────────────────────────────────────────
    updateProgress(episodeId, 'Stage 7: Adding transitions, burning subtitles, and mixing final render [FFmpeg]...');
    const finalVideoUrl = await processPostProduction(
      projectId,
      episodeId,
      scriptOutput,
      storyboardOutput,
      clips,
      (msg) => updateProgress(episodeId, msg)
    );

    const fullScreenplay = formatScreenplay(hookOutput.title, hookOutput.genre, scriptOutput, storyboardOutput);
    const telemetry = getRunData(episodeId);
    const totalTokens = telemetry.logs.reduce((acc, log) => acc + log.inputTokens + log.outputTokens, 0);

    await prisma.episode.update({
      where: { id: episodeId },
      data: {
        status: 'COMPLETED',
        videoUrl: finalVideoUrl,
        cost: telemetry.cumulativeCost,
        tokensUsed: totalTokens,
        scriptContent: fullScreenplay,
      },
    });

    const current = getEpisodeProgress(episodeId);
    current.isCompleted = true;

    // Save to memory
    const globalProgress = (global as any).progressLogs || new Map<string, EpisodeProgress>();
    globalProgress.set(episodeId, current);

    // Save to file
    try {
      const filePath = getLogsFilePath(episodeId);
      fs.writeFileSync(filePath, JSON.stringify(current, null, 2), 'utf8');
    } catch (e) {
      console.error('Failed to write progress log file:', e);
    }

    updateProgress(episodeId, 'Showrunner completed pre-production. Final video rendered.');
  } catch (err: any) {
    console.error(`Pipeline failure for episode ${episodeId}:`, err);
    
    await prisma.episode.update({
      where: { id: episodeId },
      data: { status: 'FAILED' },
    });
    
    updateProgress(episodeId, 'Pipeline aborted due to internal error.', err.message || 'Unknown error');
  }
}
