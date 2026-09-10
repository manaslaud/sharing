import { describe, expect, it } from "vitest";
import { nextDueAt, snoozeUntil } from "./recurrence";

describe("recurrence", () => {
  it("does not repeat when recurrence is NONE", () => {
    expect(nextDueAt(new Date("2026-09-10T18:00:00Z"), "NONE")).toBeNull();
  });

  it("advances daily, weekly, monthly, and yearly", () => {
    const from = new Date("2026-09-10T18:00:00Z");
    expect(nextDueAt(from, "DAILY")?.toISOString()).toBe(
      "2026-09-11T18:00:00.000Z",
    );
    expect(nextDueAt(from, "WEEKLY")?.toISOString()).toBe(
      "2026-09-17T18:00:00.000Z",
    );
    expect(nextDueAt(from, "MONTHLY")?.toISOString()).toBe(
      "2026-10-10T18:00:00.000Z",
    );
    expect(nextDueAt(from, "YEARLY")?.toISOString()).toBe(
      "2027-09-10T18:00:00.000Z",
    );
  });

  it("snoozes by one hour", () => {
    const from = new Date("2026-09-10T18:00:00Z");
    expect(snoozeUntil(from, 1).toISOString()).toBe("2026-09-10T19:00:00.000Z");
  });
});
