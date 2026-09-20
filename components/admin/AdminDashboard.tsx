'use client';

import React, { useState } from 'react';
import { MOCK_ADMIN_TENANTS, MOCK_SYSTEM_METRICS } from '@/lib/mockData';
import { TenantAdmin } from '@/types/schema';
import { Shield, Users, DollarSign, PhoneCall, Cpu, Activity, Search, AlertTriangle, CheckCircle2, ChevronRight, Sliders, ExternalLink, Info } from 'lucide-react';

interface AdminDashboardProps {
  onSelectTenantToInspect: (tenantId: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  onSelectTenantToInspect,
}) => {
  const [tenants, setTenants] = useState<TenantAdmin[]>(MOCK_ADMIN_TENANTS);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedModel, setSelectedModel] = useState('gemini-voice-v2');

  const filteredTenants = tenants.filter(
    (t) =>
      t.businessName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.trade.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.ownerEmail.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Sample data: plans, quotas and invoices are not modeled in the
          backend yet, so these figures are illustrative. */}
      <div className="flex items-start gap-2 p-3 rounded-2xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300">
        <Info className="w-4 h-4 shrink-0 mt-0.5 text-slate-400" />
        <span>
          <strong className="font-semibold">Sample data.</strong> The operator console still
          shows placeholder tenants and metrics — MRR, plans and resolution
          rates aren&apos;t modeled in the backend yet.
        </span>
      </div>

      
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <Shield className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            <span>SaaS Platform Admin Control Center</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Multi-tenant management, live telephony metrics, AI engine defaults, and revenue analytics.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
            SUPER ADMIN ACCESS
          </span>
        </div>
      </div>

      {/* METRICS CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold">
            <span>Total SaaS MRR</span>
            <DollarSign className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            ${MOCK_SYSTEM_METRICS.mrrTotal.toLocaleString()}
          </div>
          <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
            +18.4% growth this month
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold">
            <span>Active Businesses</span>
            <Users className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            {MOCK_SYSTEM_METRICS.activeTenants} / {MOCK_SYSTEM_METRICS.totalTenants}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Home service business accounts
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold">
            <span>Calls Handled Today</span>
            <PhoneCall className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            {MOCK_SYSTEM_METRICS.totalCallsToday}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Avg duration: {MOCK_SYSTEM_METRICS.avgCallDurationSec}s
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold">
            <span>Platform AI Resolution</span>
            <Activity className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            {MOCK_SYSTEM_METRICS.aiResolutionRatePct}%
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Booked without human escalation
          </p>
        </div>

      </div>

      {/* SYSTEM AI ENGINE DEFAULTS */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <h3 className="text-base font-bold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-800 pb-3 flex items-center gap-2">
          <Cpu className="w-5 h-5 text-purple-500" />
          <span>Global Voice AI Engine Settings</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Primary LLM & Speech Engine
            </label>
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="gemini-voice-v2">Gemini 3.5 Realtime Voice API (Recommended)</option>
              <option value="gpt-4o-realtime">OpenAI Realtime Voice Pipeline</option>
              <option value="deepgram-claude">Deepgram Aura + Claude 3.5 Sonnet</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Default Voice Model Preset
            </label>
            <select className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white">
              <option>Warm Friendly Male (Dan - Natural Trade Accent)</option>
              <option>Professional Female (Sarah - Direct & Concise)</option>
              <option>Casual Friendly (Alex - Conversational)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Telephony Gateway Provider
            </label>
            <select className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white">
              <option>Twilio Programmable Voice (Primary)</option>
              <option>Telnyx SIP Trunking (Secondary Fallback)</option>
            </select>
          </div>
        </div>
      </div>

      {/* MULTI-TENANT MANAGEMENT TABLE */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-purple-500" />
            <span>Business Accounts & Tenants ({tenants.length})</span>
          </h3>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search tenant..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-semibold uppercase text-[10px]">
                <th className="pb-3">Business / Owner</th>
                <th className="pb-3">Trade</th>
                <th className="pb-3">Plan</th>
                <th className="pb-3">Status</th>
                <th className="pb-3">Monthly Calls</th>
                <th className="pb-3">Resolution</th>
                <th className="pb-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredTenants.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="py-3 font-semibold text-slate-900 dark:text-white">
                    <div>{t.businessName}</div>
                    <div className="text-[10px] text-slate-400 font-mono">{t.ownerEmail}</div>
                  </td>
                  <td className="py-3 text-slate-600 dark:text-slate-300">{t.trade}</td>
                  <td className="py-3 font-mono font-bold text-slate-700 dark:text-slate-300">{t.plan}</td>
                  <td className="py-3">
                    {t.status === 'active' && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                        <CheckCircle2 className="w-3 h-3" /> Active
                      </span>
                    )}
                    {t.status === 'setup_incomplete' && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                        <AlertTriangle className="w-3 h-3" /> Incomplete
                      </span>
                    )}
                    {t.status === 'paused' && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                        Paused
                      </span>
                    )}
                  </td>
                  <td className="py-3 font-mono text-slate-900 dark:text-white">{t.totalCallsThisMonth} calls</td>
                  <td className="py-3 font-mono text-emerald-600 dark:text-emerald-400 font-bold">{t.aiResolutionRate}%</td>
                  <td className="py-3 text-right">
                    <button
                      onClick={() => onSelectTenantToInspect(t.id)}
                      className="px-3 py-1 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-[11px] inline-flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <span>Inspect Dashboard</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
