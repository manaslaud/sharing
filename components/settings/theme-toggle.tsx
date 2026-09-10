"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";

const options = ["light", "dark", "system"] as const;

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="flex gap-2">
      {options.map((value) => (
        <Button
          key={value}
          type="button"
          size="sm"
          variant={mounted && theme === value ? "default" : "outline"}
          onClick={() => setTheme(value)}
          className="capitalize"
          disabled={!mounted}
        >
          {value}
        </Button>
      ))}
    </div>
  );
}
