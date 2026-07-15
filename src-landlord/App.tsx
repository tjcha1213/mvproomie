import { useState, useCallback, useEffect } from 'react';
import { UNITS, INQUIRIES, PAYMENTS, ACTIVITY, formatListingId, formatPesoShort, formatPropertyId, LANDLORD_PROFILE } from './data';
import type { Unit, UnitStatus, Inquiry, Payment, Activity } from './data';
import { DEFAULT_PRIMARY, THEME_STORAGE_KEY } from './theme';
import LandlordNav from './components/LandlordNav';
import type { Tab } from './components/LandlordNav';
import Sidebar from './components/Sidebar';
import type { HeaderNotification } from './components/Header';
import NewListingModal from './components/NewListingModal';
import type { NewListingDraft } from './components/NewListingModal';
import DashboardScreen from './screens/DashboardScreen';
import ListingsScreen from './screens/ListingsScreen';
import InquiriesScreen from './screens/InquiriesScreen';
import PaymentsScreen from './screens/PaymentsScreen';
import ProfileScreen from './screens/ProfileScreen';
import Toast from './components/Toast';
import ThemePicker from './components/ThemePicker';

const LOCATION_COORDS: { match: RegExp; lat: number; lng: number }[] = [
  { match: /katipunan|quezon city|qc/i, lat: 14.6386, lng: 121.0760 },
  { match: /espana|manila/i, lat: 14.6090, lng: 120.9930 },
  { match: /cubao/i, lat: 14.6190, lng: 121.0510 },
  { match: /timog/i, lat: 14.6330, lng: 121.0340 },
  { match: /sampaloc/i, lat: 14.6150, lng: 121.0000 },
  { match: /ortigas|pasig/i, lat: 14.5860, lng: 121.0610 },
  { match: /makati|poblacion/i, lat: 14.5650, lng: 121.0290 },
];

function resolveLocationCoords(location: string, seed: number) {
  const match = LOCATION_COORDS.find((entry) => entry.match.test(location));
  if (match) {
    return {
      lat: match.lat + seed * 0.0018,
      lng: match.lng + seed * 0.0014,
    };
  }

  return {
    lat: 14.5995 + seed * 0.0022,
    lng: 120.9842 + seed * 0.0016,
  };
}

