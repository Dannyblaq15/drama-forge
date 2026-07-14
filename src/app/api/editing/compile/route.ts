import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { assembleTimeline } from '@/services/post-production';

export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (!body.clips || body.clips.length === 0) {
      return NextResponse.json({ error: 'No clips in timeline to compile' }, { status: 400 });
    }

    let projectId = body.projectId;
    if (!projectId) {
      const project = await prisma.project.findFirst();
      projectId = project?.id || 'dummy-project-id';
    }

    // Resolve or create project if not found in db
    let projectExists = await prisma.project.findUnique({
      where: { id: projectId }
    });

    if (!projectExists) {
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

    const progressLogs: string[] = [];
    const finalVideoUrl = await assembleTimeline(
      body.clips,
      (msg) => {
        progressLogs.push(msg);
      }
    );

    try {
      const savedVideo = await prisma.video.create({
        data: {
          prompt: `Compiled Timeline Assembly: ${body.clips.length} clips`,
          videoUrl: finalVideoUrl,
          status: 'SUCCESS',
          taskId: `timeline-${Date.now()}`,
          projectId: projectId
        }
      });

      return NextResponse.json({
        id: savedVideo.id,
        videoUrl: finalVideoUrl,
        prompt: savedVideo.prompt,
        logs: progressLogs
      });
    } catch (dbError: any) {
      console.warn('Database save failed during compile, continuing with memory fallback:', dbError.message);
      progressLogs.push('Warning: Database unreachable, video was not persisted.');
      return NextResponse.json({
        id: `timeline-${Date.now()}`,
        videoUrl: finalVideoUrl,
        prompt: `Compiled Timeline Assembly: ${body.clips.length} clips`,
        logs: progressLogs
      });
    }
  } catch (error: any) {
    console.error('Timeline Compilation failed:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
