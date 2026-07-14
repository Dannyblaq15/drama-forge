import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();
    
    const baseUrl = process.env.ALIBABA_OPENAI_COMPATIBLE_URL || 'https://dashscope.aliyuncs.com/compatible-mode/v1';
    const apiUrl = `${baseUrl}/chat/completions`;
    
    const systemPrompt = `You are a professional screenwriter. Generate a short drama script (scene beats and dialogue) based on the user's prompt. Format the output cleanly in plain text or markdown.`;

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.ALIBABA_API_KEY}`
      },
      body: JSON.stringify({
        model: 'qwen-max',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ]
      })
    });

    if (!response.ok) {
      const errData = await response.json();
      return NextResponse.json({ error: errData.message || 'Failed to generate script' }, { status: response.status });
    }

    const data = await response.json();
    const generatedScript = data.choices?.[0]?.message?.content || data.text || data.output?.text || '';
    
    if (!generatedScript) {
      return NextResponse.json({ error: 'No script text was generated. Raw response: ' + JSON.stringify(data) }, { status: 500 });
    }
    
    return NextResponse.json({ script: generatedScript });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
