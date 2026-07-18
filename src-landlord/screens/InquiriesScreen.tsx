import { useEffect, useMemo, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from 'react';
import type { Inquiry, InquiryStatus, Unit } from '../data';
import Header from '../components/Header';
import type { HeaderNotification } from '../components/Header';
import ProfilePeekModal from '../../src/components/ProfilePeekModal';

interface Props {
  inquiries: Inquiry[];
  units: Unit[];
  onSetStatus: (id: number, status: InquiryStatus) => void;
  onAddThreadMessage: (
    id: number,
    message: { sender: 'tenant' | 'landlord' | 'system'; text: string; time: string },
    status?: InquiryStatus,
  ) => void;
  onOpenProfile: () => void;
  notifications: HeaderNotification[];
  onOpenNotification: (notification: HeaderNotification) => void;
  onShowToast: (msg: string) => void;
}

type Filter = 'All' | InquiryStatus;
type SwipeSide = 'delete' | 'pin';

const FILTERS: Filter[] = ['All', 'New', 'Replied', 'Viewing'];
const ACTION_WIDTH = 92;
const REVEAL_THRESHOLD = 10;
const COMMIT_THRESHOLD = 48;
const MAX_SWIPE = 116;
const VERTICAL_CANCEL_DISTANCE = 22;
const VERTICAL_CANCEL_RATIO = 1.15;
const SWIPE_LOCK_THRESHOLD = 8;

type InquiryMeta = {
  pinned: boolean;
  hidden: boolean;
  deleting: boolean;
  deleteDirection: SwipeSide | null;
};

type SwipeState = {
  inquiryId: number;
  pointerId: number;
  startX: number;
  startY: number;
  startOffset: number;
  offset: number;
  locked: boolean;
};

type ThreadMessageMeta = {
  pinned: boolean;
  hidden: boolean;
  deleting: boolean;
  deleteDirection: SwipeSide | null;
};

type MessageSwipeState = {
  inquiryId: number;
  messageId: number;
  pointerId: number;
  startX: number;
  startY: number;
  startOffset: number;
  offset: number;
  locked: boolean;
};

function StatusBadge({ status }: { status: InquiryStatus }) {
  const cls = status === 'New' ? 'st-new' : status === 'Viewing' ? 'st-viewing' : 'st-replied';
  return <span className={`status-badge ${cls}`}>{status}</span>;
}

function timeStampLabel() {
  return 'Just now';
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

export default function InquiriesScreen({
  inquiries,
  units,
  onSetStatus,
  onAddThreadMessage,
  onOpenProfile,
  notifications,
  onOpenNotification,
  onShowToast,
}: Props) {
  const [filter, setFilter] = useState<Filter>('All');
  const [openId, setOpenId] = useState<number | null>(null);
  const [chatOpenId, setChatOpenId] = useState<number | null>(null);
  const [draftReplies, setDraftReplies] = useState<Record<number, string>>({});
  const [metaById, setMetaById] = useState<Record<number, InquiryMeta>>({});
  const [openAction, setOpenAction] = useState<{ inquiryId: number; side: SwipeSide } | null>(null);
  const [swipe, setSwipe] = useState<SwipeState | null>(null);
  const [messageMetaByInquiryId, setMessageMetaByInquiryId] = useState<Record<number, Record<number, ThreadMessageMeta>>>({});
  const [messageOpenAction, setMessageOpenAction] = useState<{ inquiryId: number; messageId: number; side: SwipeSide } | null>(null);
  const [messageSwipe, setMessageSwipe] = useState<MessageSwipeState | null>(null);
  const [profilePeekInquiryId, setProfilePeekInquiryId] = useState<number | null>(null);
  const deleteTimersRef = useRef<Record<string, number>>({});
  const messageSwipeRef = useRef<MessageSwipeState | null>(null);
  const suppressNextInquiryClickRef = useRef<number | null>(null);

  useEffect(() => {
    setMetaById((prev) => {
      const next = { ...prev };
      for (const inquiry of inquiries) {
        if (!next[inquiry.id]) {
          next[inquiry.id] = {
            pinned: false,
            hidden: false,
            deleting: false,
            deleteDirection: null,
          };
        }
      }
      return next;
    });
  }, [inquiries]);

  useEffect(() => () => {
    Object.values(deleteTimersRef.current).forEach((timer) => window.clearTimeout(timer));
  }, []);

  useEffect(() => {
    messageSwipeRef.current = messageSwipe;
  }, [messageSwipe]);

  useEffect(() => {
    if (chatOpenId === null) {
      setMessageSwipe(null);
      setMessageOpenAction(null);
      return;
    }

    const nextChat = inquiries.find((inquiry) => inquiry.id === chatOpenId) ?? null;
    if (!nextChat) {
      setMessageSwipe(null);
      setMessageOpenAction(null);
      return;
    }

    setMessageSwipe(null);
    setMessageOpenAction(null);
    setMessageMetaByInquiryId((prev) => {
      if (prev[nextChat.id]) return prev;
      return {
        ...prev,
        [nextChat.id]: {},
      };
    });
  }, [chatOpenId, inquiries]);

  const filtered = useMemo(() => {
    const base = filter === 'All' ? inquiries : inquiries.filter((i) => i.status === filter);

    return base
      .map((inquiry, index) => ({
        inquiry,
        index,
        meta: metaById[inquiry.id] ?? {
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
      });
  }, [filter, inquiries, metaById]);

  const unitTitle = (id: number) => units.find((u) => u.id === id)?.title ?? '';
  const activeChat = chatOpenId === null ? null : inquiries.find((inquiry) => inquiry.id === chatOpenId) ?? null;
  const activeChatMessages = useMemo(() => {
    if (!activeChat) return [];

    const messageMeta = messageMetaByInquiryId[activeChat.id] ?? {};

    return activeChat.thread
      .map((entry, index) => ({
        entry,
        index,
        meta: messageMeta[entry.id] ?? {
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
      });
  }, [activeChat, messageMetaByInquiryId]);

  function setDraft(id: number, value: string) {
    setDraftReplies((prev) => ({ ...prev, [id]: value }));
  }

  function sendReply(inquiry: Inquiry) {
    const text = draftReplies[inquiry.id]?.trim();
    if (!text) {
      onShowToast('Write a reply first');
      return;
    }

    onAddThreadMessage(
      inquiry.id,
      { sender: 'landlord', text, time: timeStampLabel() },
      'Replied',
    );
    setDraftReplies((prev) => ({ ...prev, [inquiry.id]: '' }));
    onShowToast(`✉️ Reply sent to ${inquiry.name}`);
  }

  function scheduleViewing(inquiry: Inquiry) {
    onSetStatus(inquiry.id, 'Viewing');
    onAddThreadMessage(
      inquiry.id,
      {
        sender: 'system',
        text: 'Viewing scheduled. Follow up with the applicant for exact time and property access notes.',
        time: timeStampLabel(),
      },
      'Viewing',
    );
    onShowToast(`📅 Viewing scheduled with ${inquiry.name}`);
  }

  const commitPinToggle = (id: number) => {
    setSwipe(null);
    setOpenAction(null);
    setMetaById((prev) => {
      const current = prev[id] ?? {
        pinned: false,
        hidden: false,
        deleting: false,
        deleteDirection: null,
      };
      return {
        ...prev,
        [id]: {
          ...current,
          pinned: !current.pinned,
          deleting: false,
          deleteDirection: null,
          hidden: false,
        },
      };
    });
  };

  const commitDelete = (id: number, direction: SwipeSide) => {
    setSwipe(null);
    setOpenAction(null);

    setMetaById((prev) => {
      const current = prev[id] ?? {
        pinned: false,
        hidden: false,
        deleting: false,
        deleteDirection: null,
      };
      return {
        ...prev,
        [id]: {
          ...current,
          deleting: true,
          deleteDirection: direction,
        },
      };
    });

    const existingTimer = deleteTimersRef.current[id];
    if (existingTimer) window.clearTimeout(existingTimer);

    deleteTimersRef.current[id] = window.setTimeout(() => {
      deleteTimersRef.current[id] = 0;
      setMetaById((prev) => {
        const current = prev[id];
        if (!current) return prev;
        return {
          ...prev,
          [id]: {
            ...current,
            hidden: true,
            deleting: false,
            deleteDirection: null,
          },
        };
      });
      if (openId === id) setOpenId(null);
      if (chatOpenId === id) setChatOpenId(null);
      delete deleteTimersRef.current[id];
    }, 220);
  };

  const commitMessagePinToggle = (inquiryId: number, messageId: number) => {
    setMessageSwipe(null);
    setMessageOpenAction(null);
    setMessageMetaByInquiryId((prev) => {
      const currentInquiry = prev[inquiryId] ?? {};
      const currentMessage = currentInquiry[messageId] ?? {
        pinned: false,
        hidden: false,
        deleting: false,
        deleteDirection: null,
      };
      return {
        ...prev,
        [inquiryId]: {
          ...currentInquiry,
          [messageId]: {
            ...currentMessage,
            pinned: !currentMessage.pinned,
            deleting: false,
            deleteDirection: null,
            hidden: false,
          },
        },
      };
    });
  };

  const commitMessageDelete = (inquiryId: number, messageId: number, direction: SwipeSide) => {
    setMessageSwipe(null);
    setMessageOpenAction(null);

    setMessageMetaByInquiryId((prev) => {
      const currentInquiry = prev[inquiryId] ?? {};
      const currentMessage = currentInquiry[messageId] ?? {
        pinned: false,
        hidden: false,
        deleting: false,
        deleteDirection: null,
      };
      return {
        ...prev,
        [inquiryId]: {
          ...currentInquiry,
          [messageId]: {
            ...currentMessage,
            deleting: true,
            deleteDirection: direction,
          },
        },
      };
    });

    const timerKey = `${inquiryId}:${messageId}`;
    const existingTimer = deleteTimersRef.current[timerKey];
    if (existingTimer) window.clearTimeout(existingTimer);

    deleteTimersRef.current[timerKey] = window.setTimeout(() => {
      deleteTimersRef.current[timerKey] = 0;
      setMessageMetaByInquiryId((prev) => {
        const currentInquiry = prev[inquiryId];
        if (!currentInquiry) return prev;
        const currentMessage = currentInquiry[messageId];
        if (!currentMessage) return prev;
        return {
          ...prev,
          [inquiryId]: {
            ...currentInquiry,
            [messageId]: {
              ...currentMessage,
              hidden: true,
              deleting: false,
              deleteDirection: null,
            },
          },
        };
      });
      delete deleteTimersRef.current[timerKey];
    }, 220);
  };

  const handleAction = (id: number, action: SwipeSide) => {
    if (action === 'pin') {
      commitPinToggle(id);
      onShowToast(metaById[id]?.pinned ? 'Unpinned inquiry' : 'Pinned inquiry');
    } else {
      commitDelete(id, 'delete');
      onShowToast('Inquiry deleted');
    }
  };

  const handleListPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) {
      setOpenAction(null);
      setSwipe(null);
      setProfilePeekInquiryId(null);
    }
  };

  const restoreInquiryOpenAction = (id: number, side: SwipeSide | null) => {
    if (!side) {
      setOpenAction((current) => (current?.inquiryId === id ? null : current));
      return;
    }
    setOpenAction({ inquiryId: id, side });
  };

  const handleRowPointerDown = (
    event: ReactPointerEvent<HTMLDivElement>,
    id: number,
  ) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    const target = event.target as HTMLElement | null;
    if (target?.closest('button, textarea, input, select, a')) return;

    if (openAction && openAction.inquiryId !== id) {
      setOpenAction(null);
    }

    const existing = openAction?.inquiryId === id ? actionOffset(openAction.side) : 0;
    setSwipe({
      inquiryId: id,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      startOffset: existing,
      offset: existing,
      locked: false,
    });

    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handleRowPointerMove = (
    event: ReactPointerEvent<HTMLDivElement>,
    id: number,
  ) => {
    if (!swipe || swipe.inquiryId !== id) return;

    const dx = event.clientX - swipe.startX;
    const dy = event.clientY - swipe.startY;
    const absX = Math.abs(dx);
    const absY = Math.abs(dy);

    if (!swipe.locked) {
      if (absX < 6 && absY < 6) return;
      if (absY > VERTICAL_CANCEL_DISTANCE && absY > absX * VERTICAL_CANCEL_RATIO) {
        setSwipe(null);
        return;
      }
      if (absX < SWIPE_LOCK_THRESHOLD || absX < absY + 2) return;
      setSwipe((current) => (current ? { ...current, locked: true } : current));
    }

    event.preventDefault();
    const nextOffset = clamp(swipe.startOffset + dx, -MAX_SWIPE, MAX_SWIPE);
    setSwipe((current) => (current && current.inquiryId === id ? { ...current, locked: true, offset: nextOffset } : current));
    const side = Math.abs(nextOffset) >= REVEAL_THRESHOLD ? swipeSideFromOffset(nextOffset) : null;
    if (side) {
      setOpenAction({ inquiryId: id, side });
    } else if (Math.abs(nextOffset) < REVEAL_THRESHOLD && openAction?.inquiryId !== id) {
      setOpenAction(null);
    }
  };

  const handleRowPointerUp = (
    event: ReactPointerEvent<HTMLDivElement>,
    id: number,
  ) => {
    if (!swipe || swipe.inquiryId !== id) return;

    try {
      event.currentTarget.releasePointerCapture(event.pointerId);
    } catch {
      // ignore capture release issues
    }

    const isTapLike = Boolean(
      !swipe.locked &&
      Math.abs(event.clientX - swipe.startX) < 8 &&
      Math.abs(event.clientY - swipe.startY) < 8
    );
    const offset = clamp(swipe.offset, -MAX_SWIPE, MAX_SWIPE);
    const resolvedSide = Math.abs(offset) >= COMMIT_THRESHOLD
      ? swipeSideFromOffset(offset)
      : swipe.startOffset > 0
        ? 'pin'
        : swipe.startOffset < 0
          ? 'delete'
        : null;

    setSwipe(null);
    if (isTapLike && swipe.startOffset !== 0) {
      suppressNextInquiryClickRef.current = id;
      restoreInquiryOpenAction(id, null);
      return;
    }

    if (isTapLike) {
      suppressNextInquiryClickRef.current = id;
      setOpenId((current) => (current === id ? null : id));
      return;
    }

    restoreInquiryOpenAction(id, resolvedSide);
  };

  const handleRowPointerCancel = (id: number) => {
    if (!swipe || swipe.inquiryId !== id) return;
    setSwipe(null);
    restoreInquiryOpenAction(
      id,
      Math.abs(swipe.offset) >= COMMIT_THRESHOLD
        ? swipeSideFromOffset(swipe.offset)
        : swipe.startOffset > 0
          ? 'pin'
          : swipe.startOffset < 0
            ? 'delete'
            : null,
    );
  };

  const handleMessagePointerDown = (
    event: ReactPointerEvent<HTMLDivElement>,
    inquiryId: number,
    messageId: number,
  ) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    const target = event.target as HTMLElement | null;
    if (target?.closest('button, textarea, input, select, a')) return;

    if (messageOpenAction && messageOpenAction.messageId !== messageId) {
      setMessageOpenAction(null);
    }

    const existing = messageOpenAction?.messageId === messageId ? actionOffset(messageOpenAction.side) : 0;
    const nextSwipe: MessageSwipeState = {
      inquiryId,
      messageId,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      startOffset: existing,
      offset: existing,
      locked: false,
    };
    setMessageSwipe(nextSwipe);
    messageSwipeRef.current = nextSwipe;

    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      // ignore capture issues
    }
  };

  const updateMessageSwipe = (clientX: number, clientY: number) => {
    const currentSwipe = messageSwipeRef.current;
    if (!currentSwipe) return;

    const dx = clientX - currentSwipe.startX;
    const dy = clientY - currentSwipe.startY;
    const absX = Math.abs(dx);
    const absY = Math.abs(dy);

    if (!currentSwipe.locked) {
      if (absX < 6 && absY < 6) return;
      if (absY > VERTICAL_CANCEL_DISTANCE && absY > absX * VERTICAL_CANCEL_RATIO) {
        messageSwipeRef.current = null;
        setMessageSwipe(null);
        return;
      }
      if (absX < SWIPE_LOCK_THRESHOLD || absX < absY + 2) return;
      const lockedSwipe = { ...currentSwipe, locked: true };
      messageSwipeRef.current = lockedSwipe;
      setMessageSwipe(lockedSwipe);
    }

    const nextOffset = clamp(currentSwipe.startOffset + dx, -MAX_SWIPE, MAX_SWIPE);
    const nextSwipe = { ...currentSwipe, locked: true, offset: nextOffset };
    messageSwipeRef.current = nextSwipe;
    setMessageSwipe(nextSwipe);
    const side = Math.abs(nextOffset) >= REVEAL_THRESHOLD ? swipeSideFromOffset(nextOffset) : null;
    if (side) {
      setMessageOpenAction({ inquiryId: currentSwipe.inquiryId, messageId: currentSwipe.messageId, side });
    } else if (Math.abs(nextOffset) < REVEAL_THRESHOLD && messageOpenAction?.messageId !== currentSwipe.messageId) {
      setMessageOpenAction(null);
    }
  };

  const finishMessageSwipe = (clientX: number, clientY: number, cancel = false) => {
    const currentSwipe = messageSwipeRef.current;
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

    messageSwipeRef.current = null;
    setMessageSwipe(null);

    if (resolvedSide) {
      setMessageOpenAction({
        inquiryId: currentSwipe.inquiryId,
        messageId: currentSwipe.messageId,
        side: resolvedSide,
      });
    } else {
      setMessageOpenAction((current) => (current?.messageId === currentSwipe.messageId ? null : current));
    }
  };

  const handleMessagePointerUp = (event: ReactPointerEvent<HTMLDivElement>, inquiryId: number, messageId: number) => {
    const currentSwipe = messageSwipeRef.current;
    if (!currentSwipe || currentSwipe.inquiryId !== inquiryId || currentSwipe.messageId !== messageId) return;
    try {
      event.currentTarget.releasePointerCapture(event.pointerId);
    } catch {
      // ignore capture release issues
    }

    const isTapLike = Boolean(
      !currentSwipe.locked &&
      Math.abs(event.clientX - currentSwipe.startX) < 8 &&
      Math.abs(event.clientY - currentSwipe.startY) < 8
    );

    if (isTapLike && currentSwipe.startOffset !== 0) {
      messageSwipeRef.current = null;
      setMessageSwipe(null);
      setMessageOpenAction(null);
      return;
    }

    finishMessageSwipe(event.clientX, event.clientY, false);
    if (isTapLike) {
      setProfilePeekInquiryId(inquiryId);
    }
  };

  const handleMessagePointerCancel = (event: ReactPointerEvent<HTMLDivElement>, inquiryId: number, messageId: number) => {
    if (!messageSwipeRef.current || messageSwipeRef.current.inquiryId !== inquiryId || messageSwipeRef.current.messageId !== messageId) return;
    try {
      event.currentTarget.releasePointerCapture(event.pointerId);
    } catch {
      // ignore capture release issues
    }

    finishMessageSwipe(event.clientX, event.clientY, true);
  };

  const currentMessageOffset = (messageId: number) => {
    if (messageSwipeRef.current?.messageId === messageId) {
      return clamp(messageSwipeRef.current.offset, -MAX_SWIPE, MAX_SWIPE);
    }
    if (messageOpenAction?.messageId === messageId) return actionOffset(messageOpenAction.side);
    return 0;
  };

  const currentMessageSide = (messageId: number) => {
    if (messageSwipeRef.current?.messageId === messageId) {
      const offset = currentMessageOffset(messageId);
      return offset > 0 ? 'pin' : offset < 0 ? 'delete' : null;
    }
    if (messageOpenAction?.messageId === messageId) return messageOpenAction.side;
    return null;
  };

  const toggleMessagePin = (messageId: number) => {
    if (!activeChat) return;
    commitMessagePinToggle(activeChat.id, messageId);
    const current = messageMetaByInquiryId[activeChat.id]?.[messageId];
    onShowToast(current?.pinned ? 'Unpinned message' : 'Pinned message');
  };

  const deleteMessage = (messageId: number) => {
    if (!activeChat) return;
    commitMessageDelete(activeChat.id, messageId, 'delete');
    onShowToast('Message deleted');
  };

  const getOffset = (id: number) => {
    if (swipe?.inquiryId === id) return clamp(swipe.offset, -MAX_SWIPE, MAX_SWIPE);
    if (openAction?.inquiryId === id) return actionOffset(openAction.side);
    return 0;
  };

  const handleInquiryMainClick = (id: number) => {
    if (suppressNextInquiryClickRef.current === id) {
      suppressNextInquiryClickRef.current = null;
      return;
    }
    setOpenId((current) => (current === id ? null : id));
  };

  const profilePeekInquiry = profilePeekInquiryId === null
    ? null
    : inquiries.find((inquiry) => inquiry.id === profilePeekInquiryId) ?? null;

  return (
    <>
      <Header onOpenProfile={onOpenProfile} notifications={notifications} onOpenNotification={onOpenNotification} />

      <div className="scroll-area">
        <div className="section-header">
          <span className="section-title">Inquiries ({filtered.length})</span>
        </div>

        <div className="search-filter-chips">
          {FILTERS.map((f) => (
            <button key={f} className={`filter-chip ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
              {f}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
            </div>
            <div className="empty-title">Nothing here</div>
            <div className="empty-sub">No inquiries match this filter.</div>
          </div>
        ) : (
          <div className="inquiry-list" onPointerDown={handleListPointerDown}>
            {filtered.map(({ inquiry: i, meta }) => {
              const offset = getOffset(i.id);
              const revealSide =
                swipe?.inquiryId === i.id
                  ? (offset > 0 ? 'pin' : offset < 0 ? 'delete' : null)
                  : openAction?.inquiryId === i.id
                    ? openAction.side
                    : null;

              return (
                <div key={i.id} className="inquiry-item">
                  <div
                    className={`inquiry-swipe-row ${meta.deleting ? `is-deleting ${meta.deleteDirection ?? ''}` : ''}`}
                    onPointerDown={(event) => handleRowPointerDown(event, i.id)}
                    onPointerMove={(event) => handleRowPointerMove(event, i.id)}
                    onPointerUp={(event) => handleRowPointerUp(event, i.id)}
                    onPointerCancel={() => handleRowPointerCancel(i.id)}
                  >
                    <div className={`inquiry-swipe-actions inquiry-swipe-actions-left ${revealSide === 'pin' ? 'show' : ''}`}>
                      <button
                        type="button"
                        className={`inquiry-swipe-action inquiry-pin-action ${meta.pinned ? 'is-unpin' : 'is-pin'}`}
                        style={meta.pinned ? {
                          background: 'linear-gradient(135deg, #e5e7eb, #cbd5e1)',
                          border: '1px solid var(--border-light)',
                          color: 'var(--text)',
                        } : undefined}
                        onPointerDown={(event) => {
                          event.stopPropagation();
                        }}
                        onClick={(event) => {
                          event.preventDefault();
                          event.stopPropagation();
                          handleAction(i.id, 'pin');
                        }}
                      >
                        <PinIcon />
                        <span>{meta.pinned ? 'Unpin' : 'Pin'}</span>
                      </button>
                    </div>
                    <div className={`inquiry-swipe-actions inquiry-swipe-actions-right ${revealSide === 'delete' ? 'show' : ''}`}>
                      <button
                        type="button"
                        className="inquiry-swipe-action inquiry-delete-action"
                        onPointerDown={(event) => {
                          event.stopPropagation();
                        }}
                        onClick={(event) => {
                          event.preventDefault();
                          event.stopPropagation();
                          handleAction(i.id, 'delete');
                        }}
                      >
                        <DeleteIcon />
                        <span>Delete</span>
                      </button>
                    </div>

                    <div
                      role="button"
                      tabIndex={0}
                      className={`inquiry-main ${revealSide ? 'is-swipe-open' : ''}`}
                      style={{ transform: `translate3d(${offset}px, 0, 0)` }}
                      onClick={() => handleInquiryMainClick(i.id)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault();
                          setOpenId(openId === i.id ? null : i.id);
                        }
                      }}
                    >
                      <button
                        type="button"
                        className="inbox-avatar inbox-avatar-button"
                        onClick={(event) => {
                          event.stopPropagation();
                          setProfilePeekInquiryId(i.id);
                        }}
                        aria-label={`View ${i.name} profile`}
                      >
                        <img src={i.avatar ?? ''} alt={i.name} />
                      </button>
                      <div className="inbox-info">
                        <div className="inquiry-name-row">
                          <span className="inbox-name">{i.name}</span>
                          <StatusBadge status={i.status} />
                        </div>
                        <div className="listing-id-row">
                          <span className="entity-id-tag">{i.userId}</span>
                          <span className={`roomie-score-chip is-${i.trust.roomieTemperature.toLowerCase()}`}>
                            {i.trust.roomieTemperature === 'Cool' ? '❄️' : i.trust.roomieTemperature === 'Warm' ? '🌤️' : '🔥'} Roomie {i.trust.roomieScore}
                          </span>
                        </div>
                        <div className="inquiry-unit">{unitTitle(i.unitId)}</div>
                        <div className="inbox-preview">{i.message}</div>
                      </div>
                      <div className="inbox-meta">
                        <div className="inbox-time">{i.time}</div>
                      </div>
                    </div>
                  </div>

                  {openId === i.id && (
                    <div className="inquiry-actions">
                      <div className="inquiry-reply-box">
                        <label className="inquiry-reply-label" htmlFor={`reply-${i.id}`}>Quick reply</label>
                        <textarea
                          id={`reply-${i.id}`}
                          className="inquiry-reply-input"
                          rows={3}
                          placeholder="Write a quick reply to the inquiry here"
                          value={draftReplies[i.id] ?? ''}
                          onChange={(event) => setDraft(i.id, event.target.value)}
                        />
                      </div>
                      <button
                        className="unit-btn unit-btn-primary"
                        onClick={() => { sendReply(i); }}
                      >
                        Reply
                      </button>
                      <button
                        className="unit-btn"
                        onClick={() => { scheduleViewing(i); }}
                      >
                        Schedule viewing
                      </button>
                      <button
                        className="unit-btn"
                        onClick={() => { setChatOpenId(i.id); }}
                      >
                        Open chat
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <div style={{ height: 16 }} />
      </div>

      {activeChat && (
        <div
          className="listing-modal-overlay"
          onClick={() => {
            setChatOpenId(null);
            setProfilePeekInquiryId(null);
          }}
        >
          <div
            className="listing-modal inquiry-chat-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="inquiry-chat-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="inquiry-chat-shell">
              <div className="inquiry-chat-header">
                <div>
                  <span className="listing-modal-type">Inquiry chat</span>
                  <h2 id="inquiry-chat-title" className="inquiry-chat-title">{activeChat.name}</h2>
                  <div className="listing-id-row listing-id-row-modal">
                    <span className="entity-id-tag">{activeChat.userId}</span>
                    <span className={`roomie-score-chip is-${activeChat.trust.roomieTemperature.toLowerCase()}`}>{activeChat.trust.roomieTemperature === 'Cool' ? '❄️' : activeChat.trust.roomieTemperature === 'Warm' ? '🌤️' : '🔥'} Roomie {activeChat.trust.roomieScore}</span>
                  </div>
                  <div className="listing-modal-location">{unitTitle(activeChat.unitId)}</div>
                </div>
                <div className="inquiry-chat-header-side">
                  <button
                    type="button"
                    className="inbox-avatar inquiry-chat-avatar inquiry-chat-avatar-button"
                    onClick={() => setProfilePeekInquiryId(activeChat.id)}
                    aria-label={`View ${activeChat.name} profile`}
                  >
                    <img src={activeChat.avatar ?? ''} alt={activeChat.name} />
                  </button>
                  <button
                    className="listing-modal-close inquiry-chat-close"
                    onClick={() => {
                      setChatOpenId(null);
                      setProfilePeekInquiryId(null);
                    }}
                    aria-label="Close chat"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>
              </div>

              <div
                className="inquiry-chat-thread"
                onPointerDown={(event) => {
                  if (event.target === event.currentTarget) {
                    setMessageOpenAction(null);
                    setMessageSwipe(null);
                    messageSwipeRef.current = null;
                  }
                }}
              >
                {activeChatMessages.map(({ entry, meta }) => {
                  const offset = currentMessageOffset(entry.id);
                  const revealSide = currentMessageSide(entry.id);
                  const isPinned = meta.pinned;
                  const senderClass = `inquiry-chat-${entry.sender}`;
                  return (
                    <div
                      key={entry.id}
                      className={`inquiry-chat-message-swipe-row ${senderClass} ${meta.deleting ? `is-deleting ${meta.deleteDirection ?? ''}` : ''}`}
                      style={{ alignSelf: entry.sender === 'tenant' ? 'flex-start' : 'flex-end' } as CSSProperties}
                      onPointerDown={(event) => handleMessagePointerDown(event, activeChat.id, entry.id)}
                      onPointerMove={(event) => {
                        if (messageSwipeRef.current?.inquiryId === activeChat.id && messageSwipeRef.current?.messageId === entry.id) {
                          updateMessageSwipe(event.clientX, event.clientY);
                        }
                      }}
                      onPointerUp={(event) => handleMessagePointerUp(event, activeChat.id, entry.id)}
                      onPointerCancel={(event) => handleMessagePointerCancel(event, activeChat.id, entry.id)}
                    >
                      <div className={`inquiry-chat-message-actions inquiry-chat-message-actions-left ${revealSide === 'pin' ? 'show' : ''}`}>
                        <button
                          type="button"
                          className={`inquiry-chat-message-action inquiry-chat-pin-action ${isPinned ? 'is-unpin' : 'is-pin'}`}
                          aria-label={isPinned ? 'Unpin message' : 'Pin message'}
                          style={isPinned ? {
                            background: 'linear-gradient(135deg, #e5e7eb, #cbd5e1)',
                            border: '1px solid var(--border-light)',
                            color: 'var(--text)',
                          } : undefined}
                          onPointerDown={(event) => {
                            event.stopPropagation();
                          }}
                          onClick={(event) => {
                            event.preventDefault();
                            event.stopPropagation();
                            toggleMessagePin(entry.id);
                          }}
                        >
                          <span className="inbox-action-icon">{isPinned ? <UnpinIcon /> : <PinIcon />}</span>
                          <span className="inbox-action-text">{isPinned ? 'Unpin' : 'Pin'}</span>
                        </button>
                      </div>
                      <div className={`inquiry-chat-message-actions inquiry-chat-message-actions-right ${revealSide === 'delete' ? 'show' : ''}`}>
                        <button
                          type="button"
                          className="inquiry-chat-message-action inquiry-chat-delete-action"
                          onPointerDown={(event) => {
                            event.stopPropagation();
                          }}
                          onClick={(event) => {
                            event.preventDefault();
                            event.stopPropagation();
                            deleteMessage(entry.id);
                          }}
                        >
                          <DeleteIcon />
                          <span>Delete</span>
                        </button>
                      </div>
                      <div
                        className={`inquiry-chat-message inquiry-chat-message-main ${senderClass} ${isPinned ? 'is-pinned' : ''}`}
                        style={{ transform: `translate3d(${offset}px, 0, 0)` } as CSSProperties}
                      >
                        <div className="inquiry-chat-bubble">
                          {entry.text}
                          {isPinned && <span className="inquiry-chat-pin-badge">Pinned</span>}
                        </div>
                        <div className="inquiry-chat-time">{entry.time}</div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="inquiry-chat-composer">
                <label className="inquiry-reply-label" htmlFor={`chat-reply-${activeChat.id}`}>Reply in chat</label>
                <textarea
                  id={`chat-reply-${activeChat.id}`}
                  className="inquiry-reply-input inquiry-chat-input"
                  rows={3}
                  placeholder="Write a reply to continue the conversation"
                  value={draftReplies[activeChat.id] ?? ''}
                  onChange={(event) => setDraft(activeChat.id, event.target.value)}
                />
                <div className="inquiry-chat-composer-actions">
                  <button
                    className="unit-btn unit-btn-primary"
                    onClick={() => sendReply(activeChat)}
                  >
                    Send reply
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <ProfilePeekModal
        open={profilePeekInquiry !== null}
        avatar={profilePeekInquiry?.avatar ?? ''}
        name={profilePeekInquiry?.name ?? ''}
        role="Tenant"
        userId={profilePeekInquiry?.userId}
        subtitle={profilePeekInquiry ? `${unitTitle(profilePeekInquiry.unitId)} · ${profilePeekInquiry.status}` : undefined}
        details={profilePeekInquiry ? [
          `${profilePeekInquiry.trust.roomieTemperature} Roomie ${profilePeekInquiry.trust.roomieScore}`,
          `${profilePeekInquiry.thread.length} chat messages`,
        ] : []}
        onClose={() => setProfilePeekInquiryId(null)}
      />
    </>
  );
}
