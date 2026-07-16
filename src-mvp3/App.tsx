import { useState, useCallback, useEffect } from 'react';
import { listings as initialListings } from './data/listings';
import type { Listing } from './data/listings';
import type { Screen, NavTab } from './types';
import { DEFAULT_PRIMARY, THEME_STORAGE_KEY } from './theme';
import StatusBar from './components/StatusBar';
import BottomNav from './components/BottomNav';
import HomeScreen from './screens/HomeScreen';
import SearchScreen from './screens/SearchScreen';
import DetailScreen from './screens/DetailScreen';
import SavedScreen from './screens/SavedScreen';
import InboxScreen from './screens/InboxScreen';
import ProfileScreen from './screens/ProfileScreen';
import Toast from './components/Toast';
import ThemePicker from './components/ThemePicker';
import {
  createInitialConversations,
  openConversationWithPrompt,
  openConversation,
  sendConversationReply,
  type Conversation,
} from './chat';


function App() {
  const [listings, setListings] = useState<Listing[]>(initialListings);
  const [conversations, setConversations] = useState<Conversation[]>(() => createInitialConversations(initialListings));
  const [activeTab, setActiveTab] = useState<NavTab>('home');
  const [currentScreen, setCurrentScreen] = useState<Screen>('home');
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [prevScreen, setPrevScreen] = useState<Screen>('home');
  const [toast, setToast] = useState<string | null>(null);
  const [primary, setPrimary] = useState<string>(
    () => localStorage.getItem(THEME_STORAGE_KEY) || DEFAULT_PRIMARY
  );
  const [themeOpen, setThemeOpen] = useState(false);

  // Apply the chosen brand color to the document root; every accent is derived
  // from --primary via color-mix, so this one line re-themes the whole app.
  useEffect(() => {
    document.documentElement.style.setProperty('--primary', primary);
    localStorage.setItem(THEME_STORAGE_KEY, primary);
  }, [primary]);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2100);
  }, []);

  const navigate = useCallback((screen: Screen, listing?: Listing) => {
    setPrevScreen(currentScreen);
    if (listing) setSelectedListing(listing);
    setCurrentScreen(screen);
  }, [currentScreen]);

  const goBack = useCallback(() => {
    setCurrentScreen(prevScreen);
    setSelectedListing(null);
  }, [prevScreen]);

  const handleTabChange = useCallback((tab: NavTab) => {
    setActiveTab(tab);
    setPrevScreen(currentScreen);
    setCurrentScreen(tab);
    if (tab !== 'inbox') setActiveConversationId(null);
  }, [currentScreen]);

  const openInboxThread = useCallback((
    listing: Listing,
    mode: 'message' | 'inquiry'
  ) => {
    setConversations((prev) => {
      const next = openConversationWithPrompt(prev, listing, mode);
      setActiveConversationId(next.conversationId);
      return next.conversations;
    });
    setActiveTab('inbox');
    setPrevScreen(currentScreen);
    setCurrentScreen('inbox');
  }, [currentScreen]);

  const openConversationFromList = useCallback((conversationId: string) => {
    const listing = listings.find((item) => `listing-${item.id}` === conversationId);
    if (listing) {
      setConversations((prev) => openConversation(prev, listing).conversations);
    }
    setActiveConversationId(conversationId);
  }, [listings]);

  const sendReply = useCallback((conversationId: string, text: string) => {
    setConversations((prev) => sendConversationReply(prev, conversationId, text));
  }, []);

  const toggleSave = useCallback((id: number) => {
    setListings(prev =>
      prev.map(l => {
        if (l.id === id) {
          const next = { ...l, saved: !l.saved };
          showToast(next.saved ? '❤️ Saved to your list' : 'Removed from saved');
          return next;
        }
        return l;
      })
    );
    if (selectedListing?.id === id) {
      setSelectedListing(prev => prev ? { ...prev, saved: !prev.saved } : null);
    }
  }, [selectedListing, showToast]);

  const savedListings = listings.filter(l => l.saved);

  const isBack = currentScreen === 'detail';

  return (
    <div className="app-shell">
      <div className="phone-container">
        <StatusBar />
        <div className={`screen ${isBack ? 'fade-slide-enter' : ''}`} key={currentScreen}>
          {currentScreen === 'home' && (
            <HomeScreen
              listings={listings}
              onSelectListing={(l) => navigate('detail', l)}
              onToggleSave={toggleSave}
              onOpenSearch={() => handleTabChange('search')}
              onOpenMenu={() => setThemeOpen(true)}
              onShowToast={showToast}
              onSendInquiry={(listing) => openInboxThread(listing, 'inquiry')}
            />
          )}
          {currentScreen === 'search' && (
            <SearchScreen
              listings={listings}
              onSelectListing={(l) => navigate('detail', l)}
              onToggleSave={toggleSave}
              onOpenMenu={() => setThemeOpen(true)}
              onShowToast={showToast}
              onSendInquiry={(listing) => openInboxThread(listing, 'inquiry')}
            />
          )}
          {currentScreen === 'detail' && selectedListing && (
            <DetailScreen
              listing={listings.find(l => l.id === selectedListing.id) || selectedListing}
              onBack={goBack}
              onToggleSave={toggleSave}
              onShowToast={showToast}
              onOpenChat={(listing) => openInboxThread(listing, 'message')}
              onSendInquiry={(listing) => openInboxThread(listing, 'inquiry')}
            />
          )}
          {currentScreen === 'saved' && (
            <SavedScreen
              listings={savedListings}
              onSelectListing={(l) => navigate('detail', l)}
              onToggleSave={toggleSave}
              onShowToast={showToast}
            />
          )}
          {currentScreen === 'inbox' && (
            <InboxScreen
              conversations={conversations}
              activeConversationId={activeConversationId}
              onOpenConversation={openConversationFromList}
              onBackToList={() => setActiveConversationId(null)}
              onSendMessage={sendReply}
            />
          )}
          {currentScreen === 'profile' && <ProfileScreen onShowToast={showToast} onOpenTheme={() => setThemeOpen(true)} />}
        </div>

        {currentScreen !== 'detail' && (
          <BottomNav
            activeTab={activeTab}
            onTabChange={handleTabChange}
            savedCount={savedListings.length}
          />
        )}

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
