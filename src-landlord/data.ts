// Mock data for the landlord dashboard demo. All of it is held in App state so
// actions (reply, mark paid, publish, …) visibly update the KPIs.

const withBase = (p: string) => `${import.meta.env.BASE_URL}${p}`;

export const LANDLORD_PROFILE = {
  name: 'Juan Dela Cruz',
  userId: 'LL-0001',
  avatar: withBase('assets/avatars/juan-landlord.png'),
  roomieScore: 91,
  roomieTemperature: 'Cool' as RoomieTemperature,
};

export type RoomieTemperature = 'Cool' | 'Warm' | 'Hot';

export interface RoomieTrust {
  roomieScore: number;
  roomieTemperature: RoomieTemperature;
}

export const PLATFORM_CONTACTS = {
  admin: { name: 'MVProomie Admin', userId: 'ADM-0001', roomieScore: 95, roomieTemperature: 'Cool' as RoomieTemperature },
  broker: { name: 'Broker Partner Desk', userId: 'BRK-0001', roomieScore: 86, roomieTemperature: 'Warm' as RoomieTemperature },
} as const;

export function formatListingId(id: number) {
  return `LST-${String(1000 + id).padStart(4, '0')}`;
}

export function formatPropertyId(id: number) {
  return `PRP-${String(2000 + id).padStart(4, '0')}`;
}

export type UnitStatus = 'Active' | 'Occupied' | 'Draft';

export interface Unit {
  id: number;
  listingId: string;
  propertyId: string;
  ownerUserId: string;
  title: string;
  type: 'Studio' | 'Bedspace' | 'Apartment';
  location: string;
  lat: number;
  lng: number;
  price: number;
  image: string;
  gallery?: string[];
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
    listingId: formatListingId(1),
    propertyId: formatPropertyId(1),
    ownerUserId: LANDLORD_PROFILE.userId,
    title: 'Cozy Studio Unit',
    type: 'Studio',
    location: 'Katipunan, Quezon City',
    lat: 14.6386,
    lng: 121.076,
    price: 6000,
    image: withBase('assets/studio_cozy.png'),
    gallery: [
      withBase('assets/studio_cozy.png'),
      withBase('assets/studio_modern.png'),
      withBase('assets/apartment_1br.png'),
      withBase('assets/bedspace_female.png'),
    ],
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
    listingId: formatListingId(2),
    propertyId: formatPropertyId(2),
    ownerUserId: LANDLORD_PROFILE.userId,
    title: 'Male Bedspace',
    type: 'Bedspace',
    location: 'Espana, Manila',
    lat: 14.609,
    lng: 120.993,
    price: 2600,
    image: withBase('assets/bedspace_male.png'),
    gallery: [
      withBase('assets/bedspace_male.png'),
      withBase('assets/bedspace_female.png'),
      withBase('assets/studio_cozy.png'),
      withBase('assets/apartment_2br.png'),
    ],
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
    listingId: formatListingId(3),
    propertyId: formatPropertyId(3),
    ownerUserId: LANDLORD_PROFILE.userId,
    title: '1BR Apartment',
    type: 'Apartment',
    location: 'Cubao, QC',
    lat: 14.619,
    lng: 121.051,
    price: 13500,
    image: withBase('assets/apartment_1br.png'),
    gallery: [
      withBase('assets/apartment_1br.png'),
      withBase('assets/apartment_2br.png'),
      withBase('assets/studio_modern.png'),
      withBase('assets/studio_cozy.png'),
    ],
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
    listingId: formatListingId(4),
    propertyId: formatPropertyId(4),
    ownerUserId: LANDLORD_PROFILE.userId,
    title: 'Modern Studio',
    type: 'Studio',
    location: 'Timog, QC',
    lat: 14.633,
    lng: 121.034,
    price: 7000,
    image: withBase('assets/studio_modern.png'),
    gallery: [
      withBase('assets/studio_modern.png'),
      withBase('assets/studio_cozy.png'),
      withBase('assets/apartment_1br.png'),
      withBase('assets/bedspace_male.png'),
    ],
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
    listingId: formatListingId(5),
    propertyId: formatPropertyId(5),
    ownerUserId: LANDLORD_PROFILE.userId,
    title: 'Female Bedspace',
    type: 'Bedspace',
    location: 'Sampaloc, Manila',
    lat: 14.615,
    lng: 121,
    price: 2500,
    image: withBase('assets/bedspace_female.png'),
    gallery: [
      withBase('assets/bedspace_female.png'),
      withBase('assets/bedspace_male.png'),
      withBase('assets/studio_cozy.png'),
      withBase('assets/studio_modern.png'),
    ],
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
    listingId: formatListingId(6),
    propertyId: formatPropertyId(6),
    ownerUserId: LANDLORD_PROFILE.userId,
    title: '2BR Apartment',
    type: 'Apartment',
    location: 'Ortigas, Pasig',
    lat: 14.586,
    lng: 121.061,
    price: 18000,
    image: withBase('assets/apartment_2br.png'),
    gallery: [
      withBase('assets/apartment_2br.png'),
      withBase('assets/apartment_1br.png'),
      withBase('assets/studio_modern.png'),
      withBase('assets/studio_cozy.png'),
    ],
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
  userId: string;
  name: string;
  avatar?: string;
  trust: RoomieTrust;
  unitId: number;
  message: string;
  time: string;
  status: InquiryStatus;
  thread: {
    id: number;
    sender: 'tenant' | 'landlord' | 'system';
    text: string;
    time: string;
  }[];
}

