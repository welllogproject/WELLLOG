// src/App.tsx
import { RouterProvider } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { Toaster } from 'react-hot-toast'
import { queryClient } from '@/lib/queryClient'
import { router } from '@/router'
import { useAuthInit } from '@/hooks/useAuth'
import { useOfflineSync } from '@/hooks/useOfflineSync'
import { useAuthStore } from '@/stores/authStore'
import { DebugPanel } from '@/components/shared/DebugPanel'

// Componente para inicializar hooks globales dentro del contexto
function GlobalHooks() {
  useAuthInit()
  useOfflineSync()
  return null
}

export function App() {
  const { isLoading, _hydrated, usuario } = useAuthStore()

  // Solo mostrar spinner si:
  // - Zustand aún no terminó de rehidratar (< 50ms normalmente), O
  // - No hay usuario rehidratado Y Supabase aún está verificando la sesión
  const showSpinner = !_hydrated || (isLoading && !usuario)

  return (
    <QueryClientProvider client={queryClient}>
      <GlobalHooks />

      {showSpinner ? (
        <div className="min-h-screen bg-[var(--input-bg)] flex flex-col items-center justify-center gap-4">
          <div className="w-12 h-12 rounded-[14px] bg-[#7F77DD] flex items-center justify-center animate-pulse shadow-clay">
            <span className="text-white font-semibold">WL</span>
          </div>
          <p className="text-sm font-medium text-[var(--text-secondary)]">Iniciando WELL LOG...</p>
        </div>
      ) : (
        <RouterProvider router={router} />
      )}

      <Toaster
        position="top-center"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#333',
            color: '#fff',
            borderRadius: '12px',
            fontSize: '14px',
            fontFamily: 'Inter, sans-serif'
          },
          success: {
            style: { background: '#1D9E75' }
          },
          error: {
            style: { background: '#E24B4A' },
            duration: 6000
          }
        }}
      />
      <ReactQueryDevtools initialIsOpen={false} />
      <DebugPanel />
    </QueryClientProvider>
  )
}

export default App
