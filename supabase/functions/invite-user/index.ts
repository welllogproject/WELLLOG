// supabase/functions/invite-user/index.ts
// Edge Function: crear usuario en auth.users + tabla usuarios
// Requiere service role key — solo llamable desde el backend/admin autenticado
//
// POST /functions/v1/invite-user
// Body: { empresa_id, nombre_completo, email, rol, dni?, telefono? }
// Headers: Authorization: Bearer <JWT del admin>

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 1. Verificar que el llamador es un admin autenticado
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No autorizado' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Cliente con el JWT del usuario que llama (para verificar su rol)
    const supabaseUser = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    )

    // Verificar que el llamador es admin o superadmin
    const { data: { user }, error: authError } = await supabaseUser.auth.getUser()
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Token inválido' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { data: caller } = await supabaseUser
      .from('usuarios')
      .select('rol, empresa_id')
      .eq('id', user.id)
      .single()

    if (!caller || !['admin', 'superadmin'].includes(caller.rol)) {
      return new Response(JSON.stringify({ error: 'Sin permisos para crear usuarios' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // 2. Parsear el body
    const body = await req.json()
    const { empresa_id, nombre_completo, email, rol, dni, telefono } = body

    if (!empresa_id || !nombre_completo || !email || !rol) {
      return new Response(JSON.stringify({ error: 'Faltan campos requeridos' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Admin solo puede crear usuarios de su propia empresa
    if (caller.rol === 'admin' && empresa_id !== caller.empresa_id) {
      return new Response(JSON.stringify({ error: 'Solo podés crear usuarios de tu empresa' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // 3. Crear el usuario en auth.users con service role
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.inviteUserByEmail(
      email,
      {
        data: {
          nombre_completo,
          empresa_id,
          rol,
        },
        redirectTo: `${Deno.env.get('SITE_URL') ?? 'https://fieldpass.vercel.app'}/login`,
      }
    )

    if (createError) {
      // Si el usuario ya existe en auth, intentar solo crear el perfil
      if (createError.message.includes('already been registered')) {
        return new Response(JSON.stringify({ error: 'Este email ya está registrado en el sistema' }), {
          status: 409,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
      throw createError
    }

    // 4. Crear el perfil en tabla usuarios
    const { error: profileError } = await supabaseAdmin
      .from('usuarios')
      .insert({
        id: newUser.user!.id,
        empresa_id,
        email,
        nombre_completo,
        rol,
        dni: dni ?? null,
        telefono: telefono ?? null,
        estado: 'activo',
      })

    if (profileError) {
      // Si falla el perfil, eliminar el usuario de auth para no dejar inconsistencias
      await supabaseAdmin.auth.admin.deleteUser(newUser.user!.id)
      throw profileError
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Invitación enviada a ${email}`,
        user_id: newUser.user!.id,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (err) {
    console.error('[invite-user]', err)
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'Error interno' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
