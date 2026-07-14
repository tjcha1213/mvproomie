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
