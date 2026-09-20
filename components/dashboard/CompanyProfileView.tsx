'use client';

/**
 * Everything the receptionist says about the business.
 *
 * It reads as a summary until "Edit profile" is pressed — the mock shows
 * these panels as plain values, and a page of always-live inputs gave no
 * hint that anything here is saved or that a save is even needed. Editing
 * swaps in the real editors (services, the map-backed area picker, the
 * hours selector) and the page then has to be saved or cancelled, so
 * half-finished changes never reach the assistant by accident.
 */

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import {
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
  X,
} from 'lucide-react';
import type { ServiceItem, TenantConfig } from '@/types/schema';
import { Combobox } from '@/components/ui/Combobox';
import { BusinessHoursEditor } from '@/components/assistant/BusinessHoursEditor';
import { ServiceAreaPicker } from '@/components/assistant/ServiceAreaPicker';
import { TRADE_GROUPS } from '@/lib/trades';
import {
  DAY_KEYS,
  DAY_LABELS,
  formatTime,
  summarizeHours,
} from '@/lib/business-hours';
import { Card, CardTitle, FIELD, LABEL, PrimaryButton, SecondaryButton } from './ui';

/** MapLibre reaches for `window` at import time. */
const ServiceAreaMap = dynamic(
  () => import('@/components/ui/ServiceAreaMap').then((m) => m.ServiceAreaMap),
  {
    ssr: false,
    loading: () => (
      <div className="grid aspect-[16/10] w-full place-items-center rounded-[12px] border border-[#E4E8F0] bg-[#F2F4F8]">
        <Loader2 className="h-5 w-5 animate-spin text-[#8A93A6]" />
      </div>
    ),
  },
);

interface CompanyProfileViewProps {
  tenant: TenantConfig;
  onSaveTenant: (updated: TenantConfig) => void;
  onResyncAssistant: () => void;
}

/** One label/value line, the shape every panel reads as when not editing. */
const Row: React.FC<{ label: string; children: React.ReactNode }> = ({
  label,
  children,
}) => (
  <div className="flex gap-4 border-b border-[#E4E8F0] py-3 last:border-b-0">
    <div className="w-[120px] flex-none text-[12.5px] font-semibold text-[#8A93A6]">
      {label}
    </div>
    <div className="min-w-0 flex-1 text-sm font-semibold text-[#0E1526]">
      {children}
    </div>
  </div>
);

const NotSet: React.FC = () => (
  <span className="font-medium text-[#9AA2B4]">Not set</span>
);

