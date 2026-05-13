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
    // EXCEPCIÓN: puede crear auditores en empresas operadoras (flujo de invitar auditor externo)
    if (caller.rol === 'admin' && empresa_id !== caller.empresa_id) {
      if (rol !== 'auditor') {
        return new Response(JSON.stringify({ error: 'Solo podés crear usuarios de tu empresa' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
      // Verificar que la empresa destino es operadora (no puede crear usuarios en otra contratista)
      const { data: empresaDestino } = await supabaseUser
        .from('empresas')
        .select('tipo')
        .eq('id', empresa_id)
        .single()
      if (!empresaDestino || empresaDestino.tipo !== 'operadora') {
        return new Response(JSON.stringify({ error: 'Solo podés invitar auditores a empresas operadoras' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
    }

    // 3. Crear el usuario en auth.users con service role
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // 3. Crear el usuario en auth.users con service role
    // Usamos createUser + generateLink en vez de inviteUserByEmail
    // para evitar dependencia del SMTP en el momento de creación
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      email_confirm: false, // Requiere confirmación via link
      user_metadata: { nombre_completo, empresa_id, rol },
    })

    if (createError) {
      if (createError.message.includes('already been registered') ||
          createError.message.includes('already exists')) {
        return new Response(JSON.stringify({ error: 'Este email ya está registrado en el sistema' }), {
          status: 409,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
      throw createError
    }

    const userId = newUser.user!.id

    // 4. Crear el perfil en tabla usuarios
    const { error: profileError } = await supabaseAdmin
      .from('usuarios')
      .insert({
        id: userId,
        empresa_id,
        email,
        nombre_completo,
        rol,
        dni: dni ?? null,
        telefono: telefono ?? null,
        estado: 'activo',
      })

    if (profileError) {
      await supabaseAdmin.auth.admin.deleteUser(userId)
      throw profileError
    }

    // 5. Generar link de activación
    const siteUrl = Deno.env.get('SITE_URL') ?? 'https://wlogproject.vercel.app'
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'invite',
      email,
      options: { redirectTo: `${siteUrl}/login` },
    })

    const activationLink = linkData?.properties?.action_link ?? null

    // 6. Intentar enviar email via Resend directamente (más confiable que SMTP de Supabase)
    let emailSent = false
    const resendKey = Deno.env.get('RESEND_API_KEY')
    if (resendKey && activationLink) {
      try {
        const emailRes = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'WELL LOG <onboarding@resend.dev>',
            to: email,
            subject: 'Invitación a WELL LOG',
            html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: Inter, system-ui, sans-serif; max-width: 520px; margin: 0 auto; padding: 32px; color: #1A1A18;">
  <div style="background: linear-gradient(135deg, #7F77DD, #534AB7); border-radius: 14px; padding: 24px; margin-bottom: 28px; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 22px; font-weight: 600;">WELL LOG</h1>
    <p style="color: rgba(255,255,255,0.8); margin: 6px 0 0; font-size: 14px;">Control de acceso en campo</p>
  </div>
  <h2 style="font-size: 18px; font-weight: 600; margin-bottom: 8px;">Hola, ${nombre_completo}</h2>
  <p style="color: #3D3D3A; font-size: 15px; line-height: 1.6; margin-bottom: 24px;">
    Fuiste invitado a WELL LOG como <strong>${rol}</strong>. 
    Hacé click en el botón para activar tu cuenta y elegir tu contraseña.
  </p>
  <a href="${activationLink}" 
     style="display: inline-block; background: linear-gradient(135deg, #7F77DD, #534AB7); color: white; padding: 14px 28px; border-radius: 10px; text-decoration: none; font-size: 15px; font-weight: 500;">
    Activar mi cuenta →
  </a>
  <p style="margin-top: 24px; font-size: 12px; color: #9A9894;">
    Este link expira en 24 horas. Si no esperabas esta invitación, ignorá este email.
  </p>
</body>
</html>`,
          }),
        })
        emailSent = emailRes.ok
      } catch (_) {
        // Email falla silenciosamente — el link de activación sigue disponible
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: emailSent
          ? `Invitación enviada a ${email}`
          : `Usuario creado. El email no pudo enviarse — compartí el link de activación manualmente.`,
        user_id: userId,
        email_sent: emailSent,
        // Link de activación siempre disponible como fallback
        activation_link: activationLink,
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
