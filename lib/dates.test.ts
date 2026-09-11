import { describe, expect, it } from "vitest";
import { journalPath } from "./dates";

describe("journalPath", () => {
  it("opens a specific same-day entry by id", () => {
    expect(journalPath("2026-09-11", "entry_prachu")).toBe(
      "/journal/2026-09-11?entry=entry_prachu",
    );
  });

  it("keeps date-only links for day navigation", () => {
    expect(journalPath("2026-09-11")).toBe("/journal/2026-09-11");
  });
});
