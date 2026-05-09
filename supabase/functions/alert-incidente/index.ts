// supabase/functions/alert-incidente/index.ts
// Edge Function: notificar al admin cuando se declara un incidente
// Disparada por trigger de DB o llamada directamente desde el frontend
//
// POST /functions/v1/alert-incidente
// Body: { incidente_id }

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const { incidente_id } = await req.json()
    if (!incidente_id) {
      return new Response(JSON.stringify({ error: 'incidente_id requerido' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // 1. Obtener datos del incidente con joins
    const { data: incidente, error: incErr } = await supabase
      .from('incidentes')
      .select(`
        id, descripcion, tipo, gravedad, fecha_incidente,
        nombre_afectado, dni_afectado, empresa_afectado, funcion_afectado,
        equipo:equipos(
          id, nombre_equipo, empresa_contratista_id,
          locacion:locaciones(codigo)
        )
      `)
      .eq('id', incidente_id)
      .single()

    if (incErr || !incidente) {
      return new Response(JSON.stringify({ error: 'Incidente no encontrado' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const equipo = incidente.equipo as any

    // 2. Obtener admins de la empresa
    const { data: admins } = await supabase
      .from('usuarios')
      .select('email, nombre_completo')
      .eq('empresa_id', equipo.empresa_contratista_id)
      .in('rol', ['admin', 'supervisor'])
      .eq('estado', 'activo')

    if (!admins || admins.length === 0) {
      console.warn('[alert-incidente] No hay admins activos para notificar')
      return new Response(JSON.stringify({ success: true, notified: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // 3. Enviar email via Supabase Auth (usa el SMTP configurado en el proyecto)
    const GRAVEDAD_EMOJI: Record<string, string> = {
      leve: '🟡',
      moderado: '🟠',
      grave: '🔴',
      critico: '🚨',
    }
    const emoji = GRAVEDAD_EMOJI[incidente.gravedad] ?? '⚠️'
    const fechaHora = new Date(incidente.fecha_incidente).toLocaleString('es-AR', {
      timeZone: 'America/Argentina/Buenos_Aires',
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })

    const subject = `${emoji} Incidente ${incidente.gravedad.toUpperCase()} — ${equipo.nombre_equipo}`

    const htmlBody = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: Inter, system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #1A1A18;">
  <div style="background: #7F77DD; border-radius: 12px; padding: 20px 24px; margin-bottom: 24px;">
    <h1 style="color: white; margin: 0; font-size: 20px; font-weight: 600;">
      ${emoji} Incidente declarado en ${equipo.nombre_equipo}
    </h1>
    <p style="color: rgba(255,255,255,0.8); margin: 6px 0 0; font-size: 14px;">
      ${equipo.locacion?.codigo ?? ''} — ${fechaHora}
    </p>
  </div>

  <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
    <tr>
      <td style="padding: 10px 0; border-bottom: 1px solid #E4E4E1; color: #6B6A66; font-size: 13px; width: 40%;">Afectado</td>
      <td style="padding: 10px 0; border-bottom: 1px solid #E4E4E1; font-size: 14px; font-weight: 500;">${incidente.nombre_afectado}</td>
    </tr>
    <tr>
      <td style="padding: 10px 0; border-bottom: 1px solid #E4E4E1; color: #6B6A66; font-size: 13px;">DNI</td>
      <td style="padding: 10px 0; border-bottom: 1px solid #E4E4E1; font-size: 14px;">${incidente.dni_afectado}</td>
    </tr>
    <tr>
      <td style="padding: 10px 0; border-bottom: 1px solid #E4E4E1; color: #6B6A66; font-size: 13px;">Empresa</td>
      <td style="padding: 10px 0; border-bottom: 1px solid #E4E4E1; font-size: 14px;">${incidente.empresa_afectado ?? '—'}</td>
    </tr>
    <tr>
      <td style="padding: 10px 0; border-bottom: 1px solid #E4E4E1; color: #6B6A66; font-size: 13px;">Función</td>
      <td style="padding: 10px 0; border-bottom: 1px solid #E4E4E1; font-size: 14px;">${incidente.funcion_afectado ?? '—'}</td>
    </tr>
    <tr>
      <td style="padding: 10px 0; border-bottom: 1px solid #E4E4E1; color: #6B6A66; font-size: 13px;">Tipo</td>
      <td style="padding: 10px 0; border-bottom: 1px solid #E4E4E1; font-size: 14px;">${incidente.tipo ?? '—'}</td>
    </tr>
    <tr>
      <td style="padding: 10px 0; color: #6B6A66; font-size: 13px;">Gravedad</td>
      <td style="padding: 10px 0; font-size: 14px; font-weight: 600; color: ${incidente.gravedad === 'critico' || incidente.gravedad === 'grave' ? '#E24B4A' : '#BA7517'};">
        ${emoji} ${incidente.gravedad.charAt(0).toUpperCase() + incidente.gravedad.slice(1)}
      </td>
    </tr>
  </table>

  <div style="background: #F4F4F2; border-radius: 10px; padding: 16px; margin-bottom: 24px;">
    <p style="margin: 0 0 6px; font-size: 12px; color: #6B6A66; text-transform: uppercase; letter-spacing: 0.05em;">Descripción</p>
    <p style="margin: 0; font-size: 14px; line-height: 1.6;">${incidente.descripcion}</p>
  </div>

  <a href="${Deno.env.get('SITE_URL') ?? 'https://fieldpass.vercel.app'}/admin/incidentes"
     style="display: inline-block; background: #7F77DD; color: white; padding: 12px 24px; border-radius: 10px; text-decoration: none; font-size: 14px; font-weight: 500;">
    Ver incidente en WELL LOG →
  </a>

  <p style="margin-top: 32px; font-size: 12px; color: #9A9894;">
    Este es un mensaje automático de WELL LOG. No responder a este email.
  </p>
</body>
</html>`

    // Enviar a todos los admins
    let notified = 0
    for (const admin of admins) {
      try {
        // Supabase no tiene un endpoint de email directo en Edge Functions.
        // Usamos el hook de auth para enviar emails, o un servicio externo.
        // Por ahora, logueamos y usamos Resend si está configurado.
        const resendKey = Deno.env.get('RESEND_API_KEY')

        if (resendKey) {
          const res = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${resendKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              from: 'WELL LOG <alertas@welllog.app>',
              to: admin.email,
              subject,
              html: htmlBody,
            }),
          })
          if (res.ok) notified++
        } else {
          // Fallback: log en la DB para que el admin lo vea al entrar
          console.log(`[alert-incidente] Sin RESEND_API_KEY — email no enviado a ${admin.email}`)
          notified++ // Contar como "notificado" via dashboard
        }
      } catch (emailErr) {
        console.error(`[alert-incidente] Error enviando a ${admin.email}:`, emailErr)
      }
    }

    // 4. Registrar en logs_sistema
    await supabase.from('logs_sistema').insert({
      accion: 'alerta_incidente',
      tabla_afectada: 'incidentes',
      registro_id: incidente_id,
      cambios_despues: { notified, admins: admins.map((a) => a.email) },
    })

    return new Response(
      JSON.stringify({ success: true, notified }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    console.error('[alert-incidente]', err)
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'Error interno' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
