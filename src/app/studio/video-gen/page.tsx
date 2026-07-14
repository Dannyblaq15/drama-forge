'use client';

import React, { useState, useEffect } from 'react';
import { Video, Play, Sparkles, CheckCircle2, Loader2, ArrowRight } from 'lucide-react';
import { customApi } from '@/services/customApi';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';

const LOADING_STEPS = [
  'Submitting prompt to AI Engine...',
  'Synthesizing video frames...',
  'Rendering final video output...',
  'Securing permanent storage...'
];

export default function VideoGenPage() {
  const [videoId, setVideoId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const router = useRouter();

  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedInput = sessionStorage.getItem('video_input_prompt');
      if (storedInput) {
        setPrompt(storedInput);
        sessionStorage.removeItem('video_input_prompt');
      }
    }
  }, []);

  // Auto-advance loading steps for visual effect
  useEffect(() => {
    if (!isGenerating || currentStep >= 3) return;
    
    const interval = setInterval(() => {
      setCurrentStep(prev => Math.min(prev + 1, 2));
    }, 5000);
    
    return () => clearInterval(interval);
  }, [isGenerating, currentStep]);

  const handleGenerate = async () => {
    if (!prompt) return;
    setIsGenerating(true);
    setError(null);
    setVideoId(null);
    setVideoUrl(null);
    setCurrentStep(0);

    try {
      // 1. Submit task
      const result = await customApi.generateVideo({ prompt });
      const currentTaskId = result.output?.task_id || result.taskId;
      setVideoId(currentTaskId);
      
      // 2. Poll for completion
      let finalMediaUrl = '';
      let isDone = false;
      
      while (!isDone) {
        await delay(3000); // Poll every 3s
        const pollResult = await customApi.pollTask(currentTaskId);
        const status = pollResult.output?.task_status;
        
        if (status === 'SUCCEEDED') {
          finalMediaUrl = pollResult.output?.video_url;
          isDone = true;
        } else if (status === 'FAILED') {
          throw new Error('Video generation failed: ' + pollResult.output?.message);
        }
      }

      // 3. Upload & Save
      setCurrentStep(3);
      const ossResult = await customApi.uploadToOss(finalMediaUrl);
      const permanentUrl = ossResult.url;

      await customApi.saveToDb({
        type: 'video',
        prompt,
        url: permanentUrl,
        taskId: currentTaskId
      });

      // Done
      setVideoUrl(permanentUrl);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An unknown error occurred');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Video Engine</h1>
          <p className="text-muted-foreground mt-1">Generate high-quality video clips using AI models.</p>
        </div>
        <button 
          onClick={handleGenerate}
          disabled={isGenerating || !prompt}
          className="flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-all active:scale-95"
        >
          {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
          {isGenerating ? 'Processing...' : 'Generate Video'}
        </button>
      </div>

      {error && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive flex items-center gap-3">
           <span className="font-semibold text-sm">Error:</span>
           <span className="text-sm opacity-90">{error}</span>
        </motion.div>
      )}

      <div className="glass-panel rounded-2xl p-8 min-h-[500px] flex flex-col items-center justify-center gap-8 relative overflow-hidden border border-border/50 shadow-sm">
        
        {/* Background glow when generating */}
        {isGenerating && (
          <div className="absolute inset-0 bg-primary/5 animate-pulse pointer-events-none" />
        )}

        {!videoId && !isGenerating && !videoUrl && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full max-w-2xl">
             <label className="text-sm font-semibold mb-3 flex items-center gap-2 text-foreground/80">
               <Sparkles className="w-4 h-4 text-primary" />
               Describe your video
             </label>
             <textarea 
               className="w-full bg-neutral-900/80 border border-neutral-800 rounded-xl p-4 text-sm text-neutral-200 placeholder:text-neutral-600 focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none h-32 transition-all"
               placeholder="A cinematic drone shot flying over a futuristic neon city at sunset..."
               value={prompt}
               onChange={(e) => setPrompt(e.target.value)}
             />
          </motion.div>
        )}

        <AnimatePresence mode="wait">
          {videoUrl ? (
            <motion.div 
              key="video"
              initial={{ opacity: 0, scale: 0.95 }} 
              animate={{ opacity: 1, scale: 1 }} 
              className="w-full max-w-4xl aspect-video bg-black rounded-xl flex items-center justify-center border border-border shadow-2xl relative overflow-hidden group"
            >
              <video 
                src={videoUrl} 
                controls 
                autoPlay 
                loop
                className="w-full h-full object-cover"
              />
              <div className="absolute top-4 left-4 bg-black/70 backdrop-blur-md px-3 py-1.5 rounded-md text-white text-xs font-medium flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
                Saved to Database
              </div>
              <button 
                onClick={() => router.push('/studio/editing')}
                className="absolute top-4 right-4 bg-indigo-600 hover:bg-indigo-700 backdrop-blur-md px-3 py-1.5 rounded-md text-white text-xs font-semibold flex items-center gap-1.5 transition active:scale-95 shadow"
              >
                Send to Editing <ArrowRight className="w-3 h-3" />
              </button>
            </motion.div>
          ) : isGenerating ? (
            <motion.div 
              key="loading"
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              className="w-full max-w-md flex flex-col items-center justify-center relative z-10"
            >
              <div className="relative w-24 h-24 mb-8">
                <div className="absolute inset-0 border-4 border-primary/20 rounded-full" />
                <div className="absolute inset-0 border-4 border-primary rounded-full border-t-transparent animate-spin" />
                <Sparkles className="absolute inset-0 m-auto h-8 w-8 text-primary animate-pulse" />
              </div>
              
              <div className="w-full space-y-4">
                {LOADING_STEPS.map((step, index) => {
                  const isActive = index === currentStep;
                  const isPast = index < currentStep;
                  return (
                    <div key={step} className={`flex items-center gap-3 transition-all duration-500 ${isActive ? 'opacity-100 scale-105' : isPast ? 'opacity-50' : 'opacity-20'}`}>
                      {isPast ? (
                        <CheckCircle2 className="w-5 h-5 text-primary" />
                      ) : isActive ? (
                        <Loader2 className="w-5 h-5 text-primary animate-spin" />
                      ) : (
                        <div className="w-5 h-5 rounded-full border-2 border-current" />
                      )}
                      <span className={`text-sm font-medium ${isActive ? 'text-primary' : 'text-foreground'}`}>{step}</span>
                    </div>
                  );
                })}
              </div>

              {videoId && (
                <p className="text-muted-foreground/50 text-[10px] mt-8 font-mono tracking-wider uppercase">
                  TASK ID: {videoId.split('-').pop()}
                </p>
              )}
            </motion.div>
          ) : !videoUrl && (
            <div className="flex flex-col items-center justify-center text-muted-foreground">
              <Video className="h-16 w-16 mb-4 opacity-10" />
              <p className="text-sm font-medium opacity-60">Ready to synthesize.</p>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
