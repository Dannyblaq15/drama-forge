'use client';

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { User, Mail, CheckCircle2, Loader2, Sparkles } from 'lucide-react';

export default function ProfilePage() {
  const { user } = useAuth();
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);

    try {
      // Simulate profile details update save
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSaveSuccess(true);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto pb-12">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white">
          Account Profile
        </h1>
        <p className="text-neutral-500 mt-1 text-sm">
          Manage your developer settings, profile configurations, and account details.
        </p>
      </div>

      {/* Powered by Qwen AI Header Banner (Flat styling) */}
      <div className="rounded-2xl border border-indigo-950 bg-indigo-950/20 p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-md">
        <div className="space-y-2 relative z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/25 text-indigo-400 text-[10px] font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" /> Core Inference Engine
          </div>
          <h2 className="text-xl font-bold text-neutral-100 font-sans">
            Powered by Qwen AI
          </h2>
          <p className="text-xs text-neutral-400 max-w-xl leading-relaxed">
            DramaForge utilizes Alibaba Cloud Model Studio (MaaS) and the state-of-the-art **Qwen-Max** and **Qwen-Plus** large language model backbones to compile outlines, draft parallel screenplays, plan storyboard framing details, and synthesize multimodal assets.
          </p>
        </div>
        <div className="flex items-center gap-3 bg-neutral-950 px-4 py-3 rounded-xl border border-neutral-850 shadow shrink-0 relative z-10 select-none">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-black text-sm shadow animate-pulse">
            Q
          </div>
          <div>
            <span className="text-[10px] font-bold text-neutral-500 block uppercase">dashscope / api</span>
            <span className="text-xs font-semibold text-neutral-300">Qwen LLM Integrated</span>
          </div>
        </div>
      </div>

      {/* Profile Form Details (Flat, non-gradient styles) */}
      <div className="glass-panel rounded-2xl p-6 border border-neutral-800 space-y-6">
        <h3 className="text-sm font-bold text-neutral-300 uppercase tracking-wider flex items-center gap-2 border-b border-neutral-850 pb-2">
          <User className="w-4 h-4 text-indigo-400" /> Profile Details
        </h3>

        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div>
            <label className="text-[10px] font-bold text-neutral-500 uppercase block mb-1">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-neutral-500" />
              <input
                type="email"
                value={user?.email || ''}
                disabled
                className="w-full text-xs bg-neutral-900 border border-neutral-800 rounded-lg pl-10 pr-4 py-3 text-neutral-500 cursor-not-allowed focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold text-neutral-500 uppercase block mb-1">Display Name</label>
            <div className="relative">
              <User className="absolute left-3 top-3 h-4 w-4 text-neutral-500" />
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full text-xs bg-neutral-900 border border-neutral-800 rounded-lg pl-10 pr-4 py-3 text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Your Name"
              />
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between gap-4">
            {saveSuccess ? (
              <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                Profile updated successfully!
              </div>
            ) : <div />}

            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white text-xs font-bold px-5 py-2.5 rounded-lg transition active:scale-95 shadow"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
