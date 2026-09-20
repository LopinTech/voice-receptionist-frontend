import type { Call } from '@/types/schema';

/**
 * How a call's outcome is worded and coloured. Shared by the overview list
 * and the calls page so one call never reads two different ways.
 */
export function outcomeLabel(call: Call): string {
  if (call.outcome === 'booked') return 'Booked';
  if (call.outcome === 'transferred') return 'Transferred';
  if (call.outcome === 'needs_review') {
    return call.isResolved ? 'Reviewed' : 'Needs review';
  }
  return 'No action';
}

export function outcomeTone(call: Call): 'green' | 'blue' | 'grey' | 'amber' {
  if (call.outcome === 'booked') return 'green';
  if (call.outcome === 'transferred') return 'blue';
  if (call.outcome === 'needs_review') return call.isResolved ? 'grey' : 'amber';
  return 'grey';
}

export const CALL_FILTERS = [
  'All',
  'Booked',
  'Needs review',
  'Transferred',
  'No action',
] as const;

export type CallFilter = (typeof CALL_FILTERS)[number];

export function matchesFilter(call: Call, filter: CallFilter): boolean {
  if (filter === 'All') return true;
  return outcomeLabel(call) === filter || (filter === 'Needs review' && call.outcome === 'needs_review');
}
