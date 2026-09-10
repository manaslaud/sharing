import type { Visibility } from "@prisma/client";

export type AccessibleNote = {
  ownerId: string;
  sharedSpaceId: string | null;
  visibility: Visibility;
  deletedAt: Date | null;
};

export type AccessibleJournal = {
  authorId: string;
  sharedSpaceId: string | null;
  visibility: Visibility;
  deletedAt: Date | null;
};

export function canAccessNote(
  note: AccessibleNote,
  userId: string,
  memberSpaceIds: string[],
) {
  if (note.deletedAt) return false;
  if (note.visibility === "PRIVATE") return note.ownerId === userId;
  if (note.visibility === "SHARED" && note.sharedSpaceId) {
    return memberSpaceIds.includes(note.sharedSpaceId);
  }
  return note.ownerId === userId;
}

export function canEditNote(
  note: AccessibleNote,
  userId: string,
  memberSpaceIds: string[],
) {
  return canAccessNote(note, userId, memberSpaceIds);
}

export function canDeleteNote(note: AccessibleNote, userId: string) {
  if (note.deletedAt) return false;
  return note.ownerId === userId;
}

export function canShareNote(note: AccessibleNote, userId: string) {
  if (note.deletedAt) return false;
  return note.ownerId === userId;
}

export function canAccessJournal(
  entry: AccessibleJournal,
  userId: string,
  memberSpaceIds: string[],
) {
  if (entry.deletedAt) return false;
  if (entry.visibility === "PRIVATE") return entry.authorId === userId;
  if (entry.visibility === "SHARED" && entry.sharedSpaceId) {
    return memberSpaceIds.includes(entry.sharedSpaceId);
  }
  return entry.authorId === userId;
}

export function canEditJournal(
  entry: AccessibleJournal,
  userId: string,
  memberSpaceIds: string[],
) {
  return canAccessJournal(entry, userId, memberSpaceIds);
}

export function canDeleteJournal(entry: AccessibleJournal, userId: string) {
  if (entry.deletedAt) return false;
  return entry.authorId === userId;
}

export function canShareJournal(entry: AccessibleJournal, userId: string) {
  if (entry.deletedAt) return false;
  return entry.authorId === userId;
}

export function noteAccessWhere(userId: string, spaceIds: string[]) {
  return {
    deletedAt: null,
    OR: [
      { ownerId: userId, visibility: "PRIVATE" as const },
      { visibility: "SHARED" as const, sharedSpaceId: { in: spaceIds } },
    ],
  };
}

export function journalAccessWhere(userId: string, spaceIds: string[]) {
  return {
    deletedAt: null,
    OR: [
      { authorId: userId, visibility: "PRIVATE" as const },
      { visibility: "SHARED" as const, sharedSpaceId: { in: spaceIds } },
    ],
  };
}

export function reminderAccessWhere(userId: string, spaceIds: string[]) {
  return {
    deletedAt: null,
    OR: [
      { sharedSpaceId: null, creatorId: userId },
      { sharedSpaceId: { in: spaceIds } },
    ],
  };
}
