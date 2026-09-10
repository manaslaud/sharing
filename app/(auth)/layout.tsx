import { Heart } from "lucide-react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-6 py-10">
      <div className="mb-8 flex items-center gap-2 text-primary">
        <Heart className="size-6 fill-current" />
        <span className="font-serif text-2xl text-foreground">Shared Space</span>
      </div>
      <div className="w-full max-w-sm">{children}</div>
    </div>
  );
}
