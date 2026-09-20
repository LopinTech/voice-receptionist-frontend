'use client';

/**
 * The number, where it forwards, and how to set that up at the carrier.
 *
 * The mock puts an on/off switch on call forwarding. Forwarding is
 * configured on the carrier's side with a dial code, so a switch here could
 * only ever lie about the state of something it cannot change — this shows
 * the verified status and the code to dial instead.
 */

import React, { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Copy,
  Loader2,
  ShieldCheck,
} from 'lucide-react';
import type { TenantConfig } from '@/types/schema';
import { CARRIERS } from '@/lib/mockData';
import { Card, CardTitle, PrimaryButton, SecondaryButton } from './ui';

interface PhoneViewProps {
  tenant: TenantConfig;
  onVerifyForwarding: () => void;
}

const HANDLING = [
  {
    title: 'Customers keep calling your number',
    body: 'Nothing about the number on your truck or your website changes.',
  },
  {
    title: 'Unanswered calls forward to your receptionist',
    body: 'The dial code below tells your carrier to send calls you do not pick up to your assistant line.',
  },
  {
    title: 'The assistant answers around the clock',
    body: 'Outside your business hours it answers on the first ring, books what it can and takes a message for the rest.',
  },
];

export const PhoneView: React.FC<PhoneViewProps> = ({
  tenant,
  onVerifyForwarding,
}) => {
  const [carrierId, setCarrierId] = useState(CARRIERS[0].id);
  const [copied, setCopied] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  const carrier = CARRIERS.find((entry) => entry.id === carrierId) ?? CARRIERS[0];
  const aiDigits = tenant.aiPhoneNumber.replace(/\D/g, '');
  const dialCode = `${carrier.forwardingCode}${aiDigits}`;

  const fillStep = (step: string) =>
    step
      .replace(/\{aiNumberDigits\}/g, aiDigits)
      .replace(/\{aiNumber\}/g, tenant.aiPhoneNumber);

  const copy = () => {
    navigator.clipboard?.writeText(dialCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const verify = () => {
    setIsVerifying(true);
    onVerifyForwarding();
    // The check is a round trip to the backend; the spinner is released on
    // the refetched profile arriving, which flips `isForwardingVerified`.
    setTimeout(() => setIsVerifying(false), 2000);
  };

  return (
    <div className="grid items-start gap-[18px] xl:grid-cols-2">
      <Card className="p-[22px]">
        <div className="text-xs font-bold tracking-[.08em] text-[#8A93A6] uppercase">
          Your business number
        </div>
        <div className="my-2.5 text-[30px] font-extrabold tracking-[-0.02em]">
          {tenant.phoneNumber || 'Not set'}
        </div>
        <div className="text-[13px] text-[#6B7488]">
          Customers keep calling this number. Nothing changed.
        </div>

        <div className="my-5 h-px bg-[#E4E8F0]" />

        <div className="text-xs font-bold tracking-[.08em] text-[#8A93A6] uppercase">
          Forwards to
        </div>
        <div className="mt-2 mb-0.5 text-[20px] font-extrabold">
          {tenant.aiPhoneNumber || 'Being provisioned…'}
        </div>
        <div className="mb-3.5 text-[12.5px] font-semibold text-[#6B7488]">
          AI receptionist
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3.5 rounded-[12px] border border-[#E4E8F0] bg-[#F8FAFF] px-4 py-3.5">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-[13.5px] font-bold">
              {tenant.isForwardingVerified ? (
                <>
                  <CheckCircle2 className="h-4 w-4 text-[#0E8A5F]" />
                  Call forwarding is live
                </>
              ) : (
                <>
                  <AlertTriangle className="h-4 w-4 text-[#C2860C]" />
                  Forwarding not confirmed yet
                </>
              )}
            </div>
            <div className="mt-0.5 text-[12.5px] text-[#6B7488]">
              {tenant.isForwardingVerified
                ? 'Unanswered calls reach your AI receptionist.'
                : 'Dial the code on the right, then check it here.'}
            </div>
          </div>
          <PrimaryButton onClick={verify} disabled={isVerifying} type="button">
            {isVerifying ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ShieldCheck className="h-4 w-4" />
            )}
            Check forwarding
          </PrimaryButton>
        </div>

        <div className="mt-[18px] flex flex-col gap-3">
          {HANDLING.map((rule, index) => (
            <div
              key={rule.title}
              className="flex items-start gap-3 rounded-[12px] border border-[#E4E8F0] px-[15px] py-3.5"
            >
              <div className="mt-px grid h-[22px] w-[22px] flex-none place-items-center rounded-full bg-[#EEF3FF] text-[11px] font-bold text-[#2F6BFF]">
                {index + 1}
              </div>
              <div className="min-w-0">
                <div className="text-[13.5px] font-bold">{rule.title}</div>
                <div className="mt-[3px] text-[12.5px] leading-[1.5] text-[#6B7488]">
                  {rule.body}
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-[22px]">
        <CardTitle
          title="Set up forwarding at your carrier"
          hint="Takes about a minute"
          className="mb-4"
        />

        <div className="mb-4 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
          {CARRIERS.map((entry) => (
            <button
              key={entry.id}
              type="button"
              onClick={() => setCarrierId(entry.id)}
              className={`rounded-[10px] border px-3 py-2.5 text-center text-[12.5px] font-bold transition ${
                entry.id === carrierId
                  ? 'border-[#2F6BFF] bg-[#2F6BFF] text-white'
                  : 'border-[#DDE1EA] bg-white text-[#26304A] hover:border-[#B9C3D8]'
              }`}
            >
              {entry.name}
            </button>
          ))}
        </div>

        <div className="rounded-[14px] bg-[#0E1526] px-[18px] py-4">
          <div className="flex items-center justify-between gap-3">
            <span className="text-[11px] font-bold tracking-[.08em] text-[#8A94AC] uppercase">
              {carrier.name} forwarding code
            </span>
            <span className="text-[11px] text-[#3DD598]">
              Conditional forwarding
            </span>
          </div>
          <div className="mt-3 flex items-center justify-between gap-3 rounded-[10px] bg-black/30 px-3.5 py-3">
            <span className="font-mono text-lg font-bold text-[#F6CE8E]">
              {aiDigits ? dialCode : 'Waiting for your assistant line'}
            </span>
            {aiDigits !== '' && (
              <button
                type="button"
                onClick={copy}
                className="flex flex-none items-center gap-1.5 rounded-lg bg-[#2F6BFF] px-3 py-1.5 text-xs font-bold text-white transition hover:bg-[#1E4FD8]"
              >
                <Copy className="h-3.5 w-3.5" />
                {copied ? 'Copied' : 'Copy'}
              </button>
            )}
          </div>
          <p className="m-0 mt-3 text-xs leading-[1.5] text-[#8A94AC]">
            Dialling this sets conditional forwarding: when you are on a job
            or do not pick up, the receptionist answers instead of voicemail.
          </p>
        </div>

        <div className="mt-4 flex flex-col gap-2">
          {carrier.steps.map((step, index) => (
            <div
              key={step}
              className="flex items-start gap-3 rounded-[10px] border border-[#E4E8F0] bg-[#FCFCFD] px-3.5 py-3 text-[12.5px] leading-[1.5] text-[#26304A]"
            >
              <span className="mt-px grid h-5 w-5 flex-none place-items-center rounded-full bg-[#2F6BFF] text-[10px] font-bold text-white">
                {index + 1}
              </span>
              <span>{fillStep(step)}</span>
            </div>
          ))}
        </div>

        {carrier.unforwardCode && (
          <p className="m-0 mt-3 text-xs text-[#8A93A6]">
            To turn forwarding off again, dial {carrier.unforwardCode}.
          </p>
        )}

        <SecondaryButton
          type="button"
          onClick={verify}
          disabled={isVerifying}
          className="mt-4"
        >
          I have dialled it — check now
        </SecondaryButton>
      </Card>
    </div>
  );
};
