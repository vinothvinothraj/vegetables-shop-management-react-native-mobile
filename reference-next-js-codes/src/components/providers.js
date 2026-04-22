"use client";

import { AppProvider } from "@/context/app-context";
import { Toaster } from "sonner";

export function Providers({ children }) {
  return (
    <AppProvider>
      {children}
      <Toaster richColors position="top-right" />
    </AppProvider>
  );
}
