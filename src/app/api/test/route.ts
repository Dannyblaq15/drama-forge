import { NextResponse } from 'next/server';

/**
 * Self-test endpoint — GET /api/test
 * Checks all internal keys, endpoints, and database connection.
 */
export async function GET() {
  const results: { test: string; status: 'PASS' | 'FAIL'; detail: string }[] = [];

  function pass(test: string, detail: string) {
    results.push({ test, status: 'PASS', detail });
  }
  function fail(test: string, detail: string) {
    results.push({ test, status: 'FAIL', detail });
  }

  // ── ENV VARS ────────────────────────────────────────────────────────────────
  const apiKey = process.env.ALIBABA_API_KEY;
  const openaiUrl = process.env.ALIBABA_OPENAI_COMPATIBLE_URL || 'https://dashscope.aliyuncs.com/compatible-mode/v1';
  const dashUrl = process.env.ALIBABA_DASHSCOPE_URL || 'https://dashscope.aliyuncs.com/api/v1';

  if (apiKey) pass('ENV: ALIBABA_API_KEY', `ends with ...${apiKey.slice(-8)}`);
  else fail('ENV: ALIBABA_API_KEY', 'NOT SET');

  if (process.env.ALIBABA_DASHSCOPE_URL) pass('ENV: ALIBABA_DASHSCOPE_URL', dashUrl);
  else fail('ENV: ALIBABA_DASHSCOPE_URL', 'Not set — using fallback');

  if (process.env.ALIBABA_OPENAI_COMPATIBLE_URL) pass('ENV: ALIBABA_OPENAI_COMPATIBLE_URL', openaiUrl);
  else fail('ENV: ALIBABA_OPENAI_COMPATIBLE_URL', 'Not set — using fallback');

  if (process.env.ALIBABA_ACCESS_KEY_ID && process.env.ALIBABA_ACCESS_KEY_SECRET && process.env.ALIBABA_OSS_BUCKET)
    pass('ENV: OSS credentials', `bucket=${process.env.ALIBABA_OSS_BUCKET}`);
  else fail('ENV: OSS credentials', 'One or more OSS env vars missing');

  if (process.env.DATABASE_URL) pass('ENV: DATABASE_URL', 'set');
  else fail('ENV: DATABASE_URL', 'NOT SET');

  // ── DASHSCOPE: qwen-max ──────────────────────────────────────────────────────
  try {
    const r = await fetch(`${openaiUrl}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: 'qwen-max',
        messages: [{ role: 'user', content: 'Say "hi" in one word.' }],
        max_tokens: 10,
      }),
    });
    const d = await r.json();
    const reply = d.choices?.[0]?.message?.content || d.text || d.output?.text || '';
    if (r.ok && reply) {
      pass('DASHSCOPE: qwen-max (OpenAI-compat)', `reply="${reply.trim()}"`);
    } else {
      fail('DASHSCOPE: qwen-max (OpenAI-compat)', d.error?.message || d.message || JSON.stringify(d).slice(0, 200));
    }
  } catch (e: any) {
    fail('DASHSCOPE: qwen-max (OpenAI-compat)', e.message);
  }

  // ── DASHSCOPE: wan2.7-image (image via multimodal-generation) ────────────────
  try {
    const base = dashUrl.replace(/\/api\/v1\/?$/, '') + '/api/v1';
    const targetUrl = `${base}/services/aigc/multimodal-generation/generation`;

    const r = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'wan2.7-image',
        input: {
          messages: [
            {
              role: 'user',
              content: [
                { text: 'a futuristic neon city skyline' }
              ]
            }
          ]
        },
        parameters: {
          size: '1024*1024'
        }
      }),
      signal: AbortSignal.timeout(25000),
    });
    const d = await r.json();
    const url = d.output?.choices?.[0]?.message?.content?.[0]?.image || d.output?.results?.[0]?.url;
    if (r.ok && url) {
      pass('DASHSCOPE: wan2.7-image (image)', `url=${url.slice(0, 60)}...`);
    } else {
      fail('DASHSCOPE: wan2.7-image (image)', d.message || JSON.stringify(d).slice(0, 200));
    }
  } catch (e: any) {
    fail('DASHSCOPE: wan2.7-image (image)', e.message);
  }

  // ── DASHSCOPE: wanx2.1-t2v-turbo (video) ─────────────────────────────────────
  let videoTaskId: string | null = null;
  try {
    const r = await fetch(`${dashUrl}/services/aigc/video-generation/video-synthesis`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
        'X-DashScope-Async': 'enable',
      },
      body: JSON.stringify({
        model: 'wanx2.1-t2v-turbo',
        input: { prompt: 'a cyberpunk drone shot over a neon lit city' },
      }),
      signal: AbortSignal.timeout(25000),
    });
    const d = await r.json();
    if (r.ok && d.output?.task_id) {
      videoTaskId = d.output.task_id;
      pass('DASHSCOPE: wanx2.1-t2v-turbo (video)', `task_id=${videoTaskId}`);
    } else {
      fail('DASHSCOPE: wanx2.1-t2v-turbo (video)', d.message || JSON.stringify(d).slice(0, 200));
    }
  } catch (e: any) {
    fail('DASHSCOPE: wanx2.1-t2v-turbo (video)', e.message);
  }

  // ── TASK POLL: video ────────────────────────────────────────────────────────
  if (videoTaskId) {
    try {
      const r = await fetch(`${dashUrl}/tasks/${videoTaskId}`, {
        headers: { Authorization: `Bearer ${apiKey}` },
        signal: AbortSignal.timeout(15000),
      });
      const d = await r.json();
      const status = d?.output?.task_status;
      if (r.ok && status) {
        pass('DASHSCOPE: task poll (video)', `task_status=${status}`);
      } else {
        fail('DASHSCOPE: task poll (video)', d.message || JSON.stringify(d).slice(0, 200));
      }
    } catch (e: any) {
      fail('DASHSCOPE: task poll (video)', e.message);
    }
  } else {
    fail('DASHSCOPE: task poll (video)', 'skipped — no videoTaskId from previous test');
  }

  // ── DATABASE ────────────────────────────────────────────────────────────────
  try {
    const { prisma } = await import('@/lib/prisma');
    const project = await prisma.project.findFirst();
    pass('DATABASE: Prisma connection', project ? `found project id=${project.id}` : 'connected (no projects yet)');
  } catch (e: any) {
    fail('DATABASE: Prisma connection', e.message);
  }

  // ── SUMMARY ─────────────────────────────────────────────────────────────────
  const passed = results.filter(r => r.status === 'PASS').length;
  const failed = results.filter(r => r.status === 'FAIL').length;

  return NextResponse.json({
    summary: `${passed}/${results.length} passed, ${failed} failed`,
    passed,
    failed,
    results,
  }, { status: failed > 0 ? 207 : 200 });
}
