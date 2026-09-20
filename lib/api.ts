import type {
  ApiAppointment,
  ApiCall,
  ApiGeoResult,
  ApiOverview,
  ApiProfile,
  ApiServiceItem,
  ApiSession,
} from './api-types';

const API_BASE = (
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'
).replace(/\/+$/, '');

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * The session lives in an httpOnly cookie, so every request must send
 * credentials — and the backend's CORS config names this origin explicitly
 * because browsers reject a wildcard when credentials are included.
 */
async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    credentials: 'include',
    headers: {
      ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
      ...init?.headers,
    },
  });

  if (!response.ok) {
    throw new ApiError(response.status, await readError(response));
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

async function readError(response: Response): Promise<string> {
  try {
    const body: unknown = await response.json();
    if (body && typeof body === 'object' && 'message' in body) {
      const { message } = body as { message: unknown };
      // Nest's ValidationPipe returns an array of messages.
      if (Array.isArray(message)) return message.join(', ');
      if (typeof message === 'string') return message;
    }
  } catch {
    // Fall through to the generic message below.
  }

  return `Request failed with status ${response.status}`;
}

export interface RegisterPayload {
  email: string;
  password: string;
  businessName: string;
  ownerName?: string;
  trade?: string;
  services: ApiServiceItem[];
  hours: Record<string, string>;
  serviceArea?: string;
  pricingNotes?: string;
  businessPhoneE164?: string;
  carrier?: string;
}

export const api = {
  register: (payload: RegisterPayload) =>
    request<{ ok: true }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  login: (email: string, password: string) =>
    request<{ ok: true }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  logout: () => request<{ ok: true }>('/auth/logout', { method: 'POST' }),

  session: () => request<ApiSession>('/auth/me'),

  profile: () => request<ApiProfile>('/me/profile'),

  updateProfile: (patch: Record<string, unknown>) =>
    request<ApiProfile>('/me/profile', {
      method: 'PATCH',
      body: JSON.stringify(patch),
    }),

  overview: () => request<ApiOverview>('/me/overview'),

  calls: () => request<ApiCall[]>('/me/calls'),

  resolveCall: (id: string) =>
    request<ApiCall>(`/me/calls/${id}/resolve`, { method: 'POST' }),

  appointments: () => request<ApiAppointment[]>('/me/appointments'),

  createAppointment: (payload: Record<string, unknown>) =>
    request<ApiAppointment>('/me/appointments', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  updateAppointment: (id: string, payload: Record<string, unknown>) =>
    request<ApiAppointment>(`/me/appointments/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),

  cancelAppointment: (id: string) =>
    request<{ ok: true }>(`/me/appointments/${id}`, { method: 'DELETE' }),

  verifyForwarding: () =>
    request<ApiProfile>('/me/phone/verify-forwarding', { method: 'POST' }),

  /**
   * Location search for the service-area picker. Proxied by the backend,
   * which owns the upstream's User-Agent requirement and rate limit.
   */
  geoSearch: (query: string, signal?: AbortSignal) =>
    request<ApiGeoResult[]>(`/me/geo/search?q=${encodeURIComponent(query)}`, {
      signal,
    }),

  resyncAssistant: () =>
    request<ApiProfile>('/me/assistant/resync', { method: 'POST' }),

  retryProvisioning: () =>
    request<ApiProfile>('/me/retry-provisioning', { method: 'POST' }),
};
