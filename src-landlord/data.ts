// Mock data for the landlord dashboard demo. All of it is held in App state so
// actions (reply, mark paid, publish, …) visibly update the KPIs.

const withBase = (p: string) => `${import.meta.env.BASE_URL}${p}`;

export type UnitStatus = 'Active' | 'Occupied' | 'Draft';

export interface Unit {
  id: number;
  title: string;
  type: 'Studio' | 'Bedspace' | 'Apartment';
  location: string;
  price: number;
  image: string;
  status: UnitStatus;
  views: number;
  inquiries: number;
  verified: boolean;
  bedrooms: number;
  bathrooms: number;
  sqm: number;
  description: string;
  amenities: string[];
  lastUpdated: string;
  history: {
    id: number;
    date: string;
    type: 'Payment' | 'Inquiry' | 'Viewing' | 'Lease' | 'Maintenance';
    summary: string;
    detail: string;
    status: string;
    amount?: number;
  }[];
}

export const UNITS: Unit[] = [
  {
    id: 1,
    title: 'Cozy Studio Unit',
    type: 'Studio',
    location: 'Katipunan, Quezon City',
    price: 6000,
    image: withBase('assets/studio_cozy.png'),
    status: 'Occupied',
    views: 96,
    inquiries: 4,
    verified: true,
    bedrooms: 1,
    bathrooms: 1,
    sqm: 18,
    description: 'Compact studio unit near the university belt with strong recurring demand from students and young professionals.',
    amenities: ['Furnished', 'Wi-Fi ready', 'Water included', 'Near transport'],
    lastUpdated: 'Updated 2 days ago',
    history: [
      { id: 101, date: 'Jul 09', type: 'Payment', summary: 'Monthly rent received', detail: 'Maria Reyes paid the full July rent through bank transfer.', status: 'Completed', amount: 6000 },
      { id: 102, date: 'Jun 28', type: 'Lease', summary: 'Lease renewed for 12 months', detail: 'Tenant renewed the contract through June next year at the same rate.', status: 'Signed' },
      { id: 103, date: 'Jun 14', type: 'Maintenance', summary: 'Aircon cleaning logged', detail: 'Routine cleaning completed before the current lease renewal.', status: 'Closed' },
    ],
  },
  {
    id: 2,
    title: 'Male Bedspace',
    type: 'Bedspace',
    location: 'Espana, Manila',
    price: 2600,
    image: withBase('assets/bedspace_male.png'),
    status: 'Active',
    views: 214,
    inquiries: 12,
    verified: true,
    bedrooms: 1,
    bathrooms: 1,
    sqm: 24,
    description: 'High-traffic bedspace listing with consistent inquiry volume and fast turnover near schools and review centers.',
    amenities: ['Bunk setup', 'Utilities split', 'CCTV', 'Caretaker onsite'],
    lastUpdated: 'Updated today',
    history: [
      { id: 201, date: 'Jul 11', type: 'Inquiry', summary: '12 new inquiries this week', detail: 'Strong inquiry volume coming from students asking about August move-in.', status: 'Open' },
      { id: 202, date: 'Jul 06', type: 'Viewing', summary: 'Walkthrough scheduled', detail: 'Two prospective tenants booked an in-person walkthrough for Saturday afternoon.', status: 'Scheduled' },
      { id: 203, date: 'Jun 30', type: 'Payment', summary: 'Security deposit received', detail: 'Reservation fee and deposit were recorded for the next incoming occupant.', status: 'Completed', amount: 2600 },
    ],
  },
  {
    id: 3,
    title: '1BR Apartment',
    type: 'Apartment',
    location: 'Cubao, QC',
    price: 13500,
    image: withBase('assets/apartment_1br.png'),
    status: 'Active',
    views: 158,
    inquiries: 7,
    verified: false,
    bedrooms: 1,
    bathrooms: 1,
    sqm: 32,
    description: 'Private one-bedroom apartment with reliable demand from couples and small households looking for transit access.',
    amenities: ['Balcony', 'Pet-friendly', 'Parking nearby', 'Separate meter'],
    lastUpdated: 'Updated yesterday',
    history: [
      { id: 301, date: 'Jul 10', type: 'Inquiry', summary: 'Viewing request from Grace Tan', detail: 'Prospect asked for a weekend schedule and requested exact parking details.', status: 'Pending reply' },
      { id: 302, date: 'Jul 07', type: 'Maintenance', summary: 'Verification documents requested', detail: 'Property paperwork still needs one final utility bill upload.', status: 'In review' },
      { id: 303, date: 'Jun 25', type: 'Viewing', summary: 'Broker-assisted showing completed', detail: 'Previous showing ended without conversion after follow-up on commuting options.', status: 'Completed' },
    ],
  },
  {
    id: 4,
    title: 'Modern Studio',
    type: 'Studio',
    location: 'Timog, QC',
    price: 7000,
    image: withBase('assets/studio_modern.png'),
    status: 'Occupied',
    views: 61,
    inquiries: 2,
    verified: true,
    bedrooms: 1,
    bathrooms: 1,
    sqm: 21,
    description: 'Recently renovated studio with modern finishes, currently occupied by a repeat tenant on a stable payment record.',
    amenities: ['Aircon ready', 'Shower heater', 'Secure gate', 'Laundry access'],
    lastUpdated: 'Updated 5 days ago',
    history: [
      { id: 401, date: 'Jul 08', type: 'Payment', summary: 'Rent received from Ken Villanueva', detail: 'Tenant paid July rent in full ahead of the due date.', status: 'Completed', amount: 7000 },
      { id: 402, date: 'Jun 19', type: 'Lease', summary: 'Tenant extended stay', detail: 'Existing tenant confirmed another 6-month stay after the renovation update.', status: 'Signed' },
      { id: 403, date: 'Jun 12', type: 'Maintenance', summary: 'Lighting replacement', detail: 'Kitchen and hallway lighting were upgraded during the turnover refresh.', status: 'Closed' },
    ],
  },
  {
    id: 5,
    title: 'Female Bedspace',
    type: 'Bedspace',
    location: 'Sampaloc, Manila',
    price: 2500,
    image: withBase('assets/bedspace_female.png'),
    status: 'Occupied',
    views: 143,
    inquiries: 9,
    verified: true,
    bedrooms: 1,
    bathrooms: 1,
    sqm: 22,
    description: 'Affordable shared unit with strong listing traction and repeat referrals from nearby students and workers.',
    amenities: ['Secure entry', 'Curfew policy', 'Wi-Fi included', 'Shared kitchen'],
    lastUpdated: 'Updated 3 days ago',
    history: [
      { id: 501, date: 'Jul 10', type: 'Payment', summary: 'Rent reminder sent', detail: 'Janine Lopez was reminded about the upcoming due date.', status: 'Due soon', amount: 2500 },
      { id: 502, date: 'Jul 09', type: 'Payment', summary: 'Overdue balance flagged', detail: 'Rhea Mendoza remains 5 days late and follow-up is needed.', status: 'Overdue', amount: 2500 },
      { id: 503, date: 'Jun 27', type: 'Inquiry', summary: 'Referral inquiry converted', detail: 'A word-of-mouth prospect reserved the open bed after an on-site visit.', status: 'Converted' },
    ],
  },
  {
    id: 6,
    title: '2BR Apartment',
    type: 'Apartment',
    location: 'Ortigas, Pasig',
    price: 18000,
    image: withBase('assets/apartment_2br.png'),
    status: 'Draft',
    views: 0,
    inquiries: 0,
    verified: true,
    bedrooms: 2,
    bathrooms: 1,
    sqm: 46,
    description: 'Draft family-sized unit listing prepared for launch once final staging photos and policy details are approved.',
    amenities: ['Corner unit', 'Family-sized layout', 'Near offices', 'Storage nook'],
    lastUpdated: 'Draft saved this week',
    history: [
      { id: 601, date: 'Jul 11', type: 'Maintenance', summary: 'Staging checklist created', detail: 'Photo retakes and final amenity copy are still pending before launch.', status: 'In progress' },
      { id: 602, date: 'Jul 08', type: 'Lease', summary: 'Previous tenant moved out', detail: 'Turnover finished and the unit is being prepped for relisting.', status: 'Closed' },
      { id: 603, date: 'Jul 02', type: 'Maintenance', summary: 'Deep cleaning scheduled', detail: 'Cleaning and repainting were booked after turnover inspection.', status: 'Scheduled' },
    ],
  },
];

