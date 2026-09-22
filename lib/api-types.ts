/**
 * Shapes returned by the NestJS backend. Kept separate from
 * `types/schema.ts` (the shapes the UI components consume) because the two
 * were designed independently — `lib/mappers.ts` is the only place that
 * translates between them.
 */

export type ApiTenantStatus = 'ONBOARDING' | 'ACTIVE' | 'SUSPENDED';
export type ApiProvisioningStatus = 'PENDING' | 'PROVISIONED' | 'FAILED';
export type ApiForwardingStatus =
  | 'NOT_STARTED'
  | 'PENDING_CUSTOMER_ACTION'
  | 'VERIFIED'
  | 'FAILED';
export type ApiAssistantSyncStatus = 'NEVER_SYNCED' | 'SYNCED' | 'STALE';
export type ApiAppointmentStatus = 'BOOKED' | 'CANCELLED' | 'NEEDS_REVIEW';
export type ApiCallOutcome =
  | 'APPOINTMENT_CREATED'
  | 'NO_ACTION'
  | 'TRANSFERRED'
  | 'NEEDS_REVIEW';

export interface ApiServiceItem {
  name: string;
  price?: string;
  duration?: string;
}

export type ApiDayKey = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';

export interface ApiDayHours {
  closed: boolean;
  /** 24-hour "HH:MM". Meaningless when `closed`. */
  open: string;
  close: string;
}

/**
 * Two shapes live in this column: the structured per-day map the Company
 * Profile hours selector and the signup wizard write, and the legacy
 * `{ display: "..." }` line older signups stored. `lib/business-hours.ts`
 * reads both.
 */
export type ApiHours = Partial<Record<ApiDayKey, ApiDayHours>> & {
  display?: string;
};

/** One picked service area with its own radius; drawn on the profile map. */
export interface ApiServiceArea {
  id: string;
  label: string;
  lat: number;
  lng: number;
  radiusMiles: number;
}

/** One voice offered by the picker; served by GET /voices. */
export interface ApiVoice {
  /** Telnyx voice id, e.g. "Telnyx.Ultra.<uuid>". */
  id: string;
  name: string;
  description: string;
  gender: 'Female' | 'Male';
  language: string;
}

export interface ApiVoiceCatalogue {
  languages: { code: string; label: string }[];
  voices: ApiVoice[];
}

/** A location-search hit from GET /me/geo/search. */
export interface ApiGeoResult {
  label: string;
  lat: number;
  lng: number;
  kind: string;
}

export interface ApiSession {
  id: string;
  email: string;
  name: string | null;
  tenantId: string;
  tenant: { name: string; status: ApiTenantStatus };
}

export interface ApiTelnyxResource {
  phoneE164: string | null;
  provisioningStatus: ApiProvisioningStatus;
  provisioningError: string | null;
  forwardingStatus: ApiForwardingStatus;
  telnyxAssistantId: string | null;
  /** Whether the live Telnyx assistant reflects the saved profile. */
  assistantSyncStatus: ApiAssistantSyncStatus;
  assistantSyncedAt: string | null;
  assistantSyncError: string | null;
}

export interface ApiProfile {
  id: string;
  name: string;
  ownerEmail: string;
  ownerName: string | null;
  trade: string | null;
  services: ApiServiceItem[];
  hours: ApiHours;
  serviceAreas: ApiServiceArea[] | null;
  /** Summary derived from `serviceAreas` on save; never sent by the client. */
  serviceArea: string | null;
  pricingNotes: string | null;
  status: ApiTenantStatus;
  businessPhoneE164: string | null;
  carrier: string | null;
  customGreeting: string | null;
  emergencyFallbackNumber: string | null;
  /** Telnyx voice id and its language; null for tenants from before the voice step. */
  voice: string | null;
  language: string | null;
  smsAlertsEnabled: boolean;
  emailDigestEnabled: boolean;
  telnyxResource: ApiTelnyxResource | null;
}

export interface ApiAppointment {
  id: string;
  tenantId: string;
  customerName: string | null;
  customerPhone: string | null;
  requestedService: string | null;
  scheduledAt: string | null;
  notes: string | null;
  address: string | null;
  durationMinutes: number | null;
  priceEstimate: string | null;
  callControlId: string | null;
  status: ApiAppointmentStatus;
  createdAt: string;
  updatedAt: string;
}

/** One line of a call transcript, as stored by the conversation sync. */
export interface ApiTranscriptLine {
  role: 'assistant' | 'caller';
  text: string;
  at: string | null;
}

export interface ApiCall {
  id: string;
  callControlId: string;
  fromE164: string | null;
  toE164: string | null;
  startedAt: string | null;
  answeredAt: string | null;
  endedAt: string | null;
  durationSeconds: number | null;
  finalCallStatus: string | null;
  costCents: number | null;
  outcome: ApiCallOutcome | null;
  resolvedAt: string | null;
  /** Telnyx's record of what was said, newest sync wins. */
  transcript: ApiTranscriptLine[] | null;
  conversationId: string | null;
  transcriptRef: string | null;
  appointment: ApiAppointment | null;
}

export interface ApiOverview {
  callsToday: number;
  callsYesterday: number;
  bookedAppointments: number;
  needsReviewCount: number;
  minutesUsedThisMonth: number;
  telnyxCostCentsThisMonth: number;
}
