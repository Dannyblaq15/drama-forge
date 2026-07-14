import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { story } = await req.json();

    if (!story) {
      return NextResponse.json({ error: 'Missing story content' }, { status: 400 });
    }

    const baseUrl = process.env.ALIBABA_OPENAI_COMPATIBLE_URL || 'https://dashscope.aliyuncs.com/compatible-mode/v1';
    const apiUrl = `${baseUrl}/chat/completions`;

    const systemPrompt = `You are a Storyboard Director.
Break down the user's story or script into a sequence of 3 to 4 key visual frames.
For each frame, provide a highly descriptive, single-sentence visual prompt suitable for text-to-image generation (detailing the characters, composition, lighting, and setting).

Return a JSON object exactly matching this schema:
{
  "frames": [
    "string (detailed visual prompt for frame 1)",
    "string (detailed visual prompt for frame 2)",
    "string (detailed visual prompt for frame 3)"
  ]
}
Strictly output raw, valid JSON only. Do not wrap in markdown code blocks.`;

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
          { role: 'user', content: `Story/Script: ${story}` }
        ],
        response_format: { type: 'json_object' }
      })
    });

    if (!response.ok) {
      const errData = await response.json();
      return NextResponse.json({ error: errData.message || 'Failed to split story' }, { status: response.status });
    }

    const data = await response.json();
    let reply = data.choices?.[0]?.message?.content || '{}';
    
    // Clean markdown code blocks from reply if present
    reply = reply.replace(/```json/g, '').replace(/```/g, '').trim();

    let parsed: any = null;
    try {
      parsed = JSON.parse(reply);
    } catch (parseError) {
      console.warn('Failed to parse Qwen response as JSON, trying array regex extraction:', reply);
      const arrayMatch = reply.match(/\[([\s\S]*?)\]/);
      if (arrayMatch) {
        try {
          parsed = { frames: JSON.parse(`[${arrayMatch[1]}]`) };
        } catch (innerError) {
          // Leave null
        }
      }
    }

    let frames: string[] = [];
    if (parsed && parsed.frames && Array.isArray(parsed.frames)) {
      frames = parsed.frames;
    } else {
      // Robust fallback: split the story into 3-4 logical lines
      const paragraphs = story
        .split(/\n+/)
        .map((p: string) => p.trim())
        .filter((p: string) => p.length > 20);
      
      frames = paragraphs.length >= 2 
        ? paragraphs.slice(0, 4)
        : story.split(/[.!?]+/).map((s: string) => s.trim()).filter((s: string) => s.length > 10).slice(0, 4);
    }

    return NextResponse.json({ frames });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
