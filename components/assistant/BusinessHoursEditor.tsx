'use client';

import React from 'react';
import { Clock, Copy, Info } from 'lucide-react';
import {
  BusinessHours,
  DAY_KEYS,
  DAY_LABELS,
  DAY_SHORT,
  DayKey,
  TIME_OPTIONS,
  summarizeHours,
} from '@/lib/business-hours';

interface BusinessHoursEditorProps {
  value: BusinessHours;
  onChange: (next: BusinessHours) => void;
  /**
   * Set when the rows were reconstructed from a legacy free-text line rather
   * than read back as saved. The owner is told, and shown what the guess came
   * from, instead of a guess being presented as their saved hours.
   */
  parsedFrom?: string;
}

export const BusinessHoursEditor: React.FC<BusinessHoursEditorProps> = ({
  value,
  onChange,
  parsedFrom,
}) => {
  const setDay = (key: DayKey, patch: Partial<BusinessHours[DayKey]>) => {
    onChange({ ...value, [key]: { ...value[key], ...patch } });
  };

  // Filling in seven near-identical rows by hand is the main reason people
  // abandon this kind of form.
  const copyMondayToWeekdays = () => {
    const monday = value.mon;
    onChange({
      ...value,
      tue: { ...monday },
      wed: { ...monday },
      thu: { ...monday },
      fri: { ...monday },
    });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          <span>Business Hours</span>
        </label>

        <button
          type="button"
          onClick={copyMondayToWeekdays}
          className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[11px] font-bold flex items-center gap-1 hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer"
        >
          <Copy className="w-3 h-3" />
          <span>Copy Monday to weekdays</span>
        </button>
      </div>

      {parsedFrom && (
        <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-[11px] text-amber-800 dark:text-amber-200 flex gap-2">
          <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          <span>
            We read these from your previous hours,{' '}
            <span className="font-mono font-bold">
              &ldquo;{parsedFrom}&rdquo;
            </span>
            . Check each day is right before saving.
          </span>
        </div>
      )}

      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden">
        {DAY_KEYS.map((key) => {
          const day = value[key];

          return (
            <div
              key={key}
              className="flex items-center gap-3 px-3 py-2.5 bg-slate-50/60 dark:bg-slate-800/30"
            >
              <span className="w-8 sm:w-24 shrink-0 text-xs font-bold text-slate-700 dark:text-slate-300">
                <span className="sm:hidden">{DAY_SHORT[key]}</span>
                <span className="hidden sm:inline">{DAY_LABELS[key]}</span>
              </span>

              {/* Open / closed toggle */}
              <button
                type="button"
                role="switch"
                aria-checked={!day.closed}
                aria-label={`${DAY_LABELS[key]} open`}
                onClick={() => setDay(key, { closed: !day.closed })}
                className={`relative w-9 h-5 shrink-0 rounded-full transition-colors cursor-pointer ${
                  day.closed
                    ? 'bg-slate-300 dark:bg-slate-700'
                    : 'bg-emerald-500'
                }`}
              >
                <span
                  className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${
                    day.closed ? 'left-0.5' : 'left-4.5'
                  }`}
                />
              </button>

              {day.closed ? (
                <span className="text-xs text-slate-400 font-medium">
                  Closed
                </span>
              ) : (
                <div className="flex items-center gap-2 min-w-0">
                  <TimeSelect
                    label={`${DAY_LABELS[key]} opening time`}
                    value={day.open}
                    onChange={(open) => setDay(key, { open })}
                  />
                  <span className="text-xs text-slate-400 shrink-0">to</span>
                  <TimeSelect
                    label={`${DAY_LABELS[key]} closing time`}
                    value={day.close}
                    onChange={(close) => setDay(key, { close })}
                  />
                  {day.close <= day.open && (
                    <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 shrink-0">
                      Ends before it starts
                    </span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <p className="text-[11px] text-slate-400">
        Your assistant will tell callers:{' '}
        <span className="font-medium text-slate-500 dark:text-slate-300">
          {summarizeHours(value)}
        </span>
      </p>
    </div>
  );
};

function TimeSelect({
  value,
  onChange,
  label,
}: {
  value: string;
  onChange: (value: string) => void;
  label: string;
}) {
  // A time not on the half-hour (from legacy data, or a hand-edited row)
  // must still be selectable, or opening the editor would silently move it.
  const options = TIME_OPTIONS.some((option) => option.value === value)
    ? TIME_OPTIONS
    : [...TIME_OPTIONS, { value, label: value }].sort((a, b) =>
        a.value.localeCompare(b.value),
      );

  return (
    <select
      aria-label={label}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="px-2 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}
