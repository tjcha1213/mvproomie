import { useMemo, useState } from 'react';
import AppLogo from '../components/AppLogo';
import type { Conversation } from '../chat';

interface Props {
  conversations: Conversation[];
  activeConversationId: string | null;
  onOpenConversation: (conversationId: string) => void;
  onBackToList: () => void;
  onSendMessage: (conversationId: string, text: string) => void;
}

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
}: Props) {
  const [draft, setDraft] = useState('');
  const activeConversation = useMemo(
    () => conversations.find((conversation) => conversation.id === activeConversationId) ?? null,
    [activeConversationId, conversations]
  );

  const submit = () => {
    if (!activeConversation || !draft.trim()) return;
    onSendMessage(activeConversation.id, draft);
    setDraft('');
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
            return (
              <button
                key={conversation.id}
                className="inbox-item"
                type="button"
                onClick={() => onOpenConversation(conversation.id)}
              >
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
            );
          })}
        </div>
      </div>
    </>
  );
}
