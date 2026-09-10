import Link from "next/link";

export default function OfflinePage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center px-6 text-center">
      <p className="font-serif text-4xl">♥</p>
      <h1 className="mt-4 font-serif text-3xl">You’re offline</h1>
      <p className="mt-2 text-muted-foreground">
        Recently opened notes and journal entries are still on this device.
      </p>
      <Link href="/" className="mt-6 text-primary underline-offset-4 hover:underline">
        Try again
      </Link>
    </main>
  );
}