export const INQUIRIES: Inquiry[] = [
  {
    id: 1,
    userId: 'TEN-1001',
    name: 'Carlo Dizon',
    avatar: withBase('assets/avatars/carlo-dizon.png'),
    trust: { roomieScore: 78, roomieTemperature: 'Warm' },
    unitId: 2,
    message: 'Hi po! Is the bedspace still available? Looking to move in Aug 1 🙂',
    time: '5m ago',
    status: 'New',
    thread: [
      { id: 11, sender: 'tenant', text: 'Hi po! Is the bedspace still available? Looking to move in Aug 1 🙂', time: '5m ago' },
    ],
  },
  {
    id: 2,
    userId: 'TEN-1002',
    name: 'Grace Tan',
    avatar: withBase('assets/avatars/grace-tan.png'),
    trust: { roomieScore: 83, roomieTemperature: 'Cool' },
    unitId: 3,
    message: 'Can I schedule a viewing this weekend? 😊',
    time: '1h ago',
    status: 'New',
    thread: [
      { id: 21, sender: 'tenant', text: 'Can I schedule a viewing this weekend? 😊', time: '1h ago' },
    ],
  },
  {
    id: 3,
    userId: 'TEN-1003',
    name: 'Miguel Ramos',
    avatar: withBase('assets/avatars/miguel-ramos.png'),
    trust: { roomieScore: 74, roomieTemperature: 'Warm' },
    unitId: 2,
    message: 'Is water included in the rent? 👀',
    time: '3h ago',
    status: 'New',
    thread: [
      { id: 31, sender: 'tenant', text: 'Is water included in the rent? 👀', time: '3h ago' },
    ],
  },
  {
    id: 4,
    userId: 'TEN-1004',
    name: 'Bea Aquino',
    avatar: withBase('assets/avatars/grace-tan.png'),
    trust: { roomieScore: 88, roomieTemperature: 'Cool' },
    unitId: 3,
    message: 'Thank you! See you on Saturday at 2pm.',
    time: 'Yesterday',
    status: 'Viewing',
    thread: [
      { id: 41, sender: 'tenant', text: 'Can I schedule a viewing this weekend? 🙂', time: '2d ago' },
      { id: 42, sender: 'landlord', text: 'Yes, Saturday at 2pm works 👍 Please bring one valid ID.', time: 'Yesterday' },
      { id: 43, sender: 'tenant', text: 'Thank you! See you on Saturday at 2pm 🙌', time: 'Yesterday' },
    ],
  },
  {
    id: 5,
    userId: 'TEN-1005',
    name: 'Leo Garcia',
    avatar: withBase('assets/avatars/miguel-ramos.png'),
    trust: { roomieScore: 69, roomieTemperature: 'Hot' },
    unitId: 2,
    message: 'Sure, I will send my requirements tonight.',
    time: 'Mon',
    status: 'Replied',
    thread: [
      { id: 51, sender: 'tenant', text: 'Is the unit still open for July move-in? 🙂', time: 'Mon' },
      { id: 52, sender: 'landlord', text: 'Yes, it is still available. I can send the requirements list here 👍', time: 'Mon' },
      { id: 53, sender: 'tenant', text: 'Sure, I will send my requirements tonight. 🙏', time: 'Mon' },
    ],
  },
];

export type PaymentStatus = 'Paid' | 'Due' | 'Overdue';

