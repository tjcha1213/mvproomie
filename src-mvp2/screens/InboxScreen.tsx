import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from 'react';
import AppLogo from '../components/AppLogo';
import type { Conversation } from '../chat';
import ProfilePeekModal from '../../src/components/ProfilePeekModal';

interface Props {
  conversations: Conversation[];
  activeConversationId: string | null;
  onOpenConversation: (conversationId: string) => void;
  onBackToList: () => void;
  onSendMessage: (conversationId: string, text: string) => void;
}

type SwipeSide = 'delete' | 'pin';
type SwipeKind = 'message' | 'conversation';

type ThreadMessage = Conversation['messages'][number] & {
  createdAt: number;
  isPinned: boolean;
  isDeleting: boolean;
  deleteDirection: SwipeSide | null;
};

type SwipeSession = {
  kind: SwipeKind;
  id: string;
  pointerId: number;
  startX: number;
  startY: number;
  startOffset: number;
  offset: number;
  locked: boolean;
};

type ConversationMeta = {
  pinned: boolean;
  hidden: boolean;
  deleting: boolean;
  deleteDirection: SwipeSide | null;
};

const ACTION_WIDTH = 92;
const REVEAL_THRESHOLD = 10;
const COMMIT_THRESHOLD = 48;
const MAX_SWIPE = 116;
const VERTICAL_CANCEL_DISTANCE = 22;
const VERTICAL_CANCEL_RATIO = 1.15;
const SWIPE_LOCK_THRESHOLD = 8;

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

function toThreadMessage(message: Conversation['messages'][number]): ThreadMessage {
  return {
    ...message,
    createdAt: message.timestamp,
    isPinned: false,
    isDeleting: false,
    deleteDirection: null,
  };
}

function orderThreadMessages(messages: ThreadMessage[]): ThreadMessage[] {
  return [...messages].sort((a, b) => {
    if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
    if (a.createdAt !== b.createdAt) return a.createdAt - b.createdAt;
    return a.id.localeCompare(b.id);
  });
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function actionOffset(side: SwipeSide | null) {
  if (side === 'pin') return ACTION_WIDTH;
  if (side === 'delete') return -ACTION_WIDTH;
  return 0;
}

function swipeSideFromOffset(offset: number) {
  if (offset > 0) return 'pin' as const;
  if (offset < 0) return 'delete' as const;
  return null;
}

function DeleteIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M9 3.75h6m-8.25 3h10.5m-9 0 .75 12a1.5 1.5 0 0 0 1.5 1.5h4.5a1.5 1.5 0 0 0 1.5-1.5l.75-12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M10 9.75v6m4-6v6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function PinIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M14.75 3.75 20.25 9.25l-2.25 2.25-2.75-.75-2.5 2.5.75 2.75-2.25 2.25-3-3-4.25 4.25-.75-.75 4.25-4.25-3-3 2.25-2.25 2.75.75 2.5-2.5-.75-2.75 2.25-2.25Z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
  );
}

function UnpinIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M6.75 5.25 18.75 17.25" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M14.75 3.75 20.25 9.25l-2.25 2.25-2.75-.75-2.5 2.5.75 2.75-2.25 2.25-3-3-4.25 4.25-.75-.75 4.25-4.25-3-3 2.25-2.25 2.75.75 2.5-2.5-.75-2.75 2.25-2.25Z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
  );
}

