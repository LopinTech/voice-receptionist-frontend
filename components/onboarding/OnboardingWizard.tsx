'use client';

/**
 * Seven-step signup onboarding. Everything the wizard collects is sent in a
 * single `POST /auth/register` at the end — there is no account until the
 * last step, so a visitor who abandons halfway leaves no half-built tenant
 * behind. The live preview on the right is illustrative, not real data.
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { AlertTriangle, Loader2, Search, X } from 'lucide-react';
import { api } from '@/lib/api';
import { toE164 } from '@/lib/mappers';
import { formatTime } from '@/lib/business-hours';
import type {
  ApiDayKey,
  ApiGeoResult,
  ApiHours,
  ApiServiceArea,
} from '@/lib/api-types';
import { useAuth } from '@/components/auth/AuthProvider';
import { Logo } from '@/components/brand/Logo';

/**
 * The same MapLibre map the Company Profile picker draws. It reaches for
 * `window` at import time, so it must never run during the server render.
 */
const ServiceAreaMap = dynamic(
  () => import('@/components/ui/ServiceAreaMap').then((m) => m.ServiceAreaMap),
  {
    ssr: false,
    loading: () => (
      <div className="mt-3 grid aspect-[16/10] w-full place-items-center rounded-[14px] border border-[#E4E8F0] bg-[#F2F4F8]">
        <Loader2 className="h-5 w-5 animate-spin text-[#8A93A6]" />
      </div>
    ),
  },
);

/* ------------------------------------------------------------------ *
 * Static content
 * ------------------------------------------------------------------ */

const STEPS = [
  {
    id: 'account',
    key: 'Account',
    title: "Let's get your AI receptionist set up",
    sub: 'Create your account to start answering calls, texts, and customer questions automatically.',
  },
  {
    id: 'business',
    key: 'Business',
    title: 'Tell us about your business',
    sub: 'This helps your AI receptionist understand who you are and what you do.',
  },
  {
    id: 'phone',
    key: 'Phone number',
    title: 'Which number do your customers call?',
    sub: "We'll use this number to connect your customers with your AI receptionist.",
  },
  {
    id: 'areas',
    key: 'Service area',
    title: 'Where do you take jobs?',
    sub: 'Pick the areas you cover. Your AI receptionist will only book jobs inside them.',
  },
  {
    id: 'services',
    key: 'Services',
    title: 'What services do you offer?',
    sub: 'Tell your AI receptionist what you can help customers with.',
  },
  {
    id: 'hours',
    key: 'Hours',
    title: 'When are you available?',
    sub: 'Your AI receptionist can handle customers even when your team is unavailable.',
  },
  { id: 'ready', key: 'Ready', title: 'Your AI receptionist is ready', sub: '' },
] as const;

const LAST_STEP = STEPS.length - 1;

/**
 * The chip row is a shortcut, not the full taxonomy — "Other" reveals a
 * free-text field so a trade that is missing here can never block signup.
 * The value reaches the API as free text either way.
 */
const TRADE_CHIPS = [
  'Plumbing',
  'HVAC',
  'Electrical',
  'Roofing',
  'Cleaning',
  'Landscaping',
];

const OTHER = 'Other';

/**
 * One radius for every area picked here, rather than a slider each: signup
 * is not the place to tune coverage town by town, and Company Profile lets
 * an owner set them individually afterwards.
 */
const DEFAULT_RADIUS_MILES = 15;
const MIN_RADIUS_MILES = 1;
const MAX_RADIUS_MILES = 100;
const SEARCH_DEBOUNCE_MS = 350;
const MIN_QUERY_LENGTH = 3;

const NUMBER_STEPS = [
  'You keep this number. Nothing about it changes today.',
  'We give you a forwarding setting so unanswered calls ring your AI receptionist instead of voicemail.',
  'Turn forwarding on or off any time — your team can always pick up first.',
];

/* ------------------------------------------------------------------ *
 * Local shapes
 * ------------------------------------------------------------------ */

