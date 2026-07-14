'use client';

import React, { useState, useEffect } from 'react';
import { Settings, Download, Film, CheckCircle2, Loader2, RefreshCw, Play, Share2, UploadCloud, Image, Compass, Smartphone, Globe } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface SavedVideo {
  id: string;
  prompt: string;
  videoUrl: string;
  taskId: string;
  createdAt: string;
  status: string;
}

interface Character {
  id: string;
  name: string;
  role: string;
  referenceImageUrl: string;
}

export default function ProductionPage() {
  const [videos, setVideos] = useState<SavedVideo[]>([]);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Production settings & metadata
  const [videoTitle, setVideoTitle] = useState('');
  const [caption, setCaption] = useState('');
  const [selectedCoverUrl, setSelectedCoverUrl] = useState<string | null>(null);
  const [burnWatermark, setBurnWatermark] = useState(false);

  // Social media publishing mock state
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishProgress, setPublishProgress] = useState<string[]>([]);
  const [publishSuccess, setPublishSuccess] = useState(false);
  const [selectedChannels, setSelectedChannels] = useState({
    tiktok: true,
    instagram: true,
    youtube: false
  });

  const fetchVideosAndCharacters = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // 1. Fetch videos
      const res = await fetch('/api/save');
      if (!res.ok) throw new Error('Failed to fetch production media');
      const data = await res.json();
      const vids: SavedVideo[] = data.videos || [];
      setVideos(vids);
      
      if (vids.length > 0 && !selectedVideoId) {
        setSelectedVideoId(vids[0].id);
        setVideoTitle(`DramaForge Episode #${vids[0].id.slice(0, 5)}`);
        setCaption(`Check out our new vertical drama compiled with DramaForge Showrunner! #QwenCloud #Wan2.7 #Showrunner #ShortDrama`);
      }

      // 2. Fetch characters for cover art options
      const charRes = await fetch('/api/characters/dummy-project-id');
      if (charRes.ok) {
        const charData = await charRes.json();
        setCharacters(charData || []);
        if (charData.length > 0) {
          setSelectedCoverUrl(charData[0].referenceImageUrl);
        }
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchVideosAndCharacters();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectedVideo = videos.find(v => v.id === selectedVideoId) ?? null;

  // Handle selected video change
  const handleSelectVideo = (video: SavedVideo) => {
    setSelectedVideoId(video.id);
    setVideoTitle(`DramaForge Episode #${video.id.slice(0, 5)}`);
    setCompiledSuccessState();
  };

  const setCompiledSuccessState = () => {
    setPublishSuccess(false);
    setPublishProgress([]);
  };

  // Mock social publishing sequence
  const handlePublish = async () => {
    setIsPublishing(true);
    setPublishSuccess(false);
    setPublishProgress(['Publisher: Initializing API distribution pipelines...']);

    const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

    try {
      await delay(1200);
      if (selectedChannels.tiktok) {
        setPublishProgress(prev => [...prev, 'Publisher: Uploading vertical cut 720x1280 to TikTok API...']);
        await delay(1000);
        setPublishProgress(prev => [...prev, 'Publisher: Bypassing credentials verification (cn-beijing)...']);
        await delay(800);
      }
      if (selectedChannels.instagram) {
        setPublishProgress(prev => [...prev, 'Publisher: Syncing cover portrait and meta details to Instagram Reels...']);
        await delay(1100);
      }
      if (selectedChannels.youtube) {
        setPublishProgress(prev => [...prev, 'Publisher: Uploading short track format to YouTube Shorts server...']);
        await delay(900);
      }
      
      setPublishProgress(prev => [...prev, 'Publisher: Appending default subtitles and hashtags configurations...']);
      await delay(1000);
      
      setPublishProgress(prev => [...prev, 'Publisher: Broadcast successful! Episode is now live on selected channels.']);
      setPublishSuccess(true);
    } catch (err) {
      console.error(err);
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="space-y-6 pb-24">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">
            Production & Release Hub
          </h1>
          <p className="text-neutral-500 mt-1 text-sm">
            Export video master, choose casting poster covers, and publish directly to social networks.
          </p>
        </div>
        <button
          onClick={fetchVideosAndCharacters}
          disabled={isLoading}
          className="flex items-center gap-2 rounded-lg border border-neutral-800 bg-neutral-900/50 px-4 py-2.5 text-xs font-semibold text-neutral-350 hover:bg-neutral-850 disabled:opacity-50 transition"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          Sync Master Files
        </button>
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
            <p className="text-sm font-sans">Syncing production files...</p>
          </div>
        </div>
      ) : videos.length === 0 ? (
        <div className="glass-panel rounded-2xl p-8 min-h-[400px] flex flex-col items-center justify-center text-neutral-500 gap-4 border border-neutral-800">
          <Smartphone className="h-14 w-14 opacity-10 text-indigo-500" />
          <p className="text-sm font-semibold opacity-60">No videos ready. Assemble video cuts in the timeline first.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* LEFT COLUMN: Main preview player and configurations (col-span-8) */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Player Container */}
            <div className="glass-panel rounded-2xl overflow-hidden border border-neutral-800 bg-black/60 relative shadow-xl flex items-center justify-center min-h-[400px]">
              <AnimatePresence mode="wait">
                {selectedVideo ? (
                  <motion.div 
                    key={selectedVideo.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="w-full aspect-video flex items-center justify-center relative bg-black"
                  >
                    <video
                      src={selectedVideo.videoUrl}
                      controls
                      autoPlay
                      loop
                      className="w-full h-full object-contain"
                    />
                    <div className="absolute top-4 left-4 bg-black/70 backdrop-blur-md px-3 py-1.5 rounded-lg border border-neutral-800 text-[10px] text-indigo-400 font-bold tracking-wider uppercase">
                      Master Format: 9:16 Vertical Cut
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center gap-3 text-neutral-600"
                  >
                    <Play className="h-12 w-12" />
                    <p className="text-sm">Select a master file to preview</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Episode Metadata settings */}
            {selectedVideo && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Custom Metadata Details */}
                <div className="glass-panel rounded-2xl p-5 border border-neutral-800 bg-neutral-900/20 space-y-4">
                  <h3 className="text-xs font-bold text-neutral-350 uppercase tracking-wider flex items-center gap-2 border-b border-neutral-850 pb-2">
                    <Settings className="w-4 h-4 text-indigo-400" /> Episode Configurations
                  </h3>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="text-[10px] font-bold text-neutral-500 uppercase block mb-1">Release Title</label>
                      <input
                        type="text"
                        value={videoTitle}
                        onChange={(e) => setVideoTitle(e.target.value)}
                        className="w-full text-xs bg-neutral-950 border border-neutral-850 rounded-lg p-2.5 text-neutral-250 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-neutral-500 uppercase block mb-1">Social Captions & Tags</label>
                      <textarea
                        value={caption}
                        onChange={(e) => setCaption(e.target.value)}
                        className="w-full text-xs bg-neutral-950 border border-neutral-850 rounded-lg p-2.5 text-neutral-250 focus:outline-none focus:ring-1 focus:ring-indigo-500 h-20 resize-none font-sans leading-relaxed"
                      />
                    </div>
                    <div className="flex items-center justify-between pt-1">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-neutral-400">Burn Production Watermark</span>
                        <span className="text-[9px] text-neutral-600">Adds watermark overlay to bottom corner.</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={burnWatermark}
                        onChange={(e) => setBurnWatermark(e.target.checked)}
                        className="w-4 h-4 accent-indigo-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Cover Art selection from Cast list */}
                <div className="glass-panel rounded-2xl p-5 border border-neutral-800 bg-neutral-900/20 space-y-4">
                  <h3 className="text-xs font-bold text-neutral-350 uppercase tracking-wider flex items-center gap-2 border-b border-neutral-850 pb-2">
                    <Image className="w-4 h-4 text-indigo-400" /> Episode Poster Cover
                  </h3>
                  
                  {characters.length === 0 ? (
                    <div className="h-40 flex flex-col items-center justify-center text-neutral-600 text-xs">
                      <Image className="w-8 h-8 opacity-20 mb-2" />
                      No casting portraits loaded for covers.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <label className="text-[10px] font-bold text-neutral-500 uppercase block">Select character sheet as thumbnail poster</label>
                      <div className="grid grid-cols-4 gap-2">
                        {characters.map(char => (
                          <button
                            key={char.id}
                            onClick={() => setSelectedCoverUrl(char.referenceImageUrl)}
                            className={`aspect-square rounded-lg overflow-hidden border relative transition ${
                              selectedCoverUrl === char.referenceImageUrl
                                ? 'border-indigo-500 ring-2 ring-indigo-500/30'
                                : 'border-neutral-800 opacity-60 hover:opacity-100'
                            }`}
                          >
                            <img src={char.referenceImageUrl} alt={char.name} className="w-full h-full object-cover" />
                            <div className="absolute inset-x-0 bottom-0 bg-black/80 text-[8px] text-neutral-300 text-center py-0.5 truncate px-1">
                              {char.name}
                            </div>
                          </button>
                        ))}
                      </div>
                      {selectedCoverUrl && (
                        <div className="flex items-center gap-3 bg-neutral-950 p-2.5 rounded-lg border border-neutral-850 mt-1">
                          <img src={selectedCoverUrl} alt="selected cover" className="w-8 h-8 rounded object-cover shrink-0" />
                          <div>
                            <span className="text-[9px] font-bold text-neutral-500 block uppercase">Selected Cover Poster</span>
                            <span className="text-[10px] text-neutral-300 truncate block max-w-xs">{selectedCoverUrl.split('/').pop()}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* RIGHT COLUMN: Video lists & details */}
          <div className="lg:col-span-4 space-y-6">

            {/* Video masters list section */}
            <div className="glass-panel rounded-2xl p-5 border border-neutral-800 bg-neutral-900/20 space-y-4">
              <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-2">
                <Film className="h-4 w-4 text-indigo-500" /> Master Files ({videos.length})
              </h3>
              
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                {videos.map((v) => (
                  <div
                    key={v.id}
                    className={`flex items-center justify-between rounded-xl border p-3 transition-all ${
                      selectedVideoId === v.id
                        ? 'border-indigo-500/30 bg-indigo-950/20'
                        : 'border-neutral-800 bg-neutral-900/40 hover:border-neutral-700/60'
                    }`}
                  >
                    <button
                      onClick={() => handleSelectVideo(v)}
                      className="text-left min-w-0 flex-1"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <div className={`w-1.5 h-1.5 rounded-full ${v.status === 'SUCCESS' ? 'bg-green-400' : 'bg-yellow-400'}`} />
                        <span className="text-[10px] text-neutral-500">{v.status === 'SUCCESS' ? 'PRODUCTION MASTER' : 'PENDING'}</span>
                      </div>
                      <p className="text-xs font-semibold text-neutral-200 line-clamp-2">{v.prompt}</p>
                      <p className="text-[10px] text-neutral-600 mt-1">
                        {new Date(v.createdAt).toLocaleDateString()}
                      </p>
                    </button>
                    
                    <a
                      href={v.videoUrl}
                      download
                      target="_blank"
                      rel="noreferrer"
                      className="ml-3 p-2 rounded-lg bg-neutral-800 text-neutral-400 hover:text-white transition shrink-0"
                      title="Download Master File"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </a>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
