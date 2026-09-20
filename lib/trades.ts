/**
 * Trade categories offered in the Company Profile picker. Grouped so the
 * trades that make up most of this market surface first, and deliberately
 * not exhaustive — the picker always allows a custom value, because a
 * business whose trade is missing must never be blocked from finishing
 * their profile.
 *
 * The chosen value is free text by the time it reaches the API, so adding
 * or reordering entries here is safe for existing tenants.
 */
export interface TradeGroup {
  label: string;
  trades: string[];
}

export const TRADE_GROUPS: TradeGroup[] = [
  {
    label: 'Core home services',
    trades: [
      'HVAC / Heating & Cooling',
      'Plumbing',
      'Electrical',
      'Roofing',
      'Appliance Repair',
      'Garage Door',
      'Handyman',
      'General Contractor',
    ],
  },
  {
    label: 'Exterior & grounds',
    trades: [
      'Landscaping & Lawn Care',
      'Tree Service',
      'Pest Control',
      'Pool & Spa',
      'Fencing & Decking',
      'Gutter Services',
      'Pressure Washing',
      'Snow Removal',
      'Concrete & Masonry',
      'Paving & Asphalt',
    ],
  },
  {
    label: 'Interior & specialty',
    trades: [
      'Cleaning Services',
      'Painting',
      'Flooring',
      'Window & Glass',
      'Locksmith',
      'Chimney & Fireplace',
      'Insulation',
      'Septic & Sewer',
      'Water Treatment',
      'Solar',
      'Restoration & Water Damage',
      'Junk Removal',
      'Moving Services',
      'Security & Smart Home',
    ],
  },
];

export const TRADES: string[] = TRADE_GROUPS.flatMap((group) => group.trades);
