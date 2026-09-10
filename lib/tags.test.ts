import { describe, expect, it } from "vitest";
import { isValidTagName, normalizeTagName } from "./tags";

describe("normalizeTagName", () => {
  it("strips a leading hash, trims, and lowercases", () => {
    expect(normalizeTagName("  #Ideas ")).toBe("ideas");
    expect(normalizeTagName("Travel")).toBe("travel");
  });
});

describe("isValidTagName", () => {
  it("rejects empty names and names over 32 characters", () => {
    expect(isValidTagName("")).toBe(false);
    expect(isValidTagName("a".repeat(33))).toBe(false);
    expect(isValidTagName("ideas")).toBe(true);
  });
});
