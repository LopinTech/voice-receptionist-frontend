'use client';

import { useCallback, useEffect, useState } from 'react';
import { api } from './api';
import type { ApiOverview } from './api-types';
import {
  appointmentToApi,
  tenantConfigToApi,
  toAppointment,
  toCall,
  toTenantConfig,
} from './mappers';
import type { Appointment, Call, TenantConfig } from '@/types/schema';

interface DashboardState {
  tenant: TenantConfig | null;
  calls: Call[];
  appointments: Appointment[];
  overview: ApiOverview | null;
  isLoading: boolean;
  error: string | null;
}

const EMPTY: DashboardState = {
  tenant: null,
  calls: [],
  appointments: [],
  overview: null,
  isLoading: true,
  error: null,
};

/**
 * Single owner of the dashboard's server data. Components keep consuming the
 * same `types/schema` shapes they were built against — everything is mapped
 * on the way in and out, so no view had to be rewritten to talk to the API.
 *
 * Mutations refetch rather than patching local state: a booking can also
 * arrive from a live phone call, so the server is the only reliable source
 * of what currently exists.
 */
export function useDashboard(enabled: boolean) {
  const [state, setState] = useState<DashboardState>(EMPTY);

  const load = useCallback(async () => {
    try {
      const [profile, calls, appointments, overview] = await Promise.all([
        api.profile(),
        api.calls(),
        api.appointments(),
        api.overview(),
      ]);

      setState({
        tenant: toTenantConfig(profile),
        calls: calls.map(toCall),
        appointments: appointments.map(toAppointment),
        overview,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to load data',
      }));
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;
    void load();
  }, [enabled, load]);

  const saveTenant = useCallback(
    async (updated: TenantConfig) => {
      await api.updateProfile(tenantConfigToApi(updated));
      await load();
    },
    [load],
  );

  /**
   * Re-pushes the saved profile to Telnyx after a failed sync — the retry
   * behind the profile page's "not live yet" banner.
   */
  const resyncAssistant = useCallback(async () => {
    await api.resyncAssistant();
    await load();
  }, [load]);

  const setPaused = useCallback(
    async (paused: boolean) => {
      await api.updateProfile({ status: paused ? 'SUSPENDED' : 'ACTIVE' });
      await load();
    },
    [load],
  );

  const saveAppointment = useCallback(
    async (appointment: Partial<Appointment>) => {
      const payload = appointmentToApi(appointment);

      if (appointment.id) {
        await api.updateAppointment(appointment.id, payload);
      } else {
        await api.createAppointment(payload);
      }

      // A call that produced a flagged booking is dealt with once a human
      // has saved the appointment, so clear it from needs-attention too.
      if (!appointment.id && appointment.callId) {
        const call = state.calls.find(
          (c) => c.callControlId === appointment.callId,
        );
        if (call) {
          await api.resolveCall(call.id).catch(() => undefined);
        }
      }

      await load();
    },
    [load, state.calls],
  );

  const cancelAppointment = useCallback(
    async (id: string) => {
      await api.cancelAppointment(id);
      await load();
    },
    [load],
  );

  const resolveCall = useCallback(
    async (id: string) => {
      await api.resolveCall(id);
      await load();
    },
    [load],
  );

  const verifyForwarding = useCallback(async () => {
    await api.verifyForwarding();
    await load();
  }, [load]);

  const retryProvisioning = useCallback(async () => {
    await api.retryProvisioning();
    await load();
  }, [load]);

  return {
    ...state,
    reload: load,
    saveTenant,
    resyncAssistant,
    setPaused,
    saveAppointment,
    cancelAppointment,
    resolveCall,
    verifyForwarding,
    retryProvisioning,
  };
}
