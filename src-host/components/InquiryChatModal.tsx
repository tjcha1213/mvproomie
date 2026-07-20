import { createPortal } from 'react-dom';
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import type { Inquiry, InquiryStatus, Unit } from '../data';
import ProfilePeekModal from '../../src/components/ProfilePeekModal';

interface Props {
  open: boolean;
  inquiry: Inquiry | null;
  units: Unit[];
  onClose: () => void;
  onSetStatus: (id: number, status: InquiryStatus) => void;
  onSetViewing: (id: number, viewing: { date: string; time: string } | null) => void;
  onAddThreadMessage: (
    id: number,
    message: {
      sender: 'tenant' | 'host' | 'system';
      text: string;
      time: string;
      replyTo?: { name: string; text: string };
    },
    status?: Inquiry['status'],
  ) => void;
  onShowToast: (msg: string) => void;
}

type CalendarCell =
  | { kind: 'blank'; id: string }
  | { kind: 'day'; id: string; day: number; date: string; weekday: string };

type MessageContextMenuState = {
  inquiryId: number;
  messageId: number;
  top: number;
  left: number;
  width: number;
};

type ThreadMessageMeta = {
  pinned: boolean;
  hidden: boolean;
  deleting: boolean;
  deleteDirection: 'delete' | 'pin' | null;
  isDeleted: boolean;
};

function DeletedNoticeIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path d="M12 8.25v5.1" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M12 15.9h.01" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  );
}

function latestReadInquiryMessageId(inquiry: Inquiry): number | null {
  const thread = inquiry.thread;
  for (let index = thread.length - 1; index >= 0; index -= 1) {
    const message = thread[index];
    if (message.sender !== 'host') continue;
    const hasTenantReplyAfter = thread.slice(index + 1).some((entry) => entry.sender === 'tenant');
    if (hasTenantReplyAfter) return message.id;
  }
  return null;
}

function buildCalendarMonth(baseMonth: Date) {
  const month = baseMonth.getMonth();
  const year = baseMonth.getFullYear();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const leadingBlanks = new Date(year, month, 1).getDay();
  return {
    monthLabel: baseMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
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
    ] as CalendarCell[],
  };
}

