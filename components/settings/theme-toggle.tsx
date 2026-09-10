"use client";

import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex gap-2">
      {(["light", "dark", "system"] as const).map((value) => (
        <Button
          key={value}
          type="button"
          size="sm"
          variant={theme === value ? "default" : "outline"}
          onClick={() => setTheme(value)}
          className="capitalize"
        >
          {value}
        </Button>
      ))}
    </div>
  );
}
