'use client';

/**
 * The landing page: four KPIs, a week of call volume, today's jobs and the
 * most recent calls.
 *
 * Every number here comes from the API or from the calls and appointments
 * already loaded — the mock's "estimated revenue booked" tile has no source
 * behind it and is deliberately absent rather than invented.
 */

import React from 'react';
import { ArrowRight } from 'lucide-react';
import type { ApiOverview } from '@/lib/api-types';
import type { Appointment, Call } from '@/types/schema';
import { Card, CardTitle, Tag } from './ui';
import { outcomeTone, outcomeLabel } from './call-format';

interface OverviewViewProps {
  overview: ApiOverview | null;
  calls: Call[];
  appointments: Appointment[];
  needsReviewCount: number;
  onSelectTab: (tab: string) => void;
  onSelectCall: (call: Call) => void;
}

const DAY_MS = 24 * 60 * 60 * 1000;

interface DayBar {
  day: string;
  booked: number;
  other: number;
}

/** The last seven days, oldest first, counted from the calls already loaded. */
function weekOfCalls(calls: Call[]): DayBar[] {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const days: DayBar[] = [];
  for (let offset = 6; offset >= 0; offset -= 1) {
    const day = new Date(startOfToday.getTime() - offset * DAY_MS);
    days.push({
      day: day.toLocaleDateString([], { weekday: 'short' }),
      booked: 0,
      other: 0,
    });
  }

  for (const call of calls) {
    if (!call.startedAtIso) continue;
    const at = new Date(call.startedAtIso);
    if (Number.isNaN(at.getTime())) continue;

    at.setHours(0, 0, 0, 0);
    const index = 6 - Math.round((startOfToday.getTime() - at.getTime()) / DAY_MS);
    if (index < 0 || index > 6) continue;

    if (call.outcome === 'booked') days[index].booked += 1;
    else days[index].other += 1;
  }

  return days;
}

function isToday(iso: string | undefined): boolean {
  if (!iso) return false;
  const date = new Date(iso);
  const now = new Date();
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}

