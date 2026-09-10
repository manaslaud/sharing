import { describe, expect, it } from "vitest";
import { greetingForHour, hourInTimeZone } from "./names";

describe("greetingForHour", () => {
  it("uses evening from 5pm", () => {
    expect(greetingForHour(16)).toBe("Good afternoon");
    expect(greetingForHour(17)).toBe("Good evening");
    expect(greetingForHour(19)).toBe("Good evening");
  });
});

describe("hourInTimeZone", () => {
  it("converts UTC afternoon to Kolkata evening", () => {
    const utcAfternoon = new Date("2026-09-10T14:14:00Z");
    expect(hourInTimeZone(utcAfternoon, "Asia/Kolkata")).toBe(19);
    expect(greetingForHour(hourInTimeZone(utcAfternoon, "Asia/Kolkata"))).toBe(
      "Good evening",
    );
  });
});
