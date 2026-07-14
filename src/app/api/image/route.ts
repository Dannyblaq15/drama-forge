import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();
    
    /*
     * PROOF OF ALIBABA CLOUD INTEGRATION:
     * DashScope Multimodal Generation service call targeting wan2.7-image
     */
    // Dynamically use workspace URL or fallback to the public international endpoint
    const dashUrl = process.env.ALIBABA_DASHSCOPE_URL || 'https://dashscope.aliyuncs.com/api/v1';
    
    // Construct base URL and target the multimodal-generation endpoint
    const base = dashUrl.replace(/\/api\/v1\/?$/, '') + '/api/v1';
    const apiUrl = `${base}/services/aigc/multimodal-generation/generation`;

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.ALIBABA_API_KEY}`
      },
      body: JSON.stringify({
        model: 'wan2.7-image', // workspace-supported text-to-image model
        input: {
          messages: [
            {
              role: 'user',
              content: [
                { text: prompt }
              ]
            }
          ]
        },
        parameters: {
          size: '1024*1024'
        }
      })
    });

    if (response.status === 403) {
      const errData = await response.json();
      if (errData.code === 'AllocationQuota.FreeTierOnly') {
        return NextResponse.json({ 
          error: 'Free quota exhausted for image generation. Check Model Studio console.' 
        }, { status: 403 });
      }
      return NextResponse.json({ error: errData.message || 'Forbidden' }, { status: 403 });
    }

    if (!response.ok) {
      const errData = await response.json();
      return NextResponse.json({ error: errData.message || 'Failed to generate image' }, { status: response.status });
    }

    const data = await response.json();
    const url = data.output?.choices?.[0]?.message?.content?.[0]?.image || data.output?.results?.[0]?.url;

    if (!url) {
      return NextResponse.json({ error: 'No image URL returned from DashScope. Response: ' + JSON.stringify(data) }, { status: 500 });
    }

    // Return the URL directly to the frontend for permanent OSS saving
    return NextResponse.json({ url });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
