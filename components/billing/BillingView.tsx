'use client';

import React from 'react';
import { CreditCard, Clock, Calendar, ShieldCheck, Download, Zap, TrendingUp, CheckCircle2, ArrowUpRight, Info } from 'lucide-react';

export const BillingView: React.FC = () => {
  const minutesUsed = 248;
  const minutesLimit = 500;
  const usagePercentage = Math.round((minutesUsed / minutesLimit) * 100);

  return (
    <div className="space-y-6">
      {/* Sample data: plans, quotas and invoices are not modeled in the
          backend yet, so these figures are illustrative. */}
      <div className="flex items-start gap-2 p-3 rounded-2xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300">
        <Info className="w-4 h-4 shrink-0 mt-0.5 text-slate-400" />
        <span>
          <strong className="font-semibold">Sample data.</strong> Plans,
          minute quotas and invoices aren&apos;t connected yet — these numbers
          are placeholders. Real call and appointment data is live everywhere
          else in the dashboard.
        </span>
      </div>

      
      {/* Title */}
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <CreditCard className="w-6 h-6 text-blue-500" />
          <span>Billing & Value Realized</span>
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
          Track the revenue captured by your AI receptionist, minute usage, and plan details.
        </p>
      </div>

      {/* VALUE REALIZED HERO TILES (Value framed, not infra framed) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        
        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white rounded-3xl p-5 shadow-lg border border-blue-400/20 space-y-2">
          <div className="flex items-center justify-between text-blue-200 text-xs font-semibold">
            <span>Captured Job Value</span>
            <TrendingUp className="w-4 h-4 text-blue-300" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-white">
            $4,280.00
          </div>
          <p className="text-xs text-blue-100/90">
            Estimated value from 18 AI-booked service appointments this cycle.
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold">
            <span>Time Saved On Phone</span>
            <Clock className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            14.5 Hours
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Saved from answering calls manually while on job sites or driving.
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold">
            <span>Calls Handled</span>
            <ShieldCheck className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            142 Calls
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            94.2% AI resolution rate without needing phone dispatch intervention.
          </p>
        </div>

      </div>

      {/* PLAN & USAGE PROGRESS BAR */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                Current Plan
              </span>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Pro Service Plan ($149 / mo)
              </h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Includes 500 phone minutes/month, 24/7 AI answering, custom greeting, and instant SMS alerts.
            </p>
          </div>

          <button className="px-4 py-2 rounded-xl bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 font-bold text-xs hover:opacity-90 transition-opacity cursor-pointer">
            Upgrade Plan
          </button>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
            <span>Minutes Used This Cycle</span>
            <span className="font-mono">{minutesUsed} / {minutesLimit} mins ({usagePercentage}%)</span>
          </div>

          <div className="h-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-200 dark:border-slate-700">
            <div
              style={{ width: `${usagePercentage}%` }}
              className="h-full rounded-full bg-gradient-to-r from-blue-500 to-emerald-500 transition-all duration-500"
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
            <span>Cycle resets in 18 days (Sept 21, 2026)</span>
            <span>Overages: $0.18 / min</span>
          </div>
        </div>
      </div>

      {/* PAYMENT METHOD & INVOICES */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Payment Method Card */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <h3 className="text-base font-bold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-800 pb-3">
            Payment Method
          </h3>

          <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-3">
              <div className="w-10 h-6 bg-slate-800 text-white rounded font-mono text-[10px] font-bold flex items-center justify-center">
                VISA
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900 dark:text-white font-mono">
                  •••• •••• •••• 4029
                </div>
                <div className="text-[10px] text-slate-400">Expires 08/28</div>
              </div>
            </div>

            <button className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer">
              Update
            </button>
          </div>
        </div>

        {/* Invoice History */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <h3 className="text-base font-bold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-800 pb-3">
            Invoice History
          </h3>

          <div className="space-y-2 text-xs">
            {[
              { date: 'Aug 1, 2026', amount: '$149.00', status: 'Paid', id: 'INV-2026-08' },
              { date: 'Jul 1, 2026', amount: '$149.00', status: 'Paid', id: 'INV-2026-07' },
              { date: 'Jun 1, 2026', amount: '$149.00', status: 'Paid', id: 'INV-2026-06' },
            ].map((inv) => (
              <div key={inv.id} className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                <div>
                  <div className="font-semibold text-slate-900 dark:text-white">{inv.date}</div>
                  <div className="text-[10px] text-slate-400 font-mono">{inv.id}</div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="font-mono font-bold text-slate-900 dark:text-white">{inv.amount}</span>
                  <button className="p-1 rounded-lg text-slate-400 hover:text-blue-500 cursor-pointer">
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
};
