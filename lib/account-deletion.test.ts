import { describe, expect, it } from "vitest";
import {
  dateKey,
  partitionJournalTransfers,
  pickSuccessor,
} from "./account-deletion";

describe("pickSuccessor", () => {
  it("returns null when the departing user is the only member", () => {
    expect(
      pickSuccessor([{ userId: "a", role: "OWNER" }], "a"),
    ).toBeNull();
  });

  it("prefers an existing owner among remaining members", () => {
    const successor = pickSuccessor(
      [
        { userId: "a", role: "MEMBER" },
        { userId: "b", role: "OWNER" },
        { userId: "c", role: "MEMBER" },
      ],
      "a",
    );
    expect(successor?.userId).toBe("b");
  });

  it("promotes the remaining member when the owner leaves", () => {
    const successor = pickSuccessor(
      [
        { userId: "a", role: "OWNER" },
        { userId: "b", role: "MEMBER" },
      ],
      "a",
    );
    expect(successor?.userId).toBe("b");
  });
});

describe("partitionJournalTransfers", () => {
  it("transfers days the partner does not already have", () => {
    expect(
      partitionJournalTransfers(
        [
          { id: "1", date: "2026-09-10" },
          { id: "2", date: "2026-09-11" },
        ],
        ["2026-09-10"],
      ),
    ).toEqual({
      transferIds: ["2"],
      conflictIds: ["1"],
    });
  });

  it("does not transfer two departing entries onto the same successor day", () => {
    expect(
      partitionJournalTransfers(
        [
          { id: "1", date: "2026-09-10" },
          { id: "2", date: "2026-09-10" },
        ],
        [],
      ),
    ).toEqual({
      transferIds: ["1"],
      conflictIds: ["2"],
    });
  });
});

describe("dateKey", () => {
  it("uses the UTC calendar day", () => {
    expect(dateKey(new Date("2026-09-10T00:00:00.000Z"))).toBe("2026-09-10");
  });
});
