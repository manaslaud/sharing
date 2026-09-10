"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const isChunkError =
    error.name === "ChunkLoadError" ||
    /Loading chunk|Failed to load chunk|ChunkLoadError/i.test(error.message);

  const [retrying, setRetrying] = useState(false);

  useEffect(() => {
    if (!isChunkError) return;
    const key = "shared-space-chunk-reload";
    if (sessionStorage.getItem(key)) {
      sessionStorage.removeItem(key);
      return;
    }
    sessionStorage.setItem(key, "1");
    window.location.reload();
  }, [isChunkError]);

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center text-center">
      <h1 className="font-serif text-3xl">Something went wrong</h1>
      <p className="mt-2 max-w-sm text-muted-foreground">
        {isChunkError
          ? "The app was updated. Refresh to load the latest version."
          : error.message || "Please try again."}
      </p>
      <Button
        className="mt-6"
        loading={retrying}
        onClick={() => {
          if (retrying) return;
          setRetrying(true);
          if (isChunkError) {
            window.location.reload();
            return;
          }
          reset();
        }}
      >
        {retrying ? "Retrying…" : "Try again"}
      </Button>
    </div>
  );
}
