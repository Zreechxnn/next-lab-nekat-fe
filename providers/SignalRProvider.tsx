"use client";

import { useAuthStore } from "@/store/useAuthStore";
import { useEffect } from "react";

export function SignalRProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, initializeSignalR, cleanupSignalR } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated) {
      // Initialize SignalR ketika user authenticated
      const timer = setTimeout(() => {
        initializeSignalR();
      }, 1000); // Delay sedikit untuk memastikan token sudah tersimpan

      return () => clearTimeout(timer);
    }

    // Cleanup on unmount
    return () => {
      if (isAuthenticated) {
        cleanupSignalR();
      }
    };
  }, [isAuthenticated, initializeSignalR, cleanupSignalR]);

  return <>{children}</>;
}