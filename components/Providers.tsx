"use client";

import { SessionProvider } from "next-auth/react";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemedModalProvider } from "@/components/ThemedModal";
import { ToastProvider } from "@/components/Toast";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <AuthProvider>
        <ThemedModalProvider>
          <ToastProvider>{children}</ToastProvider>
        </ThemedModalProvider>
      </AuthProvider>
    </SessionProvider>
  );
}
