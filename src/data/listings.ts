export type ListingType = 'Studio' | 'Bedspace' | 'Apartment';

export interface Listing {
  id: number;
  type: ListingType;
  title: string;
  location: string;
  district: string;
  price: number;
  image: string;
  beds: number;
  baths: number;
  sqm: number;
  furnished: boolean;
  wifi: boolean;
  description: string;
  landlordName: string;
  landlordSince: number;
  landlordRating: number;
  landlordReviews: number;
  verified: boolean;
  saved: boolean;
  images: string[];
}

export const listings: Listing[] = [
  {
    id: 1,
    type: 'Studio',
    title: 'Cozy Studio Unit',
    location: 'Katipunan, Quezon City',
    district: 'QC',
    price: 6000,
    image: '/assets/studio_cozy.png',
    beds: 1,
    baths: 1,
    sqm: 20,
    furnished: true,
    wifi: true,
    description:
      'Cozy and fully furnished studio unit in a quiet and safe area near Ateneo. Perfect for students and young professionals.\n\nWith fast Wi-Fi, ref, microwave, and laundry area.',
    landlordName: 'Juan Dela Cruz',
    landlordSince: 2021,
    landlordRating: 4.9,
    landlordReviews: 128,
    verified: true,
    saved: false,
    images: ['/assets/studio_cozy.png', '/assets/studio_modern.png', '/assets/apartment_1br.png'],
  },
  {
    id: 2,
    type: 'Bedspace',
    title: 'Male Bedspace',
    location: 'Espana, Manila',
    district: 'Manila',
    price: 2600,
    image: '/assets/bedspace_male.png',
    beds: 1,
    baths: 1,
    sqm: 8,
    furnished: true,
    wifi: true,
    description:
      'Affordable male bedspace near UST and FEU. Clean and secure dormitory with CCTV, 24/7 security, and free water.',
    landlordName: 'Maria Santos',
    landlordSince: 2019,
    landlordRating: 4.7,
    landlordReviews: 84,
    verified: true,
    saved: false,
    images: ['/assets/bedspace_male.png', '/assets/bedspace_female.png', '/assets/studio_cozy.png'],
  },
  {
    id: 3,
    type: 'Apartment',
    title: '1BR Apartment',
    location: 'Cubao, QC',
    district: 'QC',
    price: 13500,
    image: '/assets/apartment_1br.png',
    beds: 1,
    baths: 1,
    sqm: 35,
    furnished: true,
    wifi: true,
    description:
      'Bright and spacious 1BR apartment in Cubao. Near Araneta Center, Shopwise, and major transport hubs. Includes parking slot.',
    landlordName: 'Roberto Lim',
    landlordSince: 2020,
    landlordRating: 4.8,
    landlordReviews: 56,
    verified: false,
    saved: false,
    images: ['/assets/apartment_1br.png', '/assets/apartment_2br.png', '/assets/studio_modern.png'],
  },
  {
    id: 4,
    type: 'Studio',
    title: 'Modern Studio',
    location: 'Timog, QC',
    district: 'QC',
    price: 7000,
    image: '/assets/studio_modern.png',
    beds: 1,
    baths: 1,
    sqm: 22,
    furnished: true,
    wifi: true,
    description:
      'Modern studio unit with city view in Timog. Walking distance to restaurants, cafes, and entertainment hubs. Ideal for young professionals.',
    landlordName: 'Ana Reyes',
    landlordSince: 2022,
    landlordRating: 5.0,
    landlordReviews: 32,
    verified: true,
    saved: false,
    images: ['/assets/studio_modern.png', '/assets/studio_cozy.png', '/assets/apartment_1br.png', '/assets/bedspace_female.png'],
  },
  {
    id: 5,
    type: 'Bedspace',
    title: 'Female Bedspace',
    location: 'Sampaloc, Manila',
    district: 'Manila',
    price: 2500,
    image: '/assets/bedspace_female.png',
    beds: 1,
    baths: 1,
    sqm: 6,
    furnished: true,
    wifi: false,
    description:
      'Safe and clean female bedspace in Sampaloc. Near UST, PUP, and Letran. With locker, common CR, and laundry area.',
    landlordName: 'Cora Diaz',
    landlordSince: 2018,
    landlordRating: 4.6,
    landlordReviews: 102,
    verified: true,
    saved: false,
    images: ['/assets/bedspace_female.png', '/assets/bedspace_male.png', '/assets/studio_cozy.png'],
  },
  {
    id: 6,
    type: 'Studio',
    title: 'Bright Studio',
    location: 'Poblacion, Makati',
    district: 'Makati',
    price: 8500,
    image: '/assets/studio_cozy.png',
    beds: 1,
    baths: 1,
    sqm: 25,
    furnished: true,
    wifi: true,
    description:
      'Bright and airy studio in the heart of Poblacion, Makati. Steps away from BGC, restaurants, bars, and coworking spaces.',
    landlordName: 'Leon Garcia',
    landlordSince: 2021,
    landlordRating: 4.9,
    landlordReviews: 47,
    verified: true,
    saved: false,
    images: ['/assets/studio_cozy.png', '/assets/studio_modern.png', '/assets/apartment_2br.png'],
  },
  {
    id: 7,
    type: 'Apartment',
    title: '2BR Apartment',
    location: 'Ortigas, Pasig',
    district: 'Pasig',
    price: 18000,
    image: '/assets/apartment_2br.png',
    beds: 2,
    baths: 2,
    sqm: 55,
    furnished: false,
    wifi: false,
    description:
      'Spacious 2BR semi-furnished apartment in Ortigas Center. Ideal for families or sharing. Near SM Megamall, Robinsons Galleria, and BGC.',
    landlordName: 'Pilar Cruz',
    landlordSince: 2017,
    landlordRating: 4.5,
    landlordReviews: 210,
    verified: false,
    saved: false,
    images: ['/assets/apartment_2br.png', '/assets/apartment_1br.png', '/assets/studio_modern.png', '/assets/studio_cozy.png'],
  },
  {
    id: 8,
    type: 'Studio',
    title: 'Minimalist Studio',
    location: 'Makati, Metro Manila',
    district: 'Makati',
    price: 7500,
    image: '/assets/studio_modern.png',
    beds: 1,
    baths: 1,
    sqm: 18,
    furnished: true,
    wifi: true,
    description:
      'Clean minimalist studio unit in Makati CBD. Perfect for solo professionals. Walking distance to BGC and Ayala malls.',
    landlordName: 'Ryan Tan',
    landlordSince: 2023,
    landlordRating: 4.8,
    landlordReviews: 18,
    verified: true,
    saved: false,
    images: ['/assets/studio_modern.png', '/assets/studio_cozy.png', '/assets/apartment_1br.png'],
  },
];