export type InquiryStatus = 'New' | 'Replied' | 'Viewing';

export interface Inquiry {
  id: number;
  name: string;
  unitId: number;
  message: string;
  time: string;
  status: InquiryStatus;
}

export const INQUIRIES: Inquiry[] = [
  { id: 1, name: 'Carlo Dizon', unitId: 2, message: 'Hi po! Is the bedspace still available? Looking to move in Aug 1.', time: '5m ago', status: 'New' },
  { id: 2, name: 'Grace Tan', unitId: 3, message: 'Can I schedule a viewing this weekend?', time: '1h ago', status: 'New' },
  { id: 3, name: 'Miguel Ramos', unitId: 2, message: 'Is water included in the rent?', time: '3h ago', status: 'New' },
  { id: 4, name: 'Bea Aquino', unitId: 3, message: 'Thank you! See you on Saturday at 2pm.', time: 'Yesterday', status: 'Viewing' },
  { id: 5, name: 'Leo Garcia', unitId: 2, message: 'Sure, I will send my requirements tonight.', time: 'Mon', status: 'Replied' },
];

export type PaymentStatus = 'Paid' | 'Due' | 'Overdue';

export interface Payment {
  id: number;
  tenant: string;
  unitId: number;
  amount: number;
  dueLabel: string;
  status: PaymentStatus;
  reminded?: boolean;
}

