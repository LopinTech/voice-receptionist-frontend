'use client';

import React from 'react';
import { TenantStatus, TenantConfig } from '@/types/schema';
import { Shield, PhoneCall, AlertTriangle, Play, Pause, ChevronDown, Wrench, Building2, Bell } from 'lucide-react';

interface AppHeaderProps {
  tenant: TenantConfig;
  status: TenantStatus;
  onStatusChange: (newStatus: TenantStatus) => void;
  isAdminView: boolean;
  onToggleAdminView: (isAdmin: boolean) => void;
  needsReviewCount: number;
  activeTab: string;
  onSelectTab: (tab: string) => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  tenant,
  status,
  onStatusChange,
  isAdminView,
  onToggleAdminView,
  needsReviewCount,
  activeTab,
  onSelectTab,
}) => {
  const getStatusBadge = () => {
    switch (status) {
      case 'active':
        return (
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-xs font-semibold animate-pulse">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <span className="w-2 h-2 rounded-full bg-emerald-500 -ml-4" />
            <span>AI Active & Answering</span>
          </div>
        );
      case 'setup_incomplete':
        return (
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30 text-xs font-semibold">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Setup Incomplete</span>
          </div>
        );
      case 'paused':
        return (
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/30 text-xs font-semibold">
            <Pause className="w-3.5 h-3.5 fill-current" />
            <span>AI Paused</span>
          </div>
        );
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Left: Brand / Tenant Info */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold shadow-md shadow-blue-500/20 shrink-0">
              <Wrench className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white truncate">
                  {isAdminView ? 'SaaS Admin Control Center' : tenant.businessName}
                </h1>
                {!isAdminView && (
                  <span className="hidden md:inline-block px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                    {tenant.trade}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 truncate">
                {isAdminView ? (
                  <span>Platform Owner & Multi-Tenant Management</span>
                ) : (
                  <>
                    <PhoneCall className="w-3 h-3 text-emerald-500 shrink-0" />
                    <span className="font-mono font-medium text-slate-700 dark:text-slate-300">{tenant.aiPhoneNumber}</span>
                    <span className="hidden xs:inline text-slate-400">| Forwarding: {tenant.forwardingNumber}</span>
                  </>
                )}
              </p>
            </div>
          </div>

          {/* Right: Actions & Status */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">

            {/* Quick Demo Status Toggle button (To easily demo all 3 status states) */}
            {!isAdminView && (
              <div className="hidden sm:flex items-center">
                <button
                  onClick={() => {
                    if (status === 'active') onStatusChange('setup_incomplete');
                    else if (status === 'setup_incomplete') onStatusChange('paused');
                    else onStatusChange('active');
                  }}
                  title="Click to cycle status state (Demo control)"
                  className="cursor-pointer hover:opacity-90 transition-opacity"
                >
                  {getStatusBadge()}
                </button>
              </div>
            )}

            {/* Needs Review Alert Badge indicator */}
            {!isAdminView && needsReviewCount > 0 && (
              <button
                onClick={() => onSelectTab('calls')}
                className="relative p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 transition-colors"
                title={`${needsReviewCount} call(s) need manual review`}
              >
                <Bell className="w-5 h-5" />
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-amber-500 text-white text-[10px] font-bold flex items-center justify-center animate-bounce shadow-sm">
                  {needsReviewCount}
                </span>
              </button>
            )}

            {/* Emergency Pause / Resume AI Button for Business Owner */}
            {!isAdminView && (
              <button
                onClick={() => onStatusChange(status === 'paused' ? 'active' : 'paused')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm ${
                  status === 'paused'
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700'
                }`}
              >
                {status === 'paused' ? (
                  <>
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Resume AI</span>
                  </>
                ) : (
                  <>
                    <Pause className="w-3.5 h-3.5 fill-current" />
                    <span className="hidden xs:inline">Pause AI</span>
                  </>
                )}
              </button>
            )}

            {/* Portal Switcher (Business Owner vs Platform Admin) */}
            <button
              onClick={() => onToggleAdminView(!isAdminView)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all border ${
                isAdminView
                  ? 'bg-purple-600 text-white border-purple-500 shadow-md shadow-purple-500/20'
                  : 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 border-transparent hover:opacity-90'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span>{isAdminView ? 'Owner View' : 'Admin Portal'}</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
