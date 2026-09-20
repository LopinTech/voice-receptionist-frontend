'use client';

import React, { useState } from 'react';
import { Call, CallOutcome } from '@/types/schema';
import { Search, Filter, PhoneCall, CheckCircle2, AlertTriangle, Play, Calendar, Phone, ArrowRight, ShieldAlert } from 'lucide-react';

interface CallsListProps {
  calls: Call[];
  onSelectCall: (call: Call) => void;
  onCreateAppointmentFromCall: (call: Call) => void;
}

export const CallsList: React.FC<CallsListProps> = ({
  calls,
  onSelectCall,
  onCreateAppointmentFromCall,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [outcomeFilter, setOutcomeFilter] = useState<string>('all');

  const filteredCalls = calls.filter((call) => {
    const matchesSearch =
      call.callerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      call.callerPhone.includes(searchTerm) ||
      call.summary.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesOutcome =
      outcomeFilter === 'all' || call.outcome === outcomeFilter;

    return matchesSearch && matchesOutcome;
  });

  const getOutcomeBadge = (outcome: CallOutcome) => {
    switch (outcome) {
      case 'booked':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3.5 h-3.5" /> Booked
          </span>
        );
      case 'needs_review':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30 animate-pulse">
            <AlertTriangle className="w-3.5 h-3.5" /> Needs Review
          </span>
        );
      case 'transferred':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
            <Phone className="w-3.5 h-3.5" /> Transferred
          </span>
        );
      case 'no_action':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20">
            No Action
          </span>
        );
    }
  };

  const needsReviewCount = calls.filter((c) => c.outcome === 'needs_review' && !c.isResolved).length;

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <PhoneCall className="w-6 h-6 text-blue-500" />
            <span>Call History & Transcripts</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Every call answered by your AI receptionist, recorded & transcribed in real-time.
          </p>
        </div>

        {needsReviewCount > 0 && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30 text-xs font-bold">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>{needsReviewCount} call(s) need review</span>
          </div>
        )}
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by customer name, phone, or issue..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          <Filter className="w-4 h-4 text-slate-400 shrink-0 ml-1" />
          {[
            { id: 'all', label: 'All Calls' },
            { id: 'needs_review', label: 'Needs Review' },
            { id: 'booked', label: 'Booked' },
            { id: 'transferred', label: 'Transferred' },
            { id: 'no_action', label: 'No Action' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setOutcomeFilter(tab.id)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                outcomeFilter === tab.id
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Calls List Table / Cards */}
      <div className="space-y-3">
        {filteredCalls.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
            <PhoneCall className="w-10 h-10 text-slate-400 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">No calls found</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1">
              No calls match your search query or selected filter.
            </p>
          </div>
        ) : (
          filteredCalls.map((call) => (
            <div
              key={call.id}
              onClick={() => onSelectCall(call)}
              className={`group bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border transition-all hover:shadow-lg cursor-pointer ${
                call.outcome === 'needs_review' && !call.isResolved
                  ? 'border-amber-500/50 dark:border-amber-500/40 bg-amber-500/5'
                  : 'border-slate-200 dark:border-slate-800 hover:border-blue-500/50 dark:hover:border-blue-500/40'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {call.callerName}
                    </h3>
                    <span className="font-mono text-xs text-slate-500 dark:text-slate-400">
                      {call.callerPhone}
                    </span>
                    {getOutcomeBadge(call.outcome)}
                  </div>

                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 line-clamp-2">
                    {call.summary}
                  </p>

                  <div className="flex items-center gap-3 text-[11px] text-slate-400 pt-1 font-mono">
                    <span>{call.timestamp}</span>
                    <span>&bull;</span>
                    <span>{call.duration}</span>
                    <span>&bull;</span>
                    <span>{call.transcript.length} turns spoken</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center pt-2 sm:pt-0">
                  {call.outcome === 'needs_review' && !call.isResolved && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onCreateAppointmentFromCall(call);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
                    >
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Manual Add</span>
                    </button>
                  )}

                  <button className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 group-hover:bg-blue-600 group-hover:text-white transition-all">
                    <Play className="w-4 h-4 fill-current" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

    </div>
  );
};
