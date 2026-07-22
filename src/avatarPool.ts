const AVATAR_SET_VERSION = '20260722a';

const withBase = (path: string) => `${import.meta.env.BASE_URL}${path}`;

export const AVATARS = Array.from({ length: 30 }, (_, index) =>
  withBase(`assets/avatars/mock-set-v2/avatar${index + 1}.png?v=${AVATAR_SET_VERSION}`)
);

export const JUAN_AVATAR = AVATARS[0];

export function avatarAt(index: number) {
  const safeIndex = ((index % AVATARS.length) + AVATARS.length) % AVATARS.length;
  return AVATARS[safeIndex];
}

export function listingAvatarFor(listingId: number) {
  return avatarAt(15 + ((listingId - 1) % 15));
}
