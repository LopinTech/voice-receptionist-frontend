'use client';

/**
 * Plan, usage and invoices.
 *
 * Only two figures here are real: the minutes this tenant's calls actually
 * consumed and what those calls cost us, both from `/me/overview`. Plans,
 * quotas, invoices and the card on file are not modelled in the backend, so
 * they are drawn as the mock designed them and labelled as placeholders
 * rather than passed off as this tenant's billing.
 */

import React from 'react';
import type { ApiOverview } from '@/lib/api-types';
import { Card, CardTitle, SampleDataNote, SecondaryButton, Tag } from './ui';

interface BillingViewProps {
  overview: ApiOverview | null;
}

const PLACEHOLDER_INVOICES = [
  { date: 'Sep 12, 2026', amount: '$149.00' },
  { date: 'Aug 12, 2026', amount: '$149.00' },
  { date: 'Jul 12, 2026', amount: '$149.00' },
  { date: 'Jun 12, 2026', amount: '$99.00' },
];

const MINUTE_ALLOWANCE = 3000;

export const BillingView: React.FC<BillingViewProps> = ({ overview }) => {
  const minutes = overview?.minutesUsedThisMonth ?? 0;
  const costDollars = ((overview?.telnyxCostCentsThisMonth ?? 0) / 100).toFixed(2);

  const usage = [
    {
      label: 'Call minutes',
      value: `${minutes.toLocaleString()} of ${MINUTE_ALLOWANCE.toLocaleString()}`,
      width: `${Math.min(100, (minutes / MINUTE_ALLOWANCE) * 100)}%`,
      color: 'bg-[#2F6BFF]',
      real: true,
    },
    {
      label: 'Jobs booked',
      value: `${overview?.bookedAppointments ?? 0} of unlimited`,
      width: '100%',
      color: 'bg-[#C6CDDB]',
      real: true,
    },
    {
      label: 'SMS follow-ups',
      value: '420 of 1,000',
      width: '42%',
      color: 'bg-[#14B87A]',
      real: false,
    },
  ];

  return (
    <>
      <SampleDataNote>
        your plan, allowances, invoices and card are not connected to billing
        yet. Minutes used and carrier cost are real.
      </SampleDataNote>

      <div className="grid items-start gap-[18px] xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <div className="flex flex-col gap-[18px]">
          <Card className="p-[22px]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-xs font-bold tracking-[.08em] text-[#8A93A6] uppercase">
                  Current plan
                </div>
                <div className="mt-2 mb-1 text-[22px] font-extrabold">
                  Pro · $149/mo
                </div>
                <div className="text-[13px] text-[#6B7488]">
                  Renews October 12, 2026
                </div>
              </div>
              <SecondaryButton disabled title="Plans are not connected yet">
                Change plan
              </SecondaryButton>
            </div>

            <div className="my-5 h-px bg-[#E4E8F0]" />

            <div className="flex flex-col gap-4">
              {usage.map((row) => (
                <div key={row.label}>
                  <div className="mb-[7px] flex justify-between text-[13px]">
                    <span className="font-bold">
                      {row.label}
                      {!row.real && (
                        <span className="ml-2 text-[11px] font-semibold text-[#A2600B]">
                          sample
                        </span>
                      )}
                    </span>
                    <span className="text-[#6B7488]">{row.value}</span>
                  </div>
                  <div className="h-[7px] overflow-hidden rounded-full bg-[#EEF0F5]">
                    <div
                      className={`h-full rounded-full ${row.color}`}
                      style={{ width: row.width }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-5 rounded-[12px] border border-[#E4E8F0] bg-[#F8FAFF] px-4 py-3.5 text-[13px]">
              <span className="font-bold">${costDollars}</span>
              <span className="text-[#6B7488]">
                {' '}
                of carrier cost from your calls this month.
              </span>
            </div>
          </Card>

          <Card className="overflow-hidden">
            <div className="border-b border-[#E4E8F0] px-[22px] py-[18px] text-[14.5px] font-bold">
              Invoices
            </div>
            {PLACEHOLDER_INVOICES.map((invoice, index) => (
              <div
                key={invoice.date}
                className={`flex items-center gap-4 px-[22px] py-3.5 ${
                  index === PLACEHOLDER_INVOICES.length - 1
                    ? ''
                    : 'border-b border-[#E4E8F0]'
                }`}
              >
                <div className="flex-1 text-[13.5px] font-semibold">
                  {invoice.date}
                </div>
                <div className="text-[13.5px] font-bold">{invoice.amount}</div>
                <Tag tone="green">Paid</Tag>
              </div>
            ))}
          </Card>
        </div>

        <Card className="p-[22px]">
          <CardTitle title="Payment method" className="mb-3.5" />
          <div className="flex items-center gap-3 rounded-[12px] border border-[#E4E8F0] p-4">
            <div className="grid h-7 w-[42px] flex-none place-items-center rounded-md bg-[#0E1526] text-[10px] font-extrabold tracking-[.05em] text-white">
              VISA
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[13.5px] font-bold">•••• 4242</div>
              <div className="mt-0.5 text-xs text-[#6B7488]">Expires 04/29</div>
            </div>
          </div>
          <SecondaryButton
            disabled
            title="Card management is not connected yet"
            className="mt-3 w-full"
          >
            Update card
          </SecondaryButton>
        </Card>
      </div>
    </>
  );
};
