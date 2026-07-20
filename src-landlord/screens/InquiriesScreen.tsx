import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from 'react';
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
    message: {
      sender: 'tenant' | 'landlord' | 'system';
      text: string;
      time: string;
      replyTo?: {
        name: string;
        text: string;
      };
    },
    status?: InquiryStatus,
  ) => void;
  onOpenProfile: () => void;
  notifications: HeaderNotification[];
  onOpenNotification: (notification: HeaderNotification) => void;
  onShowToast: (msg: string) => void;
}

type Filter = 'All' | InquiryStatus | 'Calendar';
type SwipeSide = 'delete' | 'pin';

const FILTERS: Filter[] = ['All', 'New', 'Replied', 'Viewing', 'Calendar'];
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
  isDeleted: boolean;
};

type ViewingAppointment = {
  date: string;
  time: string;
};

type MessageContextMenuState = {
  inquiryId: number;
  messageId: number;
  top: number;
  left: number;
  width: number;
};

type MessageReplyTarget = {
  name: string;
  text: string;
};

function StatusBadge({ status }: { status: InquiryStatus }) {
  const cls = status === 'New' ? 'st-new' : status === 'Viewing' ? 'st-viewing' : 'st-replied';
  return <span className={`status-badge ${cls}`}>{status}</span>;
}

function timeStampLabel() {
  return 'Just now';
}

function latestReadInquiryMessageId(inquiry: Inquiry): number | null {
  const thread = inquiry.thread;
  for (let index = thread.length - 1; index >= 0; index -= 1) {
    const message = thread[index];
    if (message.sender !== 'landlord') continue;
    const hasTenantReplyAfter = thread.slice(index + 1).some((entry) => entry.sender === 'tenant');
    if (hasTenantReplyAfter) return message.id;
  }
  return null;
}

