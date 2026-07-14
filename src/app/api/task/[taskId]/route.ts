import { NextResponse } from 'next/server';

export async function GET(req: Request, { params }: { params: { taskId: string } }) {
  try {
    const { taskId } = await params; // Extract taskId from params (in Next.js 15, params is a promise)
    
    // Dynamically use workspace URL or fallback to the public international endpoint
    const baseUrl = process.env.ALIBABA_DASHSCOPE_URL || 'https://dashscope-intl.aliyuncs.com/api/v1';
    const apiUrl = `${baseUrl}/tasks/${taskId}`;
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.ALIBABA_API_KEY}`
      }
    });

    if (!response.ok) {
      const errData = await response.json();
      return NextResponse.json({ error: errData.message || 'Failed to poll task' }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
