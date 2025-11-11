import { createClient } from '@supabase/supabase-js'

// Lee credenciales del .env.local (si faltan, no rompemos la UI)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

console.log("🔗 URL:", import.meta.env.VITE_SUPABASE_URL)
console.log("🔑 KEY:", import.meta.env.VITE_SUPABASE_ANON_KEY ? "definida ✅" : "no definida ❌")

export const supabase =
  supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null

/**
 * Guardar elección en la tabla "elecciones" SIN romper la app si algo falla.
 */
export async function guardarEleccion(payload = {}) {
  if (!supabase) {
    console.warn('⚠️ Supabase no configurado. Simulando guardado.')
    return { data: null, error: null }
  }

  const row = {
    decision: payload.fraseFinal ?? null,
    timestamp: new Date(),
  }
  if (payload.usuarioId)   row.usuario_id   = payload.usuarioId
  if (payload.personajeId) row.personaje_id = payload.personajeId

  const { data, error } = await supabase.from('elecciones').insert([row]).select()

  if (error) {
    console.error('❌ Error guardando la elección:', error.message)
  } else {
    console.log('✅ Elección guardada con éxito:', data)
  }
  return { data, error }
}

/**
 * Obtener un nivel específico desde "niveles_semanticos"
 */
export async function getNivel(personajeId, nivel) {
  if (!supabase) {
    console.warn('⚠️ Supabase no configurado. Simulando fetch de nivel.')
    return null
  }

  const { data, error } = await supabase
    .from("niveles_semanticos")
    .select("frase_base, prefijos, sufijos, tablero, mensajes_victoria_x, mensajes_victoria_o")
    .eq("personaje_id", personajeId)
    .eq("nivel", nivel)
    .single()

  if (error) {
    console.error("❌ Error cargando nivel:", error.message)
    return null
  }

  console.log(`📥 Nivel ${nivel} cargado para ${personajeId}:`, data)
  return data
}