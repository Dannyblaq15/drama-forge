import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { runPipeline } from '@/services/orchestrator';

export async function POST(req: Request) {
  try {
    const dto = await req.json();
    if (!dto.prompt) {
      return NextResponse.json({ error: 'prompt is required' }, { status: 400 });
    }

    let projectId = dto.projectId || 'dummy-project-id';
    
    // Resolve project. If projectId doesn't exist, resolve or create a dummy project
    let project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      let user = await prisma.user.findFirst();
      if (!user) {
        user = await prisma.user.create({
          data: {
            email: 'admin@dramaforge.com',
            name: 'Default User',
          },
        });
      }
      
      const newProj = await prisma.project.create({
        data: {
          id: projectId,
          title: 'Default Hackathon Project',
          userId: user.id,
        },
      });
      projectId = newProj.id;
    }

    // Create a new pending Episode record in DB
    const episode = await prisma.episode.create({
      data: {
        title: 'Generating Scene Outlines...',
        status: 'PENDING',
        projectId,
      },
    });

    const budget = dto.budget !== undefined ? Number(dto.budget) : 1.0;

    // Trigger pipeline asynchronously so we return the episodeId instantly
    runPipeline(episode.id, projectId, dto.prompt, budget);

    return NextResponse.json({ episodeId: episode.id });
  } catch (error: any) {
    console.error('Trigger Episode Generation failed:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
