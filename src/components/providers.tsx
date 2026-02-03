"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { UserProvider } from "@/contexts/UserContext";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000, // 5 minuti - i dati restano "fresh" più a lungo
            gcTime: 10 * 60 * 1000, // 10 minuti - cache persiste anche quando componenti smontati
            refetchOnWindowFocus: false, // Non refetch automatico quando torni sulla tab
            refetchOnMount: false, // Non refetch automatico al mount se i dati sono fresh
            retry: (failureCount, error) => {
              const msg = String((error as Error)?.message ?? "");
              if (msg.includes("fetch") || msg.includes("Failed to fetch") || msg.includes("NetworkError")) return false;
              return failureCount < 3;
            },
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <UserProvider>{children}</UserProvider>
    </QueryClientProvider>
  );
}
