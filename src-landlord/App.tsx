import { useState, useCallback, useEffect } from 'react';
import { UNITS, INQUIRIES, PAYMENTS } from './data';
import type { Unit, UnitStatus, Inquiry, Payment } from './data';
import { DEFAULT_PRIMARY, THEME_STORAGE_KEY } from './theme';
import LandlordNav from './components/LandlordNav';
import type { Tab } from './components/LandlordNav';
import Sidebar from './components/Sidebar';
import DashboardScreen from './screens/DashboardScreen';
import ListingsScreen from './screens/ListingsScreen';
import InquiriesScreen from './screens/InquiriesScreen';
import PaymentsScreen from './screens/PaymentsScreen';
import ProfileScreen from './screens/ProfileScreen';
import Toast from './components/Toast';
import ThemePicker from './components/ThemePicker';

function App() {
  const [tab, setTab] = useState<Tab>('dashboard');
  const [units, setUnits] = useState<Unit[]>(UNITS);
  const [inquiries, setInquiries] = useState<Inquiry[]>(INQUIRIES);
  const [payments, setPayments] = useState<Payment[]>(PAYMENTS);
  const [toast, setToast] = useState<string | null>(null);
  const [themeOpen, setThemeOpen] = useState(false);
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

  const setInquiryStatus = useCallback((id: number, status: Inquiry['status']) => {
    setInquiries(prev => prev.map(i => (i.id === id ? { ...i, status } : i)));
  }, []);

  const markPaid = useCallback((id: number) => {
    setPayments(prev => prev.map(p => (p.id === id ? { ...p, status: 'Paid', dueLabel: 'Paid today' } : p)));
  }, []);

  const remindPayment = useCallback((id: number) => {
    setPayments(prev => prev.map(p => (p.id === id ? { ...p, reminded: true } : p)));
  }, []);

  const newInquiryCount = inquiries.filter(i => i.status === 'New').length;

  return (
    <div className="app-shell">
      <div className="phone-container">
        {/* Desktop-only sidebar; bottom nav takes over on mobile (CSS-switched). */}
        <Sidebar
          activeTab={tab}
          onTabChange={setTab}
          inquiryBadge={newInquiryCount}
          onAdd={() => showToast('📝 New listing — posting flow coming soon')}
        />
        <div className="screen" key={tab}>
          {tab === 'dashboard' && (
            <DashboardScreen
              units={units}
              inquiries={inquiries}
              payments={payments}
              onGoTo={setTab}
              onOpenProfile={() => setTab('profile')}
              onShowToast={showToast}
            />
          )}
          {tab === 'listings' && (
            <ListingsScreen
              units={units}
              onSetStatus={setUnitStatus}
              onOpenProfile={() => setTab('profile')}
              onShowToast={showToast}
            />
          )}
          {tab === 'inquiries' && (
            <InquiriesScreen
              inquiries={inquiries}
              units={units}
              onSetStatus={setInquiryStatus}
              onOpenProfile={() => setTab('profile')}
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
              onShowToast={showToast}
            />
          )}
          {tab === 'profile' && (
            <ProfileScreen
              units={units}
              onOpenTheme={() => setThemeOpen(true)}
              onShowToast={showToast}
            />
          )}
        </div>

        <LandlordNav
          activeTab={tab}
          onTabChange={setTab}
          inquiryBadge={newInquiryCount}
          onAdd={() => showToast('📝 New listing — posting flow coming soon')}
        />

        {toast && <Toast message={toast} />}

        <ThemePicker
          open={themeOpen}
          primary={primary}
          onSelect={setPrimary}
          onClose={() => setThemeOpen(false)}
        />
      </div>
    </div>
  );
}

export default App;
