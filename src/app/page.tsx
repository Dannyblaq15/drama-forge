'use client';

import React from 'react';
import { Film, Play, Sparkles, Terminal, Layout, Radio, MessageSquare, ShieldCheck, Download } from 'lucide-react';

export default function Home() {
  const steps = [
    { name: 'Script Generator', icon: MessageSquare, desc: 'Translates prompt to screenplay & scene beats', status: 'ready' },
    { name: 'Casting & Styling', icon: Sparkles, desc: 'Generates consistent character visual sheets', status: 'ready' },
    { name: 'Storyboard Artist', icon: Layout, desc: 'Renders frame-by-frame compositions', status: 'ready' },
    { name: 'Video Engine', icon: Film, desc: 'Generates smooth video clips using Wan & Qwen', status: 'ready' },
    { name: 'Continuity & QA', icon: ShieldCheck, desc: 'Validates visual consistency & flow rules', status: 'ready' },
    { name: 'Audio & Music', icon: Radio, desc: 'Composes scores & generates voiceovers', status: 'ready' },
  ];

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-between overflow-hidden px-4 py-8 md:px-12 md:py-16">
      {/* Background Orbs */}
      <div className="absolute top-[-10%] left-[-10%] h-[500px] w-[500px] rounded-full bg-indigo-950/20 blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] h-[500px] w-[500px] rounded-full bg-neutral-900/20 blur-[120px]" />

      {/* Header */}
      <header className="z-10 flex w-full max-w-7xl items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-900 border border-neutral-850 shadow-md">
            <img src="/logo.svg" className="h-6 w-6" alt="DramaForge Logo" />
          </div>
          <span className="text-xl font-bold tracking-tight text-white">
            DramaForge
          </span>
        </div>
        <div className="flex gap-4">
          <a
            href="/studio"
            className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition shadow shadow-indigo-500/10"
          >
            <Sparkles className="h-4 w-4" />
            Open Studio
          </a>
          <a
            href="http://localhost:3001/api/docs"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-lg border border-neutral-800 bg-neutral-900/50 px-4 py-2 text-sm font-medium hover:bg-neutral-800 transition"
          >
            <Terminal className="h-4 w-4" />
            API Docs
          </a>
        </div>
      </header>

      {/* Main Content */}
      <div className="z-10 my-auto flex max-w-5xl flex-col items-center text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/20 bg-indigo-500/10 px-4 py-1.5 text-xs font-semibold text-indigo-400 mb-8 shadow-sm">
          <Sparkles className="h-3 w-3" />
          Phase 1: Architecture & Scaffolding Completed
        </div>

        <h1 className="text-4xl font-extrabold tracking-tight sm:text-6xl max-w-4xl text-white">
          Enterprise Autonomous Short Drama AI Studio
        </h1>

        <p className="mt-6 text-lg text-neutral-400 max-w-2xl leading-relaxed">
          DramaForge generates, edits, and produces professional short-form vertical dramas in a fully automated, observable queue pipeline.
        </p>

        {/* Dashboard Grid Mockup */}
        <div className="mt-16 w-full max-w-4xl rounded-2xl glass-panel p-6 shadow-2xl">
          <div className="flex items-center justify-between border-b border-neutral-800/80 pb-4 mb-6">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-sm font-medium text-neutral-300">Agent Orchestration Engine</span>
            </div>
            <span className="text-xs text-neutral-500">Pipeline Status: ACTIVE</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {steps.map((step, idx) => (
              <div key={idx} className="glass-card rounded-xl p-5 text-left">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-neutral-900/80 border border-neutral-800 text-primary">
                    <step.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-neutral-200 text-sm">{step.name}</h3>
                    <span className="text-[10px] text-emerald-400 font-mono">Agent Ready</span>
                  </div>
                </div>
                <p className="mt-3 text-xs text-neutral-400 leading-normal">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="z-10 mt-16 text-center text-xs text-neutral-600 flex flex-col items-center gap-2">
        <span>&copy; {new Date().getFullYear()} DramaForge. Built with Next.js 15, NestJS, and Prisma ORM.</span>
        <span className="text-neutral-500 font-semibold bg-neutral-900/60 border border-neutral-850 px-3 py-1 rounded-full text-[10px] tracking-wide uppercase flex items-center gap-1.5 shadow-sm">
          Powered by Qwen AI & Alibaba Cloud
        </span>
      </footer>
    </main>
  );
}
