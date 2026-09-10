export type PushSendResult = {
  attempted: number;
  delivered: number;
  awaitingSubscription: boolean;
};

export function shouldFinalizeDispatch(results: PushSendResult[]) {
  if (results.length === 0) return true;
  return results.every(
    (result) =>
      result.delivered > 0 ||
      (result.attempted === 0 && !result.awaitingSubscription),
  );
}
