'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, ApiError } from '@/lib/api';
import { hoursToApi, toE164 } from '@/lib/mappers';
import { useAuth } from '@/components/auth/AuthProvider';
import { PhoneCall, Loader2, AlertTriangle } from 'lucide-react';

type Mode = 'login' | 'register';

const inputClass =
  'w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500';
const labelClass =
  'block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1';

export default function LoginPage() {
  const router = useRouter();
  const { refresh } = useAuth();

  const [mode, setMode] = useState<Mode>('login');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [trade, setTrade] = useState('');
  const [businessPhone, setBusinessPhone] = useState('');
  const [servicesText, setServicesText] = useState('');
  const [businessHours, setBusinessHours] = useState('');

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      if (mode === 'login') {
        await api.login(email, password);
      } else {
        const services = servicesText
          .split('\n')
          .map((line) => line.trim())
          .filter((line) => line.length > 0)
          .map((line) => {
            // "Drain cleaning | $150-$250 | 1-2 hrs"
            const [name, price, duration] = line.split('|').map((p) => p.trim());
            return { name, price: price || undefined, duration: duration || undefined };
          });

        if (services.length === 0) {
          throw new ApiError(400, 'Add at least one service you offer');
        }

        await api.register({
          email,
          password,
          businessName,
          ownerName: ownerName || undefined,
          trade: trade || undefined,
          services,
          hours: hoursToApi(businessHours || 'Mon-Fri 8:00-17:00'),
          businessPhoneE164: toE164(businessPhone),
        });
      }

      await refresh();
      router.push('/');
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : 'Something went wrong',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 space-y-5">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-2xl bg-blue-600 text-white">
            <PhoneCall className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900 dark:text-white">
              {mode === 'login' ? 'Sign in' : 'Create your account'}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              AI receptionist for home service businesses
            </p>
          </div>
        </div>

        {error && (
          <div className="flex items-start gap-2 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/40 text-xs text-amber-800 dark:text-amber-200">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={labelClass}>Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClass}
              placeholder="you@yourbusiness.com"
            />
          </div>

          <div>
            <label className={labelClass}>Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputClass}
              placeholder={
                mode === 'register' ? 'At least 12 characters' : '••••••••'
              }
            />
          </div>

          {mode === 'register' && (
            <>
              <div>
                <label className={labelClass}>Business name</label>
                <input
                  type="text"
                  required
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  className={inputClass}
                  placeholder="Apex Plumbing & Home Services"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Your name</label>
                  <input
                    type="text"
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    className={inputClass}
                    placeholder="Dan Vance"
                  />
                </div>
                <div>
                  <label className={labelClass}>Trade</label>
                  <input
                    type="text"
                    value={trade}
                    onChange={(e) => setTrade(e.target.value)}
                    className={inputClass}
                    placeholder="Plumbing"
                  />
                </div>
              </div>

              <div>
                <label className={labelClass}>
                  Your current business number
                </label>
                <input
                  type="tel"
                  value={businessPhone}
                  onChange={(e) => setBusinessPhone(e.target.value)}
                  className={inputClass}
                  placeholder="(555) 234-8900"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  The number customers already call. You&apos;ll forward it to
                  your assistant after signup.
                </p>
              </div>

              <div>
                <label className={labelClass}>Services you offer</label>
                <textarea
                  rows={3}
                  value={servicesText}
                  onChange={(e) => setServicesText(e.target.value)}
                  className={inputClass}
                  placeholder={
                    'Drain cleaning | $150-$250 | 1-2 hrs\nWater heater flush | $180 flat | 1 hr'
                  }
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  One per line. Optionally add price and duration separated by
                  &quot;|&quot;.
                </p>
              </div>

              <div>
                <label className={labelClass}>Business hours</label>
                <input
                  type="text"
                  value={businessHours}
                  onChange={(e) => setBusinessHours(e.target.value)}
                  className={inputClass}
                  placeholder="Mon-Fri 7:00 AM - 6:00 PM, Sat 8:00 AM - 2:00 PM"
                />
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-bold shadow-md shadow-blue-500/20 transition-all"
          >
            {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
            <span>
              {mode === 'login' ? 'Sign in' : 'Create account & set up my AI'}
            </span>
          </button>
        </form>

        <button
          type="button"
          onClick={() => {
            setMode(mode === 'login' ? 'register' : 'login');
            setError(null);
          }}
          className="w-full text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
        >
          {mode === 'login'
            ? "Don't have an account? Sign up"
            : 'Already have an account? Sign in'}
        </button>
      </div>
    </div>
  );
}
