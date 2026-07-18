import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from 'react';
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

type ThreadMessage = Conversation['messages'][number] & {
  createdAt: number;
  isPinned: boolean;
  isDeleting: boolean;
  deleteDirection: SwipeSide | null;
};

type SwipeState = {
  messageId: string;
  pointerId: number;
  startX: number;
  startY: number;
  startOffset: number;
  offset: number;
  locked: boolean;
};

type OpenAction = {
  messageId: string;
  side: SwipeSide;
} | null;

type ConversationSwipeState = {
  conversationId: string;
  pointerId: number;
  startX: number;
  startY: number;
  startOffset: number;
  offset: number;
  locked: boolean;
};

type ConversationOpenAction = {
  conversationId: string;
  side: SwipeSide;
} | null;

const ACTION_WIDTH = 92;
const REVEAL_THRESHOLD = 12;
const COMMIT_THRESHOLD = 56;
const MAX_SWIPE = 116;

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

function orderConversationsLocal(conversations: Conversation[]): Conversation[] {
  return [...conversations].sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    const timeDiff = (b.messages[b.messages.length - 1]?.timestamp ?? 0) - (a.messages[a.messages.length - 1]?.timestamp ?? 0);
    if (timeDiff !== 0) return timeDiff;
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
  if (offset >= 0) return 'pin' as const;
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

export default function InboxScreen({
  conversations,
  activeConversationId,
  onOpenConversation,
  onBackToList,
  onSendMessage,
}: Props) {
  const [draft, setDraft] = useState('');
  const [conversationRows, setConversationRows] = useState<Conversation[]>(() => orderConversationsLocal(conversations));
  const [threadMessagesByConversation, setThreadMessagesByConversation] = useState<Record<string, ThreadMessage[]>>({});
  const [openAction, setOpenAction] = useState<OpenAction>(null);
  const [swipe, setSwipe] = useState<SwipeState | null>(null);
  const [conversationOpenAction, setConversationOpenAction] = useState<ConversationOpenAction>(null);
  const [conversationSwipe, setConversationSwipe] = useState<ConversationSwipeState | null>(null);
  const [profilePeekConversationId, setProfilePeekConversationId] = useState<string | null>(null);
  const activeConversation = useMemo(
    () => conversationRows.find((conversation) => conversation.id === activeConversationId) ?? null,
    [activeConversationId, conversationRows]
  );
  const rowRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const conversationRowRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const prevRectsRef = useRef<Map<string, DOMRect>>(new Map());
  const prevConversationRectsRef = useRef<Map<string, DOMRect>>(new Map());
  const deleteTimersRef = useRef<Record<string, number>>({});
  const hiddenIdsRef = useRef<Record<string, Set<string>>>({});
  const hiddenConversationIdsRef = useRef<Set<string>>(new Set());
  const suppressConversationClickRef = useRef<string | null>(null);

  const captureRects = useCallback(() => {
    if (!activeConversation) return;
    const rects = new Map<string, DOMRect>();
    const messages = threadMessagesByConversation[activeConversation.id] ?? activeConversation.messages.map(toThreadMessage);
    messages.forEach((message) => {
      const node = rowRefs.current[message.id];
      if (node) rects.set(message.id, node.getBoundingClientRect());
    });
    prevRectsRef.current = rects;
  }, [activeConversation, threadMessagesByConversation]);

  useEffect(() => {
    setConversationRows((current) => {
      const currentById = new Map(current.map((conversation) => [conversation.id, conversation]));
      const hidden = hiddenConversationIdsRef.current;
      return orderConversationsLocal(
        conversations
          .map((conversation) => {
            const existing = currentById.get(conversation.id);
            return existing ? { ...conversation, pinned: existing.pinned } : conversation;
          })
          .filter((conversation) => !hidden.has(conversation.id))
      );
    });
  }, [conversations]);

  useEffect(() => {
    if (!activeConversation) return;

    setOpenAction(null);
    setSwipe(null);
    setConversationSwipe(null);
    setConversationOpenAction(null);
    setProfilePeekConversationId(null);

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
  }, [activeConversation]);

  useLayoutEffect(() => {
    if (!activeConversation) return;
    const prevRects = prevRectsRef.current;
    if (prevRects.size === 0) return;

    const currentMessages = threadMessagesByConversation[activeConversation.id] ?? activeConversation.messages.map(toThreadMessage);
    currentMessages.forEach((message) => {
      const node = rowRefs.current[message.id];
      const prevRect = prevRects.get(message.id);
      if (!node || !prevRect) return;
      const nextRect = node.getBoundingClientRect();
      const dx = prevRect.left - nextRect.left;
      const dy = prevRect.top - nextRect.top;
      if (dx || dy) {
        node.animate(
          [
            { transform: `translate(${dx}px, ${dy}px)` },
            { transform: 'translate(0, 0)' },
          ],
          { duration: 240, easing: 'cubic-bezier(0.2, 0, 0, 1)' }
        );
      }
    });

    prevRectsRef.current = new Map();
  }, [activeConversation, threadMessagesByConversation]);

  useLayoutEffect(() => {
    if (activeConversation) return;
    const prevRects = prevConversationRectsRef.current;
    if (prevRects.size === 0) return;

    conversationRows.forEach((conversation) => {
      const node = conversationRowRefs.current[conversation.id];
      const prevRect = prevRects.get(conversation.id);
      if (!node || !prevRect) return;
      const nextRect = node.getBoundingClientRect();
      const dx = prevRect.left - nextRect.left;
      const dy = prevRect.top - nextRect.top;
      if (dx || dy) {
        node.animate(
          [
            { transform: `translate(${dx}px, ${dy}px)` },
            { transform: 'translate(0, 0)' },
          ],
          { duration: 240, easing: 'cubic-bezier(0.2, 0, 0, 1)' }
        );
      }
    });

    prevConversationRectsRef.current = new Map();
  }, [activeConversation, conversationRows]);

  useEffect(() => {
    return () => {
      Object.values(deleteTimersRef.current).forEach((timer) => window.clearTimeout(timer));
    };
  }, []);

  const currentMessages = useMemo(() => {
    if (!activeConversation) return [];
    return threadMessagesByConversation[activeConversation.id] ?? activeConversation.messages.map(toThreadMessage);
  }, [activeConversation, threadMessagesByConversation]);

  const submit = () => {
    if (!activeConversation || !draft.trim()) return;
    onSendMessage(activeConversation.id, draft);
    setDraft('');
  };

  const restoreOpenAction = useCallback((messageId: string, side: SwipeSide | null) => {
    if (!side) {
      setOpenAction((current) => (current?.messageId === messageId ? null : current));
      return;
    }
    setOpenAction({ messageId, side });
  }, []);

  const setConversationMessages = useCallback(
    (updater: (messages: ThreadMessage[]) => ThreadMessage[]) => {
      if (!activeConversation) return;
      setThreadMessagesByConversation((prev) => {
        const current = prev[activeConversation.id] ?? activeConversation.messages.map(toThreadMessage);
        const next = updater(current);
        return { ...prev, [activeConversation.id]: next };
      });
    },
    [activeConversation]
  );

  const commitPinToggle = useCallback((messageId: string) => {
    if (!activeConversation) return;
    captureRects();
    setSwipe(null);
    setOpenAction(null);
    setConversationMessages((messages) =>
      orderThreadMessages(
        messages.map((message) =>
          message.id === messageId
            ? { ...message, isPinned: !message.isPinned }
            : message
        )
      )
    );
  }, [activeConversation, captureRects, setConversationMessages]);

  const commitDelete = useCallback((messageId: string, direction: SwipeSide) => {
    if (!activeConversation) return;
    setSwipe(null);
    setOpenAction(null);

    setConversationMessages((messages) =>
      messages.map((message) =>
        message.id === messageId
          ? { ...message, isDeleting: true, deleteDirection: direction }
          : message
      )
    );

    const timerKey = `${activeConversation.id}:${messageId}`;
    const existingTimer = deleteTimersRef.current[timerKey];
    if (existingTimer) window.clearTimeout(existingTimer);

    deleteTimersRef.current[timerKey] = window.setTimeout(() => {
      deleteTimersRef.current[timerKey] = 0;
      captureRects();
      const hidden = hiddenIdsRef.current[activeConversation.id] ?? new Set<string>();
      hidden.add(messageId);
      hiddenIdsRef.current[activeConversation.id] = hidden;
      setThreadMessagesByConversation((prev) => {
        const current = prev[activeConversation.id] ?? [];
        const next = current.filter((message) => message.id !== messageId);
        return { ...prev, [activeConversation.id]: next };
      });
      delete deleteTimersRef.current[timerKey];
    }, 220);
  }, [activeConversation, captureRects, setConversationMessages]);

  const captureConversationRects = useCallback(() => {
    const rects = new Map<string, DOMRect>();
    conversationRows.forEach((conversation) => {
      const node = conversationRowRefs.current[conversation.id];
      if (node) rects.set(conversation.id, node.getBoundingClientRect());
    });
    prevConversationRectsRef.current = rects;
  }, [conversationRows]);

  const commitConversationPinToggle = useCallback((conversationId: string) => {
    captureConversationRects();
    setConversationSwipe(null);
    setConversationOpenAction(null);
    suppressConversationClickRef.current = conversationId;
    setConversationRows((current) =>
      orderConversationsLocal(
        current.map((conversation) =>
          conversation.id === conversationId
            ? { ...conversation, pinned: !conversation.pinned }
            : conversation
        )
      )
    );
  }, [captureConversationRects]);

  const commitConversationDelete = useCallback((conversationId: string) => {
    captureConversationRects();
    setConversationSwipe(null);
    setConversationOpenAction(null);
    suppressConversationClickRef.current = conversationId;
    hiddenConversationIdsRef.current.add(conversationId);
    setConversationRows((current) => current.filter((conversation) => conversation.id !== conversationId));
    if (activeConversationId === conversationId) {
      onBackToList();
    }
  }, [activeConversationId, captureConversationRects, onBackToList]);

  const handleConversationPointerDown = useCallback((
    event: ReactPointerEvent<HTMLDivElement>,
    conversationId: string,
  ) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;

    if (conversationOpenAction && conversationOpenAction.conversationId !== conversationId) {
      setConversationOpenAction(null);
    }

    const existing = conversationOpenAction?.conversationId === conversationId ? actionOffset(conversationOpenAction.side) : 0;
    setConversationSwipe({
      conversationId,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      startOffset: existing,
      offset: existing,
      locked: false,
    });

    event.currentTarget.setPointerCapture(event.pointerId);
  }, [conversationOpenAction]);

  const handleConversationPointerMove = useCallback((
    event: ReactPointerEvent<HTMLDivElement>,
    conversationId: string,
  ) => {
    if (!conversationSwipe || conversationSwipe.conversationId !== conversationId) return;

    const dx = event.clientX - conversationSwipe.startX;
    const dy = event.clientY - conversationSwipe.startY;
    const absX = Math.abs(dx);
    const absY = Math.abs(dy);

    if (!conversationSwipe.locked) {
      if (absX < 6 && absY < 6) return;
      if (absY > 18 && absY > absX * 1.2) {
        setConversationSwipe(null);
        return;
      }
      if (absX < 10 || absX < absY + 4) return;
      setConversationSwipe((current) => (current ? { ...current, locked: true } : current));
    }

    event.preventDefault();
    const nextOffset = clamp(conversationSwipe.startOffset + dx, -MAX_SWIPE, MAX_SWIPE);
    setConversationSwipe((current) => (current && current.conversationId === conversationId ? { ...current, locked: true, offset: nextOffset } : current));
    const side = Math.abs(nextOffset) >= REVEAL_THRESHOLD ? swipeSideFromOffset(nextOffset) : null;
    if (side) {
      setConversationOpenAction({ conversationId, side });
      suppressConversationClickRef.current = conversationId;
    } else if (Math.abs(nextOffset) < REVEAL_THRESHOLD && conversationOpenAction?.conversationId !== conversationId) {
      setConversationOpenAction(null);
    }
  }, [conversationOpenAction, conversationSwipe]);

  const handleConversationPointerUp = useCallback((
    event: ReactPointerEvent<HTMLDivElement>,
    conversationId: string,
  ) => {
    if (!conversationSwipe || conversationSwipe.conversationId !== conversationId) return;

    try {
      event.currentTarget.releasePointerCapture(event.pointerId);
    } catch {
      // ignore capture release issues on browsers that already released it
    }

    const offset = clamp(conversationSwipe.offset, -MAX_SWIPE, MAX_SWIPE);
    const resolvedSide = Math.abs(offset) >= COMMIT_THRESHOLD
      ? swipeSideFromOffset(offset)
      : conversationSwipe.startOffset > 0
        ? 'pin'
        : conversationSwipe.startOffset < 0
          ? 'delete'
          : null;

    setConversationSwipe(null);
    if (resolvedSide) {
      setConversationOpenAction({ conversationId, side: resolvedSide });
      suppressConversationClickRef.current = conversationId;
    } else {
      setConversationOpenAction((current) => (current?.conversationId === conversationId ? null : current));
    }
  }, [conversationSwipe]);

  const handleConversationPointerCancel = useCallback((conversationId: string) => {
    if (!conversationSwipe || conversationSwipe.conversationId !== conversationId) return;
    setConversationSwipe(null);
    setConversationOpenAction((current) => {
      const resolvedSide = Math.abs(conversationSwipe.offset) >= COMMIT_THRESHOLD
        ? swipeSideFromOffset(conversationSwipe.offset)
        : conversationSwipe.startOffset > 0
          ? 'pin'
          : conversationSwipe.startOffset < 0
            ? 'delete'
            : null;
      return resolvedSide ? { conversationId, side: resolvedSide } : (current?.conversationId === conversationId ? null : current);
    });
  }, [conversationSwipe]);

  const handleThreadPointerDown = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) {
      setOpenAction(null);
      setSwipe(null);
    }
  }, []);

  const handleRowPointerDown = useCallback((
    event: ReactPointerEvent<HTMLDivElement>,
    messageId: string,
  ) => {
    if (!activeConversation) return;
    if (event.pointerType === 'mouse' && event.button !== 0) return;

    if (openAction && openAction.messageId !== messageId) {
      setOpenAction(null);
    }

    const existing = openAction?.messageId === messageId ? actionOffset(openAction.side) : 0;
    setSwipe({
      messageId,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      startOffset: existing,
      offset: existing,
      locked: false,
    });

    event.currentTarget.setPointerCapture(event.pointerId);
  }, [activeConversation, openAction]);

  const handleRowPointerMove = useCallback((
    event: ReactPointerEvent<HTMLDivElement>,
    messageId: string,
  ) => {
    if (!swipe || swipe.messageId !== messageId) return;

    const dx = event.clientX - swipe.startX;
    const dy = event.clientY - swipe.startY;
    const absX = Math.abs(dx);
    const absY = Math.abs(dy);

    if (!swipe.locked) {
      if (absX < 6 && absY < 6) return;
      if (absY > 18 && absY > absX * 1.2) {
        setSwipe(null);
        return;
      }
      if (absX < 10 || absX < absY + 4) return;
      setSwipe((current) => (current ? { ...current, locked: true } : current));
    }

    event.preventDefault();
    const nextOffset = clamp(swipe.startOffset + dx, -MAX_SWIPE, MAX_SWIPE);
    setSwipe((current) => (current && current.messageId === messageId ? { ...current, locked: true, offset: nextOffset } : current));
    const side = Math.abs(nextOffset) >= REVEAL_THRESHOLD ? swipeSideFromOffset(nextOffset) : null;
    if (side) {
      setOpenAction({ messageId, side });
    } else if (Math.abs(nextOffset) < REVEAL_THRESHOLD && openAction?.messageId !== messageId) {
      setOpenAction(null);
    }
  }, [openAction, swipe]);

  const handleRowPointerUp = useCallback((
    event: ReactPointerEvent<HTMLDivElement>,
    messageId: string,
  ) => {
    if (!swipe || swipe.messageId !== messageId) return;

    try {
      event.currentTarget.releasePointerCapture(event.pointerId);
    } catch {
      // ignore capture release issues on browsers that already released it
    }

    const offset = clamp(swipe.offset, -MAX_SWIPE, MAX_SWIPE);
    const resolvedSide = Math.abs(offset) >= COMMIT_THRESHOLD
      ? swipeSideFromOffset(offset)
      : swipe.startOffset > 0
        ? 'pin'
        : swipe.startOffset < 0
          ? 'delete'
          : null;

    setSwipe(null);
    restoreOpenAction(messageId, resolvedSide);

  }, [restoreOpenAction, swipe]);

  const handleRowPointerCancel = useCallback((messageId: string) => {
    if (!swipe || swipe.messageId !== messageId) return;
    setSwipe(null);
    restoreOpenAction(messageId, Math.abs(swipe.offset) >= COMMIT_THRESHOLD ? swipeSideFromOffset(swipe.offset) : (swipe.startOffset > 0 ? 'pin' : swipe.startOffset < 0 ? 'delete' : null));
  }, [restoreOpenAction, swipe]);

  const handleActionClick = useCallback((messageId: string, action: SwipeSide) => {
    if (action === 'pin') {
      commitPinToggle(messageId);
    } else {
      commitDelete(messageId, 'delete');
    }
  }, [commitDelete, commitPinToggle]);

  const getMessageOffset = useCallback((message: ThreadMessage) => {
    if (swipe?.messageId === message.id) {
      return clamp(swipe.offset, -MAX_SWIPE, MAX_SWIPE);
    }
    if (openAction?.messageId === message.id) return actionOffset(openAction.side);
    return 0;
  }, [openAction, swipe]);

  const getConversationOffset = useCallback((conversation: Conversation) => {
    if (conversationSwipe?.conversationId === conversation.id) {
      return clamp(conversationSwipe.offset, -MAX_SWIPE, MAX_SWIPE);
    }
    if (conversationOpenAction?.conversationId === conversation.id) return actionOffset(conversationOpenAction.side);
    return 0;
  }, [conversationOpenAction, conversationSwipe]);

  const handleConversationCardClick = useCallback((conversationId: string) => {
    if (suppressConversationClickRef.current === conversationId) {
      suppressConversationClickRef.current = null;
      return;
    }
    if (conversationSwipe || conversationOpenAction) {
      setConversationSwipe(null);
      setConversationOpenAction(null);
      return;
    }
    onOpenConversation(conversationId);
  }, [conversationOpenAction, conversationSwipe, onOpenConversation]);

  const profilePeekConversation = profilePeekConversationId
    ? conversations.find((conversation) => conversation.id === profilePeekConversationId) ?? null
    : null;

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

        <div className="inbox-chat-thread" onPointerDown={handleThreadPointerDown}>
          {currentMessages.map((message) => {
            const offset = getMessageOffset(message);
            const revealSide =
              swipe?.messageId === message.id
                ? (offset > 0 ? 'pin' : offset < 0 ? 'delete' : null)
                : openAction?.messageId === message.id
                  ? openAction.side
                  : null;

            return (
              <div
                key={message.id}
                className={`inbox-message-swipe-row ${message.isDeleting ? `is-deleting ${message.deleteDirection ?? ''}` : ''}`}
                ref={(node) => {
                  rowRefs.current[message.id] = node;
                }}
                onPointerDown={(event) => handleRowPointerDown(event, message.id)}
                onPointerMove={(event) => handleRowPointerMove(event, message.id)}
                onPointerUp={(event) => handleRowPointerUp(event, message.id)}
                onPointerCancel={() => handleRowPointerCancel(message.id)}
              >
                <div className={`inbox-message-actions inbox-message-actions-left ${revealSide === 'pin' ? 'show' : ''}`}>
                  <button
                    type="button"
                    className="inbox-message-action inbox-pin-action"
                    onPointerDown={(event) => event.stopPropagation()}
                    onClick={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      handleActionClick(message.id, 'pin');
                    }}
                  >
                    <PinIcon />
                    <span>{message.isPinned ? 'Unpin' : 'Pin'}</span>
                  </button>
                </div>
                <div className={`inbox-message-actions inbox-message-actions-right ${revealSide === 'delete' ? 'show' : ''}`}>
                  <button
                    type="button"
                    className="inbox-message-action inbox-delete-action"
                    onPointerDown={(event) => event.stopPropagation()}
                    onClick={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      handleActionClick(message.id, 'delete');
                    }}
                  >
                    <DeleteIcon />
                    <span>Delete</span>
                  </button>
                </div>
                <div
                  className={`inbox-bubble-row ${message.author === 'self' ? 'self' : 'other'} ${message.isPinned ? 'is-pinned' : ''}`}
                  style={{ transform: `translate3d(${offset}px, 0, 0)` } as CSSProperties}
                >
                  <div className={`inbox-bubble ${message.author === 'self' ? 'self' : 'other'}`}>
                    <div className="inbox-bubble-top">
                      {message.isPinned && <span className="inbox-message-pin-badge">Pinned</span>}
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
          <button className="inbox-send-btn" type="button" onClick={submit}>
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

      <div className="scroll-area" onPointerDown={(event) => {
        if (event.target === event.currentTarget) {
          setConversationOpenAction(null);
          setConversationSwipe(null);
        }
      }}>
        <div className="inbox-list">
          {conversationRows.map((conversation) => {
            const lastMessage = conversation.messages[conversation.messages.length - 1];
            const offset = getConversationOffset(conversation);
            const revealSide =
              conversationSwipe?.conversationId === conversation.id
                ? (offset > 0 ? 'pin' : offset < 0 ? 'delete' : null)
                : conversationOpenAction?.conversationId === conversation.id
                  ? conversationOpenAction.side
                  : null;

            return (
              <div
                key={conversation.id}
                className="inbox-item-swipe-row"
                ref={(node) => {
                  conversationRowRefs.current[conversation.id] = node;
                }}
                onPointerDown={(event) => handleConversationPointerDown(event, conversation.id)}
                onPointerMove={(event) => handleConversationPointerMove(event, conversation.id)}
                onPointerUp={(event) => handleConversationPointerUp(event, conversation.id)}
                onPointerCancel={() => handleConversationPointerCancel(conversation.id)}
              >
                <div className={`inbox-message-actions inbox-message-actions-left inbox-conversation-actions-left ${revealSide === 'pin' ? 'show' : ''}`}>
                  <button
                    type="button"
                    className="inbox-message-action inbox-pin-action"
                    onPointerDown={(event) => event.stopPropagation()}
                    onClick={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      commitConversationPinToggle(conversation.id);
                    }}
                  >
                    <PinIcon />
                    <span>{conversation.pinned ? 'Unpin' : 'Pin'}</span>
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
                      commitConversationDelete(conversation.id);
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
                  onClick={() => handleConversationCardClick(conversation.id)}
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
