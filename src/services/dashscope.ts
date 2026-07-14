import OpenAI from 'openai';

export interface TokenUsage {
  stage: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  cost: number;
}

interface RunData {
  budget: number;
  cumulativeCost: number;
  economyModeTriggered: boolean;
  logs: TokenUsage[];
}

// In-memory run tracker (per episode pipeline run)
const runsTracker = new Map<string, RunData>();

function getOpenAI() {
  return new OpenAI({
    apiKey: process.env.ALIBABA_API_KEY || '',
    baseURL: process.env.ALIBABA_OPENAI_COMPATIBLE_URL || 'https://dashscope-intl.aliyuncs.com/compatible-mode/v1',
  });
}

export function initRun(episodeId: string, budget: number) {
  runsTracker.set(episodeId, { budget, cumulativeCost: 0, economyModeTriggered: false, logs: [] });
}

export function getRunData(episodeId: string): RunData {
  return runsTracker.get(episodeId) || { budget: 1.0, cumulativeCost: 0, economyModeTriggered: false, logs: [] };
}

function addUsage(episodeId: string, usage: TokenUsage) {
  const data = runsTracker.get(episodeId);
  if (!data) return;
  data.logs.push(usage);
  data.cumulativeCost += usage.cost;
  const limit = 0.8 * data.budget;
  if (data.cumulativeCost >= limit && !data.economyModeTriggered) {
    data.economyModeTriggered = true;
    console.warn(`[DashScope] Economy Mode triggered for episode ${episodeId}! Cost $${data.cumulativeCost.toFixed(4)}`);
  }
}

export async function chatCompletion(
  episodeId: string,
  stageName: string,
  defaultModel: 'qwen-max' | 'qwen-plus',
  messages: any[],
  forceModel = false
): Promise<string> {
  const openai = getOpenAI();
  const run = runsTracker.get(episodeId);
  let targetModel = defaultModel;

  if (run?.economyModeTriggered && !forceModel && targetModel === 'qwen-max') {
    targetModel = 'qwen-plus';
    console.log(`[DashScope] Economy Mode: Downgraded stage ${stageName} from qwen-max to qwen-plus`);
  }

  try {
    const response = await openai.chat.completions.create({
      model: targetModel,
      messages,
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0]?.message?.content || '{}';
    const inputTokens = response.usage?.prompt_tokens || 0;
    const outputTokens = response.usage?.completion_tokens || 0;
    const pricePerToken = targetModel === 'qwen-max' ? 0.00002 : 0.000002;
    const cost = (inputTokens + outputTokens) * pricePerToken;

    addUsage(episodeId, { stage: stageName, model: targetModel, inputTokens, outputTokens, cost });
    return content;
  } catch (error) {
    console.error(`[DashScope] Error in chatCompletion for stage ${stageName}:`, error);
    throw error;
  }
}

export async function generatePortrait(prompt: string): Promise<string> {
  const dashUrl = process.env.ALIBABA_DASHSCOPE_URL || 'https://dashscope-intl.aliyuncs.com/api/v1';
  const base = dashUrl.replace(/\/api\/v1\/?$/, '') + '/api/v1';
  const apiUrl = `${base}/services/aigc/multimodal-generation/generation`;
  const apiKey = process.env.ALIBABA_API_KEY;

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: 'wan2.7-image',
      input: { messages: [{ role: 'user', content: [{ text: prompt }] }] },
      parameters: { size: '1024*1024' },
    }),
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to generate image from DashScope');

  const url = data.output?.choices?.[0]?.message?.content?.[0]?.image || data.output?.results?.[0]?.url;
  if (!url) throw new Error(`Invalid portrait generation response: ${JSON.stringify(data)}`);
  return url;
}

export async function startVideoTask(prompt: string, imageUrl?: string): Promise<string> {
  const dashUrl = process.env.ALIBABA_DASHSCOPE_URL || 'https://dashscope-intl.aliyuncs.com/api/v1';
  const apiUrl = `${dashUrl}/services/aigc/video-generation/video-synthesis`;
  const apiKey = process.env.ALIBABA_API_KEY;
  const hasImage = !!imageUrl;
  const model = hasImage ? 'wan2.1-i2v-720p' : 'wanx2.1-t2v-turbo';
  const inputData: any = { prompt };
  if (hasImage) inputData.image_url = imageUrl;

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}`, 'X-DashScope-Async': 'enable' },
    body: JSON.stringify({ model, input: inputData, parameters: { size: '1280*720' } }),
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.message || `Failed to trigger video generation via ${model}`);
  return data.output.task_id;
}

export async function pollVideoTask(taskId: string): Promise<string> {
  const dashUrl = process.env.ALIBABA_DASHSCOPE_URL || 'https://dashscope-intl.aliyuncs.com/api/v1';
  const apiUrl = `${dashUrl}/tasks/${taskId}`;
  const apiKey = process.env.ALIBABA_API_KEY;
  const maxAttempts = 60;

  for (let i = 0; i < maxAttempts; i++) {
    const response = await fetch(apiUrl, { headers: { Authorization: `Bearer ${apiKey}` } });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Error polling video task');

    const status = data.output?.task_status;
    if (status === 'SUCCEEDED') return data.output?.video_url || data.output?.results?.[0]?.url;
    if (status === 'FAILED') throw new Error(`Video task ${taskId} failed: ${data.output?.message || 'unknown'}`);

    await new Promise((r) => setTimeout(r, 5000));
  }

  throw new Error(`Polling timed out for video task ${taskId}`);
}
