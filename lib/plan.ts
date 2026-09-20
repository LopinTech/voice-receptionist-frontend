/**
 * The Company Profile rework plan, kept as data so the public /plan page and
 * the work itself stay in step: each todo is ticked off here as it lands.
 *
 * This is a review artifact, not product surface — it is deliberately
 * unauthenticated so it can be shared before any of the work starts.
 */

export type TodoStatus = 'todo' | 'doing' | 'done';
export type PhaseStatus = 'blocked' | 'pending' | 'active' | 'done';

export interface Todo {
  id: string;
  title: string;
  detail: string;
  status: TodoStatus;
  /** Files this todo is expected to touch. */
  touches: string[];
}

export interface Phase {
  id: string;
  title: string;
  goal: string;
  status: PhaseStatus;
  todos: Todo[];
}

export interface Decision {
  question: string;
  answer: string;
  why: string;
}

/** Settled with Robin before planning; each one changed the shape of the work. */
export const DECISIONS: Decision[] = [
  {
    question: 'Map & dropdown UI',
    answer: 'Hand-rolled on maplibre-gl',
    why: 'The app is plain Tailwind + lucide-react. mapcn needs the shadcn CLI, which would pull in Radix, cmdk and CVA and leave two visual idioms side by side. Adding only maplibre-gl keeps one design system.',
  },
  {
    question: 'Location search provider',
    answer: 'Nominatim, proxied by the backend',
    why: 'Free, no API key, and it resolves small towns and neighbourhoods. The proxy sets the required User-Agent, caches, and keeps us inside the usage policy — and hides the provider so a paid one can replace it later without touching the frontend.',
  },
  {
    question: 'How the Test Call connects',
    answer: 'In-browser WebRTC via @telnyx/ai-agent-lib',
    why: 'It needs only the assistant id, so no Telnyx API key ever reaches the browser, there is no per-call telephony charge, and it does not depend on the number purchase that Telnyx account verification is still blocking.',
  },
  {
    question: 'Telnyx sync on save',
    answer: 'Sync when relevant fields change, never block the save',
    why: 'A Telnyx outage or an unprovisioned tenant must not make the profile page unsaveable. The DB write always wins; a failed push is recorded and surfaced as "changes not yet live" with a retry.',
  },
];

