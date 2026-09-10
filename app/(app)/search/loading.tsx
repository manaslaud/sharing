export default function SearchLoading() {
  return (
    <div>
      <div className="mb-6 h-9 w-28 animate-pulse rounded-lg bg-muted" />
      <div className="mb-4 h-11 animate-pulse rounded-xl bg-muted" />
      <div className="mb-4 flex flex-wrap gap-2">
        {Array.from({ length: 5 }, (_, index) => (
          <div
            key={index}
            className="h-7 w-16 animate-pulse rounded-full bg-muted"
          />
        ))}
      </div>
      <div className="grid gap-2">
        <div className="h-24 animate-pulse rounded-2xl bg-muted" />
        <div className="h-24 animate-pulse rounded-2xl bg-muted" />
        <div className="h-24 animate-pulse rounded-2xl bg-muted" />
      </div>
    </div>
  );
}