export const CompanyProfileView: React.FC<CompanyProfileViewProps> = ({
  tenant,
  onSaveTenant,
  onResyncAssistant,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState<TenantConfig>(tenant);
  const [justSaved, setJustSaved] = useState(false);

  // A refetched profile replaces the form rather than being silently
  // ignored — a booking taken by phone can change the tenant under us. This
  // is React's render-phase adjustment rather than an effect, so it happens
  // before the stale values are ever painted. While editing, the draft is
  // left alone; discarding someone's half-typed profile would be worse.
  const [syncedFrom, setSyncedFrom] = useState(tenant);
  if (syncedFrom !== tenant) {
    setSyncedFrom(tenant);
    if (!isEditing) setForm(tenant);
  }

  const patch = (changes: Partial<TenantConfig>) =>
    setForm((current) => ({ ...current, ...changes }));

  const patchService = (index: number, changes: Partial<ServiceItem>) =>
    setForm((current) => ({
      ...current,
      services: current.services.map((service, i) =>
        i === index ? { ...service, ...changes } : service,
      ),
    }));

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    onSaveTenant({ ...form, businessHours: summarizeHours(form.hours) });
    setIsEditing(false);
    setJustSaved(true);
    setTimeout(() => setJustSaved(false), 3000);
  };

  const cancel = () => {
    setForm(tenant);
    setIsEditing(false);
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-[18px]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="m-0 text-[13px] text-[#6B7488]">
          {isEditing
            ? 'Changes reach your receptionist as soon as you save.'
            : 'This is what your receptionist tells callers about you.'}
        </p>

        {isEditing ? (
          <div className="flex items-center gap-2.5">
            <SecondaryButton type="button" onClick={cancel}>
              <X className="h-3.5 w-3.5" />
              Cancel
            </SecondaryButton>
            <PrimaryButton type="submit">Save changes</PrimaryButton>
          </div>
        ) : (
          <PrimaryButton type="button" onClick={() => setIsEditing(true)}>
            <Pencil className="h-4 w-4" />
            Edit profile
          </PrimaryButton>
        )}
      </div>

      {justSaved && tenant.assistantSync !== 'stale' && (
        <div className="animate-fadeIn flex items-center gap-2 rounded-[12px] border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-[13px] font-semibold text-emerald-700">
          <CheckCircle2 className="h-4 w-4" />
          Saved, and your assistant is up to date.
        </div>
      )}

      {/* Saved in our database but not live on Telnyx: callers still hear
          the previous configuration, so say exactly that. */}
      {tenant.assistantSync === 'stale' && (
        <div className="animate-fadeIn flex flex-wrap items-center gap-3 rounded-[12px] border border-amber-400/50 bg-amber-50 px-4 py-3 text-[13px] text-amber-900">
          <AlertTriangle className="h-4 w-4 flex-none" />
          <div className="min-w-0 flex-1">
            <p className="m-0 font-semibold">
              Your changes are saved, but not live on your assistant yet.
            </p>
            <p className="m-0 mt-0.5 opacity-80">
              Callers hear your previous setup until this goes through.
              {tenant.assistantSyncError
                ? ` Last error: ${tenant.assistantSyncError}`
                : ''}
            </p>
          </div>
          <SecondaryButton type="button" onClick={onResyncAssistant}>
            <RefreshCw className="h-3.5 w-3.5" />
            Retry now
          </SecondaryButton>
        </div>
      )}

      <div className="grid items-start gap-[18px] xl:grid-cols-2">
        <Card className="p-[22px]">
          <CardTitle title="Business details" className="mb-3" />

          {isEditing ? (
            <div className="flex flex-col gap-[15px] pt-2">
              <label className="flex flex-col gap-[7px]">
                <span className={LABEL}>Business name</span>
                <input
                  value={form.businessName}
                  onChange={(event) =>
                    patch({ businessName: event.target.value })
                  }
                  className={FIELD}
                />
              </label>

              <div className="flex flex-col gap-[7px]">
                <label className={LABEL} htmlFor="trade-category">
                  Trade
                </label>
                <Combobox
                  id="trade-category"
                  value={form.trade}
                  onChange={(trade) => patch({ trade })}
                  groups={TRADE_GROUPS.map((group) => ({
                    label: group.label,
                    options: group.trades,
                  }))}
                  placeholder="Select your trade"
                  customLabel={(query) => `Use "${query}"`}
                />
              </div>

              <label className="flex flex-col gap-[7px]">
                <span className={LABEL}>Owner</span>
                <input
                  value={form.ownerName}
                  onChange={(event) => patch({ ownerName: event.target.value })}
                  className={FIELD}
                />
              </label>

              <label className="flex flex-col gap-[7px]">
                <span className={LABEL}>Pricing notes &amp; disclaimers</span>
                <textarea
                  rows={3}
                  value={form.pricingNotes}
                  onChange={(event) =>
                    patch({ pricingNotes: event.target.value })
                  }
                  className={`${FIELD} h-auto py-2.5`}
                />
                <span className="text-xs text-[#8A93A6]">
                  Spoken to callers when they ask what something costs.
                </span>
              </label>
            </div>
          ) : (
            <div>
              <Row label="Business name">
                {tenant.businessName || <NotSet />}
              </Row>
              <Row label="Trade">{tenant.trade || <NotSet />}</Row>
              <Row label="Owner">{tenant.ownerName || <NotSet />}</Row>
              <Row label="Phone">{tenant.phoneNumber || <NotSet />}</Row>
              <Row label="Pricing notes">
                {tenant.pricingNotes || <NotSet />}
              </Row>
            </div>
          )}
        </Card>

        <div className="flex flex-col gap-[18px]">
          <Card className="p-[22px]">
            <CardTitle
              title="Services & pricing"
              className="mb-3.5"
              action={
                isEditing ? (
                  <SecondaryButton
                    type="button"
                    className="h-9"
                    onClick={() =>
                      patch({
                        services: [
                          ...form.services,
                          {
                            id: `svc-new-${Date.now()}`,
                            name: '',
                            price: '',
                            duration: '',
                          },
                        ],
                      })
                    }
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add service
                  </SecondaryButton>
                ) : undefined
              }
            />

            {isEditing ? (
              <div className="flex flex-col gap-2.5">
                {form.services.length === 0 && (
                  <p className="m-0 text-[13px] text-[#6B7488]">
                    No services yet. Your receptionist needs at least one to
                    quote callers.
                  </p>
                )}
                {form.services.map((service, index) => (
                  <div
                    key={service.id}
                    className="flex flex-col gap-2 rounded-[11px] border border-[#E4E8F0] px-3.5 py-3"
                  >
                    <div className="flex items-center gap-2.5">
                      <input
                        value={service.name}
                        onChange={(event) =>
                          patchService(index, { name: event.target.value })
                        }
                        placeholder="Service name"
                        aria-label="Service name"
                        className={`${FIELD} h-10 flex-1 font-semibold`}
                      />
                      <button
                        type="button"
                        onClick={() =>
                          patch({
                            services: form.services.filter(
                              (_, i) => i !== index,
                            ),
                          })
                        }
                        aria-label={`Remove ${service.name || 'service'}`}
                        className="grid h-10 w-10 flex-none place-items-center rounded-[10px] border border-[#E4E8F0] text-[#9AA2B4] transition hover:text-rose-500"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-2.5">
                      <input
                        value={service.price}
                        onChange={(event) =>
                          patchService(index, { price: event.target.value })
                        }
                        placeholder="$150–$250"
                        aria-label="Price"
                        className={`${FIELD} h-10 text-[13.5px]`}
                      />
                      <input
                        value={service.duration}
                        onChange={(event) =>
                          patchService(index, { duration: event.target.value })
                        }
                        placeholder="1–2 hrs"
                        aria-label="Duration"
                        className={`${FIELD} h-10 text-[13.5px]`}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : tenant.services.length === 0 ? (
              <p className="m-0 text-[13px] text-[#6B7488]">
                No services yet. Your receptionist needs at least one to quote
                callers.
              </p>
            ) : (
              <div className="flex flex-col gap-[9px]">
                {tenant.services.map((service) => (
                  <div
                    key={service.id}
                    className="flex items-center gap-3 rounded-[11px] border border-[#E4E8F0] px-3.5 py-3"
                  >
                    <div className="min-w-0 flex-1 truncate text-[13.5px] font-bold">
                      {service.name || 'Unnamed service'}
                    </div>
                    <div className="flex-none text-[12.5px] text-[#6B7488]">
                      {[service.price, service.duration]
                        .filter(Boolean)
                        .join(' · ') || 'No price set'}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card className="p-[22px]">
            <CardTitle title="Service area" className="mb-3.5" />
            {isEditing ? (
              <ServiceAreaPicker
                areas={form.serviceAreas}
                onChange={(serviceAreas) => patch({ serviceAreas })}
              />
            ) : tenant.serviceAreas.length === 0 ? (
              <p className="m-0 text-[13px] text-[#6B7488]">
                No areas set, so the assistant books anywhere it is asked to.
              </p>
            ) : (
              <div className="flex flex-col gap-3.5">
                <div className="flex flex-wrap gap-[7px]">
                  {tenant.serviceAreas.map((area) => (
                    <span
                      key={area.id}
                      className="rounded-full bg-[#EEF3FF] px-3 py-[7px] text-[12.5px] font-semibold text-[#1E4FD8]"
                    >
                      {area.label} · {area.radiusMiles} mi
                    </span>
                  ))}
                </div>
                <ServiceAreaMap
                  areas={tenant.serviceAreas}
                  className="aspect-[16/10] w-full overflow-hidden rounded-[12px] border border-[#E4E8F0] bg-[#F2F4F8]"
                />
              </div>
            )}
          </Card>

          <Card className="p-[22px]">
            <CardTitle title="Business hours" className="mb-3.5" />
            {isEditing ? (
              <BusinessHoursEditor
                value={form.hours}
                onChange={(hours) => patch({ hours })}
                parsedFrom={form.hoursParsedFrom}
              />
            ) : (
              <div className="flex flex-col gap-[11px]">
                {DAY_KEYS.map((key) => {
                  const day = tenant.hours[key];
                  return (
                    <div
                      key={key}
                      className="flex justify-between gap-3 text-[13.5px]"
                    >
                      <span className="font-bold">{DAY_LABELS[key]}</span>
                      <span
                        className={day.closed ? 'text-[#9AA2B4]' : 'text-[#26304A]'}
                      >
                        {day.closed
                          ? 'Closed'
                          : `${formatTime(day.open)} – ${formatTime(day.close)}`}
                      </span>
                    </div>
                  );
                })}
                <p className="m-0 mt-1 text-xs text-[#8A93A6]">
                  Outside these hours your receptionist still answers every
                  call.
                </p>
              </div>
            )}
          </Card>

          {isEditing && (
            <div className="flex items-center gap-2.5 self-end">
              <SecondaryButton type="button" onClick={cancel}>
                Cancel
              </SecondaryButton>
              <PrimaryButton type="submit">Save changes</PrimaryButton>
            </div>
          )}
        </div>
      </div>
    </form>
  );
};
