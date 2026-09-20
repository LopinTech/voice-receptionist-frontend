import { TenantAdmin, SystemMetrics } from '@/types/schema';

// NOTE: MOCK_ADMIN_TENANTS and MOCK_SYSTEM_METRICS are still sample data.
// The Admin and Billing views need plans, MRR, quotas and invoices, none of
// which are modeled in the backend yet — see the wiring notes. Everything
// else in the dashboard reads from the API.
// CARRIERS below is real reference data, not a mock: `{aiNumber}` is
// substituted with the tenant's own assistant number at render time.

export const MOCK_ADMIN_TENANTS: TenantAdmin[] = [
  {
    id: 'tenant-apex-101',
    businessName: 'Apex Plumbing & Home Services',
    trade: 'Plumbing & Heating',
    ownerEmail: 'dan@apexplumbing.com',
    status: 'active',
    plan: 'Pro Assistant ($149/mo)',
    mrr: 149,
    totalCallsThisMonth: 142,
    aiResolutionRate: 94.2,
    dateJoined: '2026-01-12'
  },
  {
    id: 'tenant-sparky-102',
    businessName: 'Sparky Electric Co.',
    trade: 'Electrical Contracting',
    ownerEmail: 'mike@sparkyelectric.com',
    status: 'active',
    plan: 'Pro Assistant ($149/mo)',
    mrr: 149,
    totalCallsThisMonth: 198,
    aiResolutionRate: 96.5,
    dateJoined: '2026-02-01'
  },
  {
    id: 'tenant-coolzone-103',
    businessName: 'CoolZone HVAC Solutions',
    trade: 'HVAC & AC Repair',
    ownerEmail: 'admin@coolzonehvac.com',
    status: 'setup_incomplete',
    plan: 'Starter Plan ($79/mo)',
    mrr: 79,
    totalCallsThisMonth: 12,
    aiResolutionRate: 88.0,
    dateJoined: '2026-08-28'
  },
  {
    id: 'tenant-summit-104',
    businessName: 'Summit Roofing & Gutters',
    trade: 'Roofing & Exterior',
    ownerEmail: 'contact@summitroofs.com',
    status: 'paused',
    plan: 'Pro Assistant ($149/mo)',
    mrr: 149,
    totalCallsThisMonth: 89,
    aiResolutionRate: 91.0,
    dateJoined: '2026-03-15'
  }
];

export const MOCK_SYSTEM_METRICS: SystemMetrics = {
  totalTenants: 48,
  activeTenants: 42,
  totalCallsToday: 312,
  totalBookingsThisMonth: 1840,
  aiResolutionRatePct: 95.4,
  avgCallDurationSec: 92,
  mrrTotal: 6850
};

export interface CarrierConfig {
  id: string;
  name: string;
  forwardingCode: string;
  unforwardCode: string;
  steps: string[];
}

export const CARRIERS: CarrierConfig[] = [
  {
    id: 'verizon',
    name: 'Verizon Wireless',
    forwardingCode: '*72',
    unforwardCode: '*73',
    steps: [
      'Open your phone keypad dialer app.',
      'Dial *72 followed immediately by your AI Receptionist number: {aiNumber}',
      'Tap Call and listen for 2 quick confirmation beeps.',
      'Hang up. All unanswered or busy calls will now route to your AI Receptionist!'
    ]
  },
  {
    id: 'att',
    name: 'AT&T Wireless',
    forwardingCode: '*21*',
    unforwardCode: '#21#',
    steps: [
      'Open your phone dialer app.',
      'Dial *21*{aiNumberDigits}# and press Call.',
      'Wait for the success message on your screen: "Call forwarding conditional set".',
      'To turn off forwarding later, simply dial #21#.'
    ]
  },
  {
    id: 'tmobile',
    name: 'T-Mobile / Sprint',
    forwardingCode: '**21*',
    unforwardCode: '##21#',
    steps: [
      'Open phone call dialer.',
      'Enter **21*{aiNumberDigits}# and press Call.',
      'Listen for confirmation chime.',
      'Press "Test Forwarding" below to confirm setup.'
    ]
  },
  {
    id: 'xfinity',
    name: 'Xfinity Mobile / Comcast',
    forwardingCode: '*72',
    unforwardCode: '*73',
    steps: [
      'Dial *72 {aiNumber} from your cell phone.',
      'Wait for prompt confirming automated call routing.',
      'Hang up once connected.'
    ]
  },
  {
    id: 'spectrum',
    name: 'Spectrum Mobile',
    forwardingCode: '*72',
    unforwardCode: '*73',
    steps: [
      'Dial *72 then enter {aiNumber}.',
      'Press call and confirm ringback tone.'
    ]
  }
];
