'use client';

/**
 * The one banner the overview always leads with: whether calls are actually
 * being answered right now. It keeps the three states the old banner had —
 * setup incomplete, paused, live — in the new flat style.
 */

import React from 'react';
import { AlertTriangle, CheckCircle2, Pause, Play } from 'lucide-react';
import type { TenantConfig, TenantStatus } from '@/types/schema';
import { PrimaryButton, SecondaryButton } from './ui';

interface StatusBannerProps {
  tenant: TenantConfig;
  status: TenantStatus;
  onStatusChange: (status: TenantStatus) => void;
  onNavigateToTab: (tab: string) => void;
}

export const StatusBanner: React.FC<StatusBannerProps> = ({
  tenant,
  status,
  onStatusChange,
  onNavigateToTab,
}) => {
  if (status === 'setup_incomplete') {
    return (
      <div className="flex flex-wrap items-center gap-4 rounded-[18px] border border-amber-300 bg-[#FFF8EC] px-[22px] py-5">
        <AlertTriangle className="h-5 w-5 flex-none text-[#C2860C]" />
        <div className="min-w-0 flex-1">
          <div className="text-[15px] font-extrabold text-[#6B4A06]">
            Your receptionist is not answering yet
          </div>
          <p className="m-0 mt-1 text-[13px] leading-[1.5] text-[#8A6520]">
            {tenant.businessName} is set up, but calls to{' '}
            {tenant.phoneNumber || 'your number'} are not forwarding to your
            assistant line yet.
          </p>
        </div>
        <PrimaryButton type="button" onClick={() => onNavigateToTab('phone')}>
          Finish forwarding
        </PrimaryButton>
      </div>
    );
  }

  if (status === 'paused') {
    return (
      <div className="flex flex-wrap items-center gap-4 rounded-[18px] border border-[#E4E8F0] bg-white px-[22px] py-5">
        <Pause className="h-5 w-5 flex-none text-[#6B7488]" />
        <div className="min-w-0 flex-1">
          <div className="text-[15px] font-extrabold">
            Your receptionist is paused
          </div>
          <p className="m-0 mt-1 text-[13px] text-[#6B7488]">
            Calls go to voicemail until you turn it back on.
          </p>
        </div>
        <PrimaryButton type="button" onClick={() => onStatusChange('active')}>
          <Play className="h-4 w-4" />
          Resume answering
        </PrimaryButton>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-4 rounded-[18px] border border-[#E4E8F0] bg-white px-[22px] py-4">
      <CheckCircle2 className="h-5 w-5 flex-none text-[#0E8A5F]" />
      <div className="min-w-0 flex-1">
        <div className="text-[14px] font-bold">
          Answering every call to {tenant.phoneNumber || 'your line'}
        </div>
        <p className="m-0 mt-0.5 text-[12.5px] text-[#6B7488]">
          {tenant.businessHours || 'Around the clock'} · handing off to{' '}
          {tenant.forwardingNumber || 'your line'} when a caller asks for you.
        </p>
      </div>
      <SecondaryButton type="button" onClick={() => onStatusChange('paused')}>
        <Pause className="h-3.5 w-3.5" />
        Pause
      </SecondaryButton>
    </div>
  );
};