function App() {
  const [tab, setTab] = useState<Tab>('dashboard');
  const [units, setUnits] = useState<Unit[]>(UNITS);
  const [inquiries, setInquiries] = useState<Inquiry[]>(INQUIRIES);
  const [payments, setPayments] = useState<Payment[]>(PAYMENTS);
  const [activities, setActivities] = useState<Activity[]>(ACTIVITY);
  const [toast, setToast] = useState<string | null>(null);
  const [themeOpen, setThemeOpen] = useState(false);
  const [newListingOpen, setNewListingOpen] = useState(false);
  const [primary, setPrimary] = useState<string>(
    () => localStorage.getItem(THEME_STORAGE_KEY) || DEFAULT_PRIMARY
  );

  // Same mechanism as the tenant app: one CSS variable drives every accent.
  useEffect(() => {
    document.documentElement.style.setProperty('--primary', primary);
    localStorage.setItem(THEME_STORAGE_KEY, primary);
  }, [primary]);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2100);
  }, []);

  // ── Actions (mutate state so the dashboard KPIs move live) ──
  const setUnitStatus = useCallback((id: number, status: UnitStatus) => {
    setUnits(prev => prev.map(u => (u.id === id ? { ...u, status } : u)));
  }, []);

  const updateUnit = useCallback((id: number, updates: Partial<Unit>) => {
    setUnits((prev) =>
      prev.map((unit) =>
        unit.id === id
          ? {
              ...unit,
              ...updates,
              image: updates.gallery?.[0] ?? updates.image ?? unit.image,
              lastUpdated: 'Updated just now',
            }
          : unit,
      ),
    );
  }, []);

  const setInquiryStatus = useCallback((id: number, status: Inquiry['status']) => {
    setInquiries(prev => prev.map(i => (i.id === id ? { ...i, status } : i)));
  }, []);

  const addInquiryThreadMessage = useCallback((
    id: number,
    message: { sender: 'tenant' | 'landlord' | 'system'; text: string; time: string },
    status?: Inquiry['status'],
  ) => {
    setInquiries((prev) =>
      prev.map((inquiry) => {
        if (inquiry.id !== id) return inquiry;

        const nextThreadId = inquiry.thread.length > 0
          ? Math.max(...inquiry.thread.map((entry) => entry.id)) + 1
          : inquiry.id * 10 + 1;

        return {
          ...inquiry,
          status: status ?? inquiry.status,
          thread: [...inquiry.thread, { id: nextThreadId, ...message }],
        };
      }),
    );
  }, []);

  const markPaid = useCallback((id: number) => {
    setPayments(prev => prev.map(p => (p.id === id ? { ...p, status: 'Paid', dueLabel: 'Paid today' } : p)));
  }, []);

  const remindPayment = useCallback((id: number) => {
    setPayments(prev => prev.map(p => (p.id === id ? { ...p, reminded: true } : p)));
  }, []);

  const openNewListing = useCallback(() => {
    setNewListingOpen(true);
  }, []);

  const createListing = useCallback((draft: NewListingDraft) => {
    const defaultImageByType: Record<Unit['type'], string> = {
      Studio: `${import.meta.env.BASE_URL}assets/studio_modern.png`,
      Bedspace: `${import.meta.env.BASE_URL}assets/bedspace_female.png`,
      Apartment: `${import.meta.env.BASE_URL}assets/apartment_1br.png`,
    };
    const nextId = units.length > 0 ? Math.max(...units.map(unit => unit.id)) + 1 : 1;
    const coverImage = draft.photos[0] || defaultImageByType[draft.type];
    const coords = resolveLocationCoords(draft.location, nextId % 5);
    const initialViews = draft.status === 'Active' ? 18 : 0;
    const initialInquiries = draft.status === 'Active' ? 1 : 0;
    const nextUnit: Unit = {
      id: nextId,
      listingId: formatListingId(nextId),
      propertyId: formatPropertyId(nextId),
      ownerUserId: LANDLORD_PROFILE.userId,
      title: draft.title,
      type: draft.type,
      location: draft.location,
      lat: coords.lat,
      lng: coords.lng,
      price: draft.price,
      image: coverImage,
      gallery: draft.photos.length > 0 ? draft.photos : [coverImage],
      status: draft.status,
      views: initialViews,
      inquiries: initialInquiries,
      verified: false,
      bedrooms: draft.bedrooms,
      bathrooms: draft.bathrooms,
      sqm: draft.sqm,
      description: draft.description,
      amenities: draft.amenities.length > 0 ? draft.amenities : ['Photo set pending', 'Details pending'],
      lastUpdated: 'Created just now',
      history: [
        {
          id: nextId * 100 + 1,
          date: 'Jul 14',
          type: 'Lease',
          summary: draft.status === 'Active' ? 'Listing published to marketplace' : 'Draft listing created',
          detail: draft.status === 'Active'
            ? 'Mock listing was created and published from the landlord dashboard.'
            : 'Mock listing was created and saved as a draft for later review.',
          status: draft.status === 'Active' ? 'Live' : 'Draft saved',
        },
      ],
    };

    setUnits((prev) => [nextUnit, ...prev]);
    setActivities((prev) => [
      {
        id: Date.now(),
        icon: 'listing',
        text: `${draft.title} was ${draft.status === 'Active' ? 'published' : 'saved as draft'} · ${draft.location}`,
        time: 'Just now',
      },
      ...prev,
    ]);
    setTab('listings');
    setNewListingOpen(false);
    showToast(draft.status === 'Active' ? '🚀 New listing published to the demo' : '📝 Draft listing created');
  }, [showToast, units]);

  const newInquiryCount = inquiries.filter(i => i.status === 'New').length;
  const overdueTotal = payments.filter((payment) => payment.status === 'Overdue').reduce((sum, payment) => sum + payment.amount, 0);
  const draftCount = units.filter((unit) => unit.status === 'Draft').length;
  const unverifiedCount = units.filter((unit) => unit.status !== 'Draft' && !unit.verified).length;
  const notifications: HeaderNotification[] = [
    { id: 'new-inquiries', title: `${newInquiryCount} new inquiries`, detail: 'Open the inquiries tab and respond to the newest prospects.', tab: 'inquiries' as const },
    { id: 'overdue-payments', title: `${formatPesoShort(overdueTotal)} overdue`, detail: 'Review overdue rent logs and follow up from the payments tab.', tab: 'payments' as const },
    { id: 'draft-listings', title: `${draftCount} draft listings`, detail: 'Finish and publish the listings still saved as drafts.', tab: 'listings' as const },
    { id: 'verification', title: `${unverifiedCount} listings pending verification`, detail: 'Open listings to review the units that still need verification.', tab: 'listings' as const },
  ].filter((notification) => !notification.title.startsWith('0 '));

  const openNotification = useCallback((notification: HeaderNotification) => {
    setTab(notification.tab);
    showToast(`🔔 ${notification.title}`);
  }, [showToast]);

  return (
    <div className="app-shell">
      <div className="phone-container">
        {/* Desktop-only sidebar; bottom nav takes over on mobile (CSS-switched). */}
        <Sidebar
          activeTab={tab}
          onTabChange={setTab}
          inquiryBadge={newInquiryCount}
          onAdd={openNewListing}
        />
        <div className="screen" key={tab}>
          {tab === 'dashboard' && (
            <DashboardScreen
              units={units}
              inquiries={inquiries}
              payments={payments}
              activities={activities}
              onGoTo={setTab}
              onOpenProfile={() => setTab('profile')}
              notifications={notifications}
              onOpenNotification={openNotification}
              onShowToast={showToast}
            />
          )}
          {tab === 'listings' && (
            <ListingsScreen
              units={units}
              onSetStatus={setUnitStatus}
              onUpdateUnit={updateUnit}
              onOpenProfile={() => setTab('profile')}
              notifications={notifications}
              onOpenNotification={openNotification}
              onShowToast={showToast}
            />
          )}
          {tab === 'inquiries' && (
            <InquiriesScreen
              inquiries={inquiries}
              units={units}
              onSetStatus={setInquiryStatus}
              onAddThreadMessage={addInquiryThreadMessage}
              onOpenProfile={() => setTab('profile')}
              notifications={notifications}
              onOpenNotification={openNotification}
              onShowToast={showToast}
            />
          )}
          {tab === 'payments' && (
            <PaymentsScreen
              payments={payments}
              units={units}
              onMarkPaid={markPaid}
              onRemind={remindPayment}
              onOpenProfile={() => setTab('profile')}
              notifications={notifications}
              onOpenNotification={openNotification}
              onShowToast={showToast}
            />
          )}
          {tab === 'profile' && (
            <ProfileScreen
              units={units}
              onOpenTheme={() => setThemeOpen(true)}
              notifications={notifications}
              onOpenNotification={openNotification}
              onShowToast={showToast}
            />
          )}
        </div>

        <LandlordNav
          activeTab={tab}
          onTabChange={setTab}
          inquiryBadge={newInquiryCount}
          onAdd={openNewListing}
        />

        {toast && <Toast message={toast} />}

        <ThemePicker
          open={themeOpen}
          primary={primary}
          onSelect={setPrimary}
          onClose={() => setThemeOpen(false)}
        />

        <NewListingModal
          open={newListingOpen}
          onClose={() => setNewListingOpen(false)}
          onCreate={createListing}
        />
      </div>
    </div>
  );
}

export default App;
