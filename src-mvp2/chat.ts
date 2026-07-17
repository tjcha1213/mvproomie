import type { Listing } from './data/listings';

const withBase = (path: string) => `${import.meta.env.BASE_URL}${path}`;

export interface ChatMessage {
  id: string;
  author: 'self' | 'other';
  text: string;
  timestamp: number;
}

export interface Conversation {
  id: string;
  listingId: number;
  participantName: string;
  participantPhoto: string;
  participantRole: 'Landlord';
  listingTitle: string;
  listingLocation: string;
  pinned: boolean;
  unreadCount: number;
  messages: ChatMessage[];
}

const STARTER_EXCHANGES = [
  {
    other: 'Hi! The unit is still open for viewing this week.',
    self: 'Nice, I can drop by after work tomorrow.',
  },
  {
    other: 'Thanks for reaching out. I can send the house rules here.',
    self: 'Please do. I want to confirm utility coverage too.',
  },
  {
    other: 'Yes, the listing is active and the photos are current.',
    self: 'Great. Is the quoted rent already inclusive of association dues?',
  },
  {
    other: 'I can reserve a 30-minute viewing slot for Saturday morning.',
    self: 'Saturday morning works for me.',
  },
];

const PARTICIPANT_PHOTOS = [
  withBase('assets/avatars/avatar-male-01.svg'),
  withBase('assets/avatars/avatar-female-01.svg'),
  withBase('assets/avatars/avatar-male-02.svg'),
  withBase('assets/avatars/avatar-female-02.svg'),
  withBase('assets/avatars/avatar-male-03.svg'),
];

function message(id: string, author: ChatMessage['author'], text: string, timestamp: number): ChatMessage {
  return { id, author, text, timestamp };
}

function latestMessageTimestamp(conversation: Conversation): number {
  return conversation.messages[conversation.messages.length - 1]?.timestamp ?? 0;
}

function orderConversations(conversations: Conversation[]): Conversation[] {
  return [...conversations].sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    const timeDiff = latestMessageTimestamp(b) - latestMessageTimestamp(a);
    if (timeDiff !== 0) return timeDiff;
    return a.id.localeCompare(b.id);
  });
}

export function conversationIdForListing(listingId: number): string {
  return `listing-${listingId}`;
}

export function createInitialConversations(listings: Listing[]): Conversation[] {
  const now = Date.now();

  return listings.slice(0, 5).map((listing, index) => {
    const exchange = STARTER_EXCHANGES[index % STARTER_EXCHANGES.length];
    const conversationId = conversationIdForListing(listing.id);

    return {
      id: conversationId,
      listingId: listing.id,
      participantName: listing.landlordName,
      participantPhoto: PARTICIPANT_PHOTOS[index % PARTICIPANT_PHOTOS.length],
      participantRole: 'Landlord',
      listingTitle: listing.title,
      listingLocation: listing.location,
      pinned: false,
      unreadCount: index % 2 === 0 ? 1 + (index % 3) : 0,
      messages: [
        message(`${conversationId}-a`, 'other', exchange.other, now - (index + 2) * 1000 * 60 * 90),
        message(`${conversationId}-b`, 'self', exchange.self, now - (index + 1) * 1000 * 60 * 45),
      ],
    };
  });
}

function createConversation(listing: Listing, timestamp: number): Conversation {
  const id = conversationIdForListing(listing.id);

  return {
    id,
    listingId: listing.id,
    participantName: listing.landlordName,
    participantPhoto: PARTICIPANT_PHOTOS[listing.id % PARTICIPANT_PHOTOS.length],
    participantRole: 'Landlord',
    listingTitle: listing.title,
    listingLocation: listing.location,
    pinned: false,
    unreadCount: 0,
    messages: [
      message(
        `${id}-welcome`,
        'other',
        `Hi! I'm ${listing.landlordName}. Feel free to ask anything about ${listing.title}.`,
        timestamp - 1000 * 60 * 12
      ),
    ],
  };
}

export function openConversation(
  conversations: Conversation[],
  listing: Listing
): { conversations: Conversation[]; conversationId: string } {
  const id = conversationIdForListing(listing.id);
  const existing = conversations.find((conversation) => conversation.id === id);

  if (existing) {
    return {
      conversationId: id,
      conversations: orderConversations(
        conversations.map((conversation) =>
          conversation.id === id ? { ...conversation, unreadCount: 0 } : conversation
        )
      ),
    };
  }

  return {
    conversationId: id,
    conversations: orderConversations([createConversation(listing, Date.now()), ...conversations]),
  };
}

export function openConversationWithPrompt(
  conversations: Conversation[],
  listing: Listing,
  mode: 'message' | 'inquiry'
): { conversations: Conversation[]; conversationId: string } {
  const opened = openConversation(conversations, listing);
  const id = opened.conversationId;
  const now = Date.now();
  const outgoingText =
    mode === 'inquiry'
      ? `Hi ${listing.landlordName.split(' ')[0]}, I'm interested in ${listing.title}. Is it still available?`
      : `Hi ${listing.landlordName.split(' ')[0]}, I saw your ${listing.title} listing and wanted to ask about availability.`;
  const replyText =
    mode === 'inquiry'
      ? 'Yes, it is. I can share viewing slots and move-in details here.'
      : 'Absolutely. Let me know what you want to confirm and I can help.';

  return {
    conversationId: id,
    conversations: orderConversations(
      opened.conversations.map((conversation) => {
        if (conversation.id !== id) return conversation;
        const nextMessages = [
          ...conversation.messages,
          message(`${id}-self-${now}`, 'self', outgoingText, now),
          message(`${id}-other-${now}`, 'other', replyText, now + 1000),
        ];
        return { ...conversation, unreadCount: 0, messages: nextMessages };
      })
    ),
  };
}

export function sendConversationReply(
  conversations: Conversation[],
  conversationId: string,
  text: string
): Conversation[] {
  const trimmed = text.trim();
  if (!trimmed) return conversations;

  const now = Date.now();
  const updated = conversations.map((conversation) => {
    if (conversation.id !== conversationId) return conversation;
    return {
      ...conversation,
      unreadCount: 0,
      messages: [
        ...conversation.messages,
        message(`${conversationId}-self-${now}`, 'self', trimmed, now),
        message(
          `${conversationId}-other-${now}`,
          'other',
          'Received. I will reply with the next details here.',
          now + 1000
        ),
      ],
    };
  });

  return orderConversations(updated);
}

export function toggleConversationPin(
  conversations: Conversation[],
  conversationId: string
): Conversation[] {
  const updated = conversations.map((conversation) =>
    conversation.id === conversationId ? { ...conversation, pinned: !conversation.pinned } : conversation
  );

  return orderConversations(updated);
}

export function deleteConversation(
  conversations: Conversation[],
  conversationId: string
): Conversation[] {
  return orderConversations(conversations.filter((conversation) => conversation.id !== conversationId));
}
