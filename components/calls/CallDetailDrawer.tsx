'use client';

import React, { useState } from 'react';
import { Call, CallOutcome } from '@/types/schema';
import { X, Play, Pause, FastForward, CheckCircle2, AlertTriangle, Calendar, User, Phone, MapPin, Clock, FileText, ArrowRight, ShieldAlert } from 'lucide-react';

interface CallDetailDrawerProps {
  call: Call | null;
  onClose: () => void;
  onCreateAppointmentFromCall: (call: Call) => void;
  onMarkResolved: (callId: string) => void;
}

export const CallDetailDrawer: React.FC<CallDetailDrawerProps> = ({
  call,
  onClose,
  onCreateAppointmentFromCall,
  onMarkResolved,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<'1x' | '1.25x' | '1.5x'>('1x');
  const [audioProgress, setAudioProgress] = useState(35); // percentage for demo

  if (!call) return null;

  const getOutcomeBadge = (outcome: CallOutcome) => {
    switch (outcome) {
      case 'booked':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3.5 h-3.5" /> Booked
          </span>
        );
      case 'needs_review':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30">
            <AlertTriangle className="w-3.5 h-3.5" /> Needs Review
          </span>
        );
      case 'transferred':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
            <Phone className="w-3.5 h-3.5" /> Transferred
          </span>
        );
      case 'no_action':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20">
            No Action
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/60 backdrop-blur-sm flex justify-end animate-fadeIn">
      <div 
        className="w-full max-w-2xl bg-white dark:bg-slate-900 h-full shadow-2xl overflow-y-auto flex flex-col border-l border-slate-200 dark:border-slate-800"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between sticky top-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur z-20">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                {call.callerName}
              </h2>
              {getOutcomeBadge(call.outcome)}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2 font-mono">
              <span>{call.callerPhone}</span>
              <span>&bull;</span>
              <span>{call.timestamp}</span>
              <span>&bull;</span>
              <span>Duration: {call.duration}</span>
            </p>
          </div>
          
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 space-y-6 flex-1">

          {/* Special Urgent Call Attention Alert Box for Needs Review */}
          {call.outcome === 'needs_review' && !call.isResolved && (
            <div className="rounded-2xl p-4 bg-amber-500/10 border-2 border-amber-500/30 text-amber-950 dark:text-amber-200 space-y-3">
              <div className="flex items-start gap-3">
                <ShieldAlert className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-amber-900 dark:text-amber-300">
                    Needs Human Review
                  </h4>
                  <p className="text-xs leading-relaxed text-amber-800 dark:text-amber-300/90">
                    {call.reviewReason || 'AI collected partial information from caller. Please review the transcript below or create the appointment manually.'}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-1">
                <button
                  onClick={() => onCreateAppointmentFromCall(call)}
                  className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center gap-2 shadow-md transition-all cursor-pointer"
                >
                  <Calendar className="w-4 h-4" />
                  <span>Create Appointment Manually</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() => onMarkResolved(call.id)}
                  className="px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 text-slate-700 dark:text-slate-300 text-xs font-semibold border border-amber-500/30 transition-colors cursor-pointer"
                >
                  Mark Reviewed / Resolved
                </button>
              </div>
            </div>
          )}

          {/* Audio Waveform Player Simulation */}
          <div className="bg-slate-900 text-white rounded-2xl p-4 space-y-3 shadow-lg border border-slate-800">
            <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                <span>Call Recording Audio</span>
              </span>
              <span>{call.duration}</span>
            </div>

            {/* Simulated Waveform Visual Bars */}
            <div className="flex items-center gap-1 h-10 px-2 bg-slate-950 rounded-xl overflow-hidden cursor-pointer"
                 onClick={() => setAudioProgress((prev) => (prev + 20) % 100)}>
              {[30, 45, 75, 90, 40, 20, 60, 85, 100, 70, 50, 30, 65, 80, 95, 40, 60, 30, 70, 90, 85, 40, 60, 75, 90, 45, 30, 60, 80, 95, 40, 20, 60, 80].map((height, i) => {
                const isPlayed = (i / 34) * 100 <= audioProgress;
                return (
                  <div
                    key={i}
                    style={{ height: `${height}%` }}
                    className={`flex-1 rounded-full transition-all ${
                      isPlayed ? 'bg-blue-500' : 'bg-slate-700'
                    }`}
                  />
                );
              })}
            </div>

            {/* Playback Controls */}
            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="w-10 h-10 rounded-xl bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center font-bold shadow-md shadow-blue-500/30 transition-all cursor-pointer"
                >
                  {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
                </button>
                <span className="text-xs font-mono text-slate-300">
                  {isPlaying ? '0:42' : '0:00'} / {call.duration}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    if (playbackSpeed === '1x') setPlaybackSpeed('1.25x');
                    else if (playbackSpeed === '1.25x') setPlaybackSpeed('1.5x');
                    else setPlaybackSpeed('1x');
                  }}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-xs font-bold flex items-center gap-1 border border-slate-700 cursor-pointer"
                >
                  <FastForward className="w-3 h-3" />
                  <span>{playbackSpeed}</span>
                </button>
              </div>
            </div>
          </div>

          {/* AI Extracted Details Box */}
          {call.extractedAppointment && (
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 space-y-3">
              <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-blue-500" />
                <span>Extracted Appointment Data</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                  <User className="w-4 h-4 text-slate-400 shrink-0" />
                  <span><strong className="text-slate-900 dark:text-white">Customer:</strong> {call.extractedAppointment.customerName}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                  <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                  <span><strong className="text-slate-900 dark:text-white">Phone:</strong> {call.extractedAppointment.customerPhone}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                  <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                  <span><strong className="text-slate-900 dark:text-white">Requested Time:</strong> {call.extractedAppointment.requestedTime}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                  <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                  <span className="truncate"><strong className="text-slate-900 dark:text-white">Address:</strong> {call.extractedAppointment.address || 'Unspecified'}</span>
                </div>
              </div>

              {call.extractedAppointment.notes && (
                <div className="pt-2 border-t border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300">
                  <span className="font-semibold text-slate-900 dark:text-white">Notes:</span> {call.extractedAppointment.notes}
                </div>
              )}
            </div>
          )}

          {/* Full Interactive Transcript */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center justify-between">
              <span>Call Transcript ({call.transcript.length} turns)</span>
              <span className="text-[11px] text-blue-500 font-normal">AI Speaker Identified</span>
            </h3>

            <div className="space-y-3">
              {call.transcript.map((line) => {
                const isAi = line.speaker === 'ai';
                const isSystem = line.speaker === 'system';

                if (isSystem) {
                  return (
                    <div key={line.id} className="text-center my-2 text-xs font-mono text-amber-600 dark:text-amber-400 bg-amber-500/10 py-1.5 px-3 rounded-xl border border-amber-500/20">
                      {line.text}
                    </div>
                  );
                }

                return (
                  <div
                    key={line.id}
                    className={`flex flex-col ${isAi ? 'items-start' : 'items-end'}`}
                  >
                    <div className="flex items-center gap-2 mb-1 px-1 text-[11px] font-mono text-slate-400">
                      <span className="font-semibold text-slate-600 dark:text-slate-300">
                        {isAi ? 'AI Assistant' : call.callerName}
                      </span>
                      <span>&bull;</span>
                      <span>{line.time}</span>
                    </div>

                    <div
                      className={`max-w-[88%] rounded-2xl p-3.5 text-xs sm:text-sm leading-relaxed ${
                        isAi
                          ? 'bg-blue-600 text-white rounded-tl-none shadow-sm'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-tr-none border border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {line.text}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
