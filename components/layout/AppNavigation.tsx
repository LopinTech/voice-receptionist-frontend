'use client';

import React from 'react';
import { Home, PhoneCall, Calendar, Building2, PhoneForwarded, CreditCard, User, Shield } from 'lucide-react';

interface AppNavigationProps {
  activeTab: string;
  onSelectTab: (tab: string) => void;
  needsReviewCount: number;
  isAdminView: boolean;
}

interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
}

export const AppNavigation: React.FC<AppNavigationProps> = ({
  activeTab,
  onSelectTab,
  needsReviewCount,
  isAdminView,
}) => {
  const userTabs: NavItem[] = [
    { id: 'overview', label: 'Overview', icon: Home },
    { id: 'calls', label: 'Calls', icon: PhoneCall, badge: needsReviewCount },
    { id: 'appointments', label: 'Appointments', icon: Calendar },
    { id: 'assistant', label: 'Company Profile', icon: Building2 },
    { id: 'phone', label: 'Phone Number', icon: PhoneForwarded },
    { id: 'billing', label: 'Billing & Usage', icon: CreditCard },
    { id: 'account', label: 'Account', icon: User },
  ];

  const adminTabs: NavItem[] = [
    { id: 'admin', label: 'System Overview', icon: Shield },
    { id: 'overview', label: 'Switch to User View', icon: Home },
  ];

  const tabs: NavItem[] = isAdminView ? adminTabs : userTabs;

  return (
    <>
      {/* Desktop / Tablet Horizontal Navigation Bar */}
      <nav className="hidden md:block bg-slate-900 text-slate-300 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center space-x-1 overflow-x-auto py-2 scrollbar-none">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => onSelectTab(tab.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
                    isActive
                      ? 'bg-blue-600 text-white font-semibold shadow-sm'
                      : 'hover:bg-slate-800 hover:text-white text-slate-400'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                  {tab.badge && tab.badge > 0 ? (
                    <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-slate-950">
                      {tab.badge}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Mobile Sticky Bottom Navigation Bar (Thumb Friendly) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-lg border-t border-slate-800 px-2 py-1.5 shadow-2xl">
        <div className="grid grid-cols-5 gap-1 items-center max-w-md mx-auto">
          {userTabs.slice(0, 5).map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onSelectTab(tab.id)}
                className={`relative flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all cursor-pointer ${
                  isActive ? 'text-blue-400 font-semibold' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon className="w-5 h-5 mb-0.5" />
                <span className="text-[10px] truncate max-w-full">{tab.label}</span>
                {tab.badge && tab.badge > 0 ? (
                  <span className="absolute top-1 right-2 w-4 h-4 rounded-full bg-amber-500 text-slate-950 text-[9px] font-bold flex items-center justify-center">
                    {tab.badge}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
};
