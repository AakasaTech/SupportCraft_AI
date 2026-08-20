"use client";

import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { Toaster } from "sonner";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider>
        {children}
        <Toaster
          position="bottom-right"
          toastOptions={{
            classNames: {
              toast:       "sc-card elevation-dropdown text-sm font-sans",
              title:       "font-medium text-foreground",
              description: "text-muted-foreground",
              success:     "border-l-4 border-success",
              error:       "border-l-4 border-destructive",
              warning:     "border-l-4 border-warning",
              info:        "border-l-4 border-info",
            },
          }}
        />
      </ThemeProvider>
    </SessionProvider>
  );
}
