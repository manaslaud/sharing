import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center text-center">
      <h1 className="font-serif text-3xl">We couldn't find that</h1>
      <p className="mt-2 text-muted-foreground">It may be private, or it was deleted.</p>
      <Link href="/" className="mt-6 text-primary underline-offset-4 hover:underline">
        Back home
      </Link>
    </div>
  );
}
