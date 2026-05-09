// src/lib/queryClient.ts
// TanStack Query v5 — configuración global

import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 3,         // 3 minutos — datos frescos sin refetch innecesario
      gcTime: 1000 * 60 * 30,           // 30 minutos en caché — sobrevive navegación entre vistas
      retry: (failureCount, error) => {
        if (error instanceof Error && error.message.includes('401')) return false
        if (error instanceof Error && error.message.includes('403')) return false
        if (error instanceof Error && error.message.includes('PGRST')) return false
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
