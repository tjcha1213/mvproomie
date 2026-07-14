import { useState } from 'react';
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
const FILTERS: Filter[] = ['All', 'New', 'Replied', 'Viewing'];

function StatusBadge({ status }: { status: InquiryStatus }) {
  const cls = status === 'New' ? 'st-new' : status === 'Viewing' ? 'st-viewing' : 'st-replied';
  return <span className={`status-badge ${cls}`}>{status}</span>;
}

function timeStampLabel() {
  return 'Just now';
}

export default function InquiriesScreen({ inquiries, units, onSetStatus, onAddThreadMessage, onOpenProfile, notifications, onOpenNotification, onShowToast }: Props) {
  const [filter, setFilter] = useState<Filter>('All');
  const [openId, setOpenId] = useState<number | null>(null);
  const [chatOpenId, setChatOpenId] = useState<number | null>(null);
  const [draftReplies, setDraftReplies] = useState<Record<number, string>>({});

  const filtered = filter === 'All' ? inquiries : inquiries.filter(i => i.status === filter);
  const unitTitle = (id: number) => units.find(u => u.id === id)?.title ?? '';
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

  return (
    <>
      <Header onOpenProfile={onOpenProfile} notifications={notifications} onOpenNotification={onOpenNotification} />

      <div className="search-filter-chips">
        {FILTERS.map(f => (
          <button key={f} className={`filter-chip ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
            {f}
          </button>
        ))}
      </div>

      <div className="scroll-area">
        <div className="section-header">
          <span className="section-title">Inquiries ({filtered.length})</span>
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
          <div className="inbox-list">
            {filtered.map(i => (
              <div key={i.id} className="inquiry-item">
                <button className="inquiry-main" onClick={() => setOpenId(openId === i.id ? null : i.id)}>
                  <div className="inbox-avatar">
                    {i.avatar ? <img src={i.avatar} alt={i.name} /> : i.name[0]}
                  </div>
                  <div className="inbox-info">
                    <div className="inquiry-name-row">
                      <span className="inbox-name">{i.name}</span>
                      <StatusBadge status={i.status} />
                    </div>
                    <div className="inquiry-unit">{unitTitle(i.unitId)}</div>
                    <div className="inbox-preview">{i.message}</div>
                  </div>
                  <div className="inbox-meta">
                    <div className="inbox-time">{i.time}</div>
                  </div>
                </button>

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
            ))}
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
