import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  req: Request,
  props: { params: Promise<{ projectId: string }> }
) {
  try {
    const params = await props.params;
    const { projectId } = params;

    const characters = await prisma.character.findMany({
      where: { projectId },
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json(characters);
  } catch (error: any) {
    console.error('Fetch Characters failed:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
