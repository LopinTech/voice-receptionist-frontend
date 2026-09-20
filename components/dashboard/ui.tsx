'use client';

/**
 * The dashboard's shared surfaces. Every page is built from these, so the
 * cards, pills and toggles stay identical across views instead of each one
 * re-deriving the same border radius and grey.
 *
 * The palette is the Ringgy AI one: ink #0E1526, accent #2F6BFF, hairline
 * #E4E8F0 on the #F2F4F8 workspace. It is light-only by design — the
 * dashboard and the signup wizard are one surface now.
 */

import React from 'react';

export const CARD = 'rounded-[18px] border border-[#E4E8F0] bg-white';
export const HAIRLINE = 'border-[#E4E8F0]';
export const FIELD =
  'h-11 w-full rounded-[10px] border border-[#DDE1EA] bg-[#FCFCFD] px-3.5 text-sm text-[#0E1526] placeholder:text-[#A6AEBF] outline-none transition focus:border-[#2F6BFF] focus:ring-4 focus:ring-[#2F6BFF]/12';
export const LABEL = 'text-[12.5px] font-semibold text-[#26304A]';
export const MUTED = 'text-[#6B7488]';

export const Card: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = '' }) => (
  <div className={`${CARD} ${className}`}>{children}</div>
);

/** Card header with an optional action on the right. */
export const CardTitle: React.FC<{
  title: string;
  hint?: string;
  action?: React.ReactNode;
  className?: string;
}> = ({ title, hint, action, className = '' }) => (
  <div className={`flex items-baseline justify-between gap-4 ${className}`}>
    <div className="text-[14.5px] font-bold text-[#0E1526]">{title}</div>
    {action ?? (hint ? <div className="text-[12.5px] text-[#8A93A6]">{hint}</div> : null)}
  </div>
);

export const PrimaryButton: React.FC<
  React.ButtonHTMLAttributes<HTMLButtonElement>
> = ({ className = '', ...props }) => (
  <button
    {...props}
    className={`inline-flex h-11 items-center justify-center gap-2 rounded-[10px] bg-[#0E1526] px-5 text-[13.5px] font-bold text-white transition hover:bg-[#2F6BFF] disabled:opacity-60 ${className}`}
  />
);

export const SecondaryButton: React.FC<
  React.ButtonHTMLAttributes<HTMLButtonElement>
> = ({ className = '', ...props }) => (
  <button
    {...props}
    className={`inline-flex h-10 items-center justify-center gap-2 rounded-[10px] border border-[#DDE1EA] bg-white px-4 text-[13.5px] font-semibold text-[#26304A] transition hover:bg-[#F7F8FA] disabled:opacity-60 ${className}`}
  />
);

/** The pill used for call outcomes, invoice status and similar one-word states. */
export const Tag: React.FC<{
  children: React.ReactNode;
  tone: 'green' | 'blue' | 'grey' | 'amber';
}> = ({ children, tone }) => {
  const tones = {
    green: 'bg-[#E9F8F1] text-[#0E8A5F]',
    blue: 'bg-[#EEF3FF] text-[#1E4FD8]',
    grey: 'bg-[#F3F4F7] text-[#5C6579]',
    amber: 'bg-[#FEF3E2] text-[#A2600B]',
  };
  return (
    <span
      className={`flex-none rounded-full px-[11px] py-[5px] text-[11.5px] font-bold ${tones[tone]}`}
    >
      {children}
    </span>
  );
};

export const Toggle: React.FC<{
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
  disabled?: boolean;
}> = ({ checked, onChange, label, disabled }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    aria-label={label}
    disabled={disabled}
    onClick={() => onChange(!checked)}
    className={`relative h-[30px] w-[52px] flex-none rounded-full transition disabled:opacity-50 ${
      checked ? 'bg-[#2F6BFF]' : 'bg-[#C6CDDB]'
    }`}
  >
    <span
      className={`absolute top-[3px] h-6 w-6 rounded-full bg-white shadow transition-[left] ${
        checked ? 'left-[25px]' : 'left-[3px]'
      }`}
    />
  </button>
);

/**
 * Marks a panel whose numbers are placeholders rather than live data. The
 * dashboard has carried this label since the first version; it is the only
 * honest way to ship a billing screen before billing exists.
 */
export const SampleDataNote: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => (
  <div className="flex items-start gap-2 rounded-[12px] border border-amber-300/60 bg-amber-50 px-3.5 py-2.5 text-[12.5px] text-amber-900">
    <span className="font-bold">Sample data</span>
    <span className="opacity-80">— {children}</span>
  </div>
);

/** Initials for an avatar chip: "Dan Vance" -> "DV". */
export function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '—';
  return (parts[0][0] + (parts[1]?.[0] ?? '')).toUpperCase();
}
