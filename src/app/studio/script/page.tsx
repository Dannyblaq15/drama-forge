'use client';

import React, { useState } from 'react';
import { FileText, Play, Sparkles, Save } from 'lucide-react';
import { customApi } from '@/services/customApi';
import { useRouter } from 'next/navigation';

export default function ScriptPage() {
  const [prompt, setPrompt] = useState('');
  const [script, setScript] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSendToStoryboard = () => {
    sessionStorage.setItem('storyboard_input', script);
    router.push('/studio/story-board');
  };

  const handleGenerateScript = async () => {
    if (!prompt) return;
    setIsGenerating(true);
    setError(null);
    try {
      // Integration with the custom API for script generation
      const result = await customApi.generateScript({ prompt });
      setScript(result.script || 'No script was generated.');
    } catch (err: any) {
      console.error('Script generation failed:', err);
      setError(err.message || 'An error occurred during script generation');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Script Generator</h1>
          <p className="text-muted-foreground mt-1">Generate screenplay and scene beats from your prompt.</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 rounded-md bg-secondary px-4 py-2 text-sm font-medium hover:bg-secondary/80">
            <Save className="h-4 w-4" />
            Save Draft
          </button>
          <button 
            onClick={handleGenerateScript}
            disabled={isGenerating || !prompt}
            className="flex items-center gap-2 rounded-md bg-indigo-600 hover:bg-indigo-700 text-sm font-medium text-white disabled:opacity-50 transition px-4 py-2 shadow"
          >
            {isGenerating ? <Sparkles className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
            Generate Script
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive flex items-center gap-3">
           <span className="font-semibold text-sm">Error:</span>
           <span className="text-sm opacity-90">{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-4">
          <div className="glass-panel rounded-xl p-5">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              Creative Prompt
            </h3>
            <textarea
              className="w-full h-40 bg-neutral-900/80 border border-neutral-800 rounded-lg p-3 text-sm text-neutral-200 placeholder:text-neutral-600 focus:outline-none focus:ring-1 focus:ring-primary resize-none"
              placeholder="Enter your scene description or story idea..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
            />
          </div>
          
          <div className="glass-panel rounded-xl p-5">
            <h3 className="font-semibold mb-3">Parameters</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Genre</label>
                <select className="w-full bg-neutral-900 border border-neutral-800 text-neutral-200 rounded-md p-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary">
                  <option>Cyberpunk</option>
                  <option>Romance</option>
                  <option>Comedy</option>
                  <option>Thriller</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Length</label>
                <select className="w-full bg-neutral-900 border border-neutral-800 text-neutral-200 rounded-md p-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary">
                  <option>Short (30s)</option>
                  <option>Medium (60s)</option>
                  <option>Long (3m)</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="glass-panel rounded-xl h-full flex flex-col overflow-hidden">
            <div className="border-b border-border bg-muted/30 px-5 py-3 flex items-center justify-between">
              <h3 className="font-semibold text-sm">Generated Screenplay</h3>
              <div className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground">{script ? `${script.split(' ').length} words` : '0 words'}</span>
                {script && (
                  <button 
                    onClick={handleSendToStoryboard}
                    className="flex items-center gap-1.5 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-3 py-1.5 transition active:scale-95 shadow"
                  >
                    Send to Storyboard →
                  </button>
                )}
              </div>
            </div>
            <div className="p-5 flex-1 bg-neutral-950/50">
              {script ? (
                <textarea 
                  className="w-full h-full min-h-[400px] bg-transparent border-none focus:outline-none resize-none font-mono text-sm leading-relaxed"
                  value={script}
                  onChange={(e) => setScript(e.target.value)}
                />
              ) : (
                <div className="h-full min-h-[400px] flex items-center justify-center text-muted-foreground text-sm">
                  Your generated script will appear here.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
