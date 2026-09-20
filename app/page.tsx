'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Call, Appointment, TenantStatus } from '@/types/schema';
import { useAuth } from '@/components/auth/AuthProvider';
import { useDashboard } from '@/lib/useDashboard';

// Components
import { AppHeader } from '@/components/layout/AppHeader';
import { AppNavigation } from '@/components/layout/AppNavigation';
import { StatusBanner } from '@/components/common/StatusBanner';
import { CallsList } from '@/components/calls/CallsList';
import { CallDetailDrawer } from '@/components/calls/CallDetailDrawer';
import { AppointmentsView } from '@/components/appointments/AppointmentsView';
import { AppointmentModal } from '@/components/appointments/AppointmentModal';
import { CompanyProfile } from '@/components/assistant/CompanyProfile';
import { TestCallModal } from '@/components/assistant/TestCallModal';
import { PhoneSetup } from '@/components/phone/PhoneSetup';
import { BillingView } from '@/components/billing/BillingView';
import { AccountView } from '@/components/account/AccountView';
import { AdminDashboard } from '@/components/admin/AdminDashboard';

// Icons for Overview stat tiles
import { PhoneCall, Calendar, AlertTriangle, Clock, ArrowRight, Play, Loader2 } from 'lucide-react';

export default function SaaSMainPage() {
  const router = useRouter();
  const { session, isLoading: isSessionLoading } = useAuth();

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
  
  // Navigation State
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [isAdminView, setIsAdminView] = useState<boolean>(false);

  // Modals & Drawers
  const [selectedCall, setSelectedCall] = useState<Call | null>(null);
  const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState<boolean>(false);
  const [editingAppointment, setEditingAppointment] = useState<Partial<Appointment>>({});
  const [isTestCallOpen, setIsTestCallOpen] = useState<boolean>(false);

  // Needs review count — server-computed when available, otherwise derived
  // from the calls already loaded.
  const needsReviewCount =
    overview?.needsReviewCount ??
    calls.filter((c) => c.outcome === 'needs_review' && !c.isResolved).length;

  const status: TenantStatus = tenant?.status ?? 'setup_incomplete';

  // Handlers
  const handleStatusChange = (newStatus: TenantStatus) => {
    void setPaused(newStatus === 'paused');
  };

  const handleCreateAppointmentFromCall = (call: Call) => {
    if (call.extractedAppointment) {
      setEditingAppointment({
        customerName: call.extractedAppointment.customerName,
        customerPhone: call.extractedAppointment.customerPhone,
        service: call.extractedAppointment.service,
        dateTime: call.extractedAppointment.requestedTimeIso ?? '',
        address: call.extractedAppointment.address || '',
        notes: call.extractedAppointment.notes || '',
        priceEstimate: call.extractedAppointment.priceEstimate || '$180 est',
        status: 'confirmed',
        isAiCreated: true,
        callId: call.callControlId,
      });
    } else {
      setEditingAppointment({
        customerName: call.callerName,
        customerPhone: call.callerPhone,
        service: 'General Service',
        dateTime: '',
        status: 'confirmed',
        isAiCreated: true,
        callId: call.callControlId,
      });
    }
    setIsAppointmentModalOpen(true);
  };

  const handleSaveAppointment = (aptData: Partial<Appointment>) => {
    void saveAppointment(aptData);
  };

  const handleDeleteAppointment = (id: string) => {
    void cancelAppointment(id);
  };

  const handleMarkCallResolved = (callId: string) => {
    void resolveCall(callId);
    if (selectedCall?.id === callId) {
      setSelectedCall((prev) => (prev ? { ...prev, isResolved: true } : null));
    }
  };

  if (isSessionLoading || (session && isLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="flex items-center gap-3 text-sm font-semibold text-slate-500 dark:text-slate-400">
          <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
          <span>Loading your dashboard…</span>
        </div>
      </div>
    );
  }

  // The redirect above is in flight.
  if (!session || !tenant) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans pb-20 md:pb-10 transition-colors">

      {error && (
        <div className="bg-amber-500/10 border-b border-amber-500/40 px-4 py-2 text-xs font-semibold text-amber-800 dark:text-amber-200 text-center">
          {error}
        </div>
      )}

      {/* Persistent App Header */}
      <AppHeader
        tenant={tenant}
        status={status}
        onStatusChange={handleStatusChange}
        isAdminView={isAdminView}
        onToggleAdminView={(admin) => {
          setIsAdminView(admin);
          if (admin) setActiveTab('admin');
          else setActiveTab('overview');
        }}
        needsReviewCount={needsReviewCount}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
      />

      {/* Navigation */}
      <AppNavigation
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        needsReviewCount={needsReviewCount}
        isAdminView={isAdminView}
      />

      {/* Main Content Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        
        {/* VIEW 1: SaaS Admin Console */}
        {isAdminView || activeTab === 'admin' ? (
          <AdminDashboard
            onSelectTenantToInspect={(tenantId) => {
              setIsAdminView(false);
              setActiveTab('overview');
            }}
          />
        ) : (
          <>
            {/* VIEW 2: Overview (Home) */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                
                {/* 1. STATUS TRUST BANNER (#1 Priority UX Element) */}
                <StatusBanner
                  tenant={tenant}
                  status={status}
                  onStatusChange={handleStatusChange}
                  onNavigateToTab={setActiveTab}
                />

                {/* 2. STAT TILES (10-Second Answers) */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                  
                  {/* Calls Today */}
                  <div
                    onClick={() => setActiveTab('calls')}
                    className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2 hover:border-blue-500/40 transition-all cursor-pointer group"
                  >
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
                      <span>Calls Today</span>
                      <PhoneCall className="w-4 h-4 text-blue-500 group-hover:scale-110 transition-transform" />
                    </div>
                    <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
                      {overview?.callsToday ?? 0}
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold flex items-center gap-1">
                      <span>
                        {overview
                          ? `${overview.callsYesterday} yesterday`
                          : 'No data yet'}
                      </span>
                    </p>
                  </div>

                  {/* Appointments Booked */}
                  <div
                    onClick={() => setActiveTab('appointments')}
                    className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2 hover:border-blue-500/40 transition-all cursor-pointer group"
                  >
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
                      <span>Booked Jobs</span>
                      <Calendar className="w-4 h-4 text-emerald-500 group-hover:scale-110 transition-transform" />
                    </div>
                    <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
                      {overview?.bookedAppointments ?? appointments.length}
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Confirmed and upcoming
                    </p>
                  </div>

                  {/* Calls Needing Review Badge */}
                  <div
                    onClick={() => setActiveTab('calls')}
                    className={`rounded-3xl p-4 sm:p-5 border shadow-sm space-y-2 transition-all cursor-pointer group ${
                      needsReviewCount > 0
                        ? 'bg-amber-500/10 border-amber-500/40 hover:bg-amber-500/20'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-blue-500/40'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs font-semibold text-amber-600 dark:text-amber-400">
                      <span>Needs Review</span>
                      <AlertTriangle className="w-4 h-4 text-amber-500 animate-pulse" />
                    </div>
                    <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
                      {needsReviewCount}
                    </div>
                    <p className="text-[11px] text-amber-700 dark:text-amber-300 font-medium">
                      {needsReviewCount > 0 ? 'Requires human check' : 'All clear'}
                    </p>
                  </div>

                  {/* Minutes Used */}
                  <div
                    onClick={() => setActiveTab('billing')}
                    className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2 hover:border-blue-500/40 transition-all cursor-pointer group"
                  >
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
                      <span>Minutes Used</span>
                      <Clock className="w-4 h-4 text-indigo-500 group-hover:scale-110 transition-transform" />
                    </div>
                    <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white font-mono">
                      {overview?.minutesUsedThisMonth ?? 0}
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      minutes this month
                    </p>
                  </div>

                </div>

                {/* 3. RECENT CALLS & UPCOMING APPOINTMENTS 2-COLUMN GRID */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  
                  {/* Left (2 Cols): Recent Calls List */}
                  <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                      <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <PhoneCall className="w-4 h-4 text-blue-500" />
                        <span>Recent Calls (Last 5)</span>
                      </h3>
                      <button
                        onClick={() => setActiveTab('calls')}
                        className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <span>View All Calls</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="space-y-2.5">
                      {calls.slice(0, 5).map((call) => (
                        <div
                          key={call.id}
                          onClick={() => setSelectedCall(call)}
                          className={`p-3.5 rounded-2xl border transition-all hover:shadow-md cursor-pointer flex items-center justify-between gap-3 ${
                            call.outcome === 'needs_review' && !call.isResolved
                              ? 'bg-amber-500/10 border-amber-500/40'
                              : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-800 hover:border-blue-500/40'
                          }`}
                        >
                          <div className="space-y-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white truncate">
                                {call.callerName}
                              </span>
                              <span className="text-[11px] font-mono text-slate-500">
                                {call.callerPhone}
                              </span>
                            </div>
                            <p className="text-xs text-slate-600 dark:text-slate-300 truncate">
                              {call.summary}
                            </p>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-[11px] font-mono text-slate-400 hidden sm:inline">
                              {call.timestamp.split('at')[1] || call.timestamp}
                            </span>
                            <button className="p-2 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 transition-colors">
                              <Play className="w-3.5 h-3.5 fill-current" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Right (1 Col): Upcoming Appointments List */}
                  <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                      <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-emerald-500" />
                        <span>Upcoming Jobs</span>
                      </h3>
                      <button
                        onClick={() => setActiveTab('appointments')}
                        className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                      >
                        Calendar
                      </button>
                    </div>

                    <div className="space-y-3">
                      {appointments.slice(0, 4).map((apt) => (
                        <div key={apt.id} className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 text-xs space-y-1">
                          <div className="flex items-center justify-between font-bold text-slate-900 dark:text-white">
                            <span>{apt.customerName}</span>
                            <span className="text-[10px] text-blue-600 dark:text-blue-400 font-mono">{apt.dateTime}</span>
                          </div>
                          <div className="text-[11px] text-slate-500 truncate">{apt.service}</div>
                          <div className="text-[10px] text-slate-400 truncate">{apt.address}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              </div>
            )}

            {/* VIEW 3: Calls Tab */}
            {activeTab === 'calls' && (
              <CallsList
                calls={calls}
                onSelectCall={(call) => setSelectedCall(call)}
                onCreateAppointmentFromCall={handleCreateAppointmentFromCall}
              />
            )}

            {/* VIEW 4: Appointments Tab */}
            {activeTab === 'appointments' && (
              <AppointmentsView
                appointments={appointments}
                onOpenCreateModal={(aptData) => {
                  setEditingAppointment(aptData || {});
                  setIsAppointmentModalOpen(true);
                }}
                onDeleteAppointment={handleDeleteAppointment}
              />
            )}

            {/* VIEW 5: Company Profile Tab */}
            {activeTab === 'assistant' && (
              <CompanyProfile
                tenant={tenant}
                onSaveTenant={(updated) => void saveTenant(updated)}
                onStartTestCall={() => setIsTestCallOpen(true)}
                onResyncAssistant={() => void resyncAssistant()}
              />
            )}

            {/* VIEW 6: Phone Setup Tab */}
            {activeTab === 'phone' && (
              <PhoneSetup
                tenant={tenant}
                onVerifyForwarding={() => {
                  void verifyForwarding();
                }}
              />
            )}

            {/* VIEW 7: Billing Tab */}
            {activeTab === 'billing' && <BillingView />}

            {/* VIEW 8: Account Tab */}
            {activeTab === 'account' && (
              <AccountView
                tenant={tenant}
                onUpdateTenant={(updated) => void saveTenant(updated)}
              />
            )}
          </>
        )}

      </main>

      {/* DRAWERS & MODALS */}
      
      {/* Call Detail Drawer */}
      <CallDetailDrawer
        call={selectedCall}
        onClose={() => setSelectedCall(null)}
        onCreateAppointmentFromCall={(call) => {
          setSelectedCall(null);
          handleCreateAppointmentFromCall(call);
        }}
        onMarkResolved={handleMarkCallResolved}
      />

      {/* Appointment Create/Edit Modal */}
      <AppointmentModal
        isOpen={isAppointmentModalOpen}
        onClose={() => setIsAppointmentModalOpen(false)}
        onSave={handleSaveAppointment}
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

    </div>
  );
}
