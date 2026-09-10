import { describe, expect, it } from "vitest";
import {
  nextDueAt,
  nextOccurrence,
  occurrencesInRange,
  previousOccurrence,
  upcomingOccurrence,
} from "./recurrence";

function iso(date: Date) {
  return date.toISOString();
}

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

  it("rolls a repeating reminder to the next future occurrence", () => {
    const from = new Date("2026-09-10T18:00:00Z");
    expect(nextOccurrence(from, "NONE", from)).toBeNull();
    expect(
      nextOccurrence(from, "DAILY", new Date("2026-09-10T19:00:00Z"))?.toISOString(),
    ).toBe("2026-09-11T18:00:00.000Z");
    expect(
      nextOccurrence(from, "DAILY", new Date("2026-09-13T10:00:00Z"))?.toISOString(),
    ).toBe("2026-09-13T18:00:00.000Z");
    expect(
      nextOccurrence(from, "WEEKLY", new Date("2026-09-20T12:00:00Z"))?.toISOString(),
    ).toBe("2026-09-24T18:00:00.000Z");
  });

  it("picks the next upcoming occurrence without skipping a future due date", () => {
    const dueAt = new Date("2026-09-10T18:00:00Z");
    expect(
      upcomingOccurrence(dueAt, "NONE", new Date("2026-09-10T17:00:00Z"))?.toISOString(),
    ).toBe("2026-09-10T18:00:00.000Z");
    expect(
      upcomingOccurrence(dueAt, "NONE", new Date("2026-09-10T19:00:00Z")),
    ).toBeNull();
    expect(
      upcomingOccurrence(dueAt, "DAILY", new Date("2026-09-10T17:00:00Z"))?.toISOString(),
    ).toBe("2026-09-10T18:00:00.000Z");
    expect(
      upcomingOccurrence(dueAt, "DAILY", new Date("2026-09-10T19:00:00Z"))?.toISOString(),
    ).toBe("2026-09-11T18:00:00.000Z");
  });

  it("picks the most recent previous occurrence", () => {
    const dueAt = new Date("2026-09-10T18:00:00Z");
    expect(
      previousOccurrence(dueAt, "NONE", new Date("2026-09-10T19:00:00Z"))?.toISOString(),
    ).toBe("2026-09-10T18:00:00.000Z");
    expect(
      previousOccurrence(dueAt, "NONE", new Date("2026-09-10T17:00:00Z")),
    ).toBeNull();
    expect(
      previousOccurrence(dueAt, "DAILY", new Date("2026-09-13T10:00:00Z"))?.toISOString(),
    ).toBe("2026-09-12T18:00:00.000Z");
    expect(
      previousOccurrence(dueAt, "WEEKLY", new Date("2026-09-20T12:00:00Z"))?.toISOString(),
    ).toBe("2026-09-17T18:00:00.000Z");
    expect(
      previousOccurrence(
        dueAt,
        "DAILY",
        new Date("2026-09-13T10:00:00Z"),
        new Date("2026-09-11T00:00:00Z"),
      )?.toISOString(),
    ).toBe("2026-09-12T18:00:00.000Z");
    expect(
      previousOccurrence(
        dueAt,
        "DAILY",
        new Date("2026-09-10T17:00:00Z"),
        dueAt,
      ),
    ).toBeNull();
  });

  it("lists every matching day in a calendar range", () => {
    const dueAt = new Date("2026-09-10T18:00:00Z");
    const from = new Date("2026-09-01T00:00:00Z");
    const to = new Date("2026-09-30T23:59:59Z");

    expect(occurrencesInRange(dueAt, "NONE", from, to).map(iso)).toEqual([
      "2026-09-10T18:00:00.000Z",
    ]);

    const daily = occurrencesInRange(dueAt, "DAILY", from, to);
    expect(iso(daily[0])).toBe("2026-09-01T18:00:00.000Z");
    expect(iso(daily.at(-1)!)).toBe("2026-09-30T18:00:00.000Z");
    expect(daily).toHaveLength(30);

    const weekly = occurrencesInRange(dueAt, "WEEKLY", from, to).map(iso);
    expect(weekly).toEqual([
      "2026-09-03T18:00:00.000Z",
      "2026-09-10T18:00:00.000Z",
      "2026-09-17T18:00:00.000Z",
      "2026-09-24T18:00:00.000Z",
    ]);

    const created = new Date("2026-09-10T12:00:00Z");
    expect(
      occurrencesInRange(dueAt, "DAILY", from, to, created).map(iso)[0],
    ).toBe("2026-09-10T18:00:00.000Z");

    const nextDue = new Date("2026-09-11T18:00:00Z");
    expect(
      occurrencesInRange(nextDue, "DAILY", from, to, nextDue).map(iso)[0],
    ).toBe("2026-09-11T18:00:00.000Z");

    expect(occurrencesInRange(dueAt, "MONTHLY", from, to).map(iso)).toEqual([
      "2026-09-10T18:00:00.000Z",
    ]);
    expect(
      occurrencesInRange(
        dueAt,
        "YEARLY",
        new Date("2026-01-01T00:00:00Z"),
        new Date("2027-12-31T23:59:59Z"),
      ).map(iso),
    ).toEqual(["2026-09-10T18:00:00.000Z", "2027-09-10T18:00:00.000Z"]);
  });
});
