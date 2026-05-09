// src/lib/queryClient.ts
// TanStack Query v5 — configuración global

import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 3,         // 3 minutos — datos frescos sin refetch innecesario
      gcTime: 1000 * 60 * 15,           // 15 minutos en caché (mejora navegación entre vistas)
      retry: (failureCount, error) => {
        // No reintentar en errores de autorización
        if (error instanceof Error && error.message.includes('401')) return false
        if (error instanceof Error && error.message.includes('403')) return false
        // No reintentar en errores de RLS (Supabase devuelve PGRST)
        if (error instanceof Error && error.message.includes('PGRST')) return false
        return failureCount < 2
      },
      refetchOnWindowFocus: false,       // Evita refetch al volver a la pestaña (reduce requests)
      refetchOnReconnect: true,          // Sí refetch al recuperar conexión (importante offline)
      refetchOnMount: true,              // Refetch al montar si los datos están stale
    },
    mutations: {
      retry: 0,
    },
  },
})