export const PAYMENTS: Payment[] = [
  { id: 1, tenant: 'Maria Reyes', unitId: 1, amount: 6000, dueLabel: 'Paid Jul 1', status: 'Paid' },
  { id: 2, tenant: 'Ken Villanueva', unitId: 4, amount: 7000, dueLabel: 'Paid Jul 2', status: 'Paid' },
  { id: 3, tenant: 'Alyssa Cruz', unitId: 5, amount: 2500, dueLabel: 'Paid Jul 1', status: 'Paid' },
  { id: 4, tenant: 'Janine Lopez', unitId: 5, amount: 2500, dueLabel: 'Due Jul 15', status: 'Due' },
  { id: 5, tenant: 'Rhea Mendoza', unitId: 5, amount: 2500, dueLabel: '5 days late', status: 'Overdue' },
];

// Listing views over the last 7 days (Mon–Sun), for the dashboard chart.
export const WEEK_VIEWS = [42, 38, 51, 47, 63, 58, 71];
export const WEEK_DAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export const CALENDAR_VIEWS = [
  { date: '2026-07-01', day: 1, views: 18 },
  { date: '2026-07-02', day: 2, views: 26 },
  { date: '2026-07-03', day: 3, views: 31 },
  { date: '2026-07-04', day: 4, views: 34 },
  { date: '2026-07-05', day: 5, views: 29 },
  { date: '2026-07-06', day: 6, views: 42 },
  { date: '2026-07-07', day: 7, views: 38 },
  { date: '2026-07-08', day: 8, views: 51 },
  { date: '2026-07-09', day: 9, views: 47 },
  { date: '2026-07-10', day: 10, views: 63 },
  { date: '2026-07-11', day: 11, views: 58 },
  { date: '2026-07-12', day: 12, views: 71 },
  { date: '2026-07-13', day: 13, views: 54 },
  { date: '2026-07-14', day: 14, views: 49 },
  { date: '2026-07-15', day: 15, views: 44 },
  { date: '2026-07-16', day: 16, views: 39 },
  { date: '2026-07-17', day: 17, views: 52 },
  { date: '2026-07-18', day: 18, views: 57 },
  { date: '2026-07-19', day: 19, views: 46 },
  { date: '2026-07-20', day: 20, views: 41 },
  { date: '2026-07-21', day: 21, views: 36 },
  { date: '2026-07-22', day: 22, views: 43 },
  { date: '2026-07-23', day: 23, views: 48 },
  { date: '2026-07-24', day: 24, views: 55 },
  { date: '2026-07-25', day: 25, views: 62 },
  { date: '2026-07-26', day: 26, views: 50 },
  { date: '2026-07-27', day: 27, views: 40 },
  { date: '2026-07-28', day: 28, views: 35 },
  { date: '2026-07-29', day: 29, views: 45 },
  { date: '2026-07-30', day: 30, views: 53 },
  { date: '2026-07-31', day: 31, views: 60 },
];

export interface Activity {
  id: number;
  icon: 'inquiry' | 'payment' | 'views' | 'review';
  text: string;
  time: string;
}

export const ACTIVITY: Activity[] = [
  { id: 1, icon: 'inquiry', text: 'New inquiry from Carlo Dizon · Male Bedspace', time: '5m ago' },
  { id: 2, icon: 'inquiry', text: 'Grace Tan requested a viewing · 1BR Apartment', time: '1h ago' },
  { id: 3, icon: 'payment', text: '₱7,000 rent received from Ken Villanueva', time: '2h ago' },
  { id: 4, icon: 'views', text: 'Modern Studio got 24 views today', time: '6h ago' },
  { id: 5, icon: 'review', text: 'Maria Reyes left you a 5★ review', time: 'Yesterday' },
];

export function formatPeso(n: number): string {
  return `₱${n.toLocaleString()}`;
}

export function formatPesoShort(n: number): string {
  const k = n / 1000;
  return `₱${Number.isInteger(k) ? k : k.toFixed(1)}K`;
}
