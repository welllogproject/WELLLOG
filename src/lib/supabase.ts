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
      autoRefreshToken: true,
      detectSessionInUrl: true,
      // Usar localStorage explícitamente (más predecible que el default)
      storage: typeof window !== 'undefined' ? window.localStorage : undefined,
      // Deshabilitar el lock de storage que puede causar deadlocks en F5
      storageKey: 'welllog-auth-token',
      flowType: 'implicit',
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
