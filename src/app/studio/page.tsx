'use client';

import React, { useState } from 'react';
import { StudioActivity } from '@/components/studio-activity';
import { Sparkles, Video, DollarSign, Film, Loader2 } from 'lucide-react';
import { ProtectedRoute } from '@/components/ProtectedRoute';

export default function StudioPage() {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [episodeId, setEpisodeId] = useState<string | null>(null);
  
  // Custom pipeline options
  const [genre, setGenre] = useState('Melodrama');
  const [budget, setBudget] = useState(1.0);

  const genres = [
    { value: 'Melodrama', label: 'Melodrama' },
    { value: 'Revenge', label: 'Revenge Drama' },
    { value: 'Cyberpunk Thriller', label: 'Cyberpunk Thriller' },
    { value: 'Werewolf Romance', label: 'Werewolf Romance' },
    { value: 'Historical Action', label: 'Historical Action' }
  ];

  const handleGenerate = async () => {
    if (!prompt) return;
    setIsGenerating(true);
    
    try {
      const fullPrompt = `[Genre: ${genre}] Premise: ${prompt}`;
      
      const response = await fetch(`/api/episodes/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: 'dummy-project-id', // Proto dummy project ID
          prompt: fullPrompt,
          budget: budget
        }),
      });

      const data = await response.json();
      if (data.episodeId) {
        setEpisodeId(data.episodeId);
      }
    } catch (error) {
      console.error('Failed to trigger generation:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="space-y-8 max-w-4xl mx-auto mt-8 px-4 sm:px-0">
        
        {/* Banner Title */}
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="inline-flex items-center justify-center p-3.5 rounded-2xl bg-indigo-600/10 text-indigo-400 border border-indigo-500/10 shadow-inner">
            <Video className="w-8 h-8" />
          </div>
          <div className="flex flex-col items-center space-y-2">
            <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl text-white">
              AI Showrunner Studio
            </h1>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-neutral-900 border border-neutral-850 text-[10px] font-bold text-neutral-450 tracking-wide uppercase">
              <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
              Powered by Qwen AI
            </span>
          </div>
          <p className="text-neutral-400 max-w-lg text-sm sm:text-base">
            Configure your creative blueprint and trigger our six-agent pipeline. Formulate, script, storyboard, generate, and edit vertical short drama clips automatically.
          </p>
        </div>

        {/* Studio Setup Panels */}
        {!episodeId && (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
            
            {/* Input Form Column */}
            <div className="md:col-span-8 bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden shadow-sm flex flex-col justify-between">
              <div className="p-6 border-b border-neutral-800">
                <h3 className="text-lg font-bold text-neutral-100">Creative Premise Blueprint</h3>
                <p className="text-xs text-neutral-500 mt-1">
                  Detail the narrative context or scene beats of the vertical episode.
                </p>
              </div>
              <div className="p-6 space-y-4 flex-grow">
                <textarea
                  className="w-full h-44 bg-neutral-950 border border-neutral-800 rounded-lg p-4 text-sm text-neutral-200 placeholder:text-neutral-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 resize-none font-sans"
                  placeholder="Example: A billionaire CEO disguises himself as a janitor to find out who stole company funds. He catches the CFO red-handed..."
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  disabled={isGenerating}
                />
              </div>
              
              <div className="p-6 border-t border-neutral-800/60 bg-neutral-950/20">
                <button 
                  onClick={handleGenerate} 
                  disabled={!prompt || isGenerating}
                  className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-semibold transition shadow-lg shadow-indigo-500/10 w-full h-11 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Spinning Up Agents...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Deploy Showrunner Agent
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Sidebar Configurations Column */}
            <div className="md:col-span-4 space-y-6">
              
              {/* Genre Panel */}
              <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5">
                <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-3">
                  Genre Angle
                </h4>
                <select
                  value={genre}
                  onChange={(e) => setGenre(e.target.value)}
                  disabled={isGenerating}
                  className="w-full h-10 px-3 bg-neutral-950 border border-neutral-800 rounded-md text-xs text-neutral-350 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 font-sans"
                >
                  {genres.map((g) => (
                    <option key={g.value} value={g.value}>
                      {g.label}
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-neutral-500 mt-2 font-sans leading-normal">
                  The Story Architect applies a dual-line plot structures based on selected genre templates.
                </p>
              </div>

              {/* Budget Configuration Panel */}
              <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5">
                <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2 flex items-center justify-between">
                  <span>Spend Budget Cap</span>
                  <span className="font-mono text-indigo-400 font-bold">${budget.toFixed(2)}</span>
                </h4>
                <p className="text-[10px] text-neutral-500 mb-4 leading-normal">
                  Limit maximum dollar cost per episode run. Economy Mode downgrades models past 80%.
                </p>
                <div className="space-y-3">
                  <input
                    type="range"
                    min="0.10"
                    max="3.00"
                    step="0.05"
                    value={budget}
                    onChange={(e) => setBudget(parseFloat(e.target.value))}
                    disabled={isGenerating}
                    className="w-full accent-indigo-500"
                  />
                  <div className="flex justify-between text-[9px] text-neutral-500 font-mono">
                    <span>Min: $0.10</span>
                    <span>Max: $3.00</span>
                  </div>
                </div>
              </div>

              {/* Hackathon Specs Info Box */}
              <div className="bg-neutral-900 border border-neutral-850 rounded-xl p-5 text-left font-sans text-xs text-neutral-500 space-y-2 leading-relaxed">
                <span className="font-bold text-neutral-400 block uppercase tracking-wider text-[10px]">Track 2 Target Requirements</span>
                <p>• Autonomous 6-stage video orchestration</p>
                <p>• Locked references character continuity</p>
                <p>• Real-time token budget meter logs</p>
                <p>• Automated FFmpeg Vertical output render</p>
              </div>

            </div>
          </div>
        )}

        {/* Live Active Stepper and Logs Display */}
        {episodeId && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="mb-4 flex justify-between items-center bg-neutral-950 border border-neutral-850 p-4 rounded-xl">
              <div>
                <span className="text-[10px] text-neutral-500 uppercase tracking-wider font-mono">Active Episode Instance</span>
                <span className="text-xs font-bold font-mono text-neutral-350 block mt-0.5">ID: {episodeId}</span>
              </div>
              <button 
                onClick={() => {
                  setEpisodeId(null);
                  setPrompt('');
                }}
                className="inline-flex items-center justify-center rounded-md text-xs font-semibold px-4 py-1.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 transition"
              >
                Reset Studio
              </button>
            </div>
            
            <StudioActivity episodeId={episodeId} budget={budget} />
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
