import { NextResponse } from 'next/server';
import { getEpisodeProgress } from '@/services/orchestrator';

export async function GET(
  req: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params;
    const { id } = params;
    const progress = getEpisodeProgress(id);
    return NextResponse.json(progress);
  } catch (error: any) {
    console.error('Fetch Episode Progress failed:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
