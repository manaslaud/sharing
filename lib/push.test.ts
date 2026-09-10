import { describe, expect, it } from "vitest";
import { shouldFinalizeDispatch, type PushSendResult } from "./push-result";

function result(
  partial: Partial<PushSendResult> & Pick<PushSendResult, "delivered">,
): PushSendResult {
  return {
    attempted: partial.attempted ?? 0,
    awaitingSubscription: partial.awaitingSubscription ?? false,
    delivered: partial.delivered,
  };
}

describe("shouldFinalizeDispatch", () => {
  it("stamps when nobody is waiting on a device subscription", () => {
    expect(shouldFinalizeDispatch([])).toBe(true);
    expect(
      shouldFinalizeDispatch([
        result({ delivered: 0, attempted: 0, awaitingSubscription: false }),
      ]),
    ).toBe(true);
  });

  it("stamps after at least one successful delivery", () => {
    expect(
      shouldFinalizeDispatch([result({ delivered: 1, attempted: 1 })]),
    ).toBe(true);
  });

  it("retries when push is on but the endpoint is missing or dead", () => {
    expect(
      shouldFinalizeDispatch([
        result({ delivered: 0, attempted: 0, awaitingSubscription: true }),
      ]),
    ).toBe(false);
    expect(
      shouldFinalizeDispatch([
        result({ delivered: 0, attempted: 1, awaitingSubscription: true }),
      ]),
    ).toBe(false);
  });

  it("retries the whole reminder if any recipient still needs a live endpoint", () => {
    expect(
      shouldFinalizeDispatch([
        result({ delivered: 1, attempted: 1 }),
        result({ delivered: 0, attempted: 1, awaitingSubscription: true }),
      ]),
    ).toBe(false);
  });
});
