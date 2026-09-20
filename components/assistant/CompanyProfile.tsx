'use client';

import React, { useState } from 'react';
import { TenantConfig, ServiceItem } from '@/types/schema';
import { Combobox } from '@/components/ui/Combobox';
import { BusinessHoursEditor } from './BusinessHoursEditor';
import { ServiceAreaPicker } from './ServiceAreaPicker';
import { TRADE_GROUPS } from '@/lib/trades';
import { summarizeHours } from '@/lib/business-hours';
import { Building2, Save, PhoneCall, DollarSign, Wrench, Plus, Trash2, CheckCircle2, AlertTriangle, RefreshCw } from 'lucide-react';

interface CompanyProfileProps {
  tenant: TenantConfig;
  onSaveTenant: (updated: TenantConfig) => void;
  onStartTestCall: () => void;
  onResyncAssistant: () => void;
}

export const CompanyProfile: React.FC<CompanyProfileProps> = ({
  tenant,
  onSaveTenant,
  onStartTestCall,
  onResyncAssistant,
}) => {
  const [formData, setFormData] = useState<TenantConfig>({ ...tenant });
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveTenant({
      ...formData,
      businessHours: summarizeHours(formData.hours),
    });
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleAddService = () => {
    const newService: ServiceItem = {
      id: 's_' + Date.now(),
      name: 'New Service',
      price: '$150 est',
      duration: '1 hr',
    };
    setFormData({ ...formData, services: [...formData.services, newService] });
  };

  const handleRemoveService = (id: string) => {
    setFormData({ ...formData, services: formData.services.filter((s) => s.id !== id) });
  };

  return (
    <form onSubmit={handleSave} className="space-y-6">
      
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Building2 className="w-6 h-6 text-blue-500" />
            <span>Company Profile</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Your business details, hours, service areas and prices — this is what your AI receptionist tells callers.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onStartTestCall}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-emerald-500/20 transition-all cursor-pointer"
          >
            <PhoneCall className="w-4 h-4" />
            <span>Test Call</span>
          </button>

          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-blue-500/20 transition-all cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Save Profile</span>
          </button>
        </div>
      </div>

      {saveSuccess && tenant.assistantSync !== 'stale' && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4" />
          <span>Company profile saved, and your assistant is up to date.</span>
        </div>
      )}

      {/*
        Saved but not live: the profile is in the database, the push to
        Telnyx failed. Callers still hear the previous configuration, so this
        says exactly that rather than a generic error.
      */}
      {tenant.assistantSync === 'stale' && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-2 animate-fadeIn">
          <div className="flex items-start gap-2 text-xs font-bold text-amber-700 dark:text-amber-300">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p>Your changes are saved, but not live on your assistant yet.</p>
              <p className="font-medium text-amber-700/80 dark:text-amber-300/80">
                Callers still hear your previous setup until this goes through.
                {tenant.assistantSyncError
                  ? ` Last error: ${tenant.assistantSyncError}`
                  : ''}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onResyncAssistant}
            className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry now</span>
          </button>
        </div>
      )}

      {/* SECTION 1: Company & Service Area Details */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center gap-2 font-bold text-sm text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-800 pb-3">
          <Wrench className="w-4 h-4 text-blue-500" />
          <span>Company & Service Area Details</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Company Name
            </label>
            <input
              type="text"
              value={formData.businessName}
              onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label
              htmlFor="trade-category"
              className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1"
            >
              Trade / Industry Category
            </label>
            <Combobox
              id="trade-category"
              value={formData.trade}
              onChange={(trade) => setFormData({ ...formData, trade })}
              groups={TRADE_GROUPS.map((group) => ({
                label: group.label,
                options: group.trades,
              }))}
              placeholder="Select your trade"
              customLabel={(query) => `Use "${query}"`}
            />
          </div>

        </div>

        <BusinessHoursEditor
          value={formData.hours}
          onChange={(hours) => setFormData({ ...formData, hours })}
          parsedFrom={formData.hoursParsedFrom}
        />

        <ServiceAreaPicker
          areas={formData.serviceAreas}
          onChange={(serviceAreas) => setFormData({ ...formData, serviceAreas })}
        />

        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
            Pricing Notes & Diagnostic Disclaimers
          </label>
          <textarea
            rows={2}
            value={formData.pricingNotes}
            onChange={(e) => setFormData({ ...formData, pricingNotes: e.target.value })}
            className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* SECTION 2: Services Offered & Price Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2 font-bold text-sm text-slate-900 dark:text-white">
            <DollarSign className="w-4 h-4 text-emerald-500" />
            <span>Services Offered & Price Menu</span>
          </div>

          <button
            type="button"
            onClick={handleAddService}
            className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold flex items-center gap-1 hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Service</span>
          </button>
        </div>

        <div className="space-y-3">
          {formData.services.map((srv, idx) => (
            <div key={srv.id} className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center bg-slate-50 dark:bg-slate-800/40 p-3 rounded-2xl border border-slate-200 dark:border-slate-800">
              <div className="sm:col-span-5">
                <input
                  type="text"
                  value={srv.name}
                  onChange={(e) => {
                    const newSrvs = [...formData.services];
                    newSrvs[idx].name = e.target.value;
                    setFormData({ ...formData, services: newSrvs });
                  }}
                  className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white"
                />
              </div>

              <div className="sm:col-span-4">
                <input
                  type="text"
                  value={srv.price}
                  onChange={(e) => {
                    const newSrvs = [...formData.services];
                    newSrvs[idx].price = e.target.value;
                    setFormData({ ...formData, services: newSrvs });
                  }}
                  className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div className="sm:col-span-2">
                <input
                  type="text"
                  value={srv.duration}
                  onChange={(e) => {
                    const newSrvs = [...formData.services];
                    newSrvs[idx].duration = e.target.value;
                    setFormData({ ...formData, services: newSrvs });
                  }}
                  className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div className="sm:col-span-1 text-right">
                <button
                  type="button"
                  onClick={() => handleRemoveService(srv.id)}
                  className="p-1 rounded-lg text-slate-400 hover:text-rose-500"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

    </form>
  );
};