export const PHASES: Phase[] = [
  {
    id: 'phase-0',
    title: 'Phase 0 — Data model groundwork',
    goal: 'Give the new UI somewhere to store what it collects, before any of it is built. Verified end to end: 41 new unit tests, plus a live PATCH against the running stack.',
    status: 'done',
    todos: [
      {
        id: '0.1',
        title: 'Add structured service areas to the schema',
        detail:
          'New `serviceAreas` Json column on Tenant holding [{ id, label, lat, lng, radiusMiles }]. The existing free-text `serviceArea` column stays and becomes a generated human-readable summary, so nothing that already reads it breaks.',
        status: 'done',
        touches: ['backend/prisma/schema.prisma', 'backend/prisma/migrations/'],
      },
      {
        id: '0.2',
        title: 'Add assistant sync state to TelnyxResource',
        detail:
          '`assistantSyncStatus` (SYNCED | STALE | never-synced), `assistantSyncedAt` and `assistantSyncError`, so the dashboard can honestly say whether the live assistant matches what was saved.',
        status: 'done',
        touches: ['backend/prisma/schema.prisma'],
      },
      {
        id: '0.3',
        title: 'Define the structured business-hours shape',
        detail:
          'Hours become { mon: { closed, open, close }, ... }. Reading stays backwards compatible with the current single `{ display: "..." }` value that existing tenants and the signup form write, so no tenant loses their hours.',
        status: 'done',
        touches: [
          'backend/src/common/business-hours.ts',
          'backend/src/common/business-hours.spec.ts',
          'backend/src/common/service-areas.ts',
          'backend/src/common/service-areas.spec.ts',
        ],
      },
      {
        id: '0.4',
        title: 'Widen the profile DTO and API types, and wire the write path',
        detail:
          'PATCH /me/profile now validates `serviceAreas` and accepts hours in either shape, and derives the `serviceArea` summary server-side — a client that tries to send its own summary has it stripped. Verified live: structured hours and two areas saved, bad coordinates and a 5000-mile radius rejected, and a legacy `{ display }` line still accepted.',
        status: 'done',
        touches: [
          'backend/src/dashboard/dto/update-profile.dto.ts',
          'backend/src/dashboard/dashboard.controller.ts',
          'frontend/lib/api-types.ts',
        ],
      },
    ],
  },
  {
    id: 'phase-1',
    title: 'Phase 1 — Rename to Company Profile, remove dropped fields',
    goal: 'The rename and the two deletions, done cleanly and in one pass.',
    status: 'done',
    todos: [
      {
        id: '1.1',
        title: 'Rename the page and its nav entry to "Company Profile"',
        detail:
          'Nav label, page heading and subheading, and the save-confirmation copy. The component file is renamed to CompanyProfile.tsx so the code matches what the page is called.',
        status: 'done',
        touches: [
          'frontend/components/layout/AppNavigation.tsx',
          'frontend/components/assistant/CompanyProfile.tsx',
          'frontend/app/page.tsx',
        ],
      },
      {
        id: '1.2',
        title: 'Remove the Greeting field and hard-code the greeting',
        detail:
          'The whole "AI Greeting & Intro Message" section goes. The backend template returns "Thanks for calling {{company_name}}. How can I help you?" for every tenant, with company_name supplied through the dynamic variables already registered on the assistant.',
        status: 'done',
        touches: [
          'frontend/components/assistant/CompanyProfile.tsx',
          'backend/src/telnyx/assistant-template.ts',
        ],
      },
      {
        id: '1.3',
        title: 'Remove Emergency Fallback Number from this page',
        detail:
          'Field removed from the profile form only. The DB column stays: it also backs the forwarding number that the Account page edits and that the header and status banner display. Dropping it would break three other screens.',
        status: 'done',
        touches: ['frontend/components/assistant/CompanyProfile.tsx'],
      },
      {
        id: '1.4',
        title: 'Stop sending the removed fields from the mapper',
        detail:
          '`customGreeting` is no longer written by this page, so the saved payload stops carrying it and existing custom greetings stop overriding the standard one.',
        status: 'done',
        touches: ['frontend/lib/mappers.ts', 'frontend/types/schema.ts'],
      },
    ],
  },
  {
    id: 'phase-2',
    title: 'Phase 2 — Trade picker and business-hours selector',
    goal: 'Replace two free-text inputs with pickers that produce clean, structured data.',
    status: 'done',
    todos: [
      {
        id: '2.1',
        title: 'Build a searchable Combobox',
        detail:
          'One reusable component in the existing slate / rounded-3xl style: type to filter, arrow keys and Enter to choose, Escape to close, click-outside to dismiss, and an explicit "Use «what you typed»" row so a business outside the list is never locked out.',
        status: 'done',
        touches: ['frontend/components/ui/Combobox.tsx'],
      },
      {
        id: '2.2',
        title: 'Add the home-service trade catalogue',
        detail:
          'About 28 predefined categories — HVAC, Plumbing, Electrical, Roofing, Appliance Repair, Pest Control, Landscaping, Garage Door, Locksmith, Cleaning and so on — grouped so the common trades surface first.',
        status: 'done',
        touches: ['frontend/lib/trades.ts'],
      },
      {
        id: '2.3',
        title: 'Wire Trade / Industry Category to the combobox',
        detail:
          'Swapping the plain text input for the picker, keeping whatever the tenant already had selected — including a custom value that is not in the catalogue.',
        status: 'done',
        touches: ['frontend/components/assistant/CompanyProfile.tsx'],
      },
      {
        id: '2.4',
        title: 'Build the business-hours selector',
        detail:
          'A row per weekday: an open/closed toggle and two time selects on 30-minute steps, plus "copy Monday to weekdays" so filling it in is not seven near-identical edits.',
        status: 'done',
        touches: ['frontend/components/assistant/BusinessHoursEditor.tsx'],
      },
      {
        id: '2.5',
        title: 'Translate hours both ways, including legacy values',
        detail:
          'Structured hours to and from the API, and a parser that turns an existing `{ display: "Mon-Fri 8-5" }` into per-day rows on first load so current tenants open the new UI already populated rather than blank.',
        status: 'done',
        touches: ['frontend/lib/mappers.ts', 'frontend/lib/business-hours.ts'],
      },
    ],
  },
  {
    id: 'phase-3',
    title: 'Phase 3 — Service areas with search, radius and map',
    goal: 'Turn one ZIP-code text box into searchable, multi-select areas with a radius each, drawn on a map.',
    status: 'done',
    todos: [
      {
        id: '3.1',
        title: 'Add the geocoding proxy endpoint',
        detail:
          'GET /me/geo/search?q= behind the existing auth guard, forwarding to Nominatim with a proper User-Agent, US-biased, returning a trimmed { label, lat, lng, kind } list. Includes an in-memory cache and request spacing so we stay inside the usage policy.',
        status: 'done',
        touches: [
          'backend/src/geo/geo.module.ts',
          'backend/src/geo/geo.service.ts',
          'backend/src/geo/geo.controller.ts',
        ],
      },
      {
        id: '3.2',
        title: 'Build the location search field',
        detail:
          'Async searchable input, debounced ~350ms, with loading and empty states. Selecting a result adds it to the list; it stays open so several areas can be added in a row.',
        status: 'done',
        touches: ['frontend/components/assistant/ServiceAreaPicker.tsx'],
      },
      {
        id: '3.3',
        title: 'Selected areas with a per-area radius',
        detail:
          'Each selected area is a card with its own radius control (1–60 miles) and a remove button. Hovering a card highlights the matching circle on the map.',
        status: 'done',
        touches: ['frontend/components/assistant/ServiceAreaPicker.tsx'],
      },
      {
        id: '3.4',
        title: 'Draw the areas on a map',
        detail:
          'maplibre-gl with free CARTO tiles — no API key — showing a marker and a true-to-scale radius circle per area, auto-fitting the view to everything selected. Light and dark tiles follow the app theme.',
        status: 'done',
        touches: ['frontend/components/ui/ServiceAreaMap.tsx', 'frontend/package.json'],
      },
      {
        id: '3.5',
        title: 'Send the picked areas from the profile form',
        detail:
          'The mapper sends `serviceAreas` on save. The backend half of this — persisting the list and regenerating the "Austin, TX (15 mi), Cedar Park, TX (10 mi)" summary the assistant reads — already landed and was verified in Phase 0, so this is only the frontend side.',
        status: 'done',
        touches: ['frontend/lib/mappers.ts'],
      },
    ],
  },
  {
    id: 'phase-4',
    title: 'Phase 4 — Keep Telnyx in sync on every save',
    goal: 'Close the gap where profile edits after onboarding never reached the live assistant.',
    status: 'done',
    todos: [
      {
        id: '4.1',
        title: 'Extract assistant config building from provisioning',
        detail:
          'The name / instructions / greeting / dynamic-variables payload is currently assembled inside provisioning. Pulling it into one builder means onboarding and profile saves cannot drift apart.',
        status: 'done',
        touches: [
          'backend/src/telnyx/assistant-template.ts',
          'backend/src/telnyx/provisioning.service.ts',
        ],
      },
      {
        id: '4.2',
        title: 'Teach the instructions the new structured data',
        detail:
          'Per-day hours rendered as real days rather than one opaque line, and service areas rendered with their radius, so the assistant can actually answer "do you come out to Round Rock?".',
        status: 'done',
        touches: ['backend/src/telnyx/assistant-template.ts'],
      },
      {
        id: '4.3',
        title: 'Add AssistantSyncService and call it on save',
        detail:
          'PATCH /me/profile writes the DB first, then pushes to Telnyx only when an assistant-relevant field actually changed. Webhook URLs and the schedule_appointment tool are left alone — provisioning owns those.',
        status: 'done',
        touches: [
          'backend/src/telnyx/assistant-sync.service.ts',
          'backend/src/dashboard/dashboard.service.ts',
        ],
      },
      {
        id: '4.4',
        title: 'Surface sync failures instead of hiding them',
        detail:
          'A failed push marks the tenant STALE with the reason. The profile page shows "your changes are saved but not yet live on your assistant" with a Retry that calls POST /me/assistant/resync.',
        status: 'done',
        touches: [
          'backend/src/dashboard/dashboard.controller.ts',
          'frontend/components/assistant/CompanyProfile.tsx',
        ],
      },
      {
        id: '4.5',
        title: 'Cover the template and sync logic with tests',
        detail:
          'Extend the existing assistant-template spec for the fixed greeting, structured hours and service areas, and add a sync spec for: relevant change pushes, irrelevant change does not, and a Telnyx failure still saves.',
        status: 'done',
        touches: [
          'backend/src/telnyx/assistant-template.spec.ts',
          'backend/src/telnyx/assistant-sync.service.spec.ts',
        ],
      },
    ],
  },
  {
    id: 'phase-5',
    title: 'Phase 5 — Test Call that actually calls',
    goal: 'Replace the scripted simulator with a real conversation against the tenant’s own assistant.',
    status: 'done',
    todos: [
      {
        id: '5.1',
        title: 'Rename the action to "Test Call"',
        detail:
          'Button label and the modal title, both on the Company Profile page.',
        status: 'done',
        touches: ['frontend/components/assistant/CompanyProfile.tsx'],
      },
      {
        id: '5.2',
        title: 'Build the real Test Call modal',
        detail:
          '@telnyx/ai-agent-lib connects the browser to the tenant’s assistant by id: microphone in, assistant audio out, with connection and speaking/listening state shown while the call runs.',
        status: 'done',
        touches: [
          'frontend/components/assistant/TestCallModal.tsx',
          'frontend/package.json',
        ],
      },
      {
        id: '5.3',
        title: 'Handle the ways a test call cannot start',
        detail:
          'Denied microphone permission, a browser without WebRTC, and a tenant whose provisioning has not produced an assistant id yet each get a specific message and, where it applies, a route to the fix — not a spinner that never resolves.',
        status: 'done',
        touches: ['frontend/components/assistant/TestCallModal.tsx'],
      },
      {
        id: '5.4',
        title: 'Show the live transcript without storing it',
        detail:
          'Turns are rendered from the library’s in-memory transcript so you can see what the assistant heard, and are discarded when the modal closes. Nothing is written to the database, as agreed.',
        status: 'done',
        touches: ['frontend/components/assistant/TestCallModal.tsx'],
      },
      {
        id: '5.5',
        title: 'Delete the mock simulator',
        detail:
          'AssistantSimulator.tsx and its wiring come out, so there is no second, fake path that looks like a test call but is not one.',
        status: 'done',
        touches: [
          'frontend/components/assistant/AssistantSimulator.tsx',
          'frontend/app/page.tsx',
        ],
      },
    ],
  },
  {
    id: 'phase-6',
    title: 'Phase 6 — Verify',
    goal: 'Prove it works rather than assert it does. 110 backend tests, clean builds and lint both sides, and a live pass against real Telnyx and real Nominatim.',
    status: 'done',
    todos: [
      {
        id: '6.1',
        title: 'Backend tests and typecheck',
        detail: '110 tests pass (41 for the hours and service-area parsers, 8 for the geocoder mapper, 9 for assistant sync), nest build clean, eslint clean.',
        status: 'done',
        touches: ['backend/'],
      },
      {
        id: '6.2',
        title: 'Frontend build and lint',
        detail: 'next build and tsc clean; eslint reports no errors in any file this work touched. No references remain to the greeting field, the profile fallback number, or the deleted simulator.',
        status: 'done',
        touches: ['frontend/'],
      },
      {
        id: '6.3',
        title: 'Manual pass on a real tenant',
        detail:
          'Verified against the live stack: a profile save rewrote a real Telnyx assistant’s instructions and greeting, and its schedule_appointment tool survived intact; service areas and per-day hours round-trip through the API; location search returns real small towns and ZIPs; an unauthenticated geo search is rejected. Not verified — the in-browser Test Call and the map, which need a human at a browser with a microphone.',
        status: 'done',
        touches: [],
      },
    ],
  },
];

export const OUT_OF_SCOPE: string[] = [
  'Storing or displaying test-call transcripts — explicitly deferred.',
  'The Emergency Fallback / forwarding number itself, which stays editable on the Account page.',
  'The signup form’s free-text hours field; it keeps working through the legacy shape and can move to the new selector separately.',
  'Number porting, billing, and the admin console, none of which this touches.',
];
