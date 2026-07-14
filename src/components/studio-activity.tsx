'use client';

import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { 
  Loader2, CheckCircle, XCircle, DollarSign, Cpu, AlertTriangle, 
  User, Film, Download, FileText, Play, Volume2 
} from 'lucide-react';

interface ProgressEvent {
  episodeId: string;
  message: string;
  timestamp: string;
  cost?: number;
  tokensUsed?: number;
  economyMode?: boolean;
  logs?: any[];
}

interface ErrorEvent {
  episodeId: string;
  errorMsg: string;
  timestamp: string;
}

interface Character {
  id: string;
  name: string;
  description: string;
  referenceImageUrl: string;
}

interface EpisodeDetails {
  id: string;
  title: string;
  status: string;
  videoUrl?: string;
  cost: number;
  tokensUsed: number;
  scriptContent?: string;
}

export function StudioActivity({ episodeId, budget }: { episodeId: string; budget: number }) {
  const [logs, setLogs] = useState<ProgressEvent[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  
  // Real-time telemetry
  const [cost, setCost] = useState(0);
  const [tokensUsed, setTokensUsed] = useState(0);
  const [economyMode, setEconomyMode] = useState(false);
  const [stageLogs, setStageLogs] = useState<any[]>([]);
  const [characters, setCharacters] = useState<Character[]>([]);
  
  // Final assets
  const [episodeDetails, setEpisodeDetails] = useState<EpisodeDetails | null>(null);

  const steps = [
    { id: 1, name: 'Hook Strategist', desc: 'Commercial & runtime blueprint', model: 'qwen-max' },
    { id: 2, name: 'Story Architect', desc: 'Dual-line scene breakdown', model: 'qwen-max' },
    { id: 3, name: 'Scriptwriter', desc: 'Parallel scene dialogues & actions', model: 'qwen-plus' },
    { id: 4, name: 'Storyboard Director', desc: 'Cinematic composition angles', model: 'qwen-max' },
    { id: 5, name: 'Casting & Video Engine', desc: 'Consistent portrait & video synthesis', model: 'Wan Image & Video' },
    { id: 6, name: 'Audio & Music', desc: 'Composes scores & generates voiceovers', model: 'CosyVoice / Melotts' },
    { id: 7, name: 'Post-Production', desc: 'Subtitles & transitions stitcher', model: 'FFmpeg' }
  ];

  // Fetch final details once completed
  const fetchFinalDetails = async () => {
    try {
      // Fetch episode status
      const epRes = await fetch(`/api/episodes/${episodeId}`);
      if (epRes.ok) {
        const epData = await epRes.json();
        setEpisodeDetails(epData);
      }

      // Fetch characters
      const charRes = await fetch(`/api/characters/dummy-project-id`);
      if (charRes.ok) {
        const charData = await charRes.json();
        setCharacters(charData);
      }
    } catch (err) {
      console.error('Failed to fetch final episode assets:', err);
    }
  };

  useEffect(() => {
    // Reset all status and telemetry state when switching to a new episode run
    setLogs([]);
    setError(null);
    setIsCompleted(false);
    setActiveStep(0);
    setCost(0);
    setTokensUsed(0);
    setEconomyMode(false);
    setStageLogs([]);
    setCharacters([]);
    setEpisodeDetails(null);

    let intervalId: any;
    let isMounted = true;

    const pollProgress = async () => {
      try {
        const res = await fetch(`/api/episodes/${episodeId}/progress`);
        if (!res.ok) return;
        const data = await res.json();
        
        if (!isMounted) return;

        if (data.logs) {
          setLogs(data.logs);
        }
        if (data.cost !== undefined) setCost(data.cost);
        if (data.tokensUsed !== undefined) setTokensUsed(data.tokensUsed);
        if (data.economyMode !== undefined) setEconomyMode(data.economyMode);
        if (data.stageLogs !== undefined) setStageLogs(data.stageLogs);
        if (data.error) setError(data.error);

        // Parse active step from current logs
        if (data.logs && data.logs.length > 0) {
          const lastLog = data.logs[data.logs.length - 1];
          const msg = lastLog.message.toLowerCase();
          
          if (msg.includes('stage 1')) {
            setActiveStep(1);
          } else if (msg.includes('stage 2')) {
            setActiveStep(2);
          } else if (msg.includes('stage 3')) {
            setActiveStep(3);
          } else if (msg.includes('stage 4')) {
            setActiveStep(4);
          } else if (msg.includes('stage 5')) {
            setActiveStep(5);
            fetchFinalDetails();
          } else if (msg.includes('stage 6')) {
            setActiveStep(6);
          } else if (msg.includes('stage 7')) {
            setActiveStep(7);
          } else if (msg.includes('completed pre-production') || msg.includes('final video rendered')) {
            setActiveStep(7);
            setIsCompleted(true);
            fetchFinalDetails();
            clearInterval(intervalId);
          }
        }

        if (data.isCompleted) {
          setIsCompleted(true);
          fetchFinalDetails();
          clearInterval(intervalId);
        }
        if (data.error) {
          clearInterval(intervalId);
        }
      } catch (err) {
        console.error('Failed polling progress:', err);
      }
    };

    pollProgress();
    intervalId = setInterval(pollProgress, 2500);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, [episodeId]);


  // Trigger manual details refresh
  useEffect(() => {
    if (isCompleted) {
      fetchFinalDetails();
    }
  }, [isCompleted]);

  // Screenplay download helper
  const downloadScreenplay = () => {
    if (!episodeDetails?.scriptContent) return;
    const element = document.createElement("a");
    const file = new Blob([episodeDetails.scriptContent], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = `screenplay-${episodeDetails.title.replace(/\s+/g, '-').toLowerCase()}.md`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const budgetRatio = Math.min((cost / budget) * 100, 100);
  const costPercentageString = `${budgetRatio.toFixed(1)}%`;
  const isBudgetWarning = cost >= budget * 0.8;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* 1. Live Budget & Telemetry Meter */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Token Usage Widget */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 flex items-center justify-between">
          <div>
            <span className="text-xs text-neutral-500 block uppercase font-semibold">Total Tokens Used</span>
            <span className="text-2xl font-bold text-neutral-100 font-mono mt-1 block">
              {tokensUsed.toLocaleString()}
            </span>
          </div>
          <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-lg text-indigo-400">
            <Cpu className="w-6 h-6" />
          </div>
        </div>

        {/* Cost vs Budget Meter */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 flex flex-col justify-between col-span-2">
          <div className="flex items-center justify-between mb-2">
            <div>
              <span className="text-xs text-neutral-500 block uppercase font-semibold">Cumulative Spend</span>
              <span className="text-xl font-bold font-mono text-white mt-1 block">
                ${cost.toFixed(4)} <span className="text-sm font-normal text-neutral-500">/ ${budget.toFixed(2)}</span>
              </span>
            </div>
            {economyMode && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <AlertTriangle className="w-3.5 h-3.5" />
                Economy Mode Active
              </span>
            )}
          </div>
          
          <div className="space-y-1">
            <div className="w-full bg-neutral-950 h-3 rounded-full overflow-hidden border border-neutral-800">
              <div 
                className={`h-full transition-all duration-500 rounded-full ${
                  economyMode ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]' : 'bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]'
                }`}
                style={{ width: costPercentageString }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-neutral-500 font-mono">
              <span>0%</span>
              <span>80% Limit (Economy Trigger)</span>
              <span>100%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Economy Mode Alert Banner */}
      {economyMode && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex gap-3 text-amber-400">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <div>
            <h5 className="font-semibold text-sm">Budget Cap Safeguard Activated</h5>
            <p className="text-xs text-amber-400/80 mt-1">
              Spend has exceeded 80% of your limit. The scriptwriting and storyboarding stages have been downgraded to <code className="bg-amber-500/20 px-1 rounded">qwen-plus</code> to preserve tokens, while keeping Hook and Story spine models on <code className="bg-amber-500/20 px-1 rounded">qwen-max</code>.
            </p>
          </div>
        </div>
      )}

      {/* 2. Visual Stepper Progress */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6">
        <h3 className="text-lg font-bold text-neutral-100 mb-6 flex items-center gap-2">
          Pipeline Agent Orchestration
          {!isCompleted && !error && <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />}
          {isCompleted && <CheckCircle className="w-4 h-4 text-emerald-500" />}
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {steps.map((step) => {
            const isPending = activeStep < step.id;
            const isCurrent = activeStep === step.id && !isCompleted;
            const isDone = activeStep > step.id || isCompleted;

            return (
              <div 
                key={step.id} 
                className={`relative rounded-xl border p-4 text-left transition ${
                  isCurrent ? 'bg-indigo-950/20 border-indigo-500/50 shadow-md shadow-indigo-500/5' : 
                  isDone ? 'bg-neutral-900/60 border-neutral-800' : 'bg-neutral-950/30 border-neutral-850 opacity-40'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-mono font-semibold bg-neutral-950 px-2 py-0.5 rounded border border-neutral-800 text-neutral-400">
                    Stage {step.id}
                  </span>
                  
                  {isDone && <CheckCircle className="w-4.5 h-4.5 text-emerald-500" />}
                  {isCurrent && <Loader2 className="w-4.5 h-4.5 animate-spin text-indigo-500" />}
                  {isPending && <div className="w-4.5 h-4.5 rounded-full border-2 border-neutral-800" />}
                </div>

                <h4 className="font-bold text-sm text-neutral-200">{step.name}</h4>
                <p className="text-xs text-neutral-500 mt-1">{step.desc}</p>
                
                <div className="mt-3 flex items-center justify-between text-[10px] text-neutral-400 font-mono pt-2.5 border-t border-neutral-800/60">
                  <span>Model: {step.model}</span>
                  {isCurrent && <span className="text-indigo-400 animate-pulse">Running...</span>}
                  {isDone && <span className="text-emerald-500 font-semibold">Done</span>}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Output Stage: Casting Library & Video Player */}
      {isCompleted && episodeDetails && (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          
          {/* Vertical Video Player Column */}
          <div className="md:col-span-5 flex flex-col items-center">
            <h3 className="text-lg font-bold text-neutral-100 mb-4 self-start flex items-center gap-2">
              <Film className="w-5 h-5 text-indigo-400" />
              Final vertical output episode
            </h3>
            
            <div className="relative w-full max-w-[280px] aspect-[9/16] bg-neutral-950 border border-neutral-800 rounded-2xl overflow-hidden shadow-2xl group">
              {episodeDetails.videoUrl ? (
                <video 
                  src={episodeDetails.videoUrl} 
                  controls 
                  playsInline
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
                  <Loader2 className="w-8 h-8 animate-spin text-indigo-500 mb-2" />
                  <p className="text-xs text-neutral-500 font-mono">Finalizing render upload...</p>
                </div>
              )}
            </div>
          </div>

          {/* Screenplay and Casting Columns */}
          <div className="md:col-span-7 space-y-6">
            
            {/* Casting Library Grid */}
            {characters.length > 0 && (
              <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5">
                <h4 className="text-sm font-bold text-neutral-200 mb-4 flex items-center gap-2 uppercase tracking-wide">
                  <User className="w-4 h-4 text-indigo-400" />
                  Casting library (Locked Portraits)
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  {characters.map((char) => (
                    <div key={char.id} className="bg-neutral-950 border border-neutral-800 rounded-lg p-3 flex gap-3 items-center">
                      <div className="w-12 h-12 rounded-lg bg-neutral-900 overflow-hidden border border-neutral-800 shrink-0 relative">
                        {char.referenceImageUrl ? (
                          <img src={char.referenceImageUrl} alt={char.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-neutral-500 text-[10px]">Portrait</div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <span className="font-bold text-xs text-neutral-200 block truncate">{char.name}</span>
                        <span className="text-[10px] text-neutral-500 block truncate mt-0.5">{char.description}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Screenplay Output */}
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5">
              <div className="flex items-center justify-between border-b border-neutral-800 pb-3 mb-4">
                <h4 className="text-sm font-bold text-neutral-200 flex items-center gap-2 uppercase tracking-wide">
                  <FileText className="w-4 h-4 text-indigo-400" />
                  Showrunner script
                </h4>
                <button 
                  onClick={downloadScreenplay}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 text-xs font-semibold border border-indigo-500/20 transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download Script (.md)
                </button>
              </div>

              <div className="h-64 overflow-y-auto pr-2 custom-scrollbar text-left font-sans text-xs text-neutral-400 space-y-4 whitespace-pre-wrap leading-relaxed">
                {episodeDetails.scriptContent || "Dialogue files compiling..."}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. Live Running Logs */}
      <div className="bg-neutral-900 border border-neutral-850 rounded-xl p-5">
        <h4 className="text-xs font-bold text-neutral-400 mb-4 uppercase tracking-wider font-mono">
          System logs
        </h4>
        <div className="space-y-2 h-44 overflow-y-auto pr-2 custom-scrollbar font-mono text-[11px] text-left">
          {logs.length === 0 && !error ? (
            <p className="text-neutral-600 italic">Connecting and waiting for showrunner agents...</p>
          ) : (
            logs.map((log, i) => (
              <div key={i} className="flex gap-3 items-start animate-in fade-in duration-200">
                <span className="text-neutral-600 shrink-0">
                  [{new Date(log.timestamp).toLocaleTimeString()}]
                </span>
                <span className={`${log.message.includes('Completed') || log.message.includes('completed') ? 'text-emerald-400 font-semibold' : 'text-neutral-300'}`}>
                  {log.message}
                </span>
              </div>
            ))
          )}
          {error && (
            <div className="text-red-400 flex gap-3 items-start font-semibold">
              <span className="text-neutral-600">[{new Date().toLocaleTimeString()}]</span>
              <span>ERROR: {error}</span>
            </div>
          )}
        </div>
      </div>

      {/* 5. Detailed Token & Cost Breakdown Table */}
      {stageLogs.length > 0 && (
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 overflow-hidden">
          <h4 className="text-xs font-bold text-neutral-200 mb-4 uppercase tracking-wide">
            Model Token & Cost Breakdown
          </h4>
          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-[11px] text-neutral-400 border-collapse">
              <thead>
                <tr className="border-b border-neutral-800 text-neutral-500 uppercase text-[10px]">
                  <th className="pb-2.5 font-bold">Stage</th>
                  <th className="pb-2.5 font-bold">Model</th>
                  <th className="pb-2.5 font-bold text-right">Input Tokens</th>
                  <th className="pb-2.5 font-bold text-right">Output Tokens</th>
                  <th className="pb-2.5 font-bold text-right">Cost (USD)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/55">
                {stageLogs.map((log, idx) => (
                  <tr key={idx} className="hover:bg-neutral-950/20">
                    <td className="py-2.5 font-sans font-medium text-neutral-300">{log.stage}</td>
                    <td className="py-2.5 text-indigo-400 font-semibold">{log.model}</td>
                    <td className="py-2.5 text-right">{log.inputTokens.toLocaleString()}</td>
                    <td className="py-2.5 text-right">{log.outputTokens.toLocaleString()}</td>
                    <td className="py-2.5 text-right text-emerald-400">${log.cost.toFixed(6)}</td>
                  </tr>
                ))}
                <tr className="font-bold border-t-2 border-neutral-800">
                  <td className="py-3 font-sans" colSpan={2}>Grand Total</td>
                  <td className="py-3 text-right">
                    {stageLogs.reduce((acc, log) => acc + log.inputTokens, 0).toLocaleString()}
                  </td>
                  <td className="py-3 text-right">
                    {stageLogs.reduce((acc, log) => acc + log.outputTokens, 0).toLocaleString()}
                  </td>
                  <td className="py-3 text-right text-emerald-500">
                    ${stageLogs.reduce((acc, log) => acc + log.cost, 0).toFixed(5)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
      
    </div>
  );
}
