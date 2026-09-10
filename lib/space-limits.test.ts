import { describe, expect, it } from "vitest";
import { MAX_SPACE_MEMBERS, isSpaceFull } from "./space-limits";

describe("isSpaceFull", () => {
  it("caps a space at two people", () => {
    expect(MAX_SPACE_MEMBERS).toBe(2);
    expect(isSpaceFull(0)).toBe(false);
    expect(isSpaceFull(1)).toBe(false);
    expect(isSpaceFull(2)).toBe(true);
    expect(isSpaceFull(3)).toBe(true);
  });
});
