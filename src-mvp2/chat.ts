import type { Listing } from './data/listings';
import { listingAvatarFor } from '../src/avatarPool';

export interface ChatMessage {
  id: string;
  author: 'self' | 'other';
  text: string;
  timestamp: number;
  replyTo?: {
    name: string;
    text: string;
  };
}

export interface ViewingRequestNote {
  text: string;
  time: string;
  status: 'pending' | 'accepted' | 'declined';
}

export interface Conversation {
  id: string;
  listingId: number;
  participantName: string;
  participantPhoto: string;
  participantRole: 'Host';
  memberSince: string;
  verified: boolean;
  roomieScore: number;
  uploadedListings: string[];
  tenantReviews: string[];
  hostReviews: string[];
  listingTitle: string;
  listingLocation: string;
  pinned: boolean;
  unreadCount: number;
  messages: ChatMessage[];
  viewingRequest?: ViewingRequestNote;
}

const STARTER_EXCHANGES = [
  {
    self: 'Hi, I’m interested in the unit. Is it still available for viewing this week?',
    other: 'Yes, it is still open. I can share the viewing schedule here.',
  },
  {
    self: 'Hello, could you send the house rules and utility inclusions?',
    other: 'Absolutely. I’ll send the full list and the inclusions now.',
  },
  {
    self: 'Great place. Is the quoted rent already inclusive of association dues?',
    other: 'Yes, it includes the association dues and the current utility setup.',
  },
  {
    self: 'I can make a Saturday morning viewing if that slot is still free.',
    other: 'That slot is open. I can lock in a 30-minute viewing for you.',
  },
];

const PARTICIPANT_TENANT_REVIEWS = [
  'Clear communication and quick follow-up on availability.',
  'Listing details matched the in-app chat and photos.',
  'Friendly and responsive when coordinating a viewing.',
];
const PARTICIPANT_LANDLORD_REVIEWS = [
  'Keeps the listing accurate and the replies timely.',
  'Helpful with move-in details and questions about the unit.',
  'Professional and easy to coordinate with.',
];


function message(
  id: string,
  author: ChatMessage['author'],
  text: string,
  timestamp: number,
  replyTo?: ChatMessage['replyTo']
): ChatMessage {
  return { id, author, text, timestamp, replyTo };
}

function latestMessageTimestamp(conversation: Conversation): number {
  return conversation.messages[conversation.messages.length - 1]?.timestamp ?? 0;
}

function countUnreadMessages(messages: ChatMessage[]): number {
  let unread = 0;
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    if (messages[index]?.author !== 'other') break;
    unread += 1;
  }
  return unread;
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
    const messagesByIndex: Record<number, ChatMessage[]> = {
      0: [
        message(`${conversationId}-a`, 'self', exchange.self, now - 1000 * 60 * 180),
        message(`${conversationId}-b`, 'other', exchange.other, now - 1000 * 60 * 120),
        message(`${conversationId}-c`, 'other', 'I can also send the house rules and a few more photos.', now - 1000 * 60 * 60),
      ],
      1: [
        message(`${conversationId}-a`, 'self', exchange.self, now - 1000 * 60 * 180),
        message(`${conversationId}-b`, 'other', exchange.other, now - 1000 * 60 * 120),
      ],
      2: [
        message(`${conversationId}-a`, 'self', 'Is water included in the rent?', now - 1000 * 60 * 150),
        message(`${conversationId}-b`, 'other', 'Yes, water is included.', now - 1000 * 60 * 100),
        message(`${conversationId}-c`, 'other', exchange.other, now - 1000 * 60 * 45),
      ],
      3: [
        message(`${conversationId}-a`, 'self', exchange.self, now - 1000 * 60 * 150),
        message(`${conversationId}-b`, 'other', exchange.other, now - 1000 * 60 * 90),
      ],
      4: [
        message(`${conversationId}-a`, 'self', 'Is the unit still open for July move-in?', now - 1000 * 60 * 180),
        message(`${conversationId}-b`, 'other', 'Yes, it is still available. I can send the requirements list here.', now - 1000 * 60 * 120),
        message(`${conversationId}-c`, 'self', 'Perfect, I’d like to review the requirements tonight.', now - 1000 * 60 * 60),
        message(`${conversationId}-d`, 'other', 'I’ll prepare the checklist and the deposit details for you.', now - 1000 * 60 * 30),
      ],
    };
    const messages = messagesByIndex[index] ?? [
      message(`${conversationId}-a`, 'self', exchange.self, now - (index + 2) * 1000 * 60 * 90),
      message(`${conversationId}-b`, 'other', exchange.other, now - (index + 1) * 1000 * 60 * 45),
    ];

    return {
      id: conversationId,
      listingId: listing.id,
      participantName: listing.hostName,
      participantPhoto: listingAvatarFor(listing.id),
      participantRole: 'Host',
      memberSince: String(2018 + ((listing.id + index) % 5)),
      verified: listing.verified,
      roomieScore: Math.min(99, Math.round(listing.hostRating * 20)),
      uploadedListings: [listing.title],
      tenantReviews: PARTICIPANT_TENANT_REVIEWS.slice(index % 2, (index % 2) + 2),
      hostReviews: PARTICIPANT_LANDLORD_REVIEWS.slice(index % 2, (index % 2) + 2),
      listingTitle: listing.title,
      listingLocation: listing.location,
      pinned: false,
      unreadCount: countUnreadMessages(messages),
      messages,
    };
  });
}

function createConversation(listing: Listing, timestamp: number): Conversation {
  const id = conversationIdForListing(listing.id);

  return {
    id,
    listingId: listing.id,
    participantName: listing.hostName,
    participantPhoto: listingAvatarFor(listing.id),
    participantRole: 'Host',
    memberSince: String(2018 + (listing.id % 5)),
    verified: listing.verified,
    roomieScore: Math.min(99, Math.round(listing.hostRating * 20)),
    uploadedListings: [listing.title],
    tenantReviews: ['Reliable and quick to answer availability questions.'],
    hostReviews: ['Keeps the unit information current and easy to understand.'],
    listingTitle: listing.title,
    listingLocation: listing.location,
    pinned: false,
    unreadCount: 0,
    messages: [
      message(
        `${id}-welcome`,
        'other',
        `Hi! I'm ${listing.hostName}. Feel free to ask anything about ${listing.title}.`,
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
          conversation.id === id
            ? {
                ...conversation,
                participantName: listing.hostName,
                participantPhoto: listingAvatarFor(listing.id),
              }
            : conversation
        ),
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
      ? `Hi ${listing.hostName.split(' ')[0]}, I’d like to request a viewing for ${listing.title}. Is there an available slot?`
      : `Hi ${listing.hostName.split(' ')[0]}, I saw your ${listing.title} listing and wanted to ask about availability.`;
  const replyText =
    mode === 'inquiry'
      ? 'Thanks for the request. I’ll review it and send the next steps here.'
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
        return {
          ...conversation,
          unreadCount: 0,
          messages: nextMessages,
          ...(mode === 'inquiry'
            ? {
                viewingRequest: {
                  text: 'Viewing request sent. Waiting for the host to respond.',
                  time: 'Now',
                  status: 'pending' as const,
                },
              }
            : {}),
        };
      })
    ),
  };
}

export function sendConversationReply(
  conversations: Conversation[],
  conversationId: string,
  text: string,
  replyTo?: {
    name: string;
    text: string;
  }
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
        message(`${conversationId}-self-${now}`, 'self', trimmed, now, replyTo),
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
