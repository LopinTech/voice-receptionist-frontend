'use client';

import React, { useState } from 'react';
import { TenantConfig } from '@/types/schema';
import { User, Bell, Mail, Phone, ShieldCheck, CheckCircle2, Save } from 'lucide-react';

interface AccountViewProps {
  tenant: TenantConfig;
  onUpdateTenant: (updated: TenantConfig) => void;
}

export const AccountView: React.FC<AccountViewProps> = ({
  tenant,
  onUpdateTenant,
}) => {
  const [formData, setFormData] = useState<TenantConfig>({ ...tenant });
  const [saved, setSaved] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateTenant(formData);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <User className="w-6 h-6 text-blue-500" />
            <span>Account & Notifications</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Manage your personal profile and instant mobile alert preferences.
          </p>
        </div>

        <button
          type="submit"
          className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-blue-500/20 transition-all cursor-pointer self-start sm:self-auto"
        >
          <Save className="w-4 h-4" />
          <span>Save Account Preferences</span>
        </button>
      </div>

      {saved && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4" />
          <span>Account & Notification preferences updated!</span>
        </div>
      )}

      {/* OWNER PROFILE */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <h3 className="text-base font-bold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-800 pb-3 flex items-center gap-2">
          <User className="w-4 h-4 text-blue-500" />
          <span>Small Business Owner Profile</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Full Name
            </label>
            <input
              type="text"
              value={formData.ownerName}
              onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Account Login Email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Personal Cell Phone (For Instant SMS Alerts)
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={formData.forwardingNumber}
                onChange={(e) => setFormData({ ...formData, forwardingNumber: e.target.value })}
                className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* NOTIFICATION PREFERENCES */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <h3 className="text-base font-bold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-800 pb-3 flex items-center gap-2">
          <Bell className="w-4 h-4 text-amber-500" />
          <span>Real-time Mobile Notification Preferences</span>
        </h3>

        <div className="space-y-3">
          
          <label className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 cursor-pointer">
            <div className="space-y-0.5">
              <div className="text-xs font-bold text-slate-900 dark:text-white">
                Instant SMS Alert on "Needs Review" Calls
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                Receive an immediate text message if the AI encounters an unclear address or urgent emergency call.
              </div>
            </div>
            <input
              type="checkbox"
              checked={formData.smsAlertsEnabled}
              onChange={(e) => setFormData({ ...formData, smsAlertsEnabled: e.target.checked })}
              className="w-5 h-5 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
            />
          </label>

          <label className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 cursor-pointer">
            <div className="space-y-0.5">
              <div className="text-xs font-bold text-slate-900 dark:text-white">
                Daily Morning Summary Email
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                Get a 7:00 AM daily breakdown of all booked appointments and call volume for the day.
              </div>
            </div>
            <input
              type="checkbox"
              checked={formData.emailDigestEnabled}
              onChange={(e) => setFormData({ ...formData, emailDigestEnabled: e.target.checked })}
              className="w-5 h-5 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
            />
          </label>

        </div>
      </div>

    </form>
  );
};
