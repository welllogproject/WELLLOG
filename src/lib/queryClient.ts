// src/lib/queryClient.ts
// TanStack Query v5 — configuración global

import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 3,         // 3 minutos — datos frescos sin refetch innecesario
      gcTime: 1000 * 60 * 30,           // 30 minutos en caché — sobrevive navegación entre vistas
      retry: (failureCount, error) => {
        if (error instanceof Error) {
          // Auth errors — no reintentar, el usuario necesita re-login
          if (error.message.includes('401') || error.message.includes('JWT')) return false
          // Permission denied — no reintentar (RLS bloqueó)
          if (error.message.includes('403')) return false
          // Row not found — no reintentar
          if (error.message.includes('PGRST116')) return false
          // Relationship errors — no reintentar (schema issue)
          if (error.message.includes('PGRST200') || error.message.includes('PGRST204')) return false
        }
        return failureCount < 2
      },
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      refetchOnMount: true,
    },
    mutations: {
      retry: 0,
    },
  },
})