export default function InquiryChatModal({ open, inquiry, units, onClose, onSetStatus, onSetViewing, onAddThreadMessage, onShowToast }: Props) {
  const [draft, setDraft] = useState('');
  const [replyTarget, setReplyTarget] = useState<{ name: string; text: string } | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [scheduleCancelOpen, setScheduleCancelOpen] = useState(false);
  const [scheduleMonth, setScheduleMonth] = useState(() => new Date());
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('10:00');
  const [messageMeta, setMessageMeta] = useState<Record<number, ThreadMessageMeta>>({});
  const [messageReaction, setMessageReaction] = useState<Record<number, { emoji: string; count: number }>>({});
  const [messageContextMenu, setMessageContextMenu] = useState<MessageContextMenuState | null>(null);
  const messageLongPressRef = useRef<{
    messageId: number;
    timer: number | null;
    startX: number;
    startY: number;
    triggered: boolean;
    rect: DOMRect | null;
  } | null>(null);
  const suppressNextScheduleClickRef = useRef(false);

  const selectedScheduleDate = useMemo(() => (scheduleDate ? new Date(`${scheduleDate}T12:00:00`) : null), [scheduleDate]);
  const scheduleCalendar = useMemo(() => buildCalendarMonth(scheduleMonth), [scheduleMonth]);
  const unitTitle = inquiry ? (units.find((unit) => unit.id === inquiry.unitId)?.title ?? 'Listing') : 'Listing';
  const latestReadMessageId = useMemo(() => (inquiry ? latestReadInquiryMessageId(inquiry) : null), [inquiry]);
  const activeChatMessages = useMemo(() => {
    if (!inquiry) return [];

    return inquiry.thread
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
        reaction: messageReaction[entry.id] ?? null,
      }))
      .sort((a, b) => {
        if (a.meta.pinned !== b.meta.pinned) return a.meta.pinned ? -1 : 1;
        return a.index - b.index;
      });
  }, [inquiry, messageMeta, messageReaction]);

  const clearMessageLongPress = useCallback(() => {
    const current = messageLongPressRef.current;
    if (current?.timer) window.clearTimeout(current.timer);
    messageLongPressRef.current = null;
  }, []);

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  useEffect(() => {
    if (!open || !inquiry) return;
    setDraft('');
    setReplyTarget(null);
    setScheduleOpen(false);
    setScheduleCancelOpen(false);
    setMessageContextMenu(null);
    setScheduleDate(inquiry.viewingAt ?? '');
    setScheduleTime(inquiry.viewingTime ?? '10:00');
    setMessageMeta(
      inquiry.thread.reduce<Record<number, ThreadMessageMeta>>((acc, entry) => {
        acc[entry.id] = acc[entry.id] ?? {
          pinned: false,
          hidden: false,
          deleting: false,
          deleteDirection: null,
          isDeleted: false,
        };
        return acc;
      }, {}),
    );
    setMessageReaction({});
    if (inquiry.viewingAt) {
      const date = new Date(`${inquiry.viewingAt}T12:00:00`);
      if (!Number.isNaN(date.getTime())) {
        setScheduleMonth(new Date(date.getFullYear(), date.getMonth(), 1));
      }
    }
  }, [inquiry, open]);

  const sendReply = () => {
    if (!inquiry) return;
    const text = draft.trim();
    if (!text) return;
    onAddThreadMessage(
      inquiry.id,
      {
        sender: 'host',
        text,
        time: 'Just now',
        replyTo: replyTarget ?? undefined,
      },
      inquiry.status === 'New' ? 'Viewing' : undefined,
    );
    onShowToast('💬 Reply sent');
    setDraft('');
    setReplyTarget(null);
  };

  const confirmViewing = () => {
    if (!inquiry) return;
    if (!scheduleDate) return;
    onSetViewing(inquiry.id, { date: scheduleDate, time: scheduleTime });
    onSetStatus(inquiry.id, 'Viewing');
    onShowToast('📅 Viewing scheduled');
    setScheduleOpen(false);
  };

  const cancelViewing = () => {
    if (!inquiry) return;
    onSetViewing(inquiry.id, null);
    onSetStatus(inquiry.id, 'Replied');
    onShowToast('🗓️ Viewing canceled');
    setScheduleCancelOpen(false);
  };

  const openMessageContextMenu = useCallback((messageId: number, rect: DOMRect, align: 'left' | 'right') => {
    const width = 248;
    const left = align === 'right'
      ? Math.max(12, Math.min(window.innerWidth - width - 12, rect.right - width))
      : Math.max(12, Math.min(window.innerWidth - width - 12, rect.left));
    const top = Math.max(12, Math.min(window.innerHeight - 220, rect.bottom + 8));
    if (!inquiry) return;
    setMessageContextMenu({ inquiryId: inquiry.id, messageId, left, top, width });
  }, [inquiry]);

  const handleMessageLongPressAction = useCallback((action: 'copy' | 'reply' | 'emoji' | 'delete', payload?: string) => {
    if (!inquiry || !messageContextMenu) return;
    const message = inquiry.thread.find((entry) => entry.id === messageContextMenu.messageId);
    if (!message) {
      setMessageContextMenu(null);
      return;
    }

    if (action === 'copy') {
      void navigator.clipboard?.writeText(message.text);
    } else if (action === 'reply') {
      const sender = message.sender === 'host' ? 'You' : inquiry.name;
      setReplyTarget({ name: sender, text: message.text });
    } else if (action === 'emoji' && payload) {
      setMessageReaction((prev) => {
        const current = prev[message.id];
        if (current?.emoji === payload) {
          const next = { ...prev };
          delete next[message.id];
          return next;
        }
        return { ...prev, [message.id]: { emoji: payload, count: 1 } };
      });
    } else if (action === 'delete' && message.sender === 'host') {
      setMessageMeta((prev) => ({
        ...prev,
        [message.id]: { ...(prev[message.id] ?? { pinned: false, hidden: false, deleting: false, deleteDirection: null, isDeleted: false }), isDeleted: true },
      }));
      onShowToast('Message deleted');
    }

    setMessageContextMenu(null);
  }, [inquiry, messageContextMenu, onShowToast]);

  if (!open || !inquiry) return null;

  return createPortal(
    <>
      <div className="listing-modal-overlay" onClick={onClose}>
        <div className="listing-modal inquiry-chat-modal" role="dialog" aria-modal="true" aria-labelledby="inquiry-chat-title" onClick={(event) => event.stopPropagation()}>
          <div className="inquiry-chat-shell">
            <div className="inquiry-chat-header">
              <div className="inquiry-chat-header-main">
                <button type="button" className="inbox-avatar inquiry-chat-avatar inquiry-chat-avatar-button" onClick={() => setProfileOpen(true)} aria-label={`View ${inquiry.name} profile`}>
                  <img src={inquiry.avatar ?? ''} alt={inquiry.name} />
                </button>
                <div className="inquiry-chat-title-block">
                  <span className="listing-modal-type">Inquiry chat</span>
                  <h2 id="inquiry-chat-title" className="inquiry-chat-title">{inquiry.name}</h2>
                  <div className="listing-id-row listing-id-row-modal">
                    <span className="entity-id-tag">{inquiry.userId}</span>
                    <span className={`roomie-score-chip is-${inquiry.trust.roomieTemperature.toLowerCase()}`}>{inquiry.trust.roomieTemperature === 'Cool' ? '❄️' : inquiry.trust.roomieTemperature === 'Warm' ? '🌤️' : '🔥'} Roomie {inquiry.trust.roomieScore}</span>
                  </div>
                  <div className="listing-modal-location">{unitTitle}</div>
                </div>
              </div>
              <div className="inquiry-chat-header-side">
                <button
                  type="button"
                  className={`inquiry-chat-schedule-pill ${inquiry.viewingAt ? 'is-scheduled' : ''}`}
                  onPointerDown={() => {
                    if (!inquiry.viewingAt) return;
                    suppressNextScheduleClickRef.current = false;
                    const timer = window.setTimeout(() => {
                      suppressNextScheduleClickRef.current = true;
                      setScheduleCancelOpen(true);
                    }, 500);
                    const clear = () => window.clearTimeout(timer);
                    window.addEventListener('pointerup', clear, { once: true });
                    window.addEventListener('pointercancel', clear, { once: true });
                  }}
                  onClick={() => {
                    if (inquiry.viewingAt && suppressNextScheduleClickRef.current) {
                      suppressNextScheduleClickRef.current = false;
                      return;
                    }
                    setScheduleOpen(true);
                  }}
                >
                  {inquiry.viewingAt ? 'Scheduled' : 'Schedule viewing'}
                </button>
                <button className="listing-modal-close inquiry-chat-close" onClick={onClose} aria-label="Close chat">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="inquiry-chat-body">
              <div className="scroll-area inquiry-chat-scroller">
                <div className="inquiry-chat-thread">
                  {activeChatMessages.map(({ entry: message, meta, reaction }) => {
                    const isHost = message.sender === 'host';
                    const isRead = message.sender === 'host' && message.id === latestReadMessageId;
                    const senderClass = `inquiry-chat-${message.sender}`;
                    return (
                      <div
                        key={message.id}
                        className={`inquiry-chat-message-swipe-row ${senderClass} ${meta.deleting ? `is-deleting ${meta.deleteDirection ?? ''}` : ''}`}
                        style={{ alignSelf: message.sender === 'tenant' ? 'flex-start' : 'flex-end' } as CSSProperties}
                        onPointerDown={(event) => {
                          if (meta.isDeleted) return;
                          if (event.pointerType === 'mouse' && event.button !== 0) return;
                          const target = event.target as HTMLElement | null;
                          if (target?.closest('button, textarea, input, select, a')) return;
                          clearMessageLongPress();
                          messageLongPressRef.current = {
                            messageId: message.id,
                            timer: window.setTimeout(() => {
                              const current = messageLongPressRef.current;
                              if (!current || current.messageId !== message.id || current.triggered) return;
                              current.triggered = true;
                              const rect = current.rect ?? event.currentTarget.getBoundingClientRect();
                              openMessageContextMenu(
                                message.id,
                                rect,
                                isHost ? 'right' : 'left',
                              );
                            }, 560),
                            startX: event.clientX,
                            startY: event.clientY,
                            triggered: false,
                            rect: event.currentTarget.getBoundingClientRect(),
                          };
                        }}
                        onPointerMove={(event) => {
                          const current = messageLongPressRef.current;
                          if (current && current.messageId === message.id && !current.triggered) {
                            const dxLong = event.clientX - current.startX;
                            const dyLong = event.clientY - current.startY;
                            if (Math.abs(dxLong) > 10 || Math.abs(dyLong) > 10) {
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
                          clearMessageLongPress();
                        }}
                        onPointerCancel={() => {
                          clearMessageLongPress();
                        }}
                      >
                        <div className={`inquiry-chat-message inquiry-chat-message-main ${senderClass} ${meta.isDeleted ? 'is-deleted' : ''}`}>
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
                                {message.replyTo && (
                                  <div className="inbox-reply-quote">
                                    <div className="inbox-reply-source">Replying to</div>
                                    <div className="inbox-reply-name">{message.replyTo.name}</div>
                                    <div className="inbox-reply-text">{message.replyTo.text}</div>
                                  </div>
                                )}
                                {message.replyTo && <div className="inbox-reply-divider" />}
                                <div>{message.text}</div>
                                {meta.pinned && <span className="inquiry-chat-pin-badge">Pinned</span>}
                              </>
                            )}
                          </div>
                          {reaction && !meta.isDeleted && (
                            <div className={`inbox-message-reaction-row ${message.sender === 'host' ? 'self' : 'other'}`}>
                              <div className="inbox-message-reaction" aria-label={`Reaction ${reaction.emoji} ${reaction.count} times`}>
                                <span className="inbox-message-reaction-emoji">{reaction.emoji}</span>
                                <span className="inbox-message-reaction-count">{reaction.count}</span>
                              </div>
                            </div>
                          )}
                          <div className={`inquiry-chat-time ${message.sender === 'host' ? 'host' : 'tenant'}`}>
                            <span className="inquiry-message-time">{message.time}</span>
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
                  <button type="button" className="inbox-reply-banner-close" onClick={() => setReplyTarget(null)} aria-label="Cancel reply">
                    ×
                  </button>
                </div>
              )}
              <div className="inquiry-chat-composer">
                <label className="inquiry-reply-label" htmlFor={`chat-reply-${inquiry.id}`}>Reply in chat</label>
                <textarea
                  id={`chat-reply-${inquiry.id}`}
                  className="inquiry-reply-input inquiry-chat-input"
                  rows={3}
                  placeholder="Write a reply to continue the conversation"
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                />
                <div className="inquiry-chat-composer-actions">
                  <button type="button" className="unit-btn unit-btn-primary" onClick={sendReply}>
                    Send reply
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {scheduleOpen && (
        <div className="inquiry-chat-schedule-popover-overlay" onClick={() => setScheduleOpen(false)}>
          <div className="inquiry-chat-schedule-popover" role="dialog" aria-modal="true" aria-labelledby="chat-schedule-viewing-title" onClick={(event) => event.stopPropagation()}>
            <div className="listing-modal-head inquiry-chat-schedule-popover-head">
              <div className="listing-modal-title-block">
                <h2 id="chat-schedule-viewing-title" className="listing-modal-title">Schedule viewing</h2>
                <div className="listing-modal-subtitle">{inquiry.name} · {unitTitle}</div>
              </div>
              <button type="button" className="listing-modal-close inquiry-chat-schedule-close" onClick={() => setScheduleOpen(false)} aria-label="Close schedule viewing popover">
                ×
              </button>
            </div>

            <div className="inquiry-chat-schedule-popover-body">
              <div className="inquiry-calendar-shell">
                <div className="calendar-nav inquiry-calendar-nav">
                  <div className="calendar-nav-group inquiry-calendar-inline-nav" aria-label="Schedule month navigation">
                    <button type="button" className="calendar-arrow-btn" onClick={() => setScheduleMonth((current) => new Date(current.getFullYear(), current.getMonth() - 1, 1))} aria-label="Previous month">‹</button>
                    <strong>{scheduleMonth.toLocaleDateString('en-US', { month: 'long' })}</strong>
                    <button type="button" className="calendar-arrow-btn" onClick={() => setScheduleMonth((current) => new Date(current.getFullYear(), current.getMonth() + 1, 1))} aria-label="Next month">›</button>
                  </div>
                  <div className="calendar-nav-group inquiry-calendar-inline-nav" aria-label="Schedule year navigation">
                    <button type="button" className="calendar-arrow-btn" onClick={() => setScheduleMonth((current) => new Date(current.getFullYear() - 1, current.getMonth(), 1))} aria-label="Previous year">‹</button>
                    <strong>{scheduleMonth.getFullYear()}</strong>
                    <button type="button" className="calendar-arrow-btn" onClick={() => setScheduleMonth((current) => new Date(current.getFullYear() + 1, current.getMonth(), 1))} aria-label="Next year">›</button>
                  </div>
                </div>

                <div className="listing-history-calendar-weekdays">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                    <span key={day}>{day}</span>
                  ))}
                </div>
                <div className="listing-history-calendar-grid">
                  {scheduleCalendar.cells.map((cell) => {
                    if (cell.kind === 'blank') return <div key={cell.id} className="listing-history-calendar-cell is-empty" aria-hidden="true" />;
                    return (
                      <button
                        key={cell.id}
                        type="button"
                        className={`listing-history-calendar-cell inquiry-calendar-day ${scheduleDate === cell.date ? 'is-selected' : ''}`}
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
                <label className="inquiry-reply-label" htmlFor="schedule-time-chat">Select time</label>
                <input id="schedule-time-chat" type="time" className="inquiry-reply-input inquiry-time-input" value={scheduleTime} onChange={(event) => setScheduleTime(event.target.value)} />
              </div>

              <div className="inquiry-calendar-summary">
                {selectedScheduleDate ? `Selected: ${selectedScheduleDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} at ${scheduleTime}` : 'Select a date and time to continue.'}
              </div>

              <div className="inquiry-calendar-actions">
                <button type="button" className="unit-btn" onClick={() => setScheduleOpen(false)}>Cancel</button>
                <button type="button" className="unit-btn unit-btn-primary" onClick={confirmViewing}>Confirm viewing</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {scheduleCancelOpen && (
        <div className="inquiry-chat-schedule-popover-overlay" onClick={() => setScheduleCancelOpen(false)}>
          <div className="inquiry-chat-cancel-popover" role="dialog" aria-modal="true" aria-labelledby="cancel-schedule-title" onClick={(event) => event.stopPropagation()}>
            <div className="listing-modal-head inquiry-chat-schedule-popover-head">
              <div className="listing-modal-title-block">
                <h2 id="cancel-schedule-title" className="listing-modal-title">Cancel viewing?</h2>
                <div className="listing-modal-subtitle">{inquiry.name} · {unitTitle}</div>
              </div>
              <button type="button" className="listing-modal-close inquiry-chat-schedule-close" onClick={() => setScheduleCancelOpen(false)} aria-label="Close cancel schedule modal">
                ×
              </button>
            </div>
            <p className="inquiry-chat-cancel-copy">
              This will remove the scheduled viewing and return the inquiry to its regular state.
            </p>
            <div className="inquiry-calendar-actions">
              <button type="button" className="unit-btn" onClick={() => setScheduleCancelOpen(false)}>
                Keep schedule
              </button>
              <button type="button" className="unit-btn unit-btn-primary is-destructive" onClick={cancelViewing}>
                Cancel viewing
              </button>
            </div>
          </div>
        </div>
      )}

      <ProfilePeekModal
        open={profileOpen}
        avatar={inquiry.avatar ?? ''}
        name={inquiry.name}
        role="Tenant"
        userId={inquiry.userId}
        memberSince={inquiry.memberSince}
        verificationStatus={inquiry.verified ? 'Verified' : 'Unverified'}
        roomieScore={inquiry.trust.roomieScore}
        tenantReviews={inquiry.tenantReviews}
        hostReviews={inquiry.hostReviews}
        subtitle={unitTitle}
        details={[`Inquiry status: ${inquiry.status}`, inquiry.viewingAt ? `Viewing: ${inquiry.viewingAt} ${inquiry.viewingTime ?? ''}`.trim() : 'No scheduled viewing']}
        onClose={() => setProfileOpen(false)}
      />

      {messageContextMenu && (
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
            } as CSSProperties}
            onPointerDown={(event) => event.stopPropagation()}
          >
            <button type="button" className="message-context-action" onClick={() => handleMessageLongPressAction('copy')}>Copy</button>
            <button type="button" className="message-context-action" onClick={() => handleMessageLongPressAction('reply')}>Reply</button>
            <div className="message-context-emoji-row" aria-label="Quick reactions">
              {['👍', '❤️', '😂', '😮', '🙏', '🔥'].map((emoji) => (
                <button key={emoji} type="button" className="message-context-emoji" onClick={() => handleMessageLongPressAction('emoji', emoji)}>{emoji}</button>
              ))}
            </div>
            {inquiry.thread.find((entry) => entry.id === messageContextMenu.messageId)?.sender === 'host' && (
              <button type="button" className="message-context-action is-destructive" onClick={() => handleMessageLongPressAction('delete')}>Delete</button>
            )}
          </div>
        </div>
      )}
    </>,
    document.body,
  );
}