interface ServiceRow {
  name: string;
  price: string;
  duration: string;
}

/**
 * Hours are edited as three rows rather than seven, because that is how
 * these businesses describe their week. `days` is what each row expands to
 * when the structured per-day map is built for the API.
 */
interface HourRow {
  label: string;
  days: ApiDayKey[];
  from: string;
  to: string;
  open: boolean;
}

const INITIAL_HOURS: HourRow[] = [
  {
    label: 'Mon–Fri',
    days: ['mon', 'tue', 'wed', 'thu', 'fri'],
    from: '07:00',
    to: '18:00',
    open: true,
  },
  { label: 'Saturday', days: ['sat'], from: '08:00', to: '14:00', open: true },
  { label: 'Sunday', days: ['sun'], from: '09:00', to: '13:00', open: false },
];

function toApiHours(rows: HourRow[]): ApiHours {
  const hours: ApiHours = {};
  for (const row of rows) {
    for (const day of row.days) {
      hours[day] = { closed: !row.open, open: row.from, close: row.to };
    }
  }
  return hours;
}

/** "(555) 234-8900" while typing; anything non-US is left as entered. */
function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, '');
  if (value.trim().startsWith('+') || digits.length > 10) return value;
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
}

/* ------------------------------------------------------------------ *
 * Shared class strings
 * ------------------------------------------------------------------ */

const FIELD =
  'h-12 px-3.5 rounded-xl border border-[#DDE1EA] bg-[#FCFCFD] text-[15px] text-[#0E1526] placeholder:text-[#A6AEBF] outline-none transition focus:border-[#2F6BFF] focus:ring-4 focus:ring-[#2F6BFF]/12';
const LABEL = 'text-[13px] font-semibold text-[#26304A]';
const CARD = 'rounded-[14px] border border-[#E4E8F0]';

