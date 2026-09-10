"use client";

import { ThemeProvider } from "next-themes";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { OfflineSync } from "@/components/offline-sync";
import { PwaRegister } from "@/components/pwa-register";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <TooltipProvider delay={200}>
        {children}
        <Toaster position="top-center" />
        <OfflineSync />
        <PwaRegister />
      </TooltipProvider>
    </ThemeProvider>
  );
}
