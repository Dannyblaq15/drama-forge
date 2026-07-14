'use client';

import React, { useState, useEffect } from 'react';
import { Scissors, CheckCircle, Film, ImageIcon, Loader2, RefreshCw, Plus, Trash2, ArrowLeft, ArrowRight, Video, Sparkles, Wand2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';

interface SavedVideo {
  id: string;
  prompt: string;
  videoUrl: string;
  taskId: string;
  createdAt: string;
}

interface SavedStoryboard {
  id: string;
  prompt: string;
  taskIds: string; // JSON array of URLs
  createdAt: string;
}

interface TimelineItem {
  timelineId: string; // unique local ID to allow duplicate clips in timeline
  id: string;
  prompt: string;
  videoUrl: string;
  subtitleText: string;
}

export default function EditingPage() {
  const [videos, setVideos] = useState<SavedVideo[]>([]);
  const [storyboards, setStoryboards] = useState<SavedStoryboard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Interactive timeline state persisted in localStorage
  const [timeline, setTimeline] = useState<TimelineItem[]>([]);
  const [isTimelineLoaded, setIsTimelineLoaded] = useState(false);
  const [isCompiling, setIsCompiling] = useState(false);
  const [compilingLogs, setCompilingLogs] = useState<string[]>([]);
  const [compiledVideoUrl, setCompiledVideoUrl] = useState<string | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<SavedVideo | null>(null);

  const router = useRouter();

  // Load from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('dramaforge_timeline');
      if (saved) {
        try {
          setTimeline(JSON.parse(saved));
        } catch (e) {
          console.error('Failed to parse saved timeline:', e);
        }
      }
      setIsTimelineLoaded(true);
    }
  }, []);

  // Save to localStorage when timeline changes
  useEffect(() => {
    if (isTimelineLoaded && typeof window !== 'undefined') {
      localStorage.setItem('dramaforge_timeline', JSON.stringify(timeline));
    }
  }, [timeline, isTimelineLoaded]);

  const fetchMedia = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/save');
      if (!res.ok) throw new Error('Failed to fetch saved media');
      const data = await res.json();
      setVideos(data.videos || []);
      setStoryboards(data.storyboards || []);
      if (data.videos?.length > 0) {
        setSelectedVideo(data.videos[0]);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMedia();
  }, []);

  // Add clip to timeline
  const addToTimeline = (video: SavedVideo) => {
    const newItem: TimelineItem = {
      timelineId: `t-${Math.random().toString(36).substring(5)}`,
      id: video.id,
      prompt: video.prompt,
      videoUrl: video.videoUrl,
      // Default subtitle is the prompt snippet
      subtitleText: video.prompt.split(',')[0].slice(0, 50)
    };
    setTimeline(prev => [...prev, newItem]);
  };

  // Remove clip from timeline
  const removeFromTimeline = (timelineId: string) => {
    setTimeline(prev => prev.filter(item => item.timelineId !== timelineId));
  };

  // Move clip left/right on track
  const moveTimelineItem = (index: number, direction: 'left' | 'right') => {
    if (direction === 'left' && index === 0) return;
    if (direction === 'right' && index === timeline.length - 1) return;

    const targetIndex = direction === 'left' ? index - 1 : index + 1;
    const newTimeline = [...timeline];
    const temp = newTimeline[index];
    newTimeline[index] = newTimeline[targetIndex];
    newTimeline[targetIndex] = temp;
    setTimeline(newTimeline);
  };

  // Update caption
  const updateSubtitle = (timelineId: string, text: string) => {
    setTimeline(prev => prev.map(item => 
      item.timelineId === timelineId ? { ...item, subtitleText: text } : item
    ));
  };

  // Compile timeline into single master vertical drama
  const handleCompileTimeline = async () => {
    if (timeline.length === 0) return;
    setIsCompiling(true);
    setCompilingLogs(['Connecting to video compiler...']);
    setCompiledVideoUrl(null);
    setError(null);

    try {
      const payload = {
        projectId: 'dummy-project-id',
        clips: timeline.map(item => ({
          id: item.id,
          videoUrl: item.videoUrl,
          subtitleText: item.subtitleText
        }))
      };

      const res = await fetch(`/api/editing/compile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorText = await res.text().catch(() => 'No response body');
        throw new Error(`Timeline compilation request failed: HTTP ${res.status} - ${errorText}`);
      }

      const data = await res.json();
      
      if (data.logs) {
        setCompilingLogs(data.logs);
      }
      if (data.videoUrl) {
        setCompiledVideoUrl(data.videoUrl);
        setCompilingLogs(prev => [...prev, 'Video compiled successfully!']);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An error occurred compiling the timeline video.');
    } finally {
      setIsCompiling(false);
    }
  };

  const getStoryboardUrls = (s: SavedStoryboard): string[] => {
    try { return JSON.parse(s.taskIds); } catch { return []; }
  };

  return (
    <div className="space-y-6 pb-24">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">
            Timeline Editor
          </h1>
          <p className="text-neutral-500 mt-1 text-sm">
            Drag, reorder, caption, and stitch your generated clips into a master vertical short drama.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchMedia}
            disabled={isLoading || isCompiling}
            className="flex items-center gap-2 rounded-lg border border-neutral-800 bg-neutral-900/50 px-4 py-2.5 text-xs font-semibold text-neutral-350 hover:bg-neutral-850 disabled:opacity-50 transition"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Sync Library
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-red-400 text-sm">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="glass-panel rounded-2xl p-8 min-h-[400px] flex items-center justify-center border border-neutral-800">
          <div className="flex flex-col items-center gap-4 text-neutral-500">
            <Loader2 className="h-10 w-10 animate-spin text-indigo-500" />
            <p className="text-sm font-sans">Syncing workspace assets...</p>
          </div>
        </div>
      ) : videos.length === 0 ? (
        <div className="glass-panel rounded-2xl p-12 min-h-[350px] flex flex-col items-center justify-center border border-neutral-800 text-center space-y-6 max-w-xl mx-auto mt-8">
          <div className="h-16 w-16 rounded-full bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <Scissors className="h-8 w-8" />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-bold text-white">Your Video Library is Empty</h3>
            <p className="text-sm text-neutral-400 leading-relaxed max-w-sm">
              Before you can edit or compile a timeline master, you need to generate some short-drama video clips.
            </p>
          </div>
          <button
            onClick={() => router.push('/studio/video-gen')}
            className="flex items-center gap-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-6 py-3 transition active:scale-95 shadow-md shadow-indigo-500/10"
          >
            <Video className="w-4 h-4" /> Go to Video Gen page
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* LEFT: Video Preview Area */}
          <div className="lg:col-span-2 space-y-4">
            <div className="glass-panel rounded-2xl overflow-hidden border border-neutral-800 aspect-video flex items-center justify-center bg-black/80 relative shadow-xl">
              <AnimatePresence mode="wait">
                {compiledVideoUrl ? (
                  <motion.div 
                    key="compiled"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="w-full h-full relative"
                  >
                    <video 
                      src={compiledVideoUrl} 
                      controls 
                      autoPlay 
                      className="w-full h-full object-contain"
                    />
                    <div className="absolute top-4 left-4 bg-indigo-900/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-indigo-700 text-white text-[10px] font-bold tracking-wider uppercase">
                      Timeline Render Complete
                    </div>
                  </motion.div>
                ) : selectedVideo ? (
                  <motion.video
                    key={selectedVideo.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    src={selectedVideo.videoUrl}
                    controls
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <motion.div
                    key="no-video"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center gap-3 text-neutral-600"
                  >
                    <Film className="h-12 w-12 text-indigo-500 opacity-20" />
                    <p className="text-xs">Select a clip to preview</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Selected Clip Detail Card */}
            {selectedVideo && !compiledVideoUrl && (
              <div className="glass-panel rounded-xl p-4 border border-neutral-800 flex items-center justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
                    <span className="text-xs font-bold text-emerald-500">Asset Sync Verified</span>
                  </div>
                  <p className="text-xs text-neutral-300 line-clamp-2 leading-relaxed">{selectedVideo.prompt}</p>
                </div>
                <button
                  onClick={() => addToTimeline(selectedVideo)}
                  className="flex items-center gap-1.5 shrink-0 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-4 py-2 transition active:scale-95 shadow-md shadow-indigo-500/10"
                >
                  <Plus className="w-3.5 h-3.5" /> Add to Timeline
                </button>
              </div>
            )}

            {/* Compiled Clip Redirect Detail Card */}
            {compiledVideoUrl && (
              <div className="glass-panel rounded-xl p-4 border border-indigo-950 bg-indigo-950/10 flex items-center justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <span className="text-xs font-bold text-indigo-400 block uppercase mb-1">Timeline Master Compiled</span>
                  <p className="text-xs text-neutral-400">Save and download your finished vertical edit.</p>
                </div>
                <button
                  onClick={() => router.push('/studio/production')}
                  className="inline-flex items-center justify-center gap-1.5 shrink-0 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-5 py-2.5 transition active:scale-95 shadow-md"
                >
                  Go to Production →
                </button>
              </div>
            )}
          </div>

          {/* RIGHT: Library Column */}
          <div className="space-y-4 max-h-[480px] overflow-y-auto pr-1">
            {videos.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-2">
                  <Film className="h-4 w-4 text-indigo-500" /> Video Clips ({videos.length})
                </h3>
                <div className="space-y-2">
                  {videos.map((v) => (
                    <div
                      key={v.id}
                      className={`flex items-center justify-between rounded-xl border p-3 transition-all ${
                        selectedVideo?.id === v.id
                          ? 'border-indigo-500/30 bg-indigo-950/20'
                          : 'border-neutral-800 bg-neutral-900/40 hover:border-neutral-700/60'
                      }`}
                    >
                      <button
                        onClick={() => {
                          setSelectedVideo(v);
                          setCompiledVideoUrl(null);
                        }}
                        className="text-left min-w-0 flex-1"
                      >
                        <p className="text-xs font-semibold text-neutral-200 line-clamp-2">{v.prompt}</p>
                        <p className="text-[10px] text-neutral-600 mt-1">
                          {new Date(v.createdAt).toLocaleDateString()}
                        </p>
                      </button>
                      <button
                        onClick={() => addToTimeline(v)}
                        className="ml-3 p-1.5 rounded-md hover:bg-neutral-800 text-indigo-400 hover:text-indigo-300 transition shrink-0"
                        title="Add to Timeline"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {storyboards.length > 0 && (
              <div className="space-y-3 pt-2">
                <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-2">
                  <ImageIcon className="h-4 w-4 text-indigo-500" /> Storyboard Reference ({storyboards.length})
                </h3>
                <div className="space-y-2">
                  {storyboards.map((s) => {
                    const urls = getStoryboardUrls(s);
                    return (
                      <div
                        key={s.id}
                        className="rounded-xl border border-neutral-800 bg-neutral-900/40 overflow-hidden"
                      >
                        {urls[0] && (
                          <img src={urls[0]} alt={s.prompt} className="w-full aspect-video object-cover" />
                        )}
                        <div className="p-3">
                          <p className="text-[11px] text-neutral-400 line-clamp-2 leading-relaxed">{s.prompt}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* BOTTOM: Horizontal Timeline Editor Track */}
      {videos.length > 0 && (
        <div className="border-t border-neutral-800 pt-6">
          <div className="bg-neutral-900 border border-neutral-850 rounded-2xl p-5 shadow-2xl space-y-4">
            {/* Timeline Header controls */}
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <div className="flex items-center gap-2.5">
                <Scissors className="w-4 h-4 text-indigo-400 animate-pulse" />
                <span className="text-xs font-bold text-neutral-350 uppercase tracking-wider">Video Assembly Timeline Track</span>
                <span className="text-[10px] font-mono bg-neutral-800 px-2 py-0.5 rounded text-neutral-400">
                  {timeline.length} {timeline.length === 1 ? 'clip' : 'clips'}
                </span>
              </div>
              
              <div className="flex gap-3">
                {timeline.length > 0 && (
                  <button
                    onClick={() => setTimeline([])}
                    disabled={isCompiling}
                    className="text-xs text-neutral-500 hover:text-neutral-300 font-semibold transition"
                  >
                    Clear Timeline
                  </button>
                )}
                <button
                  onClick={handleCompileTimeline}
                  disabled={isCompiling || timeline.length === 0}
                  className="flex items-center gap-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 px-4 py-2 text-xs font-bold text-white transition disabled:opacity-40 active:scale-95 shadow-md shadow-indigo-500/10"
                >
                  {isCompiling ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Wand2 className="w-3.5 h-3.5" />}
                  {isCompiling ? 'Compiling Edit...' : 'Compile Timeline Video'}
                </button>
              </div>
            </div>

            {/* Track Scroll Container */}
            <div className="flex gap-4 overflow-x-auto py-4 min-h-[160px] scrollbar-thin scrollbar-thumb-neutral-800">
              <AnimatePresence>
                {timeline.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-neutral-600 py-6">
                    <Film className="w-8 h-8 opacity-20 mb-2" />
                    <p className="text-xs font-sans">Timeline empty. Click "+" on library clips above to assemble your track.</p>
                  </div>
                ) : (
                  timeline.map((item, idx) => (
                    <motion.div
                      key={item.timelineId}
                      layout
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="w-64 shrink-0 bg-neutral-950 border border-neutral-800 rounded-xl p-3 flex flex-col justify-between space-y-3 relative group"
                    >
                      {/* Video clip thumbnail/loop preview */}
                      <div className="relative aspect-video rounded-lg overflow-hidden border border-neutral-900 bg-black">
                        <video 
                          src={item.videoUrl} 
                          loop 
                          muted 
                          autoPlay
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-2 left-2 bg-black/60 px-1.5 py-0.5 rounded text-[9px] font-mono text-neutral-400">
                          #{idx + 1}
                        </div>
                      </div>

                      {/* Subtitle Caption Editor */}
                      <div>
                        <label className="text-[10px] font-bold text-neutral-500 uppercase block mb-1">Subtitle Text</label>
                        <input
                          type="text"
                          value={item.subtitleText}
                          onChange={(e) => updateSubtitle(item.timelineId, e.target.value)}
                          className="w-full text-xs bg-neutral-900 border border-neutral-800 rounded px-2 py-1 text-neutral-300 focus:outline-none focus:border-indigo-500"
                          placeholder="Subtitle dialogue..."
                        />
                      </div>

                      {/* Timeline Block Controls */}
                      <div className="flex items-center justify-between border-t border-neutral-900 pt-2 text-[10px]">
                        <div className="flex gap-1">
                          <button
                            onClick={() => moveTimelineItem(idx, 'left')}
                            disabled={idx === 0}
                            className="p-1 rounded hover:bg-neutral-900 text-neutral-500 hover:text-neutral-300 disabled:opacity-30"
                            title="Move Left"
                          >
                            <ArrowLeft className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => moveTimelineItem(idx, 'right')}
                            disabled={idx === timeline.length - 1}
                            className="p-1 rounded hover:bg-neutral-900 text-neutral-500 hover:text-neutral-300 disabled:opacity-30"
                            title="Move Right"
                          >
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <button
                          onClick={() => removeFromTimeline(item.timelineId)}
                          className="p-1 rounded hover:bg-red-950 text-neutral-500 hover:text-red-400 transition"
                          title="Delete Clip"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>

            {/* Compilation Progress Logs Overlay */}
            {isCompiling && (
              <div className="bg-neutral-950 border border-neutral-850 rounded-xl p-4 space-y-2 animate-pulse">
                <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider block">Compilation Pipeline Logs</span>
                <div className="font-mono text-[10px] text-neutral-400 max-h-24 overflow-y-auto space-y-1">
                  {compilingLogs.map((log, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <span className="text-neutral-600">{index + 1}.</span>
                      <span>{log}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
