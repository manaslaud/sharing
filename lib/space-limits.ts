export const MAX_SPACE_MEMBERS = 2;

export function isSpaceFull(memberCount: number) {
  return memberCount >= MAX_SPACE_MEMBERS;
}
