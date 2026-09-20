/**
 * The Company Profile hours selector edits hours per day; the API stores
 * either that structured shape or the legacy `{ display: "Mon-Fri 8-5" }`
 * line written by earlier versions of signup. This module is the only place
 * in the frontend that knows about either.
 */
import type { ApiDayHours, ApiDayKey, ApiHours } from './api-types';

export type DayKey = ApiDayKey;
export type DayHours = ApiDayHours;
export type BusinessHours = Record<DayKey, DayHours>;

export const DAY_KEYS: DayKey[] = [
  'mon',
  'tue',
  'wed',
  'thu',
  'fri',
  'sat',
  'sun',
];

export const DAY_LABELS: Record<DayKey, string> = {
  mon: 'Monday',
  tue: 'Tuesday',
  wed: 'Wednesday',
  thu: 'Thursday',
  fri: 'Friday',
  sat: 'Saturday',
  sun: 'Sunday',
};

export const DAY_SHORT: Record<DayKey, string> = {
  mon: 'Mon',
  tue: 'Tue',
  wed: 'Wed',
  thu: 'Thu',
  fri: 'Fri',
  sat: 'Sat',
  sun: 'Sun',
};

/** Weekdays open 8–5, weekend closed — the shape most of these businesses keep. */
export function defaultHours(): BusinessHours {
  return {
    mon: { closed: false, open: '08:00', close: '17:00' },
    tue: { closed: false, open: '08:00', close: '17:00' },
    wed: { closed: false, open: '08:00', close: '17:00' },
    thu: { closed: false, open: '08:00', close: '17:00' },
    fri: { closed: false, open: '08:00', close: '17:00' },
    sat: { closed: true, open: '09:00', close: '13:00' },
    sun: { closed: true, open: '09:00', close: '13:00' },
  };
}

const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;

export function isTime(value: unknown): value is string {
  return typeof value === 'string' && TIME_RE.test(value);
}

/** "8:00 AM" from "08:00". */
export function formatTime(value: string): string {
  const match = TIME_RE.exec(value);
  if (!match) return value;

  const hour24 = Number(match[1]);
  const period = hour24 < 12 ? 'AM' : 'PM';
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
  return `${hour12}:${match[2]} ${period}`;
}

/** Half-hour steps, plus 11:59 PM so "open until midnight" is expressible. */
export const TIME_OPTIONS: { value: string; label: string }[] = (() => {
  const options: { value: string; label: string }[] = [];
  for (let minutes = 0; minutes < 24 * 60; minutes += 30) {
    const value = `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(
      minutes % 60,
    ).padStart(2, '0')}`;
    options.push({ value, label: formatTime(value) });
  }
  options.push({ value: '23:59', label: formatTime('23:59') });
  return options;
})();

/* ------------------------------------------------------------------ *
 * Reading what is stored
 * ------------------------------------------------------------------ */

export interface LoadedHours {
  days: BusinessHours;
  /**
   * `structured` — read back exactly as saved.
   * `parsed` — reconstructed from a legacy free-text line, so it is a guess.
   * `default` — nothing usable was stored.
   *
   * The editor tells the owner which of these happened rather than silently
   * presenting a guess as their saved hours.
   */
  source: 'structured' | 'parsed' | 'default';
  /** The legacy line, kept so the UI can show what the guess came from. */
  originalText?: string;
}

export function loadHours(hours: ApiHours | null | undefined): LoadedHours {
  if (hours) {
    const structured = readStructured(hours);
    if (structured) return { days: structured, source: 'structured' };

    const text = legacyText(hours);
    if (text) {
      const parsed = parseDisplayLine(text);
      if (parsed) {
        return { days: parsed, source: 'parsed', originalText: text };
      }
      return { days: defaultHours(), source: 'default', originalText: text };
    }
  }

  return { days: defaultHours(), source: 'default' };
}

function readStructured(hours: ApiHours): BusinessHours | null {
  const days = {} as BusinessHours;
  let found = 0;

  for (const key of DAY_KEYS) {
    const day = hours[key];
    if (day && typeof day === 'object' && 'closed' in day) {
      found += 1;
      days[key] = {
        closed: Boolean(day.closed),
        open: isTime(day.open) ? day.open : '08:00',
        close: isTime(day.close) ? day.close : '17:00',
      };
    } else {
      days[key] = { closed: true, open: '08:00', close: '17:00' };
    }
  }

  return found > 0 ? days : null;
}

function legacyText(hours: ApiHours): string | null {
  if (typeof hours.display === 'string' && hours.display.trim()) {
    return hours.display.trim();
  }

  const entries = Object.entries(hours).filter(
    (entry): entry is [string, string] => typeof entry[1] === 'string',
  );
  return entries.length
    ? entries.map(([day, range]) => `${day} ${range}`).join(', ')
    : null;
}

/* ------------------------------------------------------------------ *
 * Legacy line -> per-day rows
 * ------------------------------------------------------------------ */

const DAY_WORDS: Record<string, DayKey> = {
  mon: 'mon',
  monday: 'mon',
  tue: 'tue',
  tues: 'tue',
  tuesday: 'tue',
  wed: 'wed',
  weds: 'wed',
  wednesday: 'wed',
  thu: 'thu',
  thur: 'thu',
  thurs: 'thu',
  thursday: 'thu',
  fri: 'fri',
  friday: 'fri',
  sat: 'sat',
  saturday: 'sat',
  sun: 'sun',
  sunday: 'sun',
};

