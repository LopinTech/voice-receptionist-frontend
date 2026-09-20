import React from 'react';
import type { Metadata } from 'next';
import {
  CheckCircle2,
  Circle,
  Loader2,
  ListChecks,
  GitBranch,
  FileCode2,
  Ban,
  Lightbulb,
} from 'lucide-react';
import { PHASES, DECISIONS, OUT_OF_SCOPE, type Phase, type Todo } from '@/lib/plan';

export const metadata: Metadata = {
  title: 'Company Profile rework — plan',
  description:
    'Phases and todo lists for the Company Profile changes, published for review before the work starts.',
};

/* ------------------------------------------------------------------ *
 * Small presentational pieces
 * ------------------------------------------------------------------ */

function StatusIcon({ status }: { status: Todo['status'] }) {
  if (status === 'done') {
    return <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />;
  }
  if (status === 'doing') {
    return (
      <Loader2 className="w-4 h-4 text-blue-500 shrink-0 mt-0.5 animate-spin" />
    );
  }
  return <Circle className="w-4 h-4 text-slate-300 dark:text-slate-600 shrink-0 mt-0.5" />;
}

const PHASE_BADGES: Record<Phase['status'], { label: string; className: string }> = {
  done: {
    label: 'Done',
    className: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
  },
  active: {
    label: 'In progress',
    className: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30',
  },
  pending: {
    label: 'Awaiting approval',
    className: 'bg-slate-500/10 text-slate-500 dark:text-slate-400 border-slate-500/30',
  },
  blocked: {
    label: 'Blocked',
    className: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30',
  },
};

function PhaseCard({ phase, index }: { phase: Phase; index: number }) {
  const done = phase.todos.filter((t) => t.status === 'done').length;
  const badge = PHASE_BADGES[phase.status];

  return (
    <section className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
      <header className="p-5 sm:p-6 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div className="space-y-1 min-w-0">
          <div className="flex items-center gap-2.5">
            <span className="w-7 h-7 shrink-0 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-bold flex items-center justify-center font-mono">
              {index}
            </span>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              {phase.title.replace(/^Phase \d+ — /, '')}
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 sm:pl-9.5 leading-relaxed">
            {phase.goal}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[11px] font-mono font-bold text-slate-400 tabular-nums">
            {done}/{phase.todos.length}
          </span>
          <span
            className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${badge.className}`}
          >
            {badge.label}
          </span>
        </div>
      </header>

      <ol className="divide-y divide-slate-100 dark:divide-slate-800/70">
        {phase.todos.map((todo) => (
          <li
            key={todo.id}
            className="p-4 sm:px-6 sm:py-4 flex gap-3 hover:bg-slate-50/70 dark:hover:bg-slate-800/30 transition-colors"
          >
            <StatusIcon status={todo.status} />

            <div className="space-y-1.5 min-w-0 flex-1">
              <div className="flex items-baseline gap-2 flex-wrap">
                <span className="text-[10px] font-mono font-bold text-slate-400 tabular-nums">
                  {todo.id}
                </span>
                <h3
                  className={`text-xs sm:text-sm font-bold ${
                    todo.status === 'done'
                      ? 'text-slate-400 dark:text-slate-500 line-through'
                      : 'text-slate-900 dark:text-white'
                  }`}
                >
                  {todo.title}
                </h3>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                {todo.detail}
              </p>

              {todo.touches.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-0.5">
                  {todo.touches.map((file) => (
                    <span
                      key={file}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-[10px] font-mono text-slate-500 dark:text-slate-400 max-w-full"
                    >
                      <FileCode2 className="w-2.5 h-2.5 shrink-0" />
                      <span className="truncate">{file}</span>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

/* ------------------------------------------------------------------ *
 * Page
 * ------------------------------------------------------------------ */

export default function PlanPage() {
  const allTodos = PHASES.flatMap((phase) => phase.todos);
  const doneCount = allTodos.filter((todo) => todo.status === 'done').length;
  const pct = Math.round((doneCount / allTodos.length) * 100);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans">
      {/* Header */}
      <header className="bg-slate-900 text-white border-b border-slate-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-4">
          <div className="flex items-center gap-2 text-xs font-bold text-blue-400">
            <GitBranch className="w-4 h-4" />
            <span>Implementation plan · for review</span>
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Assistant Config → Company Profile
            </h1>
            <p className="text-sm text-slate-400 leading-relaxed max-w-2xl">
              Seven requested changes, grouped into six phases so each one is
              reviewable on its own. Nothing here is built yet — this page is
              the thing to approve first. It stays live as the work runs, and
              each item is ticked off here as it lands.
            </p>
          </div>

          {/* Progress */}
          <div className="space-y-2 pt-2">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-400">
              <span className="flex items-center gap-1.5">
                <ListChecks className="w-3.5 h-3.5" />
                <span>
                  {doneCount} of {allTodos.length} items complete
                </span>
              </span>
              <span className="font-mono tabular-nums">{pct}%</span>
            </div>
            <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-blue-500 to-emerald-500 transition-all duration-500"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Decisions */}
        <section className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-5 sm:p-6 space-y-4">
          <div className="flex items-center gap-2 font-bold text-sm text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-800 pb-3">
            <Lightbulb className="w-4 h-4 text-amber-500" />
            <span>Decisions this plan rests on</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {DECISIONS.map((decision) => (
              <div
                key={decision.question}
                className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-1.5"
              >
                <div className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                  {decision.question}
                </div>
                <div className="text-xs font-bold text-slate-900 dark:text-white">
                  {decision.answer}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  {decision.why}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Phases */}
        <div className="space-y-5">
          {PHASES.map((phase, index) => (
            <PhaseCard key={phase.id} phase={phase} index={index} />
          ))}
        </div>

        {/* Out of scope */}
        <section className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-5 sm:p-6 space-y-3">
          <div className="flex items-center gap-2 font-bold text-sm text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-800 pb-3">
            <Ban className="w-4 h-4 text-rose-500" />
            <span>Deliberately not in this pass</span>
          </div>
          <ul className="space-y-2">
            {OUT_OF_SCOPE.map((item) => (
              <li
                key={item}
                className="text-xs text-slate-600 dark:text-slate-400 flex gap-2 leading-relaxed"
              >
                <span className="text-slate-300 dark:text-slate-600 shrink-0">—</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>

        <p className="text-[11px] text-center text-slate-400 pb-8">
          Waiting on your approval before any of this is written.
        </p>
      </main>
    </div>
  );
}
