import { useState, useCallback, useEffect } from 'react';
import { flushSync } from 'react-dom';
import { UNITS, INQUIRIES, PAYMENTS, ACTIVITY, formatListingId, formatPesoShort, formatPropertyId, HOST_PROFILE } from './data';
import type { Unit, UnitStatus, Inquiry, Payment, Activity } from './data';
import { DEFAULT_PRIMARY, THEME_STORAGE_KEY } from './theme';
import HostNav from './components/HostNav';
import type { Tab } from './components/HostNav';
import Sidebar from './components/Sidebar';
import type { HeaderNotification } from './components/Header';
import NewListingModal from './components/NewListingModal';
import type { NewListingDraft } from './components/NewListingModal';
import DashboardScreen from './screens/DashboardScreen';
import ListingsScreen from './screens/ListingsScreen';
import TenantsScreen from './screens/TenantsScreen';
import InquiriesScreen from './screens/InquiriesScreen';
import PaymentsScreen from './screens/PaymentsScreen';
import ProfileScreen from './screens/ProfileScreen';
import ReviewsScreen from './screens/ReviewsScreen';
import Toast from './components/Toast';
import ThemePicker from './components/ThemePicker';
import ListingDetailsModal from './components/ListingDetailsModal';
import InquiryChatModal from './components/InquiryChatModal';

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
  const setInquiryCalendarRoute = useCallback((date?: string | null) => {
    const url = new URL(window.location.href);
    url.searchParams.set('tab', 'inquiries');
    url.searchParams.set('inquiriesMode', 'calendar');
    if (date) url.searchParams.set('inquiriesDate', date);
    else url.searchParams.delete('inquiriesDate');
    window.history.replaceState({}, '', url);
  }, []);

  const clearInquiryCalendarRoute = useCallback(() => {
    const url = new URL(window.location.href);
    url.searchParams.delete('inquiriesMode');
    url.searchParams.delete('inquiriesDate');
    window.history.replaceState({}, '', url);
  }, []);

  const initialTab = (() => {
    const tab = new URL(window.location.href).searchParams.get('tab');
    return tab === 'dashboard' || tab === 'listings' || tab === 'tenants' || tab === 'inquiries' || tab === 'payments' || tab === 'profile' || tab === 'reviews' ? tab : 'dashboard';
  })();
  const [tab, setTab] = useState<Tab>(initialTab);
  const [units, setUnits] = useState<Unit[]>(UNITS);
  const [inquiries, setInquiries] = useState<Inquiry[]>(INQUIRIES);
  const [payments, setPayments] = useState<Payment[]>(PAYMENTS);
  const [activities, setActivities] = useState<Activity[]>(ACTIVITY);
  const [toast, setToast] = useState<string | null>(null);
  const [themeOpen, setThemeOpen] = useState(false);
  const [newListingOpen, setNewListingOpen] = useState(false);
  const [inquiriesEntryMode, setInquiriesEntryMode] = useState<'normal' | 'calendar'>('normal');
  const [inquiriesStartFilter, setInquiriesStartFilter] = useState<'Calendar' | null>(null);
  const [inquiriesStartDate, setInquiriesStartDate] = useState<string | null>(null);
  const [inquiriesStartChatId, setInquiriesStartChatId] = useState<number | null>(null);
  const [inquiriesResetToken, setInquiriesResetToken] = useState(0);
  const [listingsStartUnitId, setListingsStartUnitId] = useState<number | null>(null);
  const [sharedInquiryId, setSharedInquiryId] = useState<number | null>(null);
  const [sharedListingUnitId, setSharedListingUnitId] = useState<number | null>(null);
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
    setInquiries(prev => prev.map((i) => {
      if (i.id !== id) return i;
      if (status === 'Viewing') return { ...i, status };
      const { viewingAt, viewingTime, ...rest } = i;
      return {
        ...rest,
        status,
      };
    }));
  }, []);

  const setInquiryViewing = useCallback((id: number, viewing: { date: string; time: string } | null) => {
    setInquiries((prev) =>
      prev.map((i) => {
        if (i.id !== id) return i;
        if (!viewing) {
          const { viewingAt, viewingTime, ...rest } = i;
          return { ...rest };
        }
        return {
          ...i,
          viewingAt: viewing.date,
          viewingTime: viewing.time,
        };
      }),
    );
  }, []);

  const markInquiryRead = useCallback((id: number) => {
    setInquiries((prev) => prev.map((inquiry) => (inquiry.id === id ? { ...inquiry, unreadCount: 0 } : inquiry)));
  }, []);

  const deleteInquiry = useCallback((id: number) => {
    setInquiries((prev) => prev.filter((inquiry) => inquiry.id !== id));
    setSharedInquiryId((current) => (current === id ? null : current));
    setInquiriesStartChatId((current) => (current === id ? null : current));
  }, []);

  const addInquiryThreadMessage = useCallback((
    id: number,
    message: {
      sender: 'tenant' | 'host' | 'system';
      text: string;
      time: string;
      replyTo?: {
        name: string;
        text: string;
      };
    },
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
          unreadCount: message.sender === 'tenant' ? inquiry.unreadCount + 1 : inquiry.unreadCount,
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
      ownerUserId: HOST_PROFILE.userId,
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
            ? 'Mock listing was created and published from the host dashboard.'
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

  const inquiryMessageCount = inquiries.reduce((total, inquiry) => total + inquiry.unreadCount, 0);
  const overdueTotal = payments.filter((payment) => payment.status === 'Overdue').reduce((sum, payment) => sum + payment.amount, 0);
  const draftCount = units.filter((unit) => unit.status === 'Draft').length;
  const unverifiedCount = units.filter((unit) => unit.status !== 'Draft' && !unit.verified).length;
  const notifications: HeaderNotification[] = [
    { id: 'new-inquiries', title: `${inquiryMessageCount} unread inquiry messages`, detail: 'Open the inquiries tab and respond to the latest prospect messages.', tab: 'inquiries' as const },
    { id: 'overdue-payments', title: `${formatPesoShort(overdueTotal)} overdue`, detail: 'Review overdue rent logs and follow up from the payments tab.', tab: 'payments' as const },
    { id: 'draft-listings', title: `${draftCount} draft listings`, detail: 'Finish and publish the listings still saved as drafts.', tab: 'listings' as const },
    { id: 'verification', title: `${unverifiedCount} listings pending verification`, detail: 'Open listings to review the units that still need verification.', tab: 'listings' as const },
  ].filter((notification) => !notification.title.startsWith('0 '));

  const openNotification = useCallback((notification: HeaderNotification) => {
    setTab(notification.tab);
    showToast(`🔔 ${notification.title}`);
  }, [showToast]);

  const handleTabChange = useCallback((nextTab: Tab) => {
    if (nextTab === 'inquiries') {
      const hasPendingInquiryLanding =
        inquiriesEntryMode === 'calendar' ||
        inquiriesStartFilter !== null ||
        inquiriesStartDate !== null ||
        inquiriesStartChatId !== null;

      if (!hasPendingInquiryLanding) {
        clearInquiryCalendarRoute();
        setInquiriesStartFilter(null);
        setInquiriesStartDate(null);
        setInquiriesStartChatId(null);
        setInquiriesResetToken((current) => current + 1);
      }
    }
    if (nextTab !== 'inquiries') {
      clearInquiryCalendarRoute();
      setInquiriesEntryMode('normal');
      setInquiriesStartFilter(null);
      setInquiriesStartDate(null);
      setInquiriesStartChatId(null);
    }
    setTab(nextTab);
  }, [clearInquiryCalendarRoute, inquiriesEntryMode, inquiriesStartChatId, inquiriesStartDate, inquiriesStartFilter]);

  return (
    <div className="app-shell">
      <div className="phone-container">
        {/* Desktop-only sidebar; bottom nav takes over on mobile (CSS-switched). */}
          <Sidebar
            activeTab={tab}
            onTabChange={handleTabChange}
            inquiryBadge={inquiryMessageCount}
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
              onOpenInquiriesCalendar={(date) => {
                setInquiryCalendarRoute(date ?? null);
                flushSync(() => {
                  setInquiriesEntryMode('calendar');
                  setInquiriesStartFilter('Calendar');
                  setInquiriesStartDate(date ?? null);
                  setTab('inquiries');
                });
              }}
              onOpenInquiryModal={(inquiryId) => setSharedInquiryId(inquiryId)}
              onOpenListingModal={(unitId) => setSharedListingUnitId(unitId)}
              onOpenProfile={() => setTab('profile')}
              notifications={notifications}
              onOpenNotification={openNotification}
              onShowToast={showToast}
              onAdd={openNewListing}
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
              initialSelectedUnitId={listingsStartUnitId}
              onInitialSelectedUnitApplied={() => setListingsStartUnitId(null)}
              onAdd={openNewListing}
            />
          )}
          {tab === 'tenants' && (
            <TenantsScreen
              units={units}
              payments={payments}
              onOpenProfile={() => setTab('profile')}
              notifications={notifications}
              onOpenNotification={openNotification}
              onAdd={openNewListing}
            />
          )}
          {tab === 'inquiries' && (
              <InquiriesScreen
                inquiries={inquiries}
                units={units}
                onDeleteInquiry={deleteInquiry}
                onMarkInquiryRead={markInquiryRead}
                onSetStatus={setInquiryStatus}
                onSetViewing={setInquiryViewing}
                onAddThreadMessage={addInquiryThreadMessage}
              onOpenProfile={() => setTab('profile')}
              notifications={notifications}
                onOpenNotification={openNotification}
                onShowToast={showToast}
                initialEntryMode={inquiriesEntryMode}
                initialFilter={inquiriesStartFilter}
                initialCalendarDate={inquiriesStartDate}
                initialChatInquiryId={inquiriesStartChatId}
                resetToken={inquiriesResetToken}
                onInitialChatInquiryIdApplied={() => setInquiriesStartChatId(null)}
                onAdd={openNewListing}
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
              onAdd={openNewListing}
            />
          )}
          {tab === 'profile' && (
            <ProfileScreen
              units={units}
              onOpenListings={() => setTab('listings')}
              onOpenTenants={() => setTab('tenants')}
              onOpenTheme={() => setThemeOpen(true)}
              onOpenReviews={() => setTab('reviews')}
              notifications={notifications}
              onOpenNotification={openNotification}
              onShowToast={showToast}
              onAdd={openNewListing}
            />
          )}
          {tab === 'reviews' && (
            <ReviewsScreen
              onOpenProfile={() => setTab('profile')}
              notifications={notifications}
              onOpenNotification={openNotification}
              onAdd={openNewListing}
            />
          )}
        </div>

            <HostNav
              activeTab={tab}
              onTabChange={handleTabChange}
              inquiryBadge={inquiryMessageCount}
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

        <InquiryChatModal
          open={sharedInquiryId !== null}
          inquiry={sharedInquiryId === null ? null : inquiries.find((inquiry) => inquiry.id === sharedInquiryId) ?? null}
          units={units}
          onClose={() => setSharedInquiryId(null)}
          onSetStatus={setInquiryStatus}
          onSetViewing={setInquiryViewing}
          onAddThreadMessage={addInquiryThreadMessage}
          onShowToast={showToast}
        />

        <ListingDetailsModal
          open={sharedListingUnitId !== null}
          unit={sharedListingUnitId === null ? null : units.find((unit) => unit.id === sharedListingUnitId) ?? null}
          onClose={() => setSharedListingUnitId(null)}
        />
      </div>
    </div>
  );
}

export default App;
