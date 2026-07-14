import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  req: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params;
    const { id } = params;

    const episode = await prisma.episode.findUnique({
      where: { id },
    });

    if (!episode) {
      return NextResponse.json({ error: 'Episode not found' }, { status: 404 });
    }

    return NextResponse.json(episode);
  } catch (error: any) {
    console.error('Fetch Episode failed:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
