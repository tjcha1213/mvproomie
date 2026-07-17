const withBase = (path: string) => `${import.meta.env.BASE_URL}${path}`;

export const AVATARS = Array.from({ length: 30 }, (_, index) =>
  withBase(`assets/avatars/mock-set/avatar${index + 1}.png`)
);

export const JUAN_AVATAR = AVATARS[0];

export function avatarAt(index: number) {
  const safeIndex = ((index % AVATARS.length) + AVATARS.length) % AVATARS.length;
  return AVATARS[safeIndex];
}
