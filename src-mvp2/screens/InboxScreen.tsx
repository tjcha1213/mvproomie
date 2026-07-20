import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type MouseEvent as ReactMouseEvent, type PointerEvent as ReactPointerEvent } from 'react';
import AppLogo from '../components/AppLogo';
import type { Conversation } from '../chat';
import ProfilePeekModal from '../../src/components/ProfilePeekModal';

interface Props {
  conversations: Conversation[];
  activeConversationId: string | null;
  onOpenConversation: (conversationId: string) => void;
  readConversationIds: Record<string, boolean>;
  onMarkConversationRead: (conversationId: string) => void;
  onBackToList: () => void;
  onSendMessage: (
    conversationId: string,
    text: string,
    replyTo?: {
      name: string;
      text: string;
    }
  ) => void;
}

type SwipeSide = 'delete' | 'pin';
type SwipeKind = 'conversation';

type ThreadMessage = Conversation['messages'][number] & {
  createdAt: number;
  isPinned: boolean;
  isDeleting: boolean;
  isDeleted: boolean;
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

type MessageContextMenuState = {
  messageId: string;
  top: number;
  left: number;
  width: number;
  align: 'left' | 'right';
};

type MessageReplyTarget = {
  name: string;
  text: string;
};

const ACTION_WIDTH = 92;
const REVEAL_THRESHOLD = 10;
const COMMIT_THRESHOLD = 48;
const MAX_SWIPE = 116;
const VERTICAL_CANCEL_DISTANCE = 22;
const VERTICAL_CANCEL_RATIO = 1.15;
const SWIPE_LOCK_THRESHOLD = 8;
const MESSAGE_CONTEXT_MENU_WIDTH = 248;
const MESSAGE_LONG_PRESS_DELAY = 560;
const MESSAGE_LONG_PRESS_MOVE_TOLERANCE = 10;
const MESSAGE_REACTIONS = ['👍', '❤️', '😂', '😮', '🙏', '🔥'];

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

function latestReadSelfMessageId(conversation: Conversation): string | null {
  const messages = conversation.messages;
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index];
    if (message.author !== 'self') continue;
    const hasReceiverReplyAfter = messages.slice(index + 1).some((entry) => entry.author === 'other');
    if (hasReceiverReplyAfter) return message.id;
  }
  return null;
}

function toThreadMessage(message: Conversation['messages'][number]): ThreadMessage {
  return {
    ...message,
    createdAt: message.timestamp,
    isPinned: false,
    isDeleting: false,
    isDeleted: false,
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

function DeletedNoticeIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path d="M12 8.25v5.1" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M12 15.9h.01" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
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

function BellIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M14 18a2 2 0 0 1-4 0" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M18 16H6c1.1-1.1 1.75-2.4 1.75-4.25V10a4.25 4.25 0 0 1 8.5 0v1.75c0 1.85.65 3.15 1.75 4.25Z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
  );
}

function BellOffIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M14 18a2 2 0 0 1-4 0" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M18 16H6c1.1-1.1 1.75-2.4 1.75-4.25V10a4.25 4.25 0 0 1 8.5 0v1.75c0 1.85.65 3.15 1.75 4.25Z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M5.5 5.5 18.5 18.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export default function InboxScreen({
  conversations,
  activeConversationId,
  onOpenConversation,
  readConversationIds,
  onMarkConversationRead,
  onBackToList,
  onSendMessage,
}: Props) {
  const [draft, setDraft] = useState('');
  const [threadMessagesByConversation, setThreadMessagesByConversation] = useState<Record<string, ThreadMessage[]>>({});
  const [listOpenAction, setListOpenAction] = useState<{ conversationId: string; side: SwipeSide } | null>(null);
  const [swipe, setSwipe] = useState<SwipeSession | null>(null);
  const [conversationMetaById, setConversationMetaById] = useState<Record<string, ConversationMeta>>({});
  const [messagePinStateByConversation, setMessagePinStateByConversation] = useState<Record<string, Record<string, boolean>>>({});
  const [messageReactionByConversation, setMessageReactionByConversation] = useState<Record<string, Record<string, { emoji: string; count: number }>>>({});
  const [messageDeletedByConversation, setMessageDeletedByConversation] = useState<Record<string, Record<string, boolean>>>({});
  const [replyTarget, setReplyTarget] = useState<MessageReplyTarget | null>(null);
  const [profilePeekConversationId, setProfilePeekConversationId] = useState<string | null>(null);
  const [conversationMutedById, setConversationMutedById] = useState<Record<string, boolean>>({});
  const [conversationActionSheetId, setConversationActionSheetId] = useState<string | null>(null);
  const [messageContextMenu, setMessageContextMenu] = useState<MessageContextMenuState | null>(null);
  const activeConversation = useMemo(
    () => conversations.find((conversation) => conversation.id === activeConversationId) ?? null,
    [activeConversationId, conversations]
  );
  const deleteTimersRef = useRef<Record<string, number>>({});
  const hiddenIdsRef = useRef<Record<string, Set<string>>>({});
  const swipeRef = useRef<SwipeSession | null>(null);
  const inboxScrollerRef = useRef<HTMLDivElement | null>(null);
  const inboxScrollAnchorRef = useRef<HTMLDivElement | null>(null);
  const activeConversationIdRef = useRef<string | null>(activeConversationId);
  const suppressProfilePeekRef = useRef<{ conversationId: string; until: number } | null>(null);
  const longPressRef = useRef<{ conversationId: string; timer: number | null; startX: number; startY: number; triggered: boolean } | null>(null);
  const messageLongPressRef = useRef<{
    messageId: string;
    timer: number | null;
    startX: number;
    startY: number;
    triggered: boolean;
    rect: DOMRect | null;
  } | null>(null);

  useEffect(() => {
    activeConversationIdRef.current = activeConversationId;
  }, [activeConversationId]);

  const setSwipeState = useCallback((next: SwipeSession | null) => {
    swipeRef.current = next;
    setSwipe(next);
  }, []);

  const clearConversationLongPress = useCallback(() => {
    const current = longPressRef.current;
    if (current?.timer) window.clearTimeout(current.timer);
    longPressRef.current = null;
  }, []);

  const clearMessageLongPress = useCallback(() => {
    const current = messageLongPressRef.current;
    if (current?.timer) window.clearTimeout(current.timer);
    messageLongPressRef.current = null;
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
    setListOpenAction(null);
    setProfilePeekConversationId(null);
    setMessageContextMenu(null);
    setReplyTarget(null);
    clearMessageLongPress();
    setMessagePinStateByConversation((prev) => {
      if (prev[activeConversation.id]) return prev;
      return {
        ...prev,
        [activeConversation.id]: {},
      };
    });
    setMessageDeletedByConversation((prev) => {
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

  const scrollInboxToBottom = useCallback(() => {
    const scroller = inboxScrollerRef.current;
    const anchor = inboxScrollAnchorRef.current;
    if (!scroller) return;

    const snapToBottom = () => {
      anchor?.scrollIntoView({ block: 'end', behavior: 'auto' });
      scroller.scrollTop = scroller.scrollHeight;
    };

    window.requestAnimationFrame(() => {
      snapToBottom();
      window.requestAnimationFrame(() => {
        snapToBottom();
      });
    });
  }, []);

  const suppressConversationProfilePeek = useCallback((conversationId: string) => {
    suppressProfilePeekRef.current = {
      conversationId,
      until: Date.now() + 650,
    };
  }, []);

  const shouldSuppressConversationProfilePeek = useCallback((conversationId: string) => {
    const current = suppressProfilePeekRef.current;
    if (!current) return false;
    if (current.conversationId !== conversationId) return false;
    if (Date.now() > current.until) {
      suppressProfilePeekRef.current = null;
      return false;
    }
    return true;
  }, []);

  useLayoutEffect(() => {
    if (!activeConversation) return;
    const raf = window.requestAnimationFrame(() => {
      scrollInboxToBottom();
    });
    return () => window.cancelAnimationFrame(raf);
  }, [activeConversation?.id, activeConversation?.messages.length, replyTarget?.text, scrollInboxToBottom]);

  useEffect(() => {
    if (!activeConversation) return;
    const scroller = inboxScrollerRef.current;
    if (!scroller) return;
    const raf = window.requestAnimationFrame(() => {
      scroller.scrollTo({ top: scroller.scrollHeight, behavior: 'auto' });
    });
    return () => window.cancelAnimationFrame(raf);
  }, [activeConversation?.id, activeConversation?.messages.length]);

  const currentMessages = useMemo(() => {
    if (!activeConversation) return [];
    return threadMessagesByConversation[activeConversation.id] ?? activeConversation.messages.map(toThreadMessage);
  }, [activeConversation, threadMessagesByConversation]);

  const activeConversationMessages = useMemo(() => {
    if (!activeConversation) return [];
    const pinMap = messagePinStateByConversation[activeConversation.id] ?? {};
    const deletedMap = messageDeletedByConversation[activeConversation.id] ?? {};
    return orderThreadMessages(
      currentMessages.map((message) => ({
        ...message,
        isPinned: Boolean(pinMap[message.id] ?? message.isPinned),
        isDeleted: Boolean(deletedMap[message.id] ?? message.isDeleted),
      }))
    );
  }, [activeConversation, currentMessages, messageDeletedByConversation, messagePinStateByConversation]);

  const latestReadMessageId = useMemo(
    () => (activeConversation ? latestReadSelfMessageId(activeConversation) : null),
    [activeConversation]
  );

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

  const beginConversationSwipe = useCallback((event: ReactPointerEvent<HTMLDivElement>, conversationId: string) => {
    clearConversationLongPress();
    startSwipe(
      'conversation',
      conversationId,
      event,
      listOpenAction?.conversationId === conversationId ? listOpenAction.side : null,
      () => {
        if (listOpenAction && listOpenAction.conversationId !== conversationId) setListOpenAction(null);
      },
    );

    longPressRef.current = {
      conversationId,
      timer: window.setTimeout(() => {
        const current = longPressRef.current;
        if (!current || current.conversationId !== conversationId || current.triggered) return;
        current.triggered = true;
        setSwipeState(null);
        setListOpenAction(null);
        setConversationActionSheetId(conversationId);
      }, MESSAGE_LONG_PRESS_DELAY),
      startX: event.clientX,
      startY: event.clientY,
      triggered: false,
    };
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

    if (resolvedSide) {
      setListOpenAction({ conversationId: currentSwipe.id, side: resolvedSide });
    } else {
      setListOpenAction((current) => (current?.conversationId === currentSwipe.id ? null : current));
    }
  }, [setSwipeState]);

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

  const handleConversationLongPressAction = useCallback((action: 'read' | 'mute' | 'pin' | 'delete') => {
    if (!conversationActionSheetId) return;

    if (action === 'read') {
      onMarkConversationRead(conversationActionSheetId);
    } else if (action === 'mute') {
      setConversationMutedById((prev) => ({
        ...prev,
        [conversationActionSheetId]: !prev[conversationActionSheetId],
      }));
    } else if (action === 'pin') {
      toggleConversationPin(conversationActionSheetId);
    } else {
      deleteConversation(conversationActionSheetId);
    }

    setConversationActionSheetId(null);
  }, [conversationActionSheetId, deleteConversation, onMarkConversationRead, toggleConversationPin]);

  const currentConversationOffset = useCallback((conversation: Conversation) => {
    if (swipe?.kind === 'conversation' && swipe.id === conversation.id) return clamp(swipe.offset, -MAX_SWIPE, MAX_SWIPE);
    if (listOpenAction?.conversationId === conversation.id) return actionOffset(listOpenAction.side);
    return 0;
  }, [listOpenAction, swipe]);

  const currentConversationSide = useCallback((conversation: Conversation) => {
    if (swipe?.kind === 'conversation' && swipe.id === conversation.id) {
      const offset = currentConversationOffset(conversation);
      return offset > 0 ? 'pin' : offset < 0 ? 'delete' : null;
    }
    if (listOpenAction?.conversationId === conversation.id) return listOpenAction.side;
    return null;
  }, [currentConversationOffset, listOpenAction, swipe]);

  const openMessageContextMenu = useCallback((messageId: string, rect: DOMRect, align: 'left' | 'right') => {
    const width = MESSAGE_CONTEXT_MENU_WIDTH;
    const maxLeft = Math.max(12, window.innerWidth - width - 12);
    const left = align === 'right'
      ? clamp(rect.right - width, 12, maxLeft)
      : clamp(rect.left, 12, maxLeft);
    const menuHeight = 214;
    const belowTop = rect.bottom + 8;
    const aboveTop = rect.top - menuHeight - 8;
    const top = belowTop + menuHeight <= window.innerHeight - 12
      ? clamp(belowTop, 12, Math.max(12, window.innerHeight - menuHeight - 12))
      : Math.max(12, aboveTop);
    setMessageContextMenu({ messageId, left, top, width, align });
  }, []);

  const deleteMessage = useCallback((messageId: string) => {
    if (!activeConversation) return;
    const timerKey = `${activeConversation.id}:${messageId}`;
    const existingTimer = deleteTimersRef.current[timerKey];
    if (existingTimer) window.clearTimeout(existingTimer);

    setMessageContextMenu(null);
    setMessageDeletedByConversation((prev) => ({
      ...prev,
      [activeConversation.id]: {
        ...(prev[activeConversation.id] ?? {}),
        [messageId]: true,
      },
    }));

    setThreadMessagesByConversation((prev) => {
      const current = prev[activeConversation.id] ?? [];
      return {
        ...prev,
        [activeConversation.id]: current.map((message) =>
          message.id === messageId ? { ...message, isDeleting: true, deleteDirection: 'delete' } : message
        ),
      };
    });

    deleteTimersRef.current[timerKey] = window.setTimeout(() => {
      deleteTimersRef.current[timerKey] = 0;
      setThreadMessagesByConversation((prev) => {
        const current = prev[activeConversation.id] ?? [];
        return {
          ...prev,
          [activeConversation.id]: current.map((message) =>
            message.id === messageId ? { ...message, isDeleting: false, isDeleted: true, deleteDirection: null } : message
          ),
        };
      });
      delete deleteTimersRef.current[timerKey];
    }, 180);
  }, [activeConversation]);

  const handleMessageLongPressAction = useCallback((action: 'copy' | 'reply' | 'emoji' | 'delete', payload?: string) => {
    if (!activeConversation || !messageContextMenu) return;
    const message = activeConversationMessages.find((entry) => entry.id === messageContextMenu.messageId);
    if (!message) {
      setMessageContextMenu(null);
      return;
    }

    if (action === 'copy') {
      void navigator.clipboard?.writeText(message.text);
    } else if (action === 'reply') {
      const sender = message.author === 'self' ? 'You' : activeConversation.participantName;
      setReplyTarget({ name: sender, text: message.text });
    } else if (action === 'emoji' && payload) {
      const currentReaction = messageReactionByConversation[activeConversation.id]?.[message.id];
      setMessageReactionByConversation((prev) => {
        const conversationReactions = prev[activeConversation.id] ?? {};
        if (currentReaction?.emoji === payload) {
          const { [message.id]: _removed, ...rest } = conversationReactions;
          return {
            ...prev,
            [activeConversation.id]: rest,
          };
        }
        return {
          ...prev,
          [activeConversation.id]: {
            ...conversationReactions,
            [message.id]: { emoji: payload, count: 1 },
          },
        };
      });
    } else if (action === 'delete') {
      deleteMessage(message.id);
      return;
    }

    setMessageContextMenu(null);
  }, [activeConversation, activeConversationMessages, deleteMessage, messageContextMenu]);

  const handleConversationCardClick = useCallback((conversationId: string) => {
    if (conversationActionSheetId === conversationId) {
      setConversationActionSheetId(null);
      return;
    }
    if (swipeRef.current?.locked) {
      setSwipeState(null);
      setListOpenAction(null);
      return;
    }
    if (listOpenAction && listOpenAction.conversationId !== conversationId) {
      setListOpenAction(null);
    }
    onMarkConversationRead(conversationId);
    onOpenConversation(conversationId);
  }, [conversationActionSheetId, listOpenAction, onMarkConversationRead, onOpenConversation, setSwipeState]);

  const closeConversationActionSheet = useCallback(() => {
    setConversationActionSheetId(null);
  }, []);

  const closeMessageContextMenu = useCallback(() => {
    setMessageContextMenu(null);
    clearMessageLongPress();
  }, [clearMessageLongPress]);

  const stopActionEvent = useCallback((event: ReactPointerEvent<HTMLElement> | ReactMouseEvent<HTMLElement>) => {
    event.stopPropagation();
  }, []);

  const profilePeekModal = (
    <ProfilePeekModal
      open={profilePeekConversation !== null}
      avatar={profilePeekConversation?.participantPhoto ?? ''}
      name={profilePeekConversation?.participantName ?? ''}
      role={profilePeekConversation?.participantRole ?? 'Host'}
      memberSince={profilePeekConversation?.memberSince}
      verificationStatus={profilePeekConversation ? (profilePeekConversation.verified ? 'Verified host' : 'Unverified host') : undefined}
      roomieScore={profilePeekConversation?.roomieScore}
      uploadedListings={profilePeekConversation?.uploadedListings ?? []}
      tenantReviews={['No tenant-side reviews logged in this preview.']}
      hostReviews={profilePeekConversation?.hostReviews ?? []}
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
      <div className="inbox-chat-screen">
        <div className="app-header">
          <div className="logo"><AppLogo /></div>
        </div>

        <div className="inbox-chat-layout">
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

          <div className="inbox-chat-body">
            <div className="scroll-area inbox-chat-scroller" ref={inboxScrollerRef}>
              <div className="inbox-chat-thread" onPointerDown={(event) => {
                if (event.target === event.currentTarget) {
                  setMessageContextMenu(null);
                  setSwipeState(null);
                }
              }}>
                {activeConversationMessages.map((message) => {
                  const isPinned = Boolean(messagePinStateByConversation[activeConversation.id]?.[message.id] ?? message.isPinned);
                  const reaction = messageReactionByConversation[activeConversation.id]?.[message.id];

                  return (
                    <div
                      key={message.id}
                      className={`inbox-message-swipe-row ${message.isDeleting ? `is-deleting ${message.deleteDirection ?? ''}` : ''}`}
                      onPointerDown={(event) => {
                        if (event.pointerType === 'mouse' && event.button !== 0) return;
                        const target = event.target as HTMLElement | null;
                        if (target?.closest('button, textarea, input, select, a, .inbox-message-actions')) return;
                        clearMessageLongPress();
                        setMessageContextMenu(null);
                        messageLongPressRef.current = {
                          messageId: message.id,
                          timer: window.setTimeout(() => {
                            const current = messageLongPressRef.current;
                            if (!current || current.messageId !== message.id || current.triggered) return;
                            current.triggered = true;
                            openMessageContextMenu(
                              message.id,
                              current.rect ?? event.currentTarget.getBoundingClientRect(),
                              message.author === 'self' ? 'right' : 'left'
                            );
                          }, MESSAGE_LONG_PRESS_DELAY),
                          startX: event.clientX,
                          startY: event.clientY,
                          triggered: false,
                          rect: event.currentTarget.getBoundingClientRect(),
                        };

                        try {
                          event.currentTarget.setPointerCapture(event.pointerId);
                        } catch {
                          // ignore
                        }
                      }}
                      onPointerMove={(event) => {
                        const current = messageLongPressRef.current;
                        if (current && current.messageId === message.id && !current.triggered) {
                          const dx = event.clientX - current.startX;
                          const dy = event.clientY - current.startY;
                          if (Math.abs(dx) > MESSAGE_LONG_PRESS_MOVE_TOLERANCE || Math.abs(dy) > MESSAGE_LONG_PRESS_MOVE_TOLERANCE) {
                            clearMessageLongPress();
                          }
                        }
                      }}
                      onPointerUp={(event) => {
                        const current = messageLongPressRef.current;
                        const longPressTriggered = Boolean(current && current.messageId === message.id && current.triggered);
                        try {
                          event.currentTarget.releasePointerCapture(event.pointerId);
                        } catch {
                          // ignore
                        }
                        clearMessageLongPress();
                        if (!longPressTriggered && messageContextMenu?.messageId === message.id) {
                          setMessageContextMenu(null);
                          return;
                        }
                      }}
                      onPointerCancel={(event) => {
                        try {
                          event.currentTarget.releasePointerCapture(event.pointerId);
                        } catch {
                          // ignore
                        }
                        clearMessageLongPress();
                      }}
                    >
                      <div
                        className={`inbox-bubble-row ${message.author === 'self' ? 'self' : 'other'} ${isPinned ? 'is-pinned' : ''}`}
                      >
                        <div className={`inbox-bubble ${message.author === 'self' ? 'self' : 'other'}`}>
                          {message.isDeleted ? (
                            <div className="inbox-deleted-message">
                              <span className="inbox-deleted-message-icon"><DeletedNoticeIcon /></span>
                              <span className="inbox-deleted-message-text">Message deleted</span>
                            </div>
                          ) : (
                            <>
                              <div className="inbox-bubble-top">
                                {isPinned && <span className="inbox-message-pin-badge">Pinned</span>}
                              </div>
                              {message.author === 'self' && message.replyTo && (
                                <div className="inbox-reply-quote">
                                  <div className="inbox-reply-source">Replying to</div>
                                  <div className="inbox-reply-name">{message.replyTo.name}</div>
                                  <div className="inbox-reply-text">{message.replyTo.text}</div>
                                </div>
                              )}
                              {message.author === 'self' && message.replyTo && <div className="inbox-reply-divider" />}
                              <div>{message.text}</div>
                              <div className="inbox-bubble-time">
                                <span className="inbox-message-time">{formatMessageTime(message.createdAt)}</span>
                                {message.id === latestReadMessageId && (
                                  <>
                                    <span className="inbox-time-divider" aria-hidden="true">•</span>
                                    <span className="inbox-read-label">Read</span>
                                  </>
                                )}
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                      {reaction && !message.isDeleted && (
                        <div className={`inbox-message-reaction-row ${message.author === 'self' ? 'self' : 'other'}`}>
                          <div className="inbox-message-reaction" aria-label={`Reaction ${reaction.emoji} ${reaction.count} times`}>
                            <span className="inbox-message-reaction-emoji">{reaction.emoji}</span>
                            <span className="inbox-message-reaction-count">{reaction.count}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
                <div ref={inboxScrollAnchorRef} className="inbox-scroll-anchor" aria-hidden="true" />
              </div>
            </div>

            <div className="inbox-chat-footer">
              {replyTarget && (
                <div className="inbox-reply-banner">
                  <div className="inbox-reply-banner-copy">
                    <div className="inbox-reply-banner-title">Replying to {replyTarget.name}</div>
                    <div className="inbox-reply-banner-text">{replyTarget.text}</div>
                  </div>
                  <button
                    type="button"
                    className="inbox-reply-banner-close"
                    onClick={() => setReplyTarget(null)}
                    aria-label="Cancel reply"
                  >
                    ×
                  </button>
                </div>
              )}

              <div className="inbox-composer">
                <textarea
                  className="inbox-composer-input"
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  onFocus={() => {
                    window.requestAnimationFrame(() => {
                      scrollInboxToBottom();
                    });
                  }}
                  onBlur={() => {
                    window.requestAnimationFrame(() => {
                      scrollInboxToBottom();
                    });
                  }}
                  placeholder={`Message ${activeConversation.participantName.split(' ')[0]}...`}
                  rows={1}
                />
                <button className="inbox-send-btn" type="button" onClick={() => {
                  if (!activeConversation || !draft.trim()) return;
                  onSendMessage(activeConversation.id, draft, replyTarget ?? undefined);
                  setDraft('');
                  setReplyTarget(null);
                  window.requestAnimationFrame(() => {
                    scrollInboxToBottom();
                  });
                }}>
                  Send
                </button>
              </div>
            </div>
          </div>
        </div>

        {messageContextMenu && activeConversation && (() => {
          const message = activeConversationMessages.find((entry) => entry.id === messageContextMenu.messageId);
          if (!message) return null;
          const reactionMap = messageReactionByConversation[activeConversation.id] ?? {};
          const currentReaction = reactionMap[message.id];
          return (
            <div
              className="message-context-menu-overlay"
              onPointerDown={closeMessageContextMenu}
            >
              <div
                className="message-context-menu"
                role="dialog"
                aria-modal="true"
                aria-label="Message options"
                style={{
                  top: `${messageContextMenu.top}px`,
                  left: `${messageContextMenu.left}px`,
                  width: `${messageContextMenu.width}px`,
                }}
                onPointerDown={(event) => event.stopPropagation()}
              >
                <button
                  type="button"
                  className="message-context-action"
                  onClick={() => handleMessageLongPressAction('copy')}
                >
                  Copy
                </button>
                <button
                  type="button"
                  className="message-context-action"
                  onClick={() => handleMessageLongPressAction('reply')}
                >
                  Reply
                </button>
                {message.author === 'self' && (
                  <button
                    type="button"
                    className="message-context-action is-destructive"
                    onClick={() => handleMessageLongPressAction('delete')}
                  >
                    Delete
                  </button>
                )}
                <div className="message-context-emoji-row" aria-label="Quick reactions">
                  {MESSAGE_REACTIONS.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      className={`message-context-emoji ${currentReaction?.emoji === emoji ? 'is-active' : ''}`}
                      onClick={() => handleMessageLongPressAction('emoji', emoji)}
                      aria-label={`React with ${emoji}`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          );
        })()}

        {profilePeekModal}
      </div>
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
            const isMuted = Boolean(conversationMutedById[conversation.id]);
            const unreadCount = readConversationIds[conversation.id] ? 0 : conversation.unreadCount;

            return (
              <div
                key={conversation.id}
                className="inbox-item-swipe-row"
                onPointerDown={(event) => beginConversationSwipe(event, conversation.id)}
                onPointerMove={(event) => {
                  const longPress = longPressRef.current;
                  if (longPress && longPress.conversationId === conversation.id && !longPress.triggered) {
                    const dx = event.clientX - longPress.startX;
                    const dy = event.clientY - longPress.startY;
                    if (Math.abs(dx) > 10 || Math.abs(dy) > 10) {
                      clearConversationLongPress();
                    }
                  }
                  if (swipe?.kind === 'conversation' && swipe.id === conversation.id) {
                    updateSwipe(event.clientX, event.clientY);
                  }
                }}
                onPointerUp={(event) => {
                  const longPress = longPressRef.current;
                  const longPressTriggered = Boolean(longPress && longPress.conversationId === conversation.id && longPress.triggered);
                  clearConversationLongPress();
                  if (longPressTriggered) return;
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

                    if (isTapLike && currentSwipe && currentSwipe.startOffset !== 0) {
                      setSwipeState(null);
                      setListOpenAction(null);
                      return;
                    }

                    finishSwipe(event.clientX, event.clientY, false);
                    if (isTapLike) {
                      handleConversationCardClick(conversation.id);
                    }
                  }
                }}
                onPointerCancel={(event) => {
                  clearConversationLongPress();
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
                    onPointerDown={(event) => {
                      stopActionEvent(event);
                      suppressConversationProfilePeek(conversation.id);
                      toggleConversationPin(conversation.id);
                    }}
                    onClick={(event) => {
                      if (event.detail !== 0) return;
                      stopActionEvent(event);
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
                    onPointerDown={(event) => {
                      stopActionEvent(event);
                      suppressConversationProfilePeek(conversation.id);
                      deleteConversation(conversation.id);
                    }}
                    onClick={(event) => {
                      if (event.detail !== 0) return;
                      stopActionEvent(event);
                      deleteConversation(conversation.id);
                    }}
                  >
                    <DeleteIcon />
                    <span>Delete</span>
                  </button>
                </div>
                <div
                  className={`inbox-item ${isPinned ? 'is-pinned' : ''} ${revealSide ? 'is-action-open' : ''}`}
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
                      if (shouldSuppressConversationProfilePeek(conversation.id)) return;
                      setProfilePeekConversationId(conversation.id);
                    }}
                    aria-label={`View ${conversation.participantName} profile`}
                  >
                    <img src={conversation.participantPhoto} alt={conversation.participantName} />
                  </button>
                  <div className="inbox-info">
                    <div className="inbox-name-row">
                      <div className="inbox-name">{conversation.participantName}</div>
                      {isMuted && (
                        <span className="inbox-muted-badge" aria-label="Notifications muted">
                          <BellOffIcon />
                        </span>
                      )}
                    </div>
                    <div className="inbox-preview">{lastMessage?.text}</div>
                    <div className="inbox-listing-meta">{conversation.listingTitle}</div>
                  </div>
                  <div className="inbox-meta">
                    <div className="inbox-time">{lastMessage ? formatConversationTime(lastMessage.timestamp) : ''}</div>
                    {unreadCount > 0 && <div className="inbox-unread">{unreadCount}</div>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {conversationActionSheetId && (
        <div className="conversation-sheet-overlay" onClick={closeConversationActionSheet}>
          <div
            className="conversation-sheet"
            role="dialog"
            aria-modal="true"
            aria-label="Conversation options"
            onClick={(event) => event.stopPropagation()}
          >
            {(() => {
              const isMuted = Boolean(conversationMutedById[conversationActionSheetId]);
              const isPinned = Boolean(conversationMetaById[conversationActionSheetId]?.pinned);
              return (
                <>
            <div className="conversation-sheet-handle" />
            <div className="conversation-sheet-title">Conversation options</div>
            <div className="conversation-sheet-list">
              <button type="button" className="conversation-sheet-item" onClick={() => handleConversationLongPressAction('read')}>
                <span className="conversation-sheet-icon is-read">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 6h16v12H4z" />
                    <path d="m5 8 7 5 7-5" />
                  </svg>
                </span>
                <span className="conversation-sheet-copy">
                  <strong>Mark as read</strong>
                  <small>Clear the unread badge for this chat.</small>
                </span>
              </button>
              <button type="button" className="conversation-sheet-item" onClick={() => handleConversationLongPressAction('mute')}>
                <span className="conversation-sheet-icon is-muted">
                  {isMuted ? <BellOffIcon /> : <BellIcon />}
                </span>
                <span className="conversation-sheet-copy">
                  <strong>{isMuted ? 'Turn on notification' : 'Turn off notification'}</strong>
                  <small>{isMuted ? 'Restore alerts for this chat.' : 'Mute this conversation locally.'}</small>
                </span>
              </button>
              <button type="button" className="conversation-sheet-item" onClick={() => handleConversationLongPressAction('pin')}>
                <span className="conversation-sheet-icon is-pin">
                  {isPinned ? <UnpinIcon /> : <PinIcon />}
                </span>
                <span className="conversation-sheet-copy">
                  <strong>{isPinned ? 'Unpin chat' : 'Pin chat'}</strong>
                  <small>Keep this chat at the top of the list.</small>
                </span>
              </button>
              <button type="button" className="conversation-sheet-item is-destructive" onClick={() => handleConversationLongPressAction('delete')}>
                <span className="conversation-sheet-icon is-delete">
                  <DeleteIcon />
                </span>
                <span className="conversation-sheet-copy">
                  <strong>Delete chat</strong>
                  <small>Remove the conversation from the list.</small>
                </span>
              </button>
            </div>
            <button type="button" className="conversation-sheet-cancel" onClick={closeConversationActionSheet}>
              Cancel
            </button>
                </>
              );
            })()}
          </div>
        </div>
      )}

      {profilePeekModal}
    </>
  );
}
