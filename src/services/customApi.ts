import { apiClient } from '@/lib/api-client';

export const customApi = {
  generateScript: async (data: { prompt: string }) => {
    const res = await fetch('/api/script', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to generate script');
    }
    return await res.json(); // returns { script: string }
  },
  
  generateStoryboard: async (data: { prompt: string }) => {
    const res = await fetch('/api/image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to generate image');
    }
    const json = await res.json();
    return { frames: [json.taskId] }; // Return task ID as a frame reference for now
  },

  generateVideo: async (data: { prompt: string }) => {
    const res = await fetch('/api/video', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: data.prompt }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to start video generation task');
    }
    const result = await res.json();
    return result; // contains { taskId }
  },

  pollTask: async (taskId: string) => {
    const res = await fetch(`/api/task/${taskId}`);
    if (!res.ok) throw new Error('Failed to poll task status');
    return res.json(); // contains { output: { task_status, video_url }, ... }
  },

  uploadToOss: async (sourceUrl: string) => {
    const res = await fetch('/api/oss', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sourceUrl }),
    });
    if (!res.ok) throw new Error('Failed to upload to OSS');
    return res.json(); // contains { url: permanent_oss_url }
  },

  saveToDb: async (data: { type: 'video' | 'storyboard', prompt: string, url: string, taskId?: string }) => {
    const res = await fetch('/api/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Failed to save to database');
    return result;
  },

  processEditing: async (_data: { videoId: string }) => {
    // Real editing is handled directly in the editing page UI via /api/save
    return { success: true };
  },

  finalizeProduction: async (_data: { episodeId: string }) => {
    // Real production is handled directly in the production page UI via /api/save
    return { url: '' };
  },

  getMedia: async () => {
    const res = await fetch('/api/save');
    if (!res.ok) throw new Error('Failed to fetch media');
    return res.json(); // { videos: [], storyboards: [] }
  },

  pollImageTask: async (taskId: string) => {
    const res = await fetch(`/api/task-image/${taskId}`);
    if (!res.ok) throw new Error('Failed to poll image task');
    return res.json(); // DashScope task response
  },
};

