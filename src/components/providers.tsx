"use client";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/sonner";

/**
 * Somente provedores de UI (tema, toasts). Nenhum dado de domínio aqui.
 * Tema fixo em "light": a identidade visual ainda não tem paleta escura (TODO).
 */
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" forcedTheme="light" disableTransitionOnChange>
      {children}
      <Toaster position="top-center" />
    </ThemeProvider>
  );
}
