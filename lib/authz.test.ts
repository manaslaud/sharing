import { describe, expect, it } from "vitest";
import {
  canAccessJournal,
  canAccessNote,
  canDeleteNote,
  canEditNote,
  canShareNote,
} from "./authz";

const spaceA = "space-a";
const userA = "user-a";
const userB = "user-b";

describe("note authorization", () => {
  it("does not let user A read user B's private note", () => {
    const note = {
      ownerId: userB,
      sharedSpaceId: null,
      visibility: "PRIVATE" as const,
      deletedAt: null,
    };
    expect(canAccessNote(note, userA, [spaceA])).toBe(false);
    expect(canEditNote(note, userA, [spaceA])).toBe(false);
  });

  it("lets the owner read and edit a private note", () => {
    const note = {
      ownerId: userA,
      sharedSpaceId: null,
      visibility: "PRIVATE" as const,
      deletedAt: null,
    };
    expect(canAccessNote(note, userA, [spaceA])).toBe(true);
    expect(canEditNote(note, userA, [spaceA])).toBe(true);
    expect(canShareNote(note, userA)).toBe(true);
  });

  it("lets space members read and edit a shared note", () => {
    const note = {
      ownerId: userB,
      sharedSpaceId: spaceA,
      visibility: "SHARED" as const,
      deletedAt: null,
    };
    expect(canAccessNote(note, userA, [spaceA])).toBe(true);
    expect(canEditNote(note, userA, [spaceA])).toBe(true);
    expect(canDeleteNote(note, userA)).toBe(false);
  });

  it("hides deleted notes", () => {
    const note = {
      ownerId: userA,
      sharedSpaceId: null,
      visibility: "PRIVATE" as const,
      deletedAt: new Date(),
    };
    expect(canAccessNote(note, userA, [spaceA])).toBe(false);
  });
});

describe("journal authorization", () => {
  it("keeps private entries to the author", () => {
    const entry = {
      authorId: userB,
      sharedSpaceId: null,
      visibility: "PRIVATE" as const,
      deletedAt: null,
    };
    expect(canAccessJournal(entry, userA, [spaceA])).toBe(false);
  });

  it("lets members access shared journal entries", () => {
    const entry = {
      authorId: userB,
      sharedSpaceId: spaceA,
      visibility: "SHARED" as const,
      deletedAt: null,
    };
    expect(canAccessJournal(entry, userA, [spaceA])).toBe(true);
  });
});
