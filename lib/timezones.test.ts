import { describe, expect, it } from "vitest";
import { DEFAULT_TIMEZONE, isValidTimeZone, timeZoneOptions } from "./timezones";

describe("timezones", () => {
  it("defaults to India (Kolkata)", () => {
    expect(DEFAULT_TIMEZONE).toBe("Asia/Kolkata");
    expect(isValidTimeZone(DEFAULT_TIMEZONE)).toBe(true);
  });

  it("accepts IANA zones and rejects free text", () => {
    expect(isValidTimeZone("UTC")).toBe(true);
    expect(isValidTimeZone("Asia/Kolkata")).toBe(true);
    expect(isValidTimeZone("Asia/Calcutta")).toBe(true);
    expect(isValidTimeZone("Not a zone")).toBe(false);
    expect(isValidTimeZone("")).toBe(false);
  });

  it("keeps a valid current zone in the option list", () => {
    expect(timeZoneOptions("Asia/Kolkata")).toContain("Asia/Kolkata");
    expect(timeZoneOptions("UTC")).toContain("UTC");
  });
});
