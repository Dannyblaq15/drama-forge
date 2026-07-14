'use client';

import React, { useState, useEffect } from 'react';
import { Layout, Play, Sparkles, CheckCircle2, Loader2, ImageIcon, Layers, Video } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';

interface Frame {
  url: string;
  prompt: string;
}

export default function StoryboardPage() {
  const [frames, setFrames] = useState<Frame[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [statusText, setStatusText] = useState('');
  const router = useRouter();

  const handleSendToVideo = (framePrompt: string) => {
    sessionStorage.setItem('video_input_prompt', framePrompt);
    router.push('/studio/video-gen');
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedInput = sessionStorage.getItem('storyboard_input');
      if (storedInput) {
        setPrompt(storedInput);
        sessionStorage.removeItem('storyboard_input');
      }
    }
  }, []);

  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  // Poll for image generation status
  const pollImageTask = async (taskId: string): Promise<string> => {
    let attempts = 0;
    while (attempts < 40) {
      await delay(3500);
      const res = await fetch(`/api/task-image/${taskId}`);
      if (!res.ok) throw new Error('Failed to poll image task');
      const data = await res.json();
      const status = data?.output?.task_status;

      if (status === 'SUCCEEDED') {
        const imageUrl = data?.output?.results?.[0]?.url;
        if (!imageUrl) throw new Error('No image URL in response');
        return imageUrl;
      } else if (status === 'FAILED') {
        throw new Error(data?.output?.message || 'Image generation failed');
      }
      attempts++;
    }
    throw new Error('Image generation timed out');
  };

  // Helper to generate a single frame from a specific prompt string
  const generateSingleFrame = async (framePrompt: string, frameNumberText?: string): Promise<Frame> => {
    setStatusText(`Submitting ${frameNumberText || 'frame'} to DashScope...`);

    const res = await fetch('/api/image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: framePrompt }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to start image generation');
    }

    const { taskId, url } = await res.json();
    let imageUrl = url;

    if (!imageUrl && taskId) {
      setStatusText(`Rendering ${frameNumberText || 'frame'} (Wan 2.7)...`);
      imageUrl = await pollImageTask(taskId);
    } else if (!imageUrl && !taskId) {
      throw new Error('No image URL or task ID returned from endpoint.');
    }

    setStatusText(`Saving ${frameNumberText || 'frame'} to Cloud OSS...`);

    const ossRes = await fetch('/api/oss', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sourceUrl: imageUrl }),
    });
    const ossData = await ossRes.json();
    const permanentUrl = ossData.url || imageUrl;

    // Save metadata to database
    await fetch('/api/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'storyboard',
        prompt: framePrompt,
        url: permanentUrl,
        taskId: taskId || 'sync',
      }),
    });

    return { url: permanentUrl, prompt: framePrompt };
  };

  // Option 1: Manual Single Frame Generation
  const handleGenerateSingle = async () => {
    if (!prompt) return;
    setIsGenerating(true);
    setError(null);

    try {
      const newFrame = await generateSingleFrame(prompt);
      setFrames((prev) => [...prev, newFrame]);
      setPrompt('');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An error occurred during frame generation');
    } finally {
      setIsGenerating(false);
      setStatusText('');
    }
  };

  // Option 2: Automatic Multi-Frame Script Storyboard Compilation
  const handleGenerateFullStoryboard = async () => {
    if (!prompt) return;
    setIsGenerating(true);
    setError(null);
    setFrames([]); // Clear screen for the new story

    try {
      setStatusText('Decomposing story into visual frame beats (Qwen-Max)...');

      // Call Qwen to split story into key visual shots
      const splitRes = await fetch('/api/storyboard/split', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ story: prompt }),
      });

      if (!splitRes.ok) {
        const err = await splitRes.json();
        throw new Error(err.error || 'Failed to split story into frames');
      }

      const { frames: parsedPrompts } = await splitRes.json();

      if (!parsedPrompts || parsedPrompts.length === 0) {
        throw new Error('No visual frames were extracted from the text.');
      }

      // Loop through extracted prompts and generate images sequentially
      for (let i = 0; i < parsedPrompts.length; i++) {
        const visualPrompt = parsedPrompts[i];
        const progressLabel = `frame ${i + 1}/${parsedPrompts.length}`;
        
        const newFrame = await generateSingleFrame(visualPrompt, progressLabel);
        setFrames((prev) => [...prev, newFrame]);
      }

      setPrompt('');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An error occurred during storyboarding');
    } finally {
      setIsGenerating(false);
      setStatusText('');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">
            Storyboard Artist
          </h1>
          <p className="text-neutral-500 mt-1 text-sm">
            Generate frame-by-frame visual compositions. Paste a full story to render a sequence automatically, or describe a single shot.
          </p>
        </div>
        
        <div className="flex gap-3">
          <button 
            onClick={handleGenerateSingle}
            disabled={isGenerating || !prompt}
            className="flex items-center gap-2 rounded-lg bg-neutral-900 border border-neutral-800 hover:bg-neutral-800 px-5 py-2.5 text-xs font-semibold text-neutral-300 disabled:opacity-50 transition active:scale-95"
          >
            {isGenerating && !statusText.includes('/') ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
            Generate Single Frame
          </button>

          <button 
            onClick={handleGenerateFullStoryboard}
            disabled={isGenerating || !prompt}
            className="flex items-center gap-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 px-5 py-2.5 text-xs font-semibold text-white disabled:opacity-50 transition shadow-lg shadow-indigo-500/10 active:scale-95"
          >
            {isGenerating && statusText.includes('/') ? <Loader2 className="h-4 w-4 animate-spin" /> : <Layers className="h-4 w-4" />}
            Render Full Storyboard Sequence
          </button>
        </div>
      </div>

      {error && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-red-400 flex items-center gap-3">
          <span className="font-semibold text-sm">Error:</span>
          <span className="text-sm opacity-90">{error}</span>
        </motion.div>
      )}

      <div className="glass-panel rounded-2xl p-8 min-h-[500px] flex flex-col items-center justify-center gap-8 relative overflow-hidden border border-neutral-800 shadow-xl">
        
        {/* Background glow when generating */}
        {isGenerating && (
          <div className="absolute inset-0 bg-indigo-500/5 animate-pulse pointer-events-none" />
        )}

        <AnimatePresence mode="wait">
          {frames.length > 0 ? (
            <motion.div
              key="frames"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full space-y-8"
            >
              {/* Output progress indicator */}
              {isGenerating && (
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-neutral-900 border border-neutral-800 rounded-full text-xs text-neutral-400 animate-pulse">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-500" />
                  {statusText}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {frames.map((frame, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="relative rounded-xl overflow-hidden border border-neutral-800 bg-black/40 group shadow-md"
                  >
                    <img
                      src={frame.url}
                      alt={`Frame ${idx + 1}`}
                      className="w-full aspect-video object-cover"
                    />
                    <div className="absolute inset-0 bg-black/85 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                      <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        Uploaded to Alibaba Cloud OSS
                      </div>
                      <p className="text-neutral-200 text-xs mt-2 line-clamp-3 leading-relaxed">{frame.prompt}</p>
                      <button 
                        onClick={() => handleSendToVideo(frame.prompt)}
                        className="mt-3 inline-flex items-center justify-center gap-1.5 w-full rounded bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold py-1.5 transition active:scale-95 shadow"
                      >
                        <Video className="w-3.5 h-3.5" />
                        Convert to Video →
                      </button>
                    </div>
                    <div className="p-3 bg-neutral-900/60 border-t border-neutral-800/80">
                      <span className="text-[10px] font-mono text-neutral-500 block uppercase">Frame {idx + 1} Prompt</span>
                      <p className="text-[11px] text-neutral-400 mt-1 truncate">{frame.prompt}</p>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Allow generating more frames */}
              <div className="w-full max-w-xl mx-auto border-t border-neutral-850 pt-8">
                <label className="text-xs font-bold text-neutral-400 block uppercase tracking-wide mb-2">Add another frame</label>
                <textarea 
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-3 text-sm text-neutral-200 placeholder:text-neutral-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 resize-none h-20 font-sans"
                  placeholder="Describe the next scene layout..."
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  disabled={isGenerating}
                />
              </div>
            </motion.div>
          ) : isGenerating ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-6 relative z-10"
            >
              <div className="relative w-20 h-20">
                <div className="absolute inset-0 border-4 border-indigo-500/10 rounded-full" />
                <div className="absolute inset-0 border-4 border-indigo-500 rounded-full border-t-transparent animate-spin" />
                <Sparkles className="absolute inset-0 m-auto h-7 w-7 text-indigo-500 animate-pulse" />
              </div>
              <div className="text-center space-y-2">
                <p className="text-sm font-semibold text-neutral-200">{statusText}</p>
                <p className="text-xs text-neutral-500"> Wan 2.7 Multimodal Model is rendering frames...</p>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="idle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="w-full max-w-xl flex flex-col gap-4 text-left"
            >
              <label className="text-xs font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                Story / Screenplay Script Input
              </label>
              <textarea 
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-4 text-sm text-neutral-200 placeholder:text-neutral-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 resize-none h-44 font-sans leading-relaxed"
                placeholder="Describe a single frame OR paste a full script/story here to auto-render the storyboard sequence..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
              />
              <div className="flex flex-col items-center gap-3 text-neutral-600 pt-8">
                <ImageIcon className="h-12 w-12 opacity-20 text-indigo-500" />
                <p className="text-xs opacity-60">Storyboard scenes will render and save automatically</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
