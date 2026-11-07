"use client";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/sonner";

/** Somente provedores de UI (tema, toasts). Nenhum dado de domínio aqui. */
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      {children}
      <Toaster />
    </ThemeProvider>
  );
}