export const OverviewView: React.FC<OverviewViewProps> = ({
  overview,
  calls,
  appointments,
  needsReviewCount,
  onSelectTab,
  onSelectCall,
}) => {
  const week = weekOfCalls(calls);
  // A shared scale, floored at 4, so a quiet week does not draw one call as
  // a full-height bar.
  const tallest = Math.max(4, ...week.map((day) => day.booked + day.other));

  const callsToday = overview?.callsToday ?? 0;
  const callsYesterday = overview?.callsYesterday ?? 0;
  const callDelta = callsToday - callsYesterday;

  const kpis = [
    {
      label: 'Calls answered today',
      value: String(callsToday),
      delta:
        callsYesterday === 0 && callsToday === 0
          ? 'No calls yet today'
          : `${callDelta >= 0 ? '+' : ''}${callDelta} vs yesterday`,
      tone: callDelta >= 0 ? 'text-[#0E8A5F]' : 'text-[#B4553A]',
      tab: 'calls',
    },
    {
      label: 'Jobs booked',
      value: String(overview?.bookedAppointments ?? appointments.length),
      delta: 'Confirmed and upcoming',
      tone: 'text-[#6B7488]',
      tab: 'appointments',
    },
    {
      label: 'Needs review',
      value: String(needsReviewCount),
      delta: needsReviewCount > 0 ? 'Waiting on a human' : 'All clear',
      tone: needsReviewCount > 0 ? 'text-[#A2600B]' : 'text-[#6B7488]',
      tab: 'calls',
    },
    {
      label: 'Minutes this month',
      value: String(overview?.minutesUsedThisMonth ?? 0),
      delta: 'Across every answered call',
      tone: 'text-[#6B7488]',
      tab: 'billing',
    },
  ];

  const todaysJobs = appointments
    .filter(
      (appointment) =>
        isToday(appointment.scheduledAtIso) && appointment.status !== 'cancelled',
    )
    .sort((a, b) =>
      (a.scheduledAtIso ?? '').localeCompare(b.scheduledAtIso ?? ''),
    );

  return (
    <>
      <div className="grid gap-3.5 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((kpi) => (
          <button
            key={kpi.label}
            type="button"
            onClick={() => onSelectTab(kpi.tab)}
            className="rounded-[16px] border border-[#E4E8F0] bg-white px-5 py-[18px] text-left transition hover:border-[#2F6BFF]/40"
          >
            <div className="text-[12.5px] font-semibold text-[#8A93A6]">
              {kpi.label}
            </div>
            <div className="my-[6px] text-[28px] font-extrabold tracking-[-0.03em]">
              {kpi.value}
            </div>
            <div className={`text-[12.5px] font-semibold ${kpi.tone}`}>
              {kpi.delta}
            </div>
          </button>
        ))}
      </div>

      <div className="grid gap-[18px] xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <Card className="px-[22px] py-5">
          <CardTitle
            title="Calls this week"
            hint="Booked vs. other outcomes"
            className="mb-5"
          />
          <div className="flex h-[168px] items-end gap-3.5">
            {week.map((day) => (
              <div
                key={day.day}
                className="flex min-w-0 flex-1 flex-col items-center gap-2.5"
              >
                <div className="flex h-[132px] w-full flex-col justify-end gap-[3px]">
                  <div
                    className="w-full rounded-t-md bg-[#DDE4F2]"
                    style={{ height: `${(day.other / tallest) * 132}px` }}
                    title={`${day.other} other`}
                  />
                  <div
                    className="w-full rounded-b-md bg-[#2F6BFF]"
                    style={{ height: `${(day.booked / tallest) * 132}px` }}
                    title={`${day.booked} booked`}
                  />
                </div>
                <div className="text-[11.5px] font-semibold text-[#8A93A6]">
                  {day.day}
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="px-[22px] py-5">
          <CardTitle title="Today's schedule" className="mb-4" />
          {todaysJobs.length === 0 ? (
            <p className="m-0 text-[13px] text-[#6B7488]">
              Nothing booked for today yet.
            </p>
          ) : (
            <div className="flex flex-col gap-3.5">
              {todaysJobs.map((job) => (
                <div key={job.id} className="flex gap-3">
                  <div className="w-[68px] flex-none pt-px text-[12.5px] font-bold text-[#2F6BFF]">
                    {job.scheduledAtIso
                      ? new Date(job.scheduledAtIso).toLocaleTimeString([], {
                          hour: 'numeric',
                          minute: '2-digit',
                        })
                      : '—'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[13.5px] font-bold">
                      {job.customerName}
                    </div>
                    <div className="mt-0.5 truncate text-[12.5px] text-[#6B7488]">
                      {[job.service, job.address].filter(Boolean).join(' · ')}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <Card className="overflow-hidden">
        <div className="flex items-center justify-between border-b border-[#E4E8F0] px-[22px] py-[18px]">
          <div className="text-[14.5px] font-bold">Recent calls</div>
          <button
            type="button"
            onClick={() => onSelectTab('calls')}
            className="flex items-center gap-1 text-[13px] font-bold text-[#2F6BFF] hover:underline"
          >
            View all
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>

        {calls.length === 0 ? (
          <p className="m-0 px-[22px] py-6 text-[13px] text-[#6B7488]">
            No calls yet. They appear here the moment your receptionist picks
            one up.
          </p>
        ) : (
          calls.slice(0, 5).map((call, index) => (
            <button
              key={call.id}
              type="button"
              onClick={() => onSelectCall(call)}
              className={`flex w-full items-center gap-4 px-[22px] py-3.5 text-left transition hover:bg-[#F6F8FE] ${
                index === Math.min(calls.length, 5) - 1
                  ? ''
                  : 'border-b border-[#E4E8F0]'
              }`}
            >
              <div className="min-w-0 flex-1">
                <div className="truncate text-[13.5px] font-bold">
                  {call.callerName}
                </div>
                <div className="mt-0.5 truncate text-[12.5px] text-[#6B7488]">
                  {call.summary}
                </div>
              </div>
              <div className="hidden flex-none whitespace-nowrap text-[12.5px] text-[#6B7488] sm:block">
                {call.timestamp}
              </div>
              <Tag tone={outcomeTone(call)}>{outcomeLabel(call)}</Tag>
            </button>
          ))
        )}
      </Card>
    </>
  );
};