export const OnboardingWizard: React.FC = () => {
  const router = useRouter();
  const { refresh } = useAuth();

  const [step, setStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [business, setBusiness] = useState('');
  const [person, setPerson] = useState('');
  const [trade, setTrade] = useState<string>(TRADE_CHIPS[0]);
  const [tradeOther, setTradeOther] = useState('');
  const [phone, setPhone] = useState('');
  const [services, setServices] = useState<ServiceRow[]>([
    { name: '', price: '', duration: '' },
  ]);
  const [hours, setHours] = useState<HourRow[]>(INITIAL_HOURS);

  const [areas, setAreas] = useState<ApiServiceArea[]>([]);
  const [radiusMiles, setRadiusMiles] = useState(DEFAULT_RADIUS_MILES);
  const [areaQuery, setAreaQuery] = useState('');
  const [areaResults, setAreaResults] = useState<ApiGeoResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const searchAbortRef = useRef<AbortController | null>(null);

  const meta = STEPS[step];
  const stepId = meta.id;
  const bizLabel = business.trim() || 'your business';
  const tradeLabel = (trade === OTHER ? tradeOther.trim() : trade) || 'service';
  const namedServices = services
    .map((service) => service.name.trim())
    .filter(Boolean);
  const openRows = hours.filter((row) => row.open);

  // The spinner and the cleared results belong to the keystroke that caused
  // them; the effect below stays purely about fetching.
  const onAreaQueryChange = (value: string) => {
    setAreaQuery(value);

    if (value.trim().length < MIN_QUERY_LENGTH) {
      setAreaResults([]);
      setIsSearching(false);
      setSearchError(null);
      return;
    }

    setIsSearching(true);
    setSearchError(null);
  };

  useEffect(() => {
    const trimmed = areaQuery.trim();
    if (trimmed.length < MIN_QUERY_LENGTH) return;

    // Debounced, and the in-flight request is cancelled on every keystroke:
    // the geocoder is rate limited, and a late response for an older query
    // would show results the visitor has already typed past.
    const timer = setTimeout(() => {
      searchAbortRef.current?.abort();
      const controller = new AbortController();
      searchAbortRef.current = controller;

      api
        .publicGeoSearch(trimmed, controller.signal)
        .then((found) => {
          setAreaResults(found);
          setIsSearching(false);
        })
        .catch((error: unknown) => {
          if (controller.signal.aborted) return;
          setSearchError(
            error instanceof Error
              ? error.message
              : 'Could not search for that location.',
          );
          setIsSearching(false);
        });
    }, SEARCH_DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [areaQuery]);

  const addArea = (result: ApiGeoResult) => {
    const id = `${result.lat.toFixed(4)},${result.lng.toFixed(4)}`;

    // Adding the same town twice would draw two identical circles and tell
    // the assistant about it twice.
    if (!areas.some((area) => area.id === id)) {
      setAreas((current) => [
        ...current,
        { id, label: result.label, lat: result.lat, lng: result.lng, radiusMiles },
      ]);
    }

    // Cleared so the next area can be typed straight away — most businesses
    // add several in a row.
    onAreaQueryChange('');
  };

  const removeArea = (id: string) =>
    setAreas((current) => current.filter((area) => area.id !== id));

  // The radius is shared, so moving it moves every circle at once.
  const changeRadius = (miles: number) => {
    setRadiusMiles(miles);
    setAreas((current) =>
      current.map((area) => ({ ...area, radiusMiles: miles })),
    );
  };

  const patchService = (index: number, key: keyof ServiceRow, value: string) =>
    setServices((rows) =>
      rows.map((row, i) => (i === index ? { ...row, [key]: value } : row)),
    );

  const patchHour = <K extends keyof HourRow>(
    index: number,
    key: K,
    value: HourRow[K],
  ) =>
    setHours((rows) =>
      rows.map((row, i) => (i === index ? { ...row, [key]: value } : row)),
    );

  /** What blocks the current step, or null when it is complete. */
  const stepError = useMemo((): string | null => {
    if (stepId === 'account') {
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())) {
        return 'Enter the email address you want to sign in with';
      }
      if (password.length < 12) {
        return 'Password must be at least 12 characters long';
      }
      return null;
    }
    if (stepId === 'business') {
      if (!business.trim()) return 'Tell us what your business is called';
      if (trade === OTHER && !tradeOther.trim()) return 'Name your trade';
      return null;
    }
    if (stepId === 'phone') {
      if (phone.replace(/\D/g, '').length < 10) {
        return 'Enter the number your customers call today';
      }
      return null;
    }
    if (stepId === 'services') {
      if (namedServices.length === 0) {
        return 'Add at least one service you offer';
      }
      return null;
    }
    if (stepId === 'hours') {
      const backwards = hours.find((row) => row.open && row.to <= row.from);
      if (backwards) {
        return `${backwards.label} closing time must be after the opening time`;
      }
      return null;
    }
    return null;
  }, [
    stepId,
    email,
    password,
    business,
    trade,
    tradeOther,
    phone,
    namedServices.length,
    hours,
  ]);

  const submit = async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      await api.register({
        email: email.trim(),
        password,
        businessName: business.trim(),
        ownerName: person.trim() || undefined,
        trade: trade === OTHER ? tradeOther.trim() : trade,
        services: services
          .filter((service) => service.name.trim())
          .map((service) => ({
            name: service.name.trim(),
            price: service.price.trim() || undefined,
            duration: service.duration.trim() || undefined,
          })),
        hours: toApiHours(hours),
        serviceAreas: areas.length ? areas : undefined,
        businessPhoneE164: toE164(phone),
      });
      await refresh();
      router.push('/');
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : 'Something went wrong',
      );
      setIsSubmitting(false);
    }
  };

  const next = () => {
    if (stepError) {
      setError(stepError);
      return;
    }
    setError(null);
    if (step === LAST_STEP) {
      void submit();
      return;
    }
    setStep((current) => Math.min(LAST_STEP, current + 1));
  };

  const back = () => {
    setError(null);
    setStep((current) => Math.max(0, current - 1));
  };

  const summary = [
    { label: 'Business', value: business.trim() || '—' },
    { label: 'Trade', value: tradeLabel },
    {
      label: 'Service area',
      value: areas.length
        ? `${
            areas.length > 3
              ? `${areas
                  .slice(0, 3)
                  .map((area) => area.label)
                  .join(', ')} + ${areas.length - 3} more`
              : areas.map((area) => area.label).join(', ')
          } · ${radiusMiles} mi`
        : 'Anywhere — no areas set',
    },
    {
      label: 'Services',
      value:
        namedServices.length > 2
          ? `${namedServices.slice(0, 2).join(', ')} + ${
              namedServices.length - 2
            } more`
          : namedServices.join(', ') || 'None added yet',
    },
    {
      label: 'Hours',
      value: openRows.length
        ? openRows
            .map(
              (row) =>
                `${row.label} ${formatTime(row.from)}–${formatTime(row.to)}`,
            )
            .join(' · ')
        : 'Closed all week',
    },
  ];

  const shownError = error ?? null;

  return (
    <div className="grid min-h-screen bg-white lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
      {/* ---------------------------------------------------------- *
       * Left: the wizard
       * ---------------------------------------------------------- */}
      <div className="flex min-w-0 flex-col px-7 pt-10 pb-9 sm:px-12 xl:px-[76px]">
        <Logo className="mb-11" />

        <div className="mb-3.5 flex gap-1.5">
          {STEPS.map((entry, index) => (
            <div
              key={entry.key}
              className={`h-1 flex-1 rounded-full transition-colors ${
                index <= step ? 'bg-[#2F6BFF]' : 'bg-[#E4E8F0]'
              }`}
            />
          ))}
        </div>
        <div className="mb-8 text-[12.5px] font-semibold text-[#8A93A6]">
          Step {step + 1} of {STEPS.length} · {meta.key}
        </div>

        <div className="w-full max-w-[460px] flex-1">
          <div key={step} className="animate-floatIn">
            <h1 className="mb-2.5 text-[26px] font-extrabold leading-[1.15] tracking-[-0.03em] text-[#0E1526] xl:text-[33px]">
              {meta.title}
            </h1>
            <p className="mb-7 text-[15px] leading-[1.55] text-pretty text-[#5C6579]">
              {stepId === 'ready'
                ? `We've got everything we need to set up your receptionist for ${bizLabel}.`
                : meta.sub}
            </p>

            {stepId === 'account' && (
              <div className="flex flex-col gap-[18px]">
                <label className="flex flex-col gap-[7px]">
                  <span className={LABEL}>Email</span>
                  <input
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="you@yourbusiness.com"
                    className={FIELD}
                  />
                </label>
                <label className="flex flex-col gap-[7px]">
                  <span className={LABEL}>Password</span>
                  <input
                    type="password"
                    autoComplete="new-password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="At least 12 characters"
                    className={FIELD}
                  />
                </label>
              </div>
            )}

            {stepId === 'business' && (
              <div className="flex flex-col gap-[18px]">
                <label className="flex flex-col gap-[7px]">
                  <span className={LABEL}>Business name</span>
                  <input
                    value={business}
                    onChange={(event) => setBusiness(event.target.value)}
                    placeholder="Apex Plumbing & Home Services"
                    className={FIELD}
                  />
                </label>
                <label className="flex flex-col gap-[7px]">
                  <span className={LABEL}>Your name</span>
                  <input
                    value={person}
                    onChange={(event) => setPerson(event.target.value)}
                    placeholder="Dan Vance"
                    className={FIELD}
                  />
                </label>
                <div className="flex flex-col gap-2.5">
                  <span className={LABEL}>Trade</span>
                  <div className="flex flex-wrap gap-2">
                    {[...TRADE_CHIPS, OTHER].map((name) => {
                      const selected = trade === name;
                      return (
                        <button
                          key={name}
                          type="button"
                          onClick={() => setTrade(name)}
                          className={`rounded-full border px-[15px] py-2.5 text-[13.5px] font-semibold transition ${
                            selected
                              ? 'border-[#2F6BFF] bg-[#2F6BFF] text-white'
                              : 'border-[#DDE1EA] bg-white text-[#26304A] hover:border-[#B9C3D8]'
                          }`}
                        >
                          {name}
                        </button>
                      );
                    })}
                  </div>
                  {trade === OTHER && (
                    <input
                      value={tradeOther}
                      onChange={(event) => setTradeOther(event.target.value)}
                      placeholder="Chimney & Fireplace"
                      className={`${FIELD} mt-1`}
                    />
                  )}
                </div>
              </div>
            )}

            {stepId === 'phone' && (
              <div className="flex flex-col gap-[18px]">
                <label className="flex flex-col gap-[7px]">
                  <span className={LABEL}>Current business number</span>
                  <input
                    type="tel"
                    autoComplete="tel"
                    value={phone}
                    onChange={(event) =>
                      setPhone(formatPhone(event.target.value))
                    }
                    placeholder="(555) 234-8900"
                    className={FIELD}
                  />
                </label>
                <p className="m-0 text-[13px] leading-[1.5] text-[#5C6579]">
                  This is the number your customers already call. After setup,
                  you can forward calls to your AI receptionist.
                </p>
                <div className={`${CARD} bg-[#F8FAFF] px-[18px] pt-[18px] pb-4`}>
                  <div className="mb-3.5 text-xs font-bold tracking-[.08em] text-[#2F6BFF] uppercase">
                    What happens to your number
                  </div>
                  <div className="flex flex-col gap-[13px]">
                    {NUMBER_STEPS.map((text, index) => (
                      <div key={text} className="flex items-start gap-[11px]">
                        <div className="mt-px grid h-5 w-5 flex-none place-items-center rounded-full bg-[#2F6BFF] text-[11px] font-bold text-white">
                          {index + 1}
                        </div>
                        <div className="text-[13.5px] leading-[1.5] text-[#26304A]">
                          {text}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {stepId === 'areas' && (
              <div>
                <div className="relative mb-3.5">
                  <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-[#9AA2B4]" />
                  <input
                    value={areaQuery}
                    onChange={(event) => onAreaQueryChange(event.target.value)}
                    placeholder="Search a city, town, neighbourhood or ZIP…"
                    autoComplete="off"
                    aria-label="Search for a service area"
                    className="h-[50px] w-full rounded-xl border border-[#DDE1EA] bg-[#FCFCFD] pr-10 pl-[38px] text-[14.5px] text-[#0E1526] placeholder:text-[#A6AEBF] outline-none focus:border-[#2F6BFF] focus:ring-4 focus:ring-[#2F6BFF]/12"
                  />
                  {isSearching && (
                    <Loader2 className="absolute top-1/2 right-3.5 h-4 w-4 -translate-y-1/2 animate-spin text-[#9AA2B4]" />
                  )}
                  {!isSearching && areaQuery && (
                    <button
                      type="button"
                      onClick={() => onAreaQueryChange('')}
                      aria-label="Clear search"
                      className="absolute top-1/2 right-2.5 grid h-6 w-6 -translate-y-1/2 place-items-center rounded-full bg-[#EEF0F5] text-[#6B7488]"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>

                {areas.length > 0 && (
                  <div className="mb-3.5 flex flex-wrap gap-[7px]">
                    {areas.map((area) => (
                      <button
                        key={area.id}
                        type="button"
                        onClick={() => removeArea(area.id)}
                        aria-label={`Remove ${area.label}`}
                        className="flex items-center gap-[7px] rounded-full border border-[#C9D8FF] bg-[#EEF3FF] px-[11px] py-[7px] text-[13px] font-semibold text-[#1E4FD8] transition hover:bg-[#E2EAFF]"
                      >
                        {area.label}
                        <X className="h-3 w-3 opacity-60" />
                      </button>
                    ))}
                  </div>
                )}

                {searchError && (
                  <p className="mb-3 text-[13px] font-medium text-rose-600">
                    {searchError}
                  </p>
                )}

                {areaResults.length > 0 && (
                  <div className="mb-3 grid gap-[9px] sm:grid-cols-2">
                    {areaResults.map((result) => {
                      const id = `${result.lat.toFixed(4)},${result.lng.toFixed(4)}`;
                      const picked = areas.some((area) => area.id === id);
                      return (
                        <button
                          key={id}
                          type="button"
                          onClick={() =>
                            picked ? removeArea(id) : addArea(result)
                          }
                          className={`flex items-center gap-[11px] rounded-xl border px-[13px] py-3 text-left transition ${
                            picked
                              ? 'border-[#2F6BFF] bg-[#F5F8FF]'
                              : 'border-[#E4E8F0] bg-[#FCFCFD] hover:border-[#B9C3D8]'
                          }`}
                        >
                          <span
                            className={`grid h-[19px] w-[19px] flex-none place-items-center rounded-md border text-[11px] font-bold text-white ${
                              picked
                                ? 'border-[#2F6BFF] bg-[#2F6BFF]'
                                : 'border-[#DDE1EA] bg-white'
                            }`}
                          >
                            {picked ? '✓' : ''}
                          </span>
                          <span className="min-w-0">
                            <span className="block truncate text-sm font-bold text-[#0E1526]">
                              {result.label}
                            </span>
                            <span className="mt-px block text-xs text-[#6B7488]">
                              {result.kind}
                            </span>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}

                {!isSearching &&
                  !searchError &&
                  areaQuery.trim().length >= MIN_QUERY_LENGTH &&
                  areaResults.length === 0 && (
                    <div className={`${CARD} mb-3 bg-[#FCFCFD] p-[18px] text-[13.5px] text-[#6B7488]`}>
                      No places matched “{areaQuery.trim()}”. Try the nearest
                      town or a ZIP code.
                    </div>
                  )}

                <div className="flex items-center justify-between gap-3">
                  <div className="text-[13px] font-semibold text-[#5C6579]">
                    {areas.length === 1
                      ? '1 area selected'
                      : `${areas.length} areas selected`}
                  </div>
                  {areas.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setAreas([])}
                      className="text-[13px] font-bold text-[#2F6BFF] hover:underline"
                    >
                      Clear all
                    </button>
                  )}
                </div>

                <div className={`${CARD} mt-3 bg-[#FCFCFD] px-[15px] py-3.5`}>
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <span className={LABEL}>How far out do you travel?</span>
                    <span className="text-[13px] font-bold tabular-nums text-[#0E1526]">
                      {radiusMiles} mi
                    </span>
                  </div>
                  <input
                    type="range"
                    min={MIN_RADIUS_MILES}
                    max={MAX_RADIUS_MILES}
                    step={1}
                    value={radiusMiles}
                    aria-label="Service radius around each area, in miles"
                    onChange={(event) =>
                      changeRadius(Number(event.target.value))
                    }
                    className="w-full accent-[#2F6BFF]"
                  />
                  <p className="mt-1 text-xs text-[#6B7488]">
                    Applied to every area you pick. You can set them
                    individually later in your profile.
                  </p>
                </div>

                {/* The map lives in this column, beside the picker that
                    feeds it — the panel on the right is a static product
                    shot now, and a map that far from its controls was hard
                    to connect to what had just been picked. */}
                <ServiceAreaMap
                  areas={areas}
                  className="mt-3 aspect-[16/10] w-full overflow-hidden rounded-[14px] border border-[#E4E8F0] bg-[#F2F4F8]"
                />

                <p className="m-0 mt-3.5 text-[13px] leading-[1.5] text-[#5C6579]">
                  Callers outside these areas still get answered — your
                  receptionist takes a message instead of booking a visit.
                </p>
              </div>
            )}

            {stepId === 'services' && (
              <div className="flex flex-col gap-2.5">
                {services.map((service, index) => (
                  <div
                    key={index}
                    className={`${CARD} flex flex-col gap-2.5 bg-[#FCFCFD] px-3.5 py-3.5`}
                  >
                    <div className="flex items-center gap-2.5">
                      <input
                        value={service.name}
                        onChange={(event) =>
                          patchService(index, 'name', event.target.value)
                        }
                        placeholder="Service name"
                        className="h-[42px] min-w-0 flex-1 rounded-[10px] border border-[#DDE1EA] bg-white px-3 text-[14.5px] font-semibold text-[#0E1526] outline-none focus:border-[#2F6BFF] focus:ring-4 focus:ring-[#2F6BFF]/12"
                      />
                      <button
                        type="button"
                        title="Remove"
                        aria-label={`Remove ${service.name || 'service'}`}
                        onClick={() =>
                          setServices((rows) =>
                            rows.length === 1
                              ? [{ name: '', price: '', duration: '' }]
                              : rows.filter((_, i) => i !== index),
                          )
                        }
                        className="grid h-[42px] w-[38px] flex-none place-items-center rounded-[10px] border border-[#E4E8F0] bg-white text-[#9AA2B4] transition hover:text-[#0E1526]"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-2.5">
                      <input
                        value={service.price}
                        onChange={(event) =>
                          patchService(index, 'price', event.target.value)
                        }
                        placeholder="$150–$250"
                        className="h-10 w-full min-w-0 rounded-[10px] border border-[#DDE1EA] bg-white px-3 text-[13.5px] text-[#0E1526] outline-none focus:border-[#2F6BFF] focus:ring-4 focus:ring-[#2F6BFF]/12"
                      />
                      <input
                        value={service.duration}
                        onChange={(event) =>
                          patchService(index, 'duration', event.target.value)
                        }
                        placeholder="1–2 hrs"
                        className="h-10 w-full min-w-0 rounded-[10px] border border-[#DDE1EA] bg-white px-3 text-[13.5px] text-[#0E1526] outline-none focus:border-[#2F6BFF] focus:ring-4 focus:ring-[#2F6BFF]/12"
                      />
                    </div>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() =>
                    setServices((rows) => [
                      ...rows,
                      { name: '', price: '', duration: '' },
                    ])
                  }
                  className="mt-1 h-[50px] rounded-[13px] border border-dashed border-[#C6CDDB] bg-white text-sm font-bold text-[#2F6BFF] transition hover:border-[#2F6BFF] hover:bg-[#F8FAFF]"
                >
                  Add another service +
                </button>
              </div>
            )}

            {stepId === 'hours' && (
              <>
                <div className={`${CARD} overflow-hidden`}>
                  {hours.map((row, index) => (
                    <div
                      key={row.label}
                      className={`flex flex-col gap-2.5 bg-[#FCFCFD] px-3.5 py-3 ${
                        index === hours.length - 1
                          ? ''
                          : 'border-b border-[#E4E8F0]'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2.5">
                        <div className="text-sm font-bold text-[#0E1526]">
                          {row.label}
                        </div>
                        <button
                          type="button"
                          onClick={() => patchHour(index, 'open', !row.open)}
                          className={`flex-none rounded-full border px-[13px] py-1.5 text-[12.5px] font-semibold transition ${
                            row.open
                              ? 'border-[#DDE1EA] bg-white text-[#5C6579]'
                              : 'border-[#2F6BFF] bg-[#2F6BFF] text-white'
                          }`}
                        >
                          {row.open ? 'Mark closed' : 'Set hours'}
                        </button>
                      </div>
                      {row.open ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="time"
                            aria-label={`${row.label} opening time`}
                            value={row.from}
                            onChange={(event) =>
                              patchHour(index, 'from', event.target.value)
                            }
                            className="h-10 min-w-[118px] flex-1 rounded-[10px] border border-[#DDE1EA] bg-white px-2.5 text-[13.5px] text-[#0E1526] outline-none focus:border-[#2F6BFF]"
                          />
                          <span className="text-[13px] text-[#9AA2B4]">–</span>
                          <input
                            type="time"
                            aria-label={`${row.label} closing time`}
                            value={row.to}
                            onChange={(event) =>
                              patchHour(index, 'to', event.target.value)
                            }
                            className="h-10 min-w-[118px] flex-1 rounded-[10px] border border-[#DDE1EA] bg-white px-2.5 text-[13.5px] text-[#0E1526] outline-none focus:border-[#2F6BFF]"
                          />
                        </div>
                      ) : (
                        <div className="text-[13.5px] font-medium text-[#9AA2B4]">
                          Closed — calls still answered by your AI receptionist.
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex items-center gap-2.5 rounded-xl border border-[#E4E8F0] bg-[#F8FAFF] px-[15px] py-3.5">
                  <div className="h-2 w-2 flex-none rounded-full bg-[#14B87A]" />
                  <div className="text-[13px] text-[#26304A]">
                    Outside these hours your AI receptionist answers every call,
                    24/7.
                  </div>
                </div>
              </>
            )}

            {stepId === 'ready' && (
              <div className={`${CARD} mb-2 overflow-hidden`}>
                {summary.map((row, index) => (
                  <div
                    key={row.label}
                    className={`flex gap-4 bg-[#FCFCFD] px-[18px] py-[15px] ${
                      index === summary.length - 1
                        ? ''
                        : 'border-b border-[#E4E8F0]'
                    }`}
                  >
                    <div className="w-[92px] flex-none text-[13px] font-semibold text-[#8A93A6]">
                      {row.label}
                    </div>
                    <div className="min-w-0 flex-1 text-sm font-semibold text-[#0E1526]">
                      {row.value}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="mt-8 w-full max-w-[460px]">
          {shownError && (
            <div className="mb-3.5 flex items-start gap-2 rounded-xl border border-amber-400/50 bg-amber-50 px-3.5 py-3 text-[13px] text-amber-900">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{shownError}</span>
            </div>
          )}
          <div className="flex items-center gap-3">
            {step > 0 && (
              <button
                type="button"
                onClick={back}
                disabled={isSubmitting}
                className="h-[52px] rounded-xl border border-[#DDE1EA] bg-white px-5 text-[14.5px] font-semibold text-[#26304A] transition hover:bg-[#F7F8FA] disabled:opacity-60"
              >
                Back
              </button>
            )}
            <button
              type="button"
              onClick={next}
              disabled={isSubmitting}
              className="flex h-[52px] flex-1 items-center justify-center gap-2 rounded-xl bg-[#0E1526] text-[15px] font-bold text-white transition hover:bg-[#2F6BFF] disabled:opacity-70"
            >
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {stepId === 'ready' ? 'Create account & set up my AI' : 'Continue'}
            </button>
          </div>
          <div className="mt-[18px] text-center text-[13.5px] text-[#6B7488]">
            Already have an account?{' '}
            <Link
              href="/login"
              className="font-semibold text-[#2F6BFF] hover:underline"
            >
              Sign in
            </Link>
          </div>
        </div>
      </div>

      {/* ---------------------------------------------------------- *
       * Right: what they are signing up to get
       * ---------------------------------------------------------- */}
      <div className="hidden max-h-screen min-w-0 items-center justify-center overflow-y-auto bg-[#F2F4F8] px-6 py-10 lg:flex xl:px-14">
        <figure className="m-0 w-full max-w-[620px]">
          {/* `dashboard-preview.png` is the supplied screenshot trimmed of
              its transparent margin (a fifth of the width); the artwork's
              own shadow and transparency are kept, so the panel shows
              through behind it. */}
          <Image
            src="/assets/images/dashboard-preview.png"
            alt="The Ringgy AI dashboard, showing answered calls, today's schedule and recent calls"
            width={1491}
            height={849}
            priority
            className="mx-auto h-auto w-full object-contain"
          />
          <figcaption className="mt-4 text-center text-sm text-[#5C6579]">
            Every call your receptionist answers — and every job it books —
            lands here.
          </figcaption>
        </figure>
      </div>
    </div>
  );
};