export interface Payment {
  id: number;
  tenant: string;
  tenantId: string;
  trust: RoomieTrust;
  unitId: number;
  amount: number;
  dueLabel: string;
  status: PaymentStatus;
  method: 'Bank transfer' | 'GCash' | 'Cash deposit';
  reference: string;
  paidDate?: string;
  dueDate: string;
  account: string;
  bank: string;
  monthlyTrend: number[];
  notes: string;
  reminded?: boolean;
}

export const PAYMENTS: Payment[] = [
  {
    id: 1,
    tenant: 'Maria Reyes',
    tenantId: 'TEN-2001',
    trust: { roomieScore: 93, roomieTemperature: 'Cool' },
    unitId: 1,
    amount: 6000,
    dueLabel: 'Paid Jul 1',
    status: 'Paid',
    method: 'Bank transfer',
    reference: 'BPI-778291',
    paidDate: 'Jul 1, 2026',
    dueDate: 'Jul 1, 2026',
    account: '•••• 1842',
    bank: 'BPI Family Savings',
    monthlyTrend: [5600, 6000, 6000, 6000, 6000, 6000],
    notes: 'Consistent on-time payer for 6 consecutive months.',
  },
  {
    id: 2,
    tenant: 'Ken Villanueva',
    tenantId: 'TEN-2002',
    trust: { roomieScore: 89, roomieTemperature: 'Cool' },
    unitId: 4,
    amount: 7000,
    dueLabel: 'Paid Jul 2',
    status: 'Paid',
    method: 'GCash',
    reference: 'GCASH-239181',
    paidDate: 'Jul 2, 2026',
    dueDate: 'Jul 2, 2026',
    account: 'GCash wallet',
    bank: 'GCash',
    monthlyTrend: [7000, 7000, 6800, 7000, 7000, 7000],
    notes: 'Usually pays through GCash within the first 48 hours of due date.',
  },
  {
    id: 3,
    tenant: 'Alyssa Cruz',
    tenantId: 'TEN-2003',
    trust: { roomieScore: 85, roomieTemperature: 'Warm' },
    unitId: 5,
    amount: 2500,
    dueLabel: 'Paid Jul 1',
    status: 'Paid',
    method: 'Cash deposit',
    reference: 'BDO-109283',
    paidDate: 'Jul 1, 2026',
    dueDate: 'Jul 1, 2026',
    account: '•••• 5521',
    bank: 'BDO',
    monthlyTrend: [2500, 2500, 2500, 2500, 2500, 2500],
    notes: 'Stable recurring payment pattern with no missed cycles.',
  },
  {
    id: 4,
    tenant: 'Janine Lopez',
    tenantId: 'TEN-2004',
    trust: { roomieScore: 72, roomieTemperature: 'Warm' },
    unitId: 5,
    amount: 2500,
    dueLabel: 'Due Jul 15',
    status: 'Due',
    method: 'GCash',
    reference: 'Pending',
    dueDate: 'Jul 15, 2026',
    account: 'GCash wallet',
    bank: 'GCash',
    monthlyTrend: [2500, 2500, 2500, 2500, 2500, 0],
    notes: 'Upcoming due item; reminder already sent this cycle.',
    reminded: true,
  },
  {
    id: 5,
    tenant: 'Rhea Mendoza',
    tenantId: 'TEN-2005',
    trust: { roomieScore: 58, roomieTemperature: 'Hot' },
    unitId: 5,
    amount: 2500,
    dueLabel: '5 days late',
    status: 'Overdue',
    method: 'Bank transfer',
    reference: 'Pending',
    dueDate: 'Jul 9, 2026',
    account: '•••• 9013',
    bank: 'UnionBank',
    monthlyTrend: [2500, 2500, 2500, 2500, 0, 0],
    notes: 'Late this cycle after a previously stable 4-month payment streak.',
  },
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
  icon: 'inquiry' | 'payment' | 'views' | 'review' | 'listing';
  text: string;
  time: string;
}

export const LANDLORD_REVIEWS = [
  {
    id: 1,
    author: 'Maria Reyes',
    authorId: 'TEN-2001',
    rating: 5,
    date: 'Jul 12, 2026',
    quote: 'Fast replies, clear payment records, and smooth lease renewals.',
  },
  {
    id: 2,
    author: 'Ken Villanueva',
    authorId: 'TEN-2002',
    rating: 5,
    date: 'Jul 4, 2026',
    quote: 'The unit stays well maintained and concerns are addressed quickly.',
  },
  {
    id: 3,
    author: 'Grace Tan',
    authorId: 'TEN-1002',
    rating: 4,
    date: 'Jun 28, 2026',
    quote: 'Viewing coordination was organized and the listing details matched the visit.',
  },
];

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
