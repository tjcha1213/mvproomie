import { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import type { Inquiry, InquiryStatus, Unit } from '../data';
import Header from '../components/Header';
import type { HeaderNotification } from '../components/Header';

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
const REVEAL_THRESHOLD = 12;
const COMMIT_THRESHOLD = 56;
const MAX_SWIPE = 116;

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
  const deleteTimersRef = useRef<Record<number, number>>({});

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

  const handleAction = (id: number, action: SwipeSide) => {
    if (action === 'pin') {
      commitPinToggle(id);
      onShowToast(metaById[id]?.pinned ? 'Unpinned inquiry' : 'Pinned inquiry');
    } else {
      commitDelete(id, 'delete');
      onShowToast('Inquiry deleted');
    }
  };

  const handleActionPointerUp = (
    event: ReactPointerEvent<HTMLButtonElement>,
    id: number,
    action: SwipeSide,
  ) => {
    event.preventDefault();
    event.stopPropagation();
    handleAction(id, action);
  };

  const handleListPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) {
      setOpenAction(null);
      setSwipe(null);
    }
  };

  const handleRowPointerDown = (
    event: ReactPointerEvent<HTMLDivElement>,
    id: number,
  ) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;

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
      if (absY > 18 && absY > absX * 1.2) {
        setSwipe(null);
        return;
      }
      if (absX < 10 || absX < absY + 4) return;
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

  const restoreOpenAction = (id: number, side: SwipeSide | null) => {
    if (!side) {
      setOpenAction((current) => (current?.inquiryId === id ? null : current));
      return;
    }
    setOpenAction({ inquiryId: id, side });
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

    const offset = clamp(swipe.offset, -MAX_SWIPE, MAX_SWIPE);
    const resolvedSide = Math.abs(offset) >= COMMIT_THRESHOLD
      ? swipeSideFromOffset(offset)
      : swipe.startOffset > 0
        ? 'pin'
        : swipe.startOffset < 0
          ? 'delete'
          : null;

    setSwipe(null);
    restoreOpenAction(id, resolvedSide);
  };

  const handleRowPointerCancel = (id: number) => {
    if (!swipe || swipe.inquiryId !== id) return;
    setSwipe(null);
    restoreOpenAction(
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

  const getOffset = (id: number) => {
    if (swipe?.inquiryId === id) return clamp(swipe.offset, -MAX_SWIPE, MAX_SWIPE);
    if (openAction?.inquiryId === id) return actionOffset(openAction.side);
    return 0;
  };

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
                        className="inquiry-swipe-action inquiry-pin-action"
                        onPointerDown={(event) => {
                          event.stopPropagation();
                          event.preventDefault();
                        }}
                        onPointerUp={(event) => handleActionPointerUp(event, i.id, 'pin')}
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
                          event.preventDefault();
                        }}
                        onPointerUp={(event) => handleActionPointerUp(event, i.id, 'delete')}
                      >
                        <DeleteIcon />
                        <span>Delete</span>
                      </button>
                    </div>

                    <button
                      type="button"
                      className="inquiry-main"
                      style={{ transform: `translate3d(${offset}px, 0, 0)` }}
                      onClick={() => setOpenId(openId === i.id ? null : i.id)}
                    >
                      <div className="inbox-avatar">
                        {i.avatar ? <img src={i.avatar} alt={i.name} /> : i.name[0]}
                      </div>
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
                    </button>
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
        <div className="listing-modal-overlay" onClick={() => setChatOpenId(null)}>
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
                  <div className="inbox-avatar inquiry-chat-avatar">
                    {activeChat.avatar ? <img src={activeChat.avatar} alt={activeChat.name} /> : activeChat.name[0]}
                  </div>
                  <button className="listing-modal-close inquiry-chat-close" onClick={() => setChatOpenId(null)} aria-label="Close chat">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="inquiry-chat-thread">
                {activeChat.thread.map((entry) => (
                  <div key={entry.id} className={`inquiry-chat-message inquiry-chat-${entry.sender}`}>
                    <div className="inquiry-chat-bubble">{entry.text}</div>
                    <div className="inquiry-chat-time">{entry.time}</div>
                  </div>
                ))}
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
    </>
  );
}
