'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import type { Appointment, Call, TenantStatus } from '@/types/schema';
import { useAuth } from '@/components/auth/AuthProvider';
import { useDashboard } from '@/lib/useDashboard';

import { DashboardShell } from '@/components/dashboard/DashboardShell';
import { StatusBanner } from '@/components/dashboard/StatusBanner';
import { OverviewView } from '@/components/dashboard/OverviewView';
import { CallsView } from '@/components/dashboard/CallsView';
import { AppointmentsView } from '@/components/dashboard/AppointmentsView';
import { CompanyProfileView } from '@/components/dashboard/CompanyProfileView';
import { PhoneView } from '@/components/dashboard/PhoneView';
import { BillingView } from '@/components/dashboard/BillingView';
import { AccountView } from '@/components/dashboard/AccountView';
import { AppointmentModal } from '@/components/appointments/AppointmentModal';
import { TestCallModal } from '@/components/assistant/TestCallModal';
import { AdminDashboard } from '@/components/admin/AdminDashboard';

export default function DashboardPage() {
  const router = useRouter();
  const { session, isLoading: isSessionLoading, logout } = useAuth();

  const {
    tenant,
    calls,
    appointments,
    overview,
    isLoading,
    error,
    saveTenant,
    resyncAssistant,
    setPaused,
    saveAppointment,
    cancelAppointment,
    resolveCall,
    verifyForwarding,
  } = useDashboard(Boolean(session));

  // Unauthenticated visitors belong on the sign-in screen.
  useEffect(() => {
    if (!isSessionLoading && !session) {
      router.replace('/login');
    }
  }, [isSessionLoading, session, router]);

  const [activeTab, setActiveTab] = useState('overview');
  const [isAdminView, setIsAdminView] = useState(false);
  const [selectedCall, setSelectedCall] = useState<Call | null>(null);
  const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<
    Partial<Appointment>
  >({});
  const [isTestCallOpen, setIsTestCallOpen] = useState(false);

  // Server-computed when available, otherwise derived from the calls already
  // loaded.
  const needsReviewCount =
    overview?.needsReviewCount ??
    calls.filter((call) => call.outcome === 'needs_review' && !call.isResolved)
      .length;

  const status: TenantStatus = tenant?.status ?? 'setup_incomplete';

  const openAppointmentFromCall = (call: Call) => {
    const captured = call.extractedAppointment;

    setEditingAppointment({
      customerName: captured?.customerName || call.callerName,
      customerPhone: captured?.customerPhone || call.callerPhone,
      service: captured?.service || 'General service',
      dateTime: captured?.requestedTimeIso ?? '',
      address: captured?.address ?? '',
      notes: captured?.notes ?? '',
      priceEstimate: captured?.priceEstimate,
      status: 'confirmed',
      isAiCreated: true,
      callId: call.callControlId,
    });
    setIsAppointmentModalOpen(true);
  };

  const openAppointment = (data?: Partial<Appointment>) => {
    // An existing appointment displays its time as friendly text; the form
    // needs the absolute value to prefill its datetime input.
    setEditingAppointment(
      data ? { ...data, dateTime: data.scheduledAtIso ?? data.dateTime ?? '' } : {},
    );
    setIsAppointmentModalOpen(true);
  };

  if (isSessionLoading || (session && isLoading)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F2F4F8]">
        <div className="flex items-center gap-3 text-sm font-semibold text-[#6B7488]">
          <Loader2 className="h-5 w-5 animate-spin text-[#2F6BFF]" />
          <span>Loading your dashboard…</span>
        </div>
      </div>
    );
  }

  // The redirect above is in flight.
  if (!session || !tenant) return null;

  return (
    <DashboardShell
      tenant={tenant}
      status={status}
      activeTab={activeTab}
      onSelectTab={(tab) => {
        setActiveTab(tab);
        if (tab !== 'admin') setIsAdminView(false);
      }}
      needsReviewCount={needsReviewCount}
      isAdminView={isAdminView}
      onToggleAdminView={(admin) => {
        setIsAdminView(admin);
        setActiveTab(admin ? 'admin' : 'overview');
      }}
      onStartTestCall={() => setIsTestCallOpen(true)}
      onLogout={() => {
        // The cookie is cleared server-side; the redirect is what stops the
        // dashboard refetching with a session that no longer exists.
        void logout().then(() => router.replace('/login'));
      }}
      error={error}
    >
      {activeTab === 'admin' ? (
        <AdminDashboard
          onSelectTenantToInspect={() => {
            setIsAdminView(false);
            setActiveTab('overview');
          }}
        />
      ) : (
        <>
          {activeTab === 'overview' && (
            <>
              <StatusBanner
                tenant={tenant}
                status={status}
                onStatusChange={(next) => void setPaused(next === 'paused')}
                onNavigateToTab={setActiveTab}
              />
              <OverviewView
                overview={overview}
                calls={calls}
                appointments={appointments}
                needsReviewCount={needsReviewCount}
                onSelectTab={setActiveTab}
                onSelectCall={(call) => {
                  setSelectedCall(call);
                  setActiveTab('calls');
                }}
              />
            </>
          )}

          {activeTab === 'calls' && (
            <CallsView
              calls={calls}
              selectedCall={selectedCall}
              onSelectCall={setSelectedCall}
              onCreateAppointmentFromCall={openAppointmentFromCall}
              onMarkResolved={(callId) => {
                void resolveCall(callId);
                setSelectedCall((current) =>
                  current && current.id === callId
                    ? { ...current, isResolved: true }
                    : current,
                );
              }}
            />
          )}

          {activeTab === 'appointments' && (
            <AppointmentsView
              appointments={appointments}
              onOpenModal={openAppointment}
              onCancelAppointment={(id) => void cancelAppointment(id)}
            />
          )}

          {activeTab === 'assistant' && (
            <CompanyProfileView
              tenant={tenant}
              onSaveTenant={(updated) => void saveTenant(updated)}
              onResyncAssistant={() => void resyncAssistant()}
            />
          )}

          {activeTab === 'phone' && (
            <PhoneView
              tenant={tenant}
              onVerifyForwarding={() => void verifyForwarding()}
            />
          )}

          {activeTab === 'billing' && <BillingView overview={overview} />}

          {activeTab === 'account' && (
            <AccountView
              tenant={tenant}
              onUpdateTenant={(updated) => void saveTenant(updated)}
            />
          )}
        </>
      )}

      <AppointmentModal
        isOpen={isAppointmentModalOpen}
        onClose={() => setIsAppointmentModalOpen(false)}
        onSave={(data) => void saveAppointment(data)}
        initialData={editingAppointment}
      />

      {/* Real WebRTC conversation with this tenant's own assistant.
          Unmounted when closed, which is what hangs up the call. */}
      {isTestCallOpen && (
        <TestCallModal
          tenant={tenant}
          onClose={() => setIsTestCallOpen(false)}
          onGoToSetup={() => {
            setIsTestCallOpen(false);
            setActiveTab('phone');
          }}
        />
      )}
    </DashboardShell>
  );
}
