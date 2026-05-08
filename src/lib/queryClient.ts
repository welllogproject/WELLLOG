// src/lib/queryClient.ts
// TanStack Query v5 — configuración global

import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2,         // 2 minutos
      gcTime: 1000 * 60 * 10,           // 10 minutos en caché
      retry: (failureCount, error) => {
        // No reintentar en errores de autorización
        if (error instanceof Error && error.message.includes('401')) return false
        if (error instanceof Error && error.message.includes('403')) return false
        return failureCount < 2
      },
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 0,
    },
  },
})
