'use client';

import React from 'react';
import { TenantStatus, TenantConfig } from '@/types/schema';
import { CheckCircle2, AlertTriangle, Pause, PhoneForwarded, Play, ArrowRight, ShieldCheck, Zap } from 'lucide-react';

interface StatusBannerProps {
  tenant: TenantConfig;
  status: TenantStatus;
  onStatusChange: (status: TenantStatus) => void;
  onNavigateToTab: (tab: string) => void;
}

export const StatusBanner: React.FC<StatusBannerProps> = ({
  tenant,
  status,
  onStatusChange,
  onNavigateToTab,
}) => {
  if (status === 'setup_incomplete') {
    return (
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-500 via-orange-600 to-amber-700 text-white p-5 sm:p-6 shadow-xl border border-amber-400/30">
        <div className="absolute top-0 right-0 -mt-6 -mr-6 w-40 h-40 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-5 relative z-10">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-black/20 text-amber-100 text-xs font-semibold backdrop-blur-sm">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-300" />
              <span>SETUP INCOMPLETE &bull; AI IS NOT ANSWERING YET</span>
            </div>
            
            <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white">
              Connect your phone line to start taking calls
            </h2>
            
            <p className="text-sm text-amber-100/90 leading-relaxed">
              Your AI Assistant is configured and ready for <span className="font-semibold">{tenant.businessName}</span>, but calls to <span className="font-mono bg-black/20 px-1.5 py-0.5 rounded">{tenant.phoneNumber}</span> are not yet forwarding to your AI line.
            </p>

            {/* Quick 2-step setup checklist */}
            <div className="pt-2 flex flex-wrap gap-4 text-xs">
              <div className="flex items-center gap-1.5 text-white/90">
                <CheckCircle2 className="w-4 h-4 text-amber-300 shrink-0" />
                <span>1. Assistant Profile Configured</span>
              </div>
              <div className="flex items-center gap-1.5 font-bold text-white bg-black/20 px-2.5 py-1 rounded-lg">
                <span className="w-2 h-2 rounded-full bg-amber-300 animate-ping" />
                <span>2. Enable Phone Call Forwarding</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto shrink-0">
            <button
              onClick={() => onNavigateToTab('phone')}
              className="px-5 py-3 rounded-xl bg-white text-orange-950 hover:bg-amber-50 font-bold text-sm flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all cursor-pointer"
            >
              <PhoneForwarded className="w-4 h-4" />
              <span>Forward Your Number Now</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => onStatusChange('active')}
              className="px-4 py-3 rounded-xl bg-black/30 hover:bg-black/40 text-white font-medium text-xs border border-white/20 text-center transition-colors cursor-pointer"
            >
              Simulate Active
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'paused') {
    return (
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-rose-950 to-slate-900 text-white p-5 sm:p-6 shadow-xl border border-rose-500/30">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 text-xs font-semibold border border-rose-500/30">
              <Pause className="w-3.5 h-3.5 fill-current text-rose-400" />
              <span>MANUAL OVERRIDE &bull; AI PAUSED</span>
            </div>
            
            <h2 className="text-xl sm:text-2xl font-extrabold text-white">
              AI Assistant is currently turned OFF
            </h2>
            
            <p className="text-sm text-slate-300">
              Incoming calls are currently falling back to your direct mobile line ({tenant.forwardingNumber}) or voicemail.
            </p>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <button
              onClick={() => onStatusChange('active')}
              className="w-full md:w-auto px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Turn AI Back ON</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Active state
  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-950 via-slate-900 to-slate-900 text-white p-5 sm:p-6 shadow-xl border border-emerald-500/30">
      <div className="absolute top-0 right-0 -mt-8 -mr-8 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-5 relative z-10">
        <div className="space-y-2">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/40">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <span>100% OPERATIONAL &bull; ACTIVE AND ANSWERING</span>
            </div>
          </div>

          <h2 className="text-xl sm:text-2xl font-extrabold text-white flex items-center gap-2">
            <span>Your AI Receptionist is live & taking calls</span>
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
          </h2>

          <p className="text-xs sm:text-sm text-slate-300 flex items-center gap-2">
            <span>Forwarded from <span className="font-mono text-emerald-200">{tenant.phoneNumber}</span></span>
            <span>&bull;</span>
            <span>AI Line: <span className="font-mono text-emerald-200">{tenant.aiPhoneNumber}</span></span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          <button
            onClick={() => onNavigateToTab('assistant')}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold border border-slate-700 flex items-center gap-2 transition-colors cursor-pointer"
          >
            <Zap className="w-3.5 h-3.5 text-emerald-400" />
            <span>Test Assistant Simulator</span>
          </button>
          
          <button
            onClick={() => onStatusChange('paused')}
            className="px-4 py-2.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-xs font-semibold border border-rose-500/30 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Pause className="w-3.5 h-3.5 fill-current" />
            <span>Pause AI</span>
          </button>
        </div>
      </div>
    </div>
  );
};