/**
 * Best-effort reading of lines like "Mon-Fri 7:00-18:00, Sat 8-2" or
 * "Monday-Friday 24 hours" — enough to open the editor already filled in.
 * Returns null when nothing at all could be recognised, so the caller can
 * say so rather than present a fabricated week as saved data.
 */
export function parseDisplayLine(text: string): BusinessHours | null {
  const days: BusinessHours = Object.fromEntries(
    DAY_KEYS.map((key) => [key, { closed: true, open: '08:00', close: '17:00' }]),
  ) as BusinessHours;

  let matched = false;

  for (const segment of splitSegments(text)) {
    const chunk = segment.trim();
    if (!chunk) continue;

    const targets = daysInSegment(chunk);
    if (targets.length === 0) continue;

    const range = timesInSegment(chunk);
    if (!range) continue;

    matched = true;
    for (const key of targets) {
      days[key] = range;
    }
  }

  return matched ? days : null;
}

/**
 * Splits on commas and semicolons, and on "and" only when both sides carry
 * their own times ("Mon-Fri 8-5 and Sat 9-1"). Splitting "Tue and Thu 9-3"
 * would strand Tuesday with no hours and silently drop it.
 */
function splitSegments(text: string): string[] {
  return text
    .split(/[,;]/)
    .flatMap((part) => {
      const halves = part.split(/\band\b/i);
      return halves.length === 2 && halves.every((half) => /\d/.test(half))
        ? halves
        : [part];
    });
}

function daysInSegment(chunk: string): DayKey[] {
  const matches = [...chunk.toLowerCase().matchAll(/[a-z]+/g)];
  const found = matches
    .map((match) => ({ key: DAY_WORDS[match[0]], at: match.index ?? 0, word: match[0] }))
    .filter((entry): entry is { key: DayKey; at: number; word: string } =>
      Boolean(entry.key),
    );

  if (found.length === 0) return [];

  // "Mon-Fri" / "Monday through Friday" means the whole span. The separator
  // has to sit *between the two day words* — testing the chunk as a whole
  // would read the dash in "Tue and Thu 9-3" as a range and swallow
  // Wednesday.
  const between =
    found.length === 2
      ? chunk.slice(found[0].at + found[0].word.length, found[1].at)
      : null;
  const isRange =
    between !== null && /^\s*(?:-|–|to|through|thru)\s*$/i.test(between);

  if (!isRange) return Array.from(new Set(found.map((entry) => entry.key)));

  const start = DAY_KEYS.indexOf(found[0].key);
  const end = DAY_KEYS.indexOf(found[1].key);

  const span: DayKey[] = [];
  for (let i = start; ; i = (i + 1) % DAY_KEYS.length) {
    span.push(DAY_KEYS[i]);
    if (i === end || span.length > DAY_KEYS.length) break;
  }
  return span;
}

function timesInSegment(chunk: string): DayHours | null {
  if (/closed/i.test(chunk)) {
    return { closed: true, open: '08:00', close: '17:00' };
  }
  if (/24\s*\/\s*7|24\s*hours?|all\s*day/i.test(chunk)) {
    return { closed: false, open: '00:00', close: '23:59' };
  }

  // Two clock times separated by a dash: "7:00-18:00", "8-5", "8am - 5pm".
  const match =
    /(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\s*(?:-|–|to)\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i.exec(
      chunk,
    );
  if (!match) return null;

  const open = toTime(match[1], match[2], match[3], false);
  const close = toTime(match[4], match[5], match[6], true);
  if (!open || !close) return null;

  return { closed: false, open, close };
}

function toTime(
  hourText: string,
  minuteText: string | undefined,
  meridiem: string | undefined,
  isClosing: boolean,
): string | null {
  let hour = Number(hourText);
  if (!Number.isInteger(hour) || hour < 0 || hour > 24) return null;

  if (meridiem) {
    const pm = meridiem.toLowerCase() === 'pm';
    if (hour === 12) hour = pm ? 12 : 0;
    else if (pm) hour += 12;
  } else if (isClosing && hour < 8) {
    // "8-5" means 8am to 5pm for a home service business, not 8am to 5am.
    hour += 12;
  }

  if (hour > 23) return '23:59';

  const minute = minuteText ?? '00';
  return `${String(hour).padStart(2, '0')}:${minute}`;
}

/* ------------------------------------------------------------------ *
 * Writing / display
 * ------------------------------------------------------------------ */

export function toApiHours(days: BusinessHours): ApiHours {
  return Object.fromEntries(
    DAY_KEYS.map((key) => [key, days[key]]),
  ) as ApiHours;
}

/** "Mon-Fri 8:00 AM - 5:00 PM · Sat 9:00 AM - 1:00 PM · Sun Closed" */
export function summarizeHours(days: BusinessHours): string {
  const lines: string[] = [];
  let runStart = 0;

  for (let i = 0; i < DAY_KEYS.length; i += 1) {
    const current = days[DAY_KEYS[i]];
    const next = i + 1 < DAY_KEYS.length ? days[DAY_KEYS[i + 1]] : null;
    if (next && sameHours(current, next)) continue;

    const label =
      runStart === i
        ? DAY_SHORT[DAY_KEYS[runStart]]
        : `${DAY_SHORT[DAY_KEYS[runStart]]}-${DAY_SHORT[DAY_KEYS[i]]}`;

    lines.push(
      current.closed
        ? `${label} Closed`
        : `${label} ${formatTime(current.open)} - ${formatTime(current.close)}`,
    );
    runStart = i + 1;
  }

  return lines.join(' · ');
}

function sameHours(a: DayHours, b: DayHours): boolean {
  if (a.closed && b.closed) return true;
  return !a.closed && !b.closed && a.open === b.open && a.close === b.close;
}
