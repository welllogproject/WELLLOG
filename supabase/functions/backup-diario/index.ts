// supabase/functions/backup-diario/index.ts
// Backup automático diario de datos críticos → Supabase Storage
// Disparar via cron desde Supabase Dashboard → Database → Cron Jobs:
//   0 3 * * *  (todos los días a las 3 AM Argentina = 6 AM UTC)
//
// O llamar manualmente desde superadmin

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const fecha = new Date().toISOString().split('T')[0]
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const resultados: Record<string, number> = {}

    // ── Tablas a respaldar ──────────────────────────────────────────────────
    const tablas = [
      { nombre: 'empresas',            select: '*' },
      { nombre: 'usuarios',            select: 'id,empresa_id,email,nombre_completo,rol,dni,estado,created_at' },
      { nombre: 'equipos',             select: '*' },
      { nombre: 'locaciones',          select: '*' },
      { nombre: 'registros_acceso',    select: 'id,equipo_id,locacion_id,dni,nombre_completo,empresa_visitante_nombre,funcion_visitante,motivo_visita,vehiculo_patente,fecha_ingreso,fecha_egreso,estado,declara_incidente,registrado_por_usuario_id,created_at' },
      { nombre: 'incidentes',          select: '*' },
      { nombre: 'documentos_seguridad',select: '*' },
      { nombre: 'permisos_acceso',     select: '*' },
      { nombre: 'metricas_diarias',    select: '*' },
    ]

    const backupData: Record<string, unknown[]> = {}

    for (const tabla of tablas) {
      const { data, error, count } = await supabase
        .from(tabla.nombre)
        .select(tabla.select, { count: 'exact' })
        .limit(50000) // Límite de seguridad

      if (error) {
        console.error(`Error en ${tabla.nombre}:`, error.message)
        resultados[tabla.nombre] = -1
        continue
      }

      backupData[tabla.nombre] = data ?? []
      resultados[tabla.nombre] = count ?? 0
    }

    // ── Generar JSON comprimido ─────────────────────────────────────────────
    const backupJson = JSON.stringify({
      version: '1.0',
      generado_en: new Date().toISOString(),
      proyecto: 'WELL LOG',
      tablas: resultados,
      datos: backupData,
    }, null, 0) // Sin indentación para reducir tamaño

    const bytes = new TextEncoder().encode(backupJson)

    // ── Subir a Supabase Storage ────────────────────────────────────────────
    // Bucket: backups (crear si no existe)
    await supabase.storage.createBucket('backups', {
      public: false,
      allowedMimeTypes: ['application/json'],
      fileSizeLimit: 52428800, // 50MB
    }).catch(() => {}) // Ignorar si ya existe

    const path = `daily/${fecha}/backup_${timestamp}.json`
    const { error: uploadError } = await supabase.storage
      .from('backups')
      .upload(path, bytes, {
        contentType: 'application/json',
        upsert: false,
      })

    if (uploadError) throw uploadError

    // ── Limpiar backups de más de 30 días ───────────────────────────────────
    const hace30 = new Date()
    hace30.setDate(hace30.getDate() - 30)
    const hace30Str = hace30.toISOString().split('T')[0]

    const { data: archivos } = await supabase.storage
      .from('backups')
      .list('daily', { limit: 100 })

    if (archivos) {
      const viejos = archivos.filter(f => f.name < hace30Str)
      if (viejos.length > 0) {
        await supabase.storage
          .from('backups')
          .remove(viejos.map(f => `daily/${f.name}`))
        console.log(`Eliminados ${viejos.length} backups antiguos`)
      }
    }

    // ── Log en sistema ──────────────────────────────────────────────────────
    await supabase.from('logs_sistema').insert({
      accion: 'backup_diario',
      tabla_afectada: 'multiple',
      cambios_despues: {
        path,
        tablas: resultados,
        size_bytes: bytes.length,
      },
    })

    const totalRegistros = Object.values(resultados).reduce((a, b) => a + (b > 0 ? b : 0), 0)

    return new Response(
      JSON.stringify({
        success: true,
        fecha,
        path,
        size_kb: Math.round(bytes.length / 1024),
        total_registros: totalRegistros,
        tablas: resultados,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    console.error('[backup-diario]', err)
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'Error interno' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
