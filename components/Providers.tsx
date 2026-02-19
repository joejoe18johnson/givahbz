"use client";

import { SessionProvider } from "next-auth/react";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemedModalProvider } from "@/components/ThemedModal";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <AuthProvider>
        <ThemedModalProvider>{children}</ThemedModalProvider>
      </AuthProvider>
    </SessionProvider>
  );
}
