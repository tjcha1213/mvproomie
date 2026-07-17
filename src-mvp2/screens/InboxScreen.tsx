import { useMemo, useRef, useState } from 'react';
import AppLogo from '../components/AppLogo';
import type { Conversation } from '../chat';

interface Props {
  conversations: Conversation[];
  activeConversationId: string | null;
  onOpenConversation: (conversationId: string) => void;
  onBackToList: () => void;
  onSendMessage: (conversationId: string, text: string) => void;
  onDeleteConversation: (conversationId: string) => void;
  onTogglePinConversation: (conversationId: string) => void;
}

type SwipeAction = 'delete' | 'pin';
interface SwipeState { id: string; startX: number; offset: number; action: SwipeAction | null; }

function formatConversationTime(timestamp: number): string {
  const deltaMinutes = Math.round((Date.now() - timestamp) / (1000 * 60));
  if (deltaMinutes < 1) return 'Now';
  if (deltaMinutes < 60) return `${deltaMinutes}m`;
  if (deltaMinutes < 1440) return `${Math.floor(deltaMinutes / 60)}h`;
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(timestamp);
}

function formatMessageTime(timestamp: number): string {
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  }).format(timestamp);
}

export default function InboxScreen({
  conversations,
  activeConversationId,
  onOpenConversation,
  onBackToList,
  onSendMessage,
  onDeleteConversation,
  onTogglePinConversation,
}: Props) {
  const [draft, setDraft] = useState('');
  const [openSwipe, setOpenSwipe] = useState<{ id: string; action: SwipeAction } | null>(null);
  const [swipe, setSwipe] = useState<SwipeState | null>(null);
  const swipeRef = useRef<SwipeState | null>(null);
  const swipeMoved = useRef(false);
  const suppressNextClick = useRef(false);
  const activeConversation = useMemo(
    () => conversations.find((conversation) => conversation.id === activeConversationId) ?? null,
    [activeConversationId, conversations]
  );

  const submit = () => {
    if (!activeConversation || !draft.trim()) return;
    onSendMessage(activeConversation.id, draft);
    setDraft('');
  };
  const beginSwipe = (event: React.PointerEvent<HTMLDivElement>, id: string) => { if (event.pointerType === 'mouse' && event.button !== 0) return; event.currentTarget.setPointerCapture(event.pointerId); swipeMoved.current = false; const next = { id, startX: event.clientX, offset: 0, action: null as SwipeAction | null }; swipeRef.current = next; setSwipe(next); };
  const moveSwipe = (event: React.PointerEvent<HTMLDivElement>, id: string) => { const activeSwipe = swipeRef.current; if (!activeSwipe || activeSwipe.id !== id) return; const delta = event.clientX - activeSwipe.startX; if (Math.abs(delta) < 4) return; event.preventDefault(); swipeMoved.current = true; const next = { ...activeSwipe, offset: Math.max(-88, Math.min(88, delta)), action: delta < 0 ? 'delete' as const : 'pin' as const }; swipeRef.current = next; setSwipe(next); };
  const endSwipe = (event: React.PointerEvent<HTMLDivElement>, id: string, openTap = true) => {
    const activeSwipe = swipeRef.current;
    if (!activeSwipe || activeSwipe.id !== id) return;
    const action = Math.abs(activeSwipe.offset) >= 52 ? activeSwipe.action : null;
    setOpenSwipe(action ? { id, action } : null);
    swipeRef.current = null;
    setSwipe(null);
    if (!action && openTap && !swipeMoved.current) {
      suppressNextClick.current = true;
      onOpenConversation(id);
    }
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  };

  const triggerSwipeAction = (
    event: React.PointerEvent<HTMLButtonElement>,
    conversationId: string,
    action: SwipeAction,
  ) => {
    event.preventDefault();
    event.stopPropagation();
    setOpenSwipe(null);
    if (action === 'delete') {
      onDeleteConversation(conversationId);
      return;
    }
    onTogglePinConversation(conversationId);
  };

  if (activeConversation) {
    return (
      <>
        <div className="app-header">
          <div className="logo"><AppLogo /></div>
        </div>

        <div className="inbox-chat-header">
          <button className="inbox-chat-back" type="button" onClick={onBackToList} aria-label="Back to inbox">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <div className="inbox-chat-header-main">
            <div className="inbox-chat-header-avatar">
              <img src={activeConversation.participantPhoto} alt={activeConversation.participantName} />
            </div>
            <div className="inbox-chat-title-block">
              <div className="inbox-chat-name-row">
                <div className="inbox-chat-title">{activeConversation.participantName}</div>
                <div className="inbox-chat-role">{activeConversation.participantRole}</div>
              </div>
              <div className="inbox-chat-subtitle">
                {activeConversation.listingTitle} · {activeConversation.listingLocation}
              </div>
            </div>
          </div>
        </div>

        <div className="inbox-chat-thread">
          {activeConversation.messages.map((message) => (
            <div
              key={message.id}
              className={`inbox-bubble-row ${message.author === 'self' ? 'self' : 'other'}`}
            >
              <div className={`inbox-bubble ${message.author === 'self' ? 'self' : 'other'}`}>
                <div>{message.text}</div>
                <div className="inbox-bubble-time">{formatMessageTime(message.timestamp)}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="inbox-composer">
          <textarea
            className="inbox-composer-input"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder={`Message ${activeConversation.participantName.split(' ')[0]}...`}
            rows={1}
          />
          <button className="inbox-send-btn" type="button" onClick={submit}>
            Send
          </button>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="app-header">
        <div className="logo"><AppLogo /></div>
      </div>

      <div className="section-header">
        <span className="section-title">Chat</span>
      </div>

      <div className="scroll-area">
        <div className="inbox-list">
          {conversations.map((conversation) => {
            const lastMessage = conversation.messages[conversation.messages.length - 1];
            const isOpen = openSwipe?.id === conversation.id;
            const offset = swipe?.id === conversation.id ? swipe.offset : isOpen ? (openSwipe.action === 'delete' ? -88 : 88) : 0;
            return (
              <div
                key={conversation.id}
                className={`inbox-swipe-row ${isOpen ? 'is-open' : ''}`}
                onPointerDown={(event) => { if (!(event.target as HTMLElement).closest('.inbox-swipe-action')) beginSwipe(event, conversation.id); }} onPointerMove={(event) => moveSwipe(event, conversation.id)} onPointerUp={(event) => { if (!(event.target as HTMLElement).closest('.inbox-swipe-action')) endSwipe(event, conversation.id); }} onPointerCancel={(event) => endSwipe(event, conversation.id, false)}
              >
                <div className="inbox-swipe-actions">
                  <button className="inbox-swipe-action inbox-pin-action" type="button" aria-label={conversation.pinned ? 'Unpin conversation' : 'Pin conversation'} onPointerDown={(event) => triggerSwipeAction(event, conversation.id, 'pin')}><span className="inbox-action-icon">{conversation.pinned ? '★' : '☆'}</span><span>{conversation.pinned ? 'Unpin' : 'Pin'}</span></button>
                  <button className="inbox-swipe-action inbox-delete-action" type="button" aria-label="Delete conversation" onPointerDown={(event) => triggerSwipeAction(event, conversation.id, 'delete')}><span className="inbox-action-icon">×</span><span>Delete</span></button>
                </div>
                <button className="inbox-item" type="button" style={{ transform: `translateX(${offset}px)` }} onClick={() => { if (suppressNextClick.current) { suppressNextClick.current = false; return; } if (swipeMoved.current) { swipeMoved.current = false; return; } if (isOpen) { setOpenSwipe(null); return; } onOpenConversation(conversation.id); }}>
                <div className="inbox-avatar"><img src={conversation.participantPhoto} alt="" /></div>
                <div className="inbox-info">
                  <div className="inbox-name">{conversation.participantName}</div>
                  <div className="inbox-preview">{lastMessage?.text}</div>
                  <div className="inbox-listing-meta">{conversation.listingTitle}</div>
                </div>
                <div className="inbox-meta">
                  <div className="inbox-time">{lastMessage ? formatConversationTime(lastMessage.timestamp) : ''}</div>
                  {conversation.unreadCount > 0 && <div className="inbox-unread">{conversation.unreadCount}</div>}
                </div>
                </button>
              </div>
            );
          })}
        </div>

      </div>
    </>
  );
}