export default function InboxScreen({
  conversations,
  activeConversationId,
  onOpenConversation,
  onBackToList,
  onSendMessage,
}: Props) {
  const [draft, setDraft] = useState('');
  const [threadMessagesByConversation, setThreadMessagesByConversation] = useState<Record<string, ThreadMessage[]>>({});
  const [openAction, setOpenAction] = useState<{ messageId: string; side: SwipeSide } | null>(null);
  const [listOpenAction, setListOpenAction] = useState<{ conversationId: string; side: SwipeSide } | null>(null);
  const [swipe, setSwipe] = useState<SwipeSession | null>(null);
  const [conversationMetaById, setConversationMetaById] = useState<Record<string, ConversationMeta>>({});
  const [messagePinStateByConversation, setMessagePinStateByConversation] = useState<Record<string, Record<string, boolean>>>({});
  const [profilePeekConversationId, setProfilePeekConversationId] = useState<string | null>(null);
  const activeConversation = useMemo(
    () => conversations.find((conversation) => conversation.id === activeConversationId) ?? null,
    [activeConversationId, conversations]
  );
  const deleteTimersRef = useRef<Record<string, number>>({});
  const hiddenIdsRef = useRef<Record<string, Set<string>>>({});
  const swipeRef = useRef<SwipeSession | null>(null);
  const activeConversationIdRef = useRef<string | null>(activeConversationId);

  useEffect(() => {
    activeConversationIdRef.current = activeConversationId;
  }, [activeConversationId]);

  const setSwipeState = useCallback((next: SwipeSession | null) => {
    swipeRef.current = next;
    setSwipe(next);
  }, []);

  useEffect(() => {
    setConversationMetaById((prev) => {
      const next = { ...prev };
      for (const conversation of conversations) {
        if (!next[conversation.id]) {
          next[conversation.id] = {
            pinned: false,
            hidden: false,
            deleting: false,
            deleteDirection: null,
          };
        }
      }
      return next;
    });
  }, [conversations]);

  useEffect(() => {
    if (!activeConversation) return;

    setSwipeState(null);
    setOpenAction(null);
    setListOpenAction(null);
    setProfilePeekConversationId(null);
    setMessagePinStateByConversation((prev) => {
      if (prev[activeConversation.id]) return prev;
      return {
        ...prev,
        [activeConversation.id]: {},
      };
    });

    setThreadMessagesByConversation((prev) => {
      const hidden = hiddenIdsRef.current[activeConversation.id] ?? new Set<string>();
      const existing = prev[activeConversation.id] ?? [];
      const existingById = new Map(existing.map((message) => [message.id, message]));
      const next = orderThreadMessages(
        activeConversation.messages
          .map((message) => {
            const existingMessage = existingById.get(message.id);
            if (existingMessage) {
              return {
                ...existingMessage,
                author: message.author,
                text: message.text,
                createdAt: message.timestamp,
              };
            }
            return toThreadMessage(message);
          })
          .filter((message) => !hidden.has(message.id))
      );

      return {
        ...prev,
        [activeConversation.id]: next,
      };
    });
  }, [activeConversation, messagePinStateByConversation, setSwipeState]);

  useEffect(() => {
    return () => {
      Object.values(deleteTimersRef.current).forEach((timer) => window.clearTimeout(timer));
    };
  }, []);

  const currentMessages = useMemo(() => {
    if (!activeConversation) return [];
    return threadMessagesByConversation[activeConversation.id] ?? activeConversation.messages.map(toThreadMessage);
  }, [activeConversation, threadMessagesByConversation]);

  const activeConversationMessages = useMemo(() => {
    if (!activeConversation) return [];
    const pinMap = messagePinStateByConversation[activeConversation.id] ?? {};
    return orderThreadMessages(
      currentMessages.map((message) => ({
        ...message,
        isPinned: Boolean(pinMap[message.id] ?? message.isPinned),
      }))
    );
  }, [activeConversation, currentMessages, messagePinStateByConversation]);

  const conversationRows = useMemo(() => {
    return conversations
      .map((conversation, index) => ({
        conversation,
        index,
        meta: conversationMetaById[conversation.id] ?? {
          pinned: false,
          hidden: false,
          deleting: false,
          deleteDirection: null,
        },
      }))
      .filter((entry) => !entry.meta.hidden)
      .sort((a, b) => {
        if (a.meta.pinned !== b.meta.pinned) return a.meta.pinned ? -1 : 1;
        return a.index - b.index;
      })
      .map((entry) => entry.conversation);
  }, [conversationMetaById, conversations]);

  const profilePeekConversation = profilePeekConversationId
    ? conversations.find((conversation) => conversation.id === profilePeekConversationId) ?? null
    : null;

  const startSwipe = useCallback((
    kind: SwipeKind,
    id: string,
    event: ReactPointerEvent<HTMLDivElement>,
    currentOpenSide: SwipeSide | null,
    clearOtherOpen: () => void,
  ) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    const target = event.target as HTMLElement | null;
    if (target?.closest('button, textarea, input, select, a')) return;

    clearOtherOpen();

    const existing = currentOpenSide ? actionOffset(currentOpenSide) : 0;
    setSwipeState({
      kind,
      id,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      startOffset: existing,
      offset: existing,
      locked: false,
    });

    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      // ignore browsers that already transferred or do not support capture cleanly
    }
  }, [setSwipeState]);

  const beginMessageSwipe = useCallback((event: ReactPointerEvent<HTMLDivElement>, messageId: string) => {
    startSwipe(
      'message',
      messageId,
      event,
      openAction?.messageId === messageId ? openAction.side : null,
      () => {
        if (openAction && openAction.messageId !== messageId) setOpenAction(null);
      },
    );
  }, [openAction, startSwipe]);

  const beginConversationSwipe = useCallback((event: ReactPointerEvent<HTMLDivElement>, conversationId: string) => {
    startSwipe(
      'conversation',
      conversationId,
      event,
      listOpenAction?.conversationId === conversationId ? listOpenAction.side : null,
      () => {
        if (listOpenAction && listOpenAction.conversationId !== conversationId) setListOpenAction(null);
      },
    );
  }, [listOpenAction, startSwipe]);

  const updateSwipe = useCallback((clientX: number, clientY: number) => {
    const currentSwipe = swipeRef.current;
    if (!currentSwipe) return;

    const dx = clientX - currentSwipe.startX;
    const dy = clientY - currentSwipe.startY;
    const absX = Math.abs(dx);
    const absY = Math.abs(dy);

    if (!currentSwipe.locked) {
      if (absX < 6 && absY < 6) return;
      if (absY > VERTICAL_CANCEL_DISTANCE && absY > absX * VERTICAL_CANCEL_RATIO) {
        setSwipeState(null);
        return;
      }
      if (absX < SWIPE_LOCK_THRESHOLD || absX < absY + 2) return;
      setSwipeState({ ...currentSwipe, locked: true });
    }

    const nextOffset = clamp(currentSwipe.startOffset + dx, -MAX_SWIPE, MAX_SWIPE);
    setSwipeState({ ...currentSwipe, locked: true, offset: nextOffset });
  }, [setSwipeState]);

  const finishSwipe = useCallback((clientX: number, clientY: number, cancel = false) => {
    const currentSwipe = swipeRef.current;
    if (!currentSwipe) return;

    const dx = clientX - currentSwipe.startX;
    const dy = clientY - currentSwipe.startY;
    const isVertical = Math.abs(dy) > VERTICAL_CANCEL_DISTANCE && Math.abs(dy) > Math.abs(dx) * VERTICAL_CANCEL_RATIO;
    const offset = clamp(currentSwipe.offset, -MAX_SWIPE, MAX_SWIPE);
    const resolvedSide = cancel || isVertical
      ? null
      : Math.abs(offset) >= COMMIT_THRESHOLD
        ? swipeSideFromOffset(offset)
        : Math.abs(offset) >= REVEAL_THRESHOLD
          ? swipeSideFromOffset(offset)
          : currentSwipe.startOffset > 0
            ? 'pin'
            : currentSwipe.startOffset < 0
              ? 'delete'
              : null;

    setSwipeState(null);

    if (currentSwipe.kind === 'message') {
      if (resolvedSide) {
        setOpenAction({ messageId: currentSwipe.id, side: resolvedSide });
      } else {
        setOpenAction((current) => (current?.messageId === currentSwipe.id ? null : current));
      }
    } else {
      if (resolvedSide) {
        setListOpenAction({ conversationId: currentSwipe.id, side: resolvedSide });
      } else {
        setListOpenAction((current) => (current?.conversationId === currentSwipe.id ? null : current));
      }
    }
  }, [setSwipeState]);

  const toggleMessagePin = useCallback((messageId: string) => {
    if (!activeConversation) return;
    setSwipeState(null);
    setOpenAction(null);
    setMessagePinStateByConversation((prev) => {
      const currentConversationPins = prev[activeConversation.id] ?? {};
      const nextPinned = !currentConversationPins[messageId];
      return {
        ...prev,
        [activeConversation.id]: {
          ...currentConversationPins,
          [messageId]: nextPinned,
        },
      };
    });
  }, [activeConversation, setSwipeState]);

  const deleteMessage = useCallback((messageId: string) => {
    if (!activeConversation) return;
    setSwipeState(null);
    setOpenAction(null);

    setThreadMessagesByConversation((prev) => {
      const current = prev[activeConversation.id] ?? [];
      return {
        ...prev,
        [activeConversation.id]: current.map((message) =>
          message.id === messageId ? { ...message, isDeleting: true, deleteDirection: 'delete' } : message
        ),
      };
    });

    const timerKey = `${activeConversation.id}:${messageId}`;
    const existingTimer = deleteTimersRef.current[timerKey];
    if (existingTimer) window.clearTimeout(existingTimer);

    deleteTimersRef.current[timerKey] = window.setTimeout(() => {
      deleteTimersRef.current[timerKey] = 0;
      const hidden = hiddenIdsRef.current[activeConversation.id] ?? new Set<string>();
      hidden.add(messageId);
      hiddenIdsRef.current[activeConversation.id] = hidden;
      setThreadMessagesByConversation((prev) => {
        const current = prev[activeConversation.id] ?? [];
        return { ...prev, [activeConversation.id]: current.filter((message) => message.id !== messageId) };
      });
      delete deleteTimersRef.current[timerKey];
    }, 220);
  }, [activeConversation, setSwipeState]);

  const toggleConversationPin = useCallback((conversationId: string) => {
    setSwipeState(null);
    setListOpenAction(null);
    setConversationMetaById((prev) => {
      const current = prev[conversationId] ?? {
        pinned: false,
        hidden: false,
        deleting: false,
        deleteDirection: null,
      };
      return {
        ...prev,
        [conversationId]: {
          ...current,
          pinned: !current.pinned,
          hidden: false,
          deleting: false,
          deleteDirection: null,
        },
      };
    });
  }, [setSwipeState]);

  const deleteConversation = useCallback((conversationId: string) => {
    setSwipeState(null);
    setListOpenAction(null);
    setConversationMetaById((prev) => {
      const current = prev[conversationId] ?? {
        pinned: false,
        hidden: false,
        deleting: false,
        deleteDirection: null,
      };
      return {
        ...prev,
        [conversationId]: {
          ...current,
          deleting: true,
          deleteDirection: 'delete',
        },
      };
    });

    const existingTimer = deleteTimersRef.current[conversationId];
    if (existingTimer) window.clearTimeout(existingTimer);

    deleteTimersRef.current[conversationId] = window.setTimeout(() => {
      deleteTimersRef.current[conversationId] = 0;
      setConversationMetaById((prev) => {
        const current = prev[conversationId];
        if (!current) return prev;
        return {
          ...prev,
          [conversationId]: {
            ...current,
            hidden: true,
            deleting: false,
            deleteDirection: null,
          },
        };
      });
      if (activeConversationIdRef.current === conversationId) {
        onBackToList();
      }
      delete deleteTimersRef.current[conversationId];
    }, 220);
  }, [onBackToList, setSwipeState]);

  const currentMessageOffset = useCallback((message: ThreadMessage) => {
    if (swipe?.kind === 'message' && swipe.id === message.id) return clamp(swipe.offset, -MAX_SWIPE, MAX_SWIPE);
    if (openAction?.messageId === message.id) return actionOffset(openAction.side);
    return 0;
  }, [openAction, swipe]);

  const currentConversationOffset = useCallback((conversation: Conversation) => {
    if (swipe?.kind === 'conversation' && swipe.id === conversation.id) return clamp(swipe.offset, -MAX_SWIPE, MAX_SWIPE);
    if (listOpenAction?.conversationId === conversation.id) return actionOffset(listOpenAction.side);
    return 0;
  }, [listOpenAction, swipe]);

  const currentMessageSide = useCallback((message: ThreadMessage) => {
    if (swipe?.kind === 'message' && swipe.id === message.id) {
      const offset = currentMessageOffset(message);
      return offset > 0 ? 'pin' : offset < 0 ? 'delete' : null;
    }
    if (openAction?.messageId === message.id) return openAction.side;
    return null;
  }, [currentMessageOffset, openAction, swipe]);

  const currentConversationSide = useCallback((conversation: Conversation) => {
    if (swipe?.kind === 'conversation' && swipe.id === conversation.id) {
      const offset = currentConversationOffset(conversation);
      return offset > 0 ? 'pin' : offset < 0 ? 'delete' : null;
    }
    if (listOpenAction?.conversationId === conversation.id) return listOpenAction.side;
    return null;
  }, [currentConversationOffset, listOpenAction, swipe]);

  const handleConversationCardClick = useCallback((conversationId: string) => {
    if (swipeRef.current?.locked) {
      setSwipeState(null);
      setListOpenAction(null);
      return;
    }
    if (listOpenAction && listOpenAction.conversationId !== conversationId) {
      setListOpenAction(null);
    }
    onOpenConversation(conversationId);
  }, [listOpenAction, onOpenConversation, setSwipeState]);

  const profilePeekModal = (
    <ProfilePeekModal
      open={profilePeekConversation !== null}
      avatar={profilePeekConversation?.participantPhoto ?? ''}
      name={profilePeekConversation?.participantName ?? ''}
      role={profilePeekConversation?.participantRole ?? 'Landlord'}
      subtitle={profilePeekConversation ? `${profilePeekConversation.listingTitle} · ${profilePeekConversation.listingLocation}` : undefined}
      details={profilePeekConversation ? [
        `${profilePeekConversation.messages.length} messages`,
        profilePeekConversation.pinned ? 'Pinned conversation' : 'Regular conversation',
      ] : []}
      onClose={() => setProfilePeekConversationId(null)}
    />
  );

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
            <button
              type="button"
              className="inbox-chat-header-avatar inbox-chat-header-avatar-button"
              onClick={() => setProfilePeekConversationId(activeConversation.id)}
              aria-label={`View ${activeConversation.participantName} profile`}
            >
              <img src={activeConversation.participantPhoto} alt={activeConversation.participantName} />
            </button>
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

        <div className="inbox-chat-thread" onPointerDown={(event) => {
          if (event.target === event.currentTarget) {
            setOpenAction(null);
            setSwipeState(null);
          }
        }}>
          {activeConversationMessages.map((message) => {
            const offset = currentMessageOffset(message);
            const revealSide = currentMessageSide(message);
            const isPinned = Boolean(messagePinStateByConversation[activeConversation.id]?.[message.id] ?? message.isPinned);

            return (
              <div
                key={message.id}
                className={`inbox-message-swipe-row ${message.isDeleting ? `is-deleting ${message.deleteDirection ?? ''}` : ''}`}
                onPointerDown={(event) => beginMessageSwipe(event, message.id)}
                onPointerMove={(event) => {
                  if (swipe?.kind === 'message' && swipe.id === message.id) {
                    updateSwipe(event.clientX, event.clientY);
                  }
                }}
                onPointerUp={(event) => {
                  if (swipe?.kind === 'message' && swipe.id === message.id) {
                    const currentSwipe = swipeRef.current;
                    const isTapLike = Boolean(
                      currentSwipe &&
                      currentSwipe.kind === 'message' &&
                      currentSwipe.id === message.id &&
                      !currentSwipe.locked &&
                      Math.abs(event.clientX - currentSwipe.startX) < 8 &&
                      Math.abs(event.clientY - currentSwipe.startY) < 8
                    );
                    try {
                      event.currentTarget.releasePointerCapture(event.pointerId);
                    } catch {
                      // ignore
                    }
                    finishSwipe(event.clientX, event.clientY, false);
                    if (isTapLike && activeConversation) {
                      setProfilePeekConversationId(activeConversation.id);
                    }
                  }
                }}
                onPointerCancel={(event) => {
                  if (swipe?.kind === 'message' && swipe.id === message.id) {
                    try {
                      event.currentTarget.releasePointerCapture(event.pointerId);
                    } catch {
                      // ignore
                    }
                    finishSwipe(event.clientX, event.clientY, true);
                  }
                }}
              >
                <div className={`inbox-message-actions inbox-message-actions-left inbox-conversation-actions-left ${revealSide === 'pin' ? 'show' : ''}`}>
                  <button
                    type="button"
                    className={`inbox-message-action inbox-pin-action ${isPinned ? 'is-unpin' : 'is-pin'}`}
                    aria-label={isPinned ? 'Unpin message' : 'Pin message'}
                    onPointerDown={(event) => event.stopPropagation()}
                    onClick={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      toggleMessagePin(message.id);
                    }}
                  >
                    <span className="inbox-action-icon">{isPinned ? <UnpinIcon /> : <PinIcon />}</span>
                    <span className="inbox-action-text">{isPinned ? 'Unpin' : 'Pin'}</span>
                  </button>
                </div>
                <div className={`inbox-message-actions inbox-message-actions-right inbox-conversation-actions-right ${revealSide === 'delete' ? 'show' : ''}`}>
                  <button
                    type="button"
                    className="inbox-message-action inbox-delete-action"
                    onPointerDown={(event) => event.stopPropagation()}
                    onClick={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      deleteMessage(message.id);
                    }}
                  >
                    <DeleteIcon />
                    <span>Delete</span>
                  </button>
                </div>
                <div
                  className={`inbox-bubble-row ${message.author === 'self' ? 'self' : 'other'} ${isPinned ? 'is-pinned' : ''}`}
                  style={{ transform: `translate3d(${offset}px, 0, 0)` } as CSSProperties}
                >
                  <div className={`inbox-bubble ${message.author === 'self' ? 'self' : 'other'}`}>
                    <div className="inbox-bubble-top">
                      {isPinned && <span className="inbox-message-pin-badge">Pinned</span>}
                    </div>
                    <div>{message.text}</div>
                    <div className="inbox-bubble-time">{formatMessageTime(message.createdAt)}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="inbox-composer">
          <textarea
            className="inbox-composer-input"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder={`Message ${activeConversation.participantName.split(' ')[0]}...`}
            rows={1}
          />
          <button className="inbox-send-btn" type="button" onClick={() => {
            if (!activeConversation || !draft.trim()) return;
            onSendMessage(activeConversation.id, draft);
            setDraft('');
          }}>
            Send
          </button>
        </div>
        {profilePeekModal}
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

      <div
        className="scroll-area"
        onPointerDown={(event) => {
          if (event.target === event.currentTarget) {
            setListOpenAction(null);
            setSwipeState(null);
          }
        }}
      >
        <div className="inbox-list">
          {conversationRows.map((conversation) => {
            const lastMessage = conversation.messages[conversation.messages.length - 1];
            const offset = currentConversationOffset(conversation);
            const revealSide = currentConversationSide(conversation);
            const isPinned = Boolean(conversationMetaById[conversation.id]?.pinned);

            return (
              <div
                key={conversation.id}
                className="inbox-item-swipe-row"
                onPointerDown={(event) => beginConversationSwipe(event, conversation.id)}
                onPointerMove={(event) => {
                  if (swipe?.kind === 'conversation' && swipe.id === conversation.id) {
                    updateSwipe(event.clientX, event.clientY);
                  }
                }}
                onPointerUp={(event) => {
                  if (swipe?.kind === 'conversation' && swipe.id === conversation.id) {
                    const currentSwipe = swipeRef.current;
                    const isTapLike = Boolean(
                      currentSwipe &&
                      currentSwipe.kind === 'conversation' &&
                      currentSwipe.id === conversation.id &&
                      !currentSwipe.locked &&
                      Math.abs(event.clientX - currentSwipe.startX) < 8 &&
                      Math.abs(event.clientY - currentSwipe.startY) < 8
                    );
                    try {
                      event.currentTarget.releasePointerCapture(event.pointerId);
                    } catch {
                      // ignore
                    }
                    finishSwipe(event.clientX, event.clientY, false);
                    if (isTapLike) {
                      handleConversationCardClick(conversation.id);
                    }
                  }
                }}
                onPointerCancel={(event) => {
                  if (swipe?.kind === 'conversation' && swipe.id === conversation.id) {
                    try {
                      event.currentTarget.releasePointerCapture(event.pointerId);
                    } catch {
                      // ignore
                    }
                    finishSwipe(event.clientX, event.clientY, true);
                  }
                }}
              >
                <div className={`inbox-message-actions inbox-message-actions-left inbox-conversation-actions-left ${revealSide === 'pin' ? 'show' : ''}`}>
                  <button
                    type="button"
                    className={`inbox-message-action inbox-pin-action ${isPinned ? 'is-unpin' : 'is-pin'}`}
                    aria-label={isPinned ? 'Unpin conversation' : 'Pin conversation'}
                    onPointerDown={(event) => event.stopPropagation()}
                    onClick={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      toggleConversationPin(conversation.id);
                    }}
                  >
                    <span className="inbox-action-icon">{isPinned ? <UnpinIcon /> : <PinIcon />}</span>
                    <span className="inbox-action-text">{isPinned ? 'Unpin' : 'Pin'}</span>
                  </button>
                </div>
                <div className={`inbox-message-actions inbox-message-actions-right inbox-conversation-actions-right ${revealSide === 'delete' ? 'show' : ''}`}>
                  <button
                    type="button"
                    className="inbox-message-action inbox-delete-action"
                    onPointerDown={(event) => event.stopPropagation()}
                    onClick={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      deleteConversation(conversation.id);
                    }}
                  >
                    <DeleteIcon />
                    <span>Delete</span>
                  </button>
                </div>
                <div
                  className="inbox-item"
                  role="button"
                  tabIndex={0}
                  style={{ transform: `translate3d(${offset}px, 0, 0)` } as CSSProperties}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      handleConversationCardClick(conversation.id);
                    }
                  }}
                >
                  <button
                    className="inbox-avatar"
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      setProfilePeekConversationId(conversation.id);
                    }}
                    aria-label={`View ${conversation.participantName} profile`}
                  >
                    <img src={conversation.participantPhoto} alt={conversation.participantName} />
                  </button>
                  <div className="inbox-info">
                    <div className="inbox-name">{conversation.participantName}</div>
                    <div className="inbox-preview">{lastMessage?.text}</div>
                    <div className="inbox-listing-meta">{conversation.listingTitle}</div>
                  </div>
                  <div className="inbox-meta">
                    <div className="inbox-time">{lastMessage ? formatConversationTime(lastMessage.timestamp) : ''}</div>
                    {conversation.unreadCount > 0 && <div className="inbox-unread">{conversation.unreadCount}</div>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {profilePeekModal}
    </>
  );
}
