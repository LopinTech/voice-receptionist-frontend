'use client';

import React, { useState } from 'react';
import { Appointment } from '@/types/schema';
import { Calendar, List, Plus, Clock, MapPin, Phone, User, Bot, CheckCircle2, DollarSign, Trash2, Edit2 } from 'lucide-react';

interface AppointmentsViewProps {
  appointments: Appointment[];
  onOpenCreateModal: (data?: Partial<Appointment>) => void;
  onDeleteAppointment: (id: string) => void;
}

export const AppointmentsView: React.FC<AppointmentsViewProps> = ({
  appointments,
  onOpenCreateModal,
  onDeleteAppointment,
}) => {
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('list');
  const [filterSource, setFilterSource] = useState<'all' | 'ai' | 'manual'>('all');

  const filteredAppointments = appointments.filter((apt) => {
    if (filterSource === 'ai') return apt.isAiCreated;
    if (filterSource === 'manual') return !apt.isAiCreated;
    return true;
  });

  return (
    <div className="space-y-6">
      
      {/* Top Title & View Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Calendar className="w-6 h-6 text-blue-500" />
            <span>Bookings & Calendar</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            View & manage all jobs booked by your AI receptionist or added manually.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* View Toggle */}
          <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-xl flex items-center gap-1 border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'list'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <List className="w-4 h-4" />
              <span>List View</span>
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'calendar'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>Week View</span>
            </button>
          </div>

          {/* New Appointment Button */}
          <button
            onClick={() => onOpenCreateModal()}
            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-blue-500/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Book Appointment</span>
          </button>
        </div>
      </div>

      {/* Filter Source Tabs */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium text-slate-400 mr-2">Filter Source:</span>
        {[
          { id: 'all', label: 'All Jobs' },
          { id: 'ai', label: 'AI Receptionist Bookings' },
          { id: 'manual', label: 'Manually Added' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilterSource(tab.id as any)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              filterSource === tab.id
                ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-sm'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* VIEW 1: Calendar Grid Mode */}
      {viewMode === 'calendar' ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 space-y-4">
          <div className="flex items-center justify-between font-bold text-sm text-slate-900 dark:text-white pb-3 border-b border-slate-200 dark:border-slate-800">
            <span>This Week Schedule</span>
            <span className="text-xs font-normal text-slate-500">Sept 1 - Sept 7, 2026</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
            {['Mon (Sept 1)', 'Tue (Sept 2)', 'Wed (Sept 3)', 'Thu (Sept 4)', 'Fri (Sept 5)', 'Sat (Sept 6)', 'Sun (Sept 7)'].map((day, idx) => {
              const dayAppts = filteredAppointments.filter((a) => {
                if (idx === 3 && a.dateTime.includes('Tomorrow')) return true;
                if (idx === 4 && a.dateTime.includes('Friday')) return true;
                if (idx === 5 && a.dateTime.includes('Saturday')) return true;
                return false;
              });

              return (
                <div key={day} className="bg-slate-50 dark:bg-slate-800/40 rounded-2xl p-3 border border-slate-200 dark:border-slate-800 min-h-[160px] flex flex-col justify-between">
                  <div className="text-xs font-bold text-slate-700 dark:text-slate-300 pb-2 border-b border-slate-200 dark:border-slate-700">
                    {day}
                  </div>

                  <div className="space-y-2 py-2 flex-1">
                    {dayAppts.length === 0 ? (
                      <div className="text-[11px] text-slate-400 text-center py-4 italic">No jobs booked</div>
                    ) : (
                      dayAppts.map((apt) => (
                        <div
                          key={apt.id}
                          onClick={() => onOpenCreateModal(apt)}
                          className="bg-white dark:bg-slate-800 p-2 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm text-xs space-y-1 hover:border-blue-500 cursor-pointer"
                        >
                          <div className="font-bold truncate text-slate-900 dark:text-white">{apt.customerName}</div>
                          <div className="text-[10px] text-slate-500 truncate">{apt.service}</div>
                          <div className="flex items-center justify-between text-[9px] pt-1">
                            <span className="font-mono text-blue-600 dark:text-blue-400">{apt.dateTime.split('at')[1] || apt.dateTime}</span>
                            {apt.isAiCreated ? (
                              <span className="px-1 py-0.2 rounded bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 font-bold">AI</span>
                            ) : (
                              <span className="px-1 py-0.2 rounded bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">Manual</span>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  <button
                    onClick={() => onOpenCreateModal({ dateTime: `${day.split(' ')[0]} at 10:00 AM` })}
                    className="w-full py-1 text-[10px] font-semibold text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 text-center border-t border-slate-200 dark:border-slate-700 cursor-pointer"
                  >
                    + Add Slot
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* VIEW 2: Detailed List Mode */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredAppointments.length === 0 ? (
            <div className="col-span-2 text-center py-12 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6">
              <Calendar className="w-10 h-10 text-slate-400 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">No appointments found</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                You have no appointments matching the selected filter.
              </p>
            </div>
          ) : (
            filteredAppointments.map((apt) => (
              <div
                key={apt.id}
                className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 hover:border-blue-500/40 transition-all"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-base font-bold text-slate-900 dark:text-white">
                        {apt.customerName}
                      </h3>
                      {apt.isAiCreated ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                          <Bot className="w-3 h-3" /> AI Booked
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20">
                          Manually Added
                        </span>
                      )}
                    </div>

                    <p className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                      {apt.service}
                    </p>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onOpenCreateModal(apt)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDeleteAppointment(apt.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Info Grid */}
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-3.5 space-y-2 text-xs">
                  <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                    <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                    <span className="font-semibold text-slate-900 dark:text-white">{apt.dateTime}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                    <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                    <span className="font-mono">{apt.customerPhone}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                    <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                    <span className="truncate">{apt.address}</span>
                  </div>
                  {apt.priceEstimate && (
                    <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                      <DollarSign className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span>Price Est: <strong>{apt.priceEstimate}</strong></span>
                    </div>
                  )}
                </div>

                {apt.notes && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 italic">
                    "{apt.notes}"
                  </p>
                )}
              </div>
            ))
          )}
        </div>
      )}

    </div>
  );
};
