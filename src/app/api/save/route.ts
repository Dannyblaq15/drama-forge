import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET: Fetch all saved media (videos + storyboards) for the editing / production pages
export async function GET() {
  try {
    const project = await prisma.project.findFirst({
      include: {
        videos: { orderBy: { createdAt: 'desc' } },
        storyboards: { orderBy: { createdAt: 'desc' } },
      },
    });

    if (!project) {
      return NextResponse.json({ videos: [], storyboards: [] });
    }

    return NextResponse.json({
      videos: project.videos,
      storyboards: project.storyboards,
    });
  } catch (error: any) {
    console.error('Fetch Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: Save a generated video or storyboard to the database
export async function POST(req: Request) {
  try {
    const { type, prompt, url, taskId } = await req.json();
    
    if (!type || !prompt || (!url && !taskId)) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    let project = await prisma.project.findFirst();
    if (!project) {
      const user = await prisma.user.create({
        data: {
          email: 'demo@dramaforge.ai',
          name: 'Demo User',
        }
      });
      project = await prisma.project.create({
        data: {
          title: 'Default Hackathon Project',
          userId: user.id
        }
      });
    }

    let savedRecord;

    if (type === 'video') {
      savedRecord = await prisma.video.create({
        data: {
          prompt,
          taskId: taskId || 'unknown',
          videoUrl: url,
          status: 'SUCCESS',
          projectId: project.id
        }
      });
    } else if (type === 'storyboard') {
      savedRecord = await prisma.storyboard.create({
        data: {
          prompt,
          taskIds: JSON.stringify([url]),
          projectId: project.id
        }
      });
    } else {
      return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
    }

    return NextResponse.json({ success: true, record: savedRecord });
  } catch (error: any) {
    console.error('Database Save Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
