// src/lib/supabase.ts
// Cliente Supabase singleton

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('[WELL LOG] Supabase credentials missing. Check your .env.local file.')
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder_key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: false,
      detectSessionInUrl: true,
      flowType: 'implicit',
      // Deshabilitar el lock que bloquea en F5
      lock: async (_name: string, _acquireTimeout: number, fn: () => Promise<any>) => {
        // Ejecutar sin lock — evita el deadlock de navigator.locks en F5
        return fn()
      },
      storage: {
        getItem: (key: string) => {
          if (typeof window === 'undefined') return null
          return window.localStorage.getItem(key)
        },
        setItem: (key: string, value: string) => {
          if (typeof window === 'undefined') return
          window.localStorage.setItem(key, value)
        },
        removeItem: (key: string) => {
          if (typeof window === 'undefined') return
          window.localStorage.removeItem(key)
        },
      },
    },
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
  }
)

// Helper de diagnostico — accesible desde DevTools console como `__supabase`
if (typeof window !== 'undefined') {
  ;(window as unknown as { __supabase: typeof supabase }).__supabase = supabase
}

export type SupabaseClient = typeof supabase