function formatLongDateTime(date: Date) {
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function buildCalendarMonth(baseMonth: Date) {
  const month = baseMonth.getMonth();
  const year = baseMonth.getFullYear();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const leadingBlanks = new Date(year, month, 1).getDay();
  const monthLabel = baseMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return {
    monthLabel,
    cells: [
      ...Array.from({ length: leadingBlanks }, (_, index) => ({ kind: 'blank' as const, id: `blank-${month}-${index}` })),
      ...Array.from({ length: daysInMonth }, (_, index) => {
        const day = index + 1;
        const date = new Date(year, month, day);
        const isoDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        return {
          kind: 'day' as const,
          id: isoDate,
          day,
          date: isoDate,
          weekday: date.toLocaleDateString('en-US', { weekday: 'short' }),
        };
      }),
    ],
  };
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

function heatLevelClass(count: number) {
  if (count >= 6) return 'heat-level-6';
  if (count >= 4) return 'heat-level-5';
  if (count >= 2) return 'heat-level-4';
  if (count === 1) return 'heat-level-2';
  return 'heat-level-0';
}

function calendarCountLabel(count: number) {
  if (count <= 0) return '0';
  if (count >= 6) return '6+';
  return String(count);
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
  const [profilePeekInquiryId, setProfilePeekInquiryId] = useState<number | null>(null);
  const [conversationActionSheetId, setConversationActionSheetId] = useState<number | null>(null);
  const [conversationReadById, setConversationReadById] = useState<Record<number, boolean>>({});
  const [conversationMutedById, setConversationMutedById] = useState<Record<number, boolean>>({});
  const [messageContextMenu, setMessageContextMenu] = useState<MessageContextMenuState | null>(null);
  const [replyTarget, setReplyTarget] = useState<MessageReplyTarget | null>(null);
  const [messageReactionByInquiryId, setMessageReactionByInquiryId] = useState<Record<number, Record<number, { emoji: string; count: number }>>>({});
  const [scheduleInquiryId, setScheduleInquiryId] = useState<number | null>(null);
  const [scheduleMonth, setScheduleMonth] = useState(() => new Date());
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('10:00');
  const [calendarMonth, setCalendarMonth] = useState(() => new Date());
  const [calendarSelectedDate, setCalendarSelectedDate] = useState('');
  const [viewingByInquiryId, setViewingByInquiryId] = useState<Record<number, ViewingAppointment>>({});
  const deleteTimersRef = useRef<Record<string, number>>({});
  const suppressNextInquiryClickRef = useRef<number | null>(null);
  const conversationLongPressRef = useRef<{ inquiryId: number; timer: number | null; startX: number; startY: number; triggered: boolean } | null>(null);
  const messageLongPressRef = useRef<{
    inquiryId: number;
    messageId: number;
    timer: number | null;
    startX: number;
    startY: number;
    triggered: boolean;
    rect: DOMRect | null;
  } | null>(null);
  const inquiryScrollerRef = useRef<HTMLDivElement | null>(null);
  const inquiryScrollAnchorRef = useRef<HTMLDivElement | null>(null);

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

  useEffect(() => {
    setViewingByInquiryId((prev) => {
      let changed = false;
      const next = { ...prev };

      for (const inquiry of inquiries) {
        if (inquiry.status !== 'Viewing' || !inquiry.viewingAt) continue;
        if (!next[inquiry.id]) {
          next[inquiry.id] = {
            date: inquiry.viewingAt,
            time: inquiry.viewingTime ?? '10:00',
          };
          changed = true;
        }
      }

      return changed ? next : prev;
    });
  }, [inquiries]);

  useEffect(() => () => {
    Object.values(deleteTimersRef.current).forEach((timer) => window.clearTimeout(timer));
  }, []);

  useEffect(() => {
    if (chatOpenId === null) {
      setMessageContextMenu(null);
      setReplyTarget(null);
      return;
    }

    const nextChat = inquiries.find((inquiry) => inquiry.id === chatOpenId) ?? null;
    if (!nextChat) {
      return;
    }

    setMessageContextMenu(null);
    setReplyTarget(null);
    setMessageMetaByInquiryId((prev) => {
      if (prev[nextChat.id]) return prev;
      return {
        ...prev,
        [nextChat.id]: {},
      };
    });
  }, [chatOpenId, inquiries]);

  const latestChatMessageId = chatOpenId === null
    ? null
    : (inquiries.find((inquiry) => inquiry.id === chatOpenId)?.thread.at(-1)?.id ?? null);

  useEffect(() => {
    if (!chatOpenId) return;
    const scroller = inquiryScrollerRef.current;
    const anchor = inquiryScrollAnchorRef.current;
    if (!scroller) return;

    const snapToBottom = () => {
      anchor?.scrollIntoView({ block: 'end', behavior: 'auto' });
      scroller.scrollTop = scroller.scrollHeight;
    };

    const raf = window.requestAnimationFrame(() => {
      snapToBottom();
      window.requestAnimationFrame(() => {
        snapToBottom();
      });
    });

    return () => window.cancelAnimationFrame(raf);
  }, [chatOpenId, inquiries, replyTarget?.text, latestChatMessageId]);

  const filtered = useMemo(() => {
    const base = filter === 'All' || filter === 'Calendar' ? inquiries : inquiries.filter((i) => i.status === filter);

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

  const viewingEntries = useMemo(() => {
    return inquiries
      .map((inquiry) => {
        const scheduled = viewingByInquiryId[inquiry.id];
        const scheduleDateValue = scheduled?.date ?? inquiry.viewingAt;
        if (!scheduleDateValue) return null;
        return {
          inquiry,
          date: scheduleDateValue,
          time: scheduled?.time ?? inquiry.viewingTime ?? inquiry.time,
        };
      })
      .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry))
      .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));
  }, [inquiries, viewingByInquiryId]);

  const viewingCalendarMonth = useMemo(() => {
    if (calendarSelectedDate) {
      const current = new Date(`${calendarSelectedDate}T12:00:00`);
      return new Date(current.getFullYear(), current.getMonth(), 1);
    }
    return new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), 1);
  }, [calendarMonth, calendarSelectedDate]);

  const viewingCalendar = buildCalendarMonth(viewingCalendarMonth);
  const selectedViewingDateEntries = useMemo(() => {
    if (!calendarSelectedDate) {
      return viewingEntries.filter((entry) => {
        const entryDate = new Date(`${entry.date}T12:00:00`);
        return (
          entryDate.getFullYear() === viewingCalendarMonth.getFullYear() &&
          entryDate.getMonth() === viewingCalendarMonth.getMonth()
        );
      });
    }
    return viewingEntries.filter((entry) => entry.date === calendarSelectedDate);
  }, [calendarSelectedDate, viewingCalendarMonth, viewingEntries]);

  const viewingCountsByDate = useMemo(() => {
    const counts = new Map<string, number>();
    viewingEntries.forEach((entry) => {
      const key = entry.date;
      counts.set(key, (counts.get(key) ?? 0) + 1);
    });
    return counts;
  }, [viewingEntries]);

  const showCalendarView = filter === 'Calendar';
  const displayedInquiryCount = showCalendarView ? viewingEntries.length : filtered.length;

  const unitTitle = (id: number) => units.find((u) => u.id === id)?.title ?? '';
  const activeChat = chatOpenId === null ? null : inquiries.find((inquiry) => inquiry.id === chatOpenId) ?? null;
  const scheduleInquiry = scheduleInquiryId === null ? null : inquiries.find((inquiry) => inquiry.id === scheduleInquiryId) ?? null;
  const scheduleCalendar = buildCalendarMonth(scheduleMonth);
  const selectedScheduleDate = scheduleDate ? new Date(`${scheduleDate}T12:00:00`) : null;
  const activeChatMessages = useMemo(() => {
    if (!activeChat) return [];

    const messageMeta = messageMetaByInquiryId[activeChat.id] ?? {};
    const reactionMap = messageReactionByInquiryId[activeChat.id] ?? {};

    return activeChat.thread
      .map((entry, index) => ({
        entry,
        index,
        meta: messageMeta[entry.id] ?? {
          pinned: false,
          hidden: false,
          deleting: false,
          deleteDirection: null,
          isDeleted: false,
        },
        reaction: reactionMap[entry.id] ?? null,
      }))
      .sort((a, b) => {
        if (a.meta.pinned !== b.meta.pinned) return a.meta.pinned ? -1 : 1;
        return a.index - b.index;
      });
  }, [activeChat, messageMetaByInquiryId, messageReactionByInquiryId]);

  const latestReadMessageId = useMemo(
    () => (activeChat ? latestReadInquiryMessageId(activeChat) : null),
    [activeChat],
  );

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
      {
        sender: 'landlord',
        text,
        time: timeStampLabel(),
        replyTo: replyTarget ?? undefined,
      },
      'Replied',
    );
    setDraftReplies((prev) => ({ ...prev, [inquiry.id]: '' }));
    setReplyTarget(null);
    onShowToast(`✉️ Reply sent to ${inquiry.name}`);
  }

  function scheduleViewing(inquiry: Inquiry) {
    const today = new Date();
    const nextMorning = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
    const initialMonth = new Date(nextMorning.getFullYear(), nextMorning.getMonth(), 1);
    const initialDate = `${nextMorning.getFullYear()}-${String(nextMorning.getMonth() + 1).padStart(2, '0')}-${String(nextMorning.getDate()).padStart(2, '0')}`;
    setScheduleInquiryId(inquiry.id);
    setScheduleMonth(initialMonth);
    setScheduleDate(initialDate);
    setScheduleTime('10:00');
  }

  function confirmScheduleViewing() {
    if (!scheduleInquiry || !scheduleDate || !scheduleTime) return;
    const [hours, minutes] = scheduleTime.split(':').map((part) => Number(part));
    const scheduledDate = new Date(`${scheduleDate}T00:00:00`);
    scheduledDate.setHours(hours, minutes, 0, 0);

    onSetStatus(scheduleInquiry.id, 'Viewing');
    onAddThreadMessage(
      scheduleInquiry.id,
      {
        sender: 'system',
        text: `Viewing scheduled for ${formatLongDateTime(scheduledDate)}. Follow up with the applicant for access notes.`,
        time: timeStampLabel(),
      },
      'Viewing',
    );
    setViewingByInquiryId((prev) => ({
      ...prev,
      [scheduleInquiry.id]: {
        date: scheduleDate,
        time: scheduleTime,
      },
    }));
    onShowToast(`📅 Viewing scheduled with ${scheduleInquiry.name}`);
    setScheduleInquiryId(null);
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
        isDeleted: false,
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
            isDeleted: true,
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

  const commitMessageDelete = (inquiryId: number, messageId: number, direction: SwipeSide) => {
    setMessageMetaByInquiryId((prev) => {
      const currentInquiry = prev[inquiryId] ?? {};
      const currentMessage = currentInquiry[messageId] ?? {
        pinned: false,
        hidden: false,
        deleting: false,
        deleteDirection: null,
        isDeleted: false,
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
              isDeleted: true,
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

    clearConversationLongPress();
    conversationLongPressRef.current = {
      inquiryId: id,
      timer: window.setTimeout(() => {
        const current = conversationLongPressRef.current;
        if (!current || current.inquiryId !== id || current.triggered) return;
        current.triggered = true;
        setSwipe(null);
        setOpenAction(null);
        setConversationActionSheetId(id);
      }, MESSAGE_LONG_PRESS_DELAY),
      startX: event.clientX,
      startY: event.clientY,
      triggered: false,
    };

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

    const longPress = conversationLongPressRef.current;
    if (longPress && longPress.inquiryId === id && !longPress.triggered) {
      const dxLong = event.clientX - longPress.startX;
      const dyLong = event.clientY - longPress.startY;
      if (Math.abs(dxLong) > MESSAGE_LONG_PRESS_MOVE_TOLERANCE || Math.abs(dyLong) > MESSAGE_LONG_PRESS_MOVE_TOLERANCE) {
        clearConversationLongPress();
      }
    }

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

    const longPress = conversationLongPressRef.current;
    const longPressTriggered = Boolean(longPress && longPress.inquiryId === id && longPress.triggered);
    clearConversationLongPress();
    if (longPressTriggered) {
      setSwipe(null);
      return;
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
    clearConversationLongPress();
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

  const deleteMessage = (messageId: number) => {
    if (!activeChat) return;
    commitMessageDelete(activeChat.id, messageId, 'delete');
    onShowToast('Message deleted');
  };

  const openMessageContextMenu = useCallback((inquiryId: number, messageId: number, rect: DOMRect, align: 'left' | 'right') => {
    const width = MESSAGE_CONTEXT_MENU_WIDTH;
    const left = align === 'right'
      ? clamp(rect.right - width, 12, Math.max(12, window.innerWidth - width - 12))
      : clamp(rect.left, 12, Math.max(12, window.innerWidth - width - 12));
    const top = clamp(rect.bottom + 8, 12, Math.max(12, window.innerHeight - 220));
    setMessageContextMenu({ inquiryId, messageId, left, top, width });
  }, []);

  const clearConversationLongPress = useCallback(() => {
    const current = conversationLongPressRef.current;
    if (current?.timer) window.clearTimeout(current.timer);
    conversationLongPressRef.current = null;
  }, []);

  const clearMessageLongPress = useCallback(() => {
    const current = messageLongPressRef.current;
    if (current?.timer) window.clearTimeout(current.timer);
    messageLongPressRef.current = null;
  }, []);

  const handleConversationLongPressAction = useCallback((action: 'read' | 'mute' | 'pin' | 'delete') => {
    if (conversationActionSheetId === null) return;
    if (action === 'read') {
      setConversationReadById((prev) => ({ ...prev, [conversationActionSheetId]: true }));
      onShowToast('Marked as read');
    } else if (action === 'mute') {
      setConversationMutedById((prev) => ({ ...prev, [conversationActionSheetId]: !prev[conversationActionSheetId] }));
      onShowToast(conversationMutedById[conversationActionSheetId] ? 'Notifications on' : 'Notifications off');
    } else if (action === 'pin') {
      handleAction(conversationActionSheetId, 'pin');
    } else {
      handleAction(conversationActionSheetId, 'delete');
    }
    setConversationActionSheetId(null);
  }, [conversationActionSheetId, conversationMutedById, handleAction, onShowToast]);

  const handleMessageLongPressAction = useCallback((action: 'copy' | 'reply' | 'emoji' | 'delete', payload?: string) => {
    if (!activeChat || !messageContextMenu) return;
    const message = activeChat.thread.find((entry) => entry.id === messageContextMenu.messageId);
    if (!message) {
      setMessageContextMenu(null);
      return;
    }

    if (action === 'copy') {
      void navigator.clipboard?.writeText(message.text);
    } else if (action === 'reply') {
      const sender = message.sender === 'landlord' ? 'You' : activeChat.name;
      setReplyTarget({ name: sender, text: message.text });
    } else if (action === 'emoji' && payload) {
      const currentReaction = messageReactionByInquiryId[activeChat.id]?.[message.id];
      setMessageReactionByInquiryId((prev) => {
        const inquiryReactions = prev[activeChat.id] ?? {};
        if (currentReaction?.emoji === payload) {
          const { [message.id]: _removed, ...rest } = inquiryReactions;
          return {
            ...prev,
            [activeChat.id]: rest,
          };
        }
        return {
          ...prev,
          [activeChat.id]: {
            ...inquiryReactions,
            [message.id]: { emoji: payload, count: 1 },
          },
        };
      });
    } else if (action === 'delete' && message.sender === 'landlord') {
      deleteMessage(message.id);
      return;
    }

    setMessageContextMenu(null);
  }, [activeChat, deleteMessage, messageContextMenu]);

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
          <span className="section-title">
            {showCalendarView ? `Viewing calendar (${displayedInquiryCount})` : `Inquiries (${displayedInquiryCount})`}
          </span>
        </div>

        <div className="search-filter-chips">
          {FILTERS.map((f) => (
            <button key={f} className={`filter-chip ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
              {f}
            </button>
          ))}
        </div>

        {showCalendarView ? (
          <div className="calendar-views inquiry-calendar-tab-shell">
            <div className="calendar-nav">
              <div className="calendar-nav-group" aria-label="Calendar month navigation">
                <span className="calendar-nav-title">Month</span>
                <div className="calendar-nav-controls">
                  <button
                    type="button"
                    className="calendar-arrow-btn"
                    onClick={() => setCalendarMonth((current) => new Date(current.getFullYear(), current.getMonth() - 1, 1))}
                    aria-label="Previous month"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="15 18 9 12 15 6" />
                    </svg>
                  </button>
                  <strong>{viewingCalendarMonth.toLocaleDateString('en-US', { month: 'long' })}</strong>
                  <button
                    type="button"
                    className="calendar-arrow-btn"
                    onClick={() => setCalendarMonth((current) => new Date(current.getFullYear(), current.getMonth() + 1, 1))}
                    aria-label="Next month"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </button>
                </div>
              </div>
              <div className="calendar-nav-group" aria-label="Calendar year navigation">
                <span className="calendar-nav-title">Year</span>
                <div className="calendar-nav-controls">
                  <button
                    type="button"
                    className="calendar-arrow-btn"
                    onClick={() => setCalendarMonth((current) => new Date(current.getFullYear() - 1, current.getMonth(), 1))}
                    aria-label="Previous year"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="15 18 9 12 15 6" />
                    </svg>
                  </button>
                  <strong>{viewingCalendarMonth.getFullYear()}</strong>
                  <button
                    type="button"
                    className="calendar-arrow-btn"
                    onClick={() => setCalendarMonth((current) => new Date(current.getFullYear() + 1, current.getMonth(), 1))}
                    aria-label="Next year"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            <div className="calendar-header-row">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <span key={day} className="calendar-weekday">{day}</span>
              ))}
            </div>

            <div className="calendar-grid">
              {viewingCalendar.cells.map((cell) => {
                if (cell.kind === 'blank') {
                  return <div key={cell.id} className="calendar-day calendar-day-empty" aria-hidden="true" />;
                }

                const count = viewingCountsByDate.get(cell.date) ?? 0;
                const isSelected = cell.date === calendarSelectedDate;

                return (
                  <button
                    key={cell.id}
                    type="button"
                    className={`calendar-day ${heatLevelClass(count)} ${isSelected ? 'is-selected' : ''}`}
                    aria-label={`${cell.date}: ${count} scheduled viewings`}
                    onClick={() => setCalendarSelectedDate((current) => (current === cell.date ? '' : cell.date))}
                  >
                    <div className="calendar-day-fill" />
                    <span className="calendar-day-number">{cell.day}</span>
                    <span className="calendar-day-count">{calendarCountLabel(count)}</span>
                  </button>
                );
              })}
            </div>

            <div className="inquiry-calendar-summary">
              {calendarSelectedDate
                ? `Scheduled viewings for ${new Date(`${calendarSelectedDate}T12:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
                : 'Tap a day to see the scheduled viewings.'}
            </div>

            <div className="inquiry-list inquiry-calendar-results">
              {selectedViewingDateEntries.length === 0 ? (
                <div className="empty-state inquiry-calendar-empty">
                  <div className="empty-title">No scheduled viewing</div>
                  <div className="empty-sub">There are no inquirers booked on this date.</div>
                </div>
              ) : (
                selectedViewingDateEntries.map(({ inquiry }) => (
                  <div key={inquiry.id} className="inquiry-item">
                    <div
                      role="button"
                      tabIndex={0}
                      className="inquiry-main"
                      onClick={() => setOpenId((current) => (current === inquiry.id ? null : inquiry.id))}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault();
                          setOpenId((current) => (current === inquiry.id ? null : inquiry.id));
                        }
                      }}
                    >
                      <button
                        type="button"
                        className="inbox-avatar inbox-avatar-button"
                        onClick={(event) => {
                          event.stopPropagation();
                          setProfilePeekInquiryId(inquiry.id);
                        }}
                        aria-label={`View ${inquiry.name} profile`}
                      >
                        <img src={inquiry.avatar ?? ''} alt={inquiry.name} />
                      </button>
                      <div className="inbox-info">
                        <div className="inquiry-name-row">
                          <span className="inbox-name">{inquiry.name}</span>
                          <StatusBadge status={inquiry.status} />
                        </div>
                        <div className="listing-id-row">
                          <span className="entity-id-tag">{inquiry.userId}</span>
                          <span className={`roomie-score-chip is-${inquiry.trust.roomieTemperature.toLowerCase()}`}>
                            {inquiry.trust.roomieTemperature === 'Cool' ? '❄️' : inquiry.trust.roomieTemperature === 'Warm' ? '🌤️' : '🔥'} Roomie {inquiry.trust.roomieScore}
                          </span>
                        </div>
                        <div className="inquiry-unit">{unitTitle(inquiry.unitId)}</div>
                        <div className="inbox-preview">{inquiry.message}</div>
                      </div>
                      <div className="inbox-meta">
                        <div className="inbox-time">{inquiry.time}</div>
                      </div>
                    </div>

                    {openId === inquiry.id && (
                      <div className="inquiry-actions">
                        <div className="inquiry-reply-box">
                          <label className="inquiry-reply-label" htmlFor={`reply-calendar-${inquiry.id}`}>Quick reply</label>
                          <textarea
                            id={`reply-calendar-${inquiry.id}`}
                            className="inquiry-reply-input"
                            rows={3}
                            placeholder="Write a quick reply to the inquiry here"
                            value={draftReplies[inquiry.id] ?? ''}
                            onChange={(event) => setDraft(inquiry.id, event.target.value)}
                          />
                        </div>
                        <button className="unit-btn unit-btn-primary" onClick={() => { sendReply(inquiry); }}>
                          Reply
                        </button>
                        <button className="unit-btn" onClick={() => { setScheduleInquiryId(inquiry.id); }}>
                          Schedule viewing
                        </button>
                        <button className="unit-btn" onClick={() => { setChatOpenId(inquiry.id); }}>
                          Open chat
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        ) : filtered.length === 0 ? (
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
              const isRead = Boolean(conversationReadById[i.id]);

              return (
                <div key={i.id} className={`inquiry-item ${meta.pinned ? 'is-pinned' : ''}`}>
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
                        {isRead && <div className="inbox-read-label">Read</div>}
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

      {scheduleInquiry && (
        <div
          className="listing-modal-overlay"
          onClick={() => setScheduleInquiryId(null)}
        >
          <div
            className="listing-modal inquiry-calendar-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="schedule-viewing-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="listing-modal-head">
              <div className="listing-modal-title-block">
                <h2 id="schedule-viewing-title" className="listing-modal-title">Schedule viewing</h2>
                <div className="listing-modal-subtitle">{scheduleInquiry.name} · {unitTitle(scheduleInquiry.unitId)}</div>
              </div>
              <button
                type="button"
                className="listing-modal-close"
                onClick={() => setScheduleInquiryId(null)}
                aria-label="Close schedule viewing modal"
              >
                ×
              </button>
            </div>

            <div className="inquiry-calendar-shell">
              <div className="listing-history-calendar-head">
                <strong>{scheduleCalendar.monthLabel}</strong>
                <div className="calendar-nav-group">
                  <button
                    type="button"
                    className="calendar-arrow-btn"
                    onClick={() => setScheduleMonth((current) => new Date(current.getFullYear(), current.getMonth() - 1, 1))}
                    aria-label="Previous month"
                  >
                    ‹
                  </button>
                  <button
                    type="button"
                    className="calendar-arrow-btn"
                    onClick={() => setScheduleMonth((current) => new Date(current.getFullYear(), current.getMonth() + 1, 1))}
                    aria-label="Next month"
                  >
                    ›
                  </button>
                </div>
              </div>

              <div className="listing-history-calendar-weekdays">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                  <span key={day}>{day}</span>
                ))}
              </div>

              <div className="listing-history-calendar-grid">
                {scheduleCalendar.cells.map((cell) => {
                  if (cell.kind === 'blank') {
                    return <div key={cell.id} className="listing-history-calendar-cell is-empty" aria-hidden="true" />;
                  }

                  const isSelected = cell.date === scheduleDate;
                  return (
                    <button
                      key={cell.id}
                      type="button"
                      className={`listing-history-calendar-cell inquiry-calendar-day ${isSelected ? 'is-selected' : ''}`}
                      onClick={() => setScheduleDate(cell.date)}
                    >
                      <span>{cell.day}</span>
                      <small>{cell.weekday}</small>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="inquiry-calendar-time-row">
              <label className="inquiry-reply-label" htmlFor="schedule-time">Select time</label>
              <input
                id="schedule-time"
                type="time"
                className="inquiry-reply-input inquiry-time-input"
                value={scheduleTime}
                onChange={(event) => setScheduleTime(event.target.value)}
              />
            </div>

            <div className="inquiry-calendar-summary">
              {selectedScheduleDate ? `Selected: ${selectedScheduleDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} at ${scheduleTime}` : 'Select a date and time to continue.'}
            </div>

            <div className="inquiry-calendar-actions">
              <button type="button" className="unit-btn" onClick={() => setScheduleInquiryId(null)}>
                Cancel
              </button>
              <button type="button" className="unit-btn unit-btn-primary" onClick={confirmScheduleViewing}>
                Confirm viewing
              </button>
            </div>
          </div>
        </div>
      )}

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
                <div className="inquiry-chat-header-main">
                  <button
                    type="button"
                    className="inbox-avatar inquiry-chat-avatar inquiry-chat-avatar-button"
                    onClick={() => setProfilePeekInquiryId(activeChat.id)}
                    aria-label={`View ${activeChat.name} profile`}
                  >
                    <img src={activeChat.avatar ?? ''} alt={activeChat.name} />
                  </button>
                  <div className="inquiry-chat-title-block">
                    <span className="listing-modal-type">Inquiry chat</span>
                    <h2 id="inquiry-chat-title" className="inquiry-chat-title">{activeChat.name}</h2>
                    <div className="listing-id-row listing-id-row-modal">
                      <span className="entity-id-tag">{activeChat.userId}</span>
                      <span className={`roomie-score-chip is-${activeChat.trust.roomieTemperature.toLowerCase()}`}>{activeChat.trust.roomieTemperature === 'Cool' ? '❄️' : activeChat.trust.roomieTemperature === 'Warm' ? '🌤️' : '🔥'} Roomie {activeChat.trust.roomieScore}</span>
                    </div>
                    <div className="listing-modal-location">{unitTitle(activeChat.unitId)}</div>
                  </div>
                </div>
                <div className="inquiry-chat-header-side">
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

              <div className="inquiry-chat-body">
                <div className="scroll-area inquiry-chat-scroller" ref={inquiryScrollerRef}>
                  <div
                    className="inquiry-chat-thread"
                    onPointerDown={(event) => {
                      if (event.target === event.currentTarget) {
                        setMessageContextMenu(null);
                        clearMessageLongPress();
                      }
                    }}
                  >
                    {activeChatMessages.map(({ entry, meta, reaction }) => {
                      const isPinned = meta.pinned;
                      const senderClass = `inquiry-chat-${entry.sender}`;
                      const isRead = entry.sender === 'landlord' && entry.id === latestReadMessageId;
                      return (
                        <div
                          key={entry.id}
                          className={`inquiry-chat-message-swipe-row ${senderClass} ${meta.deleting ? `is-deleting ${meta.deleteDirection ?? ''}` : ''}`}
                          style={{ alignSelf: entry.sender === 'tenant' ? 'flex-start' : 'flex-end' } as CSSProperties}
                          onPointerDown={(event) => {
                            if (meta.isDeleted) return;
                            if (event.pointerType === 'mouse' && event.button !== 0) return;
                            const target = event.target as HTMLElement | null;
                            if (target?.closest('button, textarea, input, select, a')) return;

                            clearMessageLongPress();
                            setMessageContextMenu(null);
                            messageLongPressRef.current = {
                              inquiryId: activeChat.id,
                              messageId: entry.id,
                              timer: window.setTimeout(() => {
                                const current = messageLongPressRef.current;
                                if (!current || current.inquiryId !== activeChat.id || current.messageId !== entry.id || current.triggered) return;
                                current.triggered = true;
                                const rect = current.rect ?? event.currentTarget.getBoundingClientRect();
                                openMessageContextMenu(
                                  activeChat.id,
                                  entry.id,
                                  rect,
                                  entry.sender === 'landlord' || entry.sender === 'system' ? 'right' : 'left',
                                );
                              }, MESSAGE_LONG_PRESS_DELAY),
                              startX: event.clientX,
                              startY: event.clientY,
                              triggered: false,
                              rect: event.currentTarget.getBoundingClientRect(),
                            };
                          }}
                          onPointerMove={(event) => {
                            const current = messageLongPressRef.current;
                            if (current && current.inquiryId === activeChat.id && current.messageId === entry.id && !current.triggered) {
                              const dxLong = event.clientX - current.startX;
                              const dyLong = event.clientY - current.startY;
                              if (Math.abs(dxLong) > MESSAGE_LONG_PRESS_MOVE_TOLERANCE || Math.abs(dyLong) > MESSAGE_LONG_PRESS_MOVE_TOLERANCE) {
                                clearMessageLongPress();
                              }
                            }
                          }}
                          onPointerUp={(event) => {
                            try {
                              event.currentTarget.releasePointerCapture(event.pointerId);
                            } catch {
                              // ignore
                            }
                            const current = messageLongPressRef.current;
                            const triggered = Boolean(current && current.inquiryId === activeChat.id && current.messageId === entry.id && current.triggered);
                            clearMessageLongPress();
                            if (triggered) return;
                          }}
                          onPointerCancel={() => {
                            clearMessageLongPress();
                          }}
                        >
                          <div
                            className={`inquiry-chat-message inquiry-chat-message-main ${senderClass} ${isPinned ? 'is-pinned' : ''} ${meta.isDeleted ? 'is-deleted' : ''}`}
                          >
                            <div className="inquiry-chat-bubble">
                              {meta.isDeleted ? (
                                <div className="inbox-deleted-message">
                                  <span className="inbox-deleted-message-icon">
                                    <DeletedNoticeIcon />
                                  </span>
                                  <span className="inbox-deleted-message-text">Message deleted</span>
                                </div>
                              ) : (
                                <>
                                  {entry.sender === 'landlord' && entry.replyTo && (
                                    <div className="inbox-reply-quote">
                                      <div className="inbox-reply-source">Replying to</div>
                                      <div className="inbox-reply-name">{entry.replyTo.name}</div>
                                      <div className="inbox-reply-text">{entry.replyTo.text}</div>
                                    </div>
                                  )}
                                  {entry.sender === 'landlord' && entry.replyTo && <div className="inbox-reply-divider" />}
                                  <div>{entry.text}</div>
                                  {isPinned && <span className="inquiry-chat-pin-badge">Pinned</span>}
                                </>
                              )}
                            </div>
                            {reaction && !meta.isDeleted && (
                              <div className={`inbox-message-reaction-row ${entry.sender === 'landlord' ? 'self' : 'other'}`}>
                                <div className="inbox-message-reaction" aria-label={`Reaction ${reaction.emoji} ${reaction.count} times`}>
                                  <span className="inbox-message-reaction-emoji">{reaction.emoji}</span>
                                  <span className="inbox-message-reaction-count">{reaction.count}</span>
                                </div>
                              </div>
                            )}
                            <div className="inquiry-chat-time">
                              <span className="inquiry-message-time">{entry.time}</span>
                              {isRead && !meta.isDeleted && (
                                <>
                                  <span className="inbox-time-divider" aria-hidden="true">•</span>
                                  <span className="inbox-read-label">Read</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={inquiryScrollAnchorRef} className="inbox-scroll-anchor" aria-hidden="true" />
                  </div>
                </div>
              </div>

              <div className="inquiry-chat-footer">
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

                <div className="inquiry-chat-composer">
                  <label className="inquiry-reply-label" htmlFor={`chat-reply-${activeChat.id}`}>Reply in chat</label>
                  <textarea
                    id={`chat-reply-${activeChat.id}`}
                    className="inquiry-reply-input inquiry-chat-input"
                    rows={3}
                    placeholder="Write a reply to continue the conversation"
                    value={draftReplies[activeChat.id] ?? ''}
                    onChange={(event) => setDraft(activeChat.id, event.target.value)}
                    onFocus={() => {
                      window.requestAnimationFrame(() => {
                        const scroller = inquiryScrollerRef.current;
                        if (scroller) scroller.scrollTop = scroller.scrollHeight;
                      });
                    }}
                    onBlur={() => {
                      window.requestAnimationFrame(() => {
                        const scroller = inquiryScrollerRef.current;
                        if (scroller) scroller.scrollTop = scroller.scrollHeight;
                      });
                    }}
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
        </div>
      )}

      {messageContextMenu && activeChat && (() => {
        const message = activeChat.thread.find((entry) => entry.id === messageContextMenu.messageId);
        if (!message) return null;
        const currentReaction = messageReactionByInquiryId[activeChat.id]?.[message.id];
        return (
          <div className="message-context-menu-overlay" onPointerDown={() => setMessageContextMenu(null)}>
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
              <button type="button" className="message-context-action" onClick={() => handleMessageLongPressAction('copy')}>
                Copy
              </button>
              <button type="button" className="message-context-action" onClick={() => handleMessageLongPressAction('reply')}>
                Reply
              </button>
              {message.sender === 'landlord' && (
                <button type="button" className="message-context-action is-destructive" onClick={() => handleMessageLongPressAction('delete')}>
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

      {conversationActionSheetId !== null && (
        <div className="conversation-sheet-overlay" onClick={() => setConversationActionSheetId(null)}>
          <div
            className="conversation-sheet"
            role="dialog"
            aria-modal="true"
            aria-label="Inquiry options"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="conversation-sheet-handle" />
            <div className="conversation-sheet-title">Inquiry options</div>
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
                  <small>Clear the unread badge for this inquiry.</small>
                </span>
              </button>
              <button type="button" className="conversation-sheet-item" onClick={() => handleConversationLongPressAction('mute')}>
                <span className="conversation-sheet-icon is-muted">
                  {conversationMutedById[conversationActionSheetId] ? <BellOffIcon /> : <BellIcon />}
                </span>
                <span className="conversation-sheet-copy">
                  <strong>{conversationMutedById[conversationActionSheetId] ? 'Turn on notification' : 'Turn off notification'}</strong>
                  <small>{conversationMutedById[conversationActionSheetId] ? 'Restore alerts for this inquiry.' : 'Mute this inquiry locally.'}</small>
                </span>
              </button>
              <button type="button" className="conversation-sheet-item" onClick={() => handleConversationLongPressAction('pin')}>
                <span className="conversation-sheet-icon is-pin">
                  {metaById[conversationActionSheetId]?.pinned ? <UnpinIcon /> : <PinIcon />}
                </span>
                <span className="conversation-sheet-copy">
                  <strong>{metaById[conversationActionSheetId]?.pinned ? 'Unpin inquiry' : 'Pin inquiry'}</strong>
                  <small>{metaById[conversationActionSheetId]?.pinned ? 'Return it to regular order.' : 'Keep it at the top of the list.'}</small>
                </span>
              </button>
              <button type="button" className="conversation-sheet-item" onClick={() => handleConversationLongPressAction('delete')}>
                <span className="conversation-sheet-icon is-delete">
                  <DeleteIcon />
                </span>
                <span className="conversation-sheet-copy">
                  <strong>Delete inquiry</strong>
                  <small>Remove this inquiry from the list.</small>
                </span>
              </button>
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
        memberSince={profilePeekInquiry?.memberSince}
        verificationStatus={profilePeekInquiry ? (profilePeekInquiry.verified ? 'Verified tenant' : 'Unverified tenant') : undefined}
        roomieScore={profilePeekInquiry?.trust.roomieScore}
        uploadedListings={[]}
        tenantReviews={profilePeekInquiry?.tenantReviews ?? []}
        landlordReviews={profilePeekInquiry?.landlordReviews ?? []}
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
