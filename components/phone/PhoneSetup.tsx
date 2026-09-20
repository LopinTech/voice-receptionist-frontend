'use client';

import React, { useState } from 'react';
import { TenantConfig } from '@/types/schema';
import { CARRIERS } from '@/lib/mockData';
import { PhoneForwarded, Phone, CheckCircle2, AlertTriangle, Copy, ArrowRight, ShieldCheck, RefreshCw, Smartphone, HelpCircle } from 'lucide-react';

interface PhoneSetupProps {
  tenant: TenantConfig;
  onVerifyForwarding: () => void;
}

export const PhoneSetup: React.FC<PhoneSetupProps> = ({
  tenant,
  onVerifyForwarding,
}) => {
  const [selectedCarrierId, setSelectedCarrierId] = useState('verizon');
  const [copiedCode, setCopiedCode] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationDone, setVerificationDone] = useState(tenant.isForwardingVerified);

  const selectedCarrier = CARRIERS.find((c) => c.id === selectedCarrierId) || CARRIERS[0];
  const formattedDialCode = `${selectedCarrier.forwardingCode}${tenant.aiPhoneNumber.replace(/\D/g, '')}`;

  // Carrier instructions are templated so they always name this tenant's own
  // assistant number rather than a placeholder.
  const fillCarrierStep = (step: string) =>
    step
      .replace(/\{aiNumberDigits\}/g, tenant.aiPhoneNumber.replace(/\D/g, ''))
      .replace(/\{aiNumber\}/g, tenant.aiPhoneNumber);

  const handleCopyCode = () => {
    navigator.clipboard?.writeText(formattedDialCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleTestForwarding = () => {
    setIsVerifying(true);
    setTimeout(() => {
      setIsVerifying(false);
      setVerificationDone(true);
      onVerifyForwarding();
    }, 2000);
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <PhoneForwarded className="w-6 h-6 text-blue-500" />
          <span>Phone Number & Forwarding Setup</span>
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
          Connect your existing business cell or shop line so incoming calls automatically route to your AI receptionist.
        </p>
      </div>

      {/* Primary Number Status Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
          <div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
              Your Provisioned Dedicated AI Line
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold font-mono text-slate-900 dark:text-white flex items-center gap-3">
              <span>{tenant.aiPhoneNumber}</span>
              {verificationDone ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Forwarding Active
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                  <AlertTriangle className="w-3.5 h-3.5" /> Pending Setup
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleTestForwarding}
              disabled={isVerifying}
              className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-blue-500/20 transition-all cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isVerifying ? 'animate-spin' : ''}`} />
              <span>{isVerifying ? 'Testing Signal...' : 'Test My Forwarding'}</span>
            </button>
          </div>
        </div>

        {/* Status Verification Feedback */}
        {verificationDone && (
          <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center gap-2">
            <ShieldCheck className="w-4 h-4" />
            <span>Carrier call routing confirmed! Calls to {tenant.phoneNumber} are actively protected by AI.</span>
          </div>
        )}
      </div>

      {/* STEP-BY-STEP CARRIER WIZARD */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-blue-500" />
            <span>Step-by-Step Carrier Setup Wizard</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Select your mobile or office phone provider to get instant 1-tap dial codes:
          </p>
        </div>

        {/* Carrier Selector Buttons */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
          {CARRIERS.map((carrier) => (
            <button
              key={carrier.id}
              onClick={() => setSelectedCarrierId(carrier.id)}
              className={`p-3 rounded-2xl text-xs font-bold text-center border transition-all cursor-pointer ${
                selectedCarrierId === carrier.id
                  ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                  : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              {carrier.name}
            </button>
          ))}
        </div>

        {/* Click-to-dial Code Box */}
        <div className="bg-slate-900 text-white p-5 rounded-2xl space-y-3 border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              {selectedCarrier.name} Forwarding Code
            </span>
            <span className="text-[11px] text-emerald-400 font-mono">Conditional Call Forwarding</span>
          </div>

          <div className="flex items-center justify-between gap-3 bg-slate-950 p-3.5 rounded-xl border border-slate-800">
            <span className="font-mono text-lg sm:text-xl font-bold text-amber-300">
              {formattedDialCode}
            </span>

            <button
              onClick={handleCopyCode}
              className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shrink-0"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>{copiedCode ? 'Copied!' : 'Copy Code'}</span>
            </button>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            Dialing this code sets up conditional forwarding so when you're busy on a job site or don't pick up, your AI receptionist immediately answers!
          </p>
        </div>

        {/* Detailed Instructions */}
        <div className="space-y-3 pt-2">
          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Instructions for {selectedCarrier.name}:
          </h4>

          <div className="space-y-2">
            {selectedCarrier.steps.map((step, idx) => (
              <div key={idx} className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 text-xs text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800">
                <span className="w-5 h-5 rounded-full bg-blue-500 text-white font-bold text-[10px] flex items-center justify-center shrink-0">
                  {idx + 1}
                </span>
                <span className="leading-relaxed">{fillCarrierStep(step)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Future Number Porting Banner */}
      <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 text-white p-6 rounded-3xl border border-purple-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
        <div className="space-y-1">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <span>Want to port your existing number directly to AI?</span>
          </h3>
          <p className="text-xs text-purple-200">
            Keep your business number permanently hosted on our ultra-fast AI voice infrastructure without needing forwarding codes.
          </p>
        </div>

        <button className="px-5 py-2.5 rounded-xl bg-white text-purple-950 font-bold text-xs hover:bg-purple-50 transition-colors shadow-md shrink-0 cursor-pointer">
          Request Number Migration
        </button>
      </div>

    </div>
  );
};
