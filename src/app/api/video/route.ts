import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();
    
    /*
     * PROOF OF ALIBABA CLOUD INTEGRATION:
     * DashScope Video Generation service call targeting wanx2.1-t2v-turbo
     */
    // Dynamically use workspace URL or fallback to the public international endpoint
    const baseUrl = process.env.ALIBABA_DASHSCOPE_URL || 'https://dashscope-intl.aliyuncs.com/api/v1';
    const apiUrl = `${baseUrl}/services/aigc/video-generation/video-synthesis`;
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.ALIBABA_API_KEY}`,
        'X-DashScope-Async': 'enable',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'wanx2.1-t2v-turbo', // Alibaba's newest video model
        input: { prompt }
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to generate video. Check your API key.');
    }

    return NextResponse.json({ taskId: data.output.task_id });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
