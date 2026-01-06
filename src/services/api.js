// src/services/api.js
import { supabase } from "../lib/supabaseClient";


export const api = {
  fetchGatologias,
  fetchBlogEntries,
  insertGatologia,
  updateGatologia,
  deleteGatologia,
  togglePinned,
  publishGatologia,
  insertEleccion: guardarEleccion,
  fetchEleccionesPorPersonaje,
  generarGatologiaDesdeAPI

};

/**
 * Obtener todas las gatologías de un personaje
 */
export async function fetchGatologias(personajeSlug) {
  const { data, error } = await supabase
    .from("gatologias")
    .select("*")
    .eq("personaje_slug", personajeSlug)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("❌ Error fetchGatologias:", error.message);
    return [];
  }
  return data || [];
}

/**
 * Obtener entradas publicadas del blog
 */
export async function fetchBlogEntries() {
  const { data, error } = await supabase
    .from("gatologias")
    .select("*")
    .in("estado", ["blog", "published"])
    .order("created_at", { ascending: false });

  if (error) {
    console.error("❌ Error fetchBlogEntries:", error.message);
    return [];
  }
  return data || [];
}

/**
 /**
 * Insertar una nueva gatología
 */
export async function insertGatologia(payload = {}) {
  // Normalizamos los nombres de los campos para coincidir con la DB
  const row = {
    personaje_slug: payload.personaje_slug || payload.personaje || null,
    titulo: payload.titulo || "Sin título",
    contenido: payload.contenido || payload.texto || "", // ✅ usa 'contenido' si existe, o 'texto' como fallback
    estado: payload.estado || "draft",
    user_id: payload.user_id || null,
    imagen_url: payload.imagen_url || null,
  };

  const { data, error } = await supabase
    .from("gatologias")
    .insert([row])
    .select()
    .single();

  if (error) {
    console.error("❌ Error insertGatologia:", error.message);
    return null;
  }
  return data;
}

/**
 * Actualizar una gatología existente
 */
export async function updateGatologia(id, payload = {}) {
  const row = {
    titulo: payload.titulo,
    contenido: payload.contenido || payload.texto, // ✅ coherente
    estado: payload.estado || "draft",
    imagen_url: payload.imagen_url || null,
  };

  const { error } = await supabase
    .from("gatologias")
    .update(row)
    .eq("id", id);

  if (error) {
    console.error("❌ Error updateGatologia:", error.message);
    return null;
  }
  return true;
}

/**
 * Borrar una gatología
 */
export async function deleteGatologia(id) {
  const { error } = await supabase
    .from("gatologias")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("❌ Error deleteGatologia:", error.message);
    return null;
  }
  return true;
}

/**
 * Pinear/despinear una gatología
 */
export async function togglePinned(id, pinned = false) {
  const { error } = await supabase
    .from("gatologias")
    .update({ pinned })
    .eq("id", id);

  if (error) {
    console.error("❌ Error togglePinned:", error.message);
    return null;
  }
  return true;
}

/**
 * Publicar una gatología (cambiar estado a 'published')
 */
export async function publishGatologia(id) {
  const { error } = await supabase
    .from("gatologias")
    .update({ estado: "published" })
    .eq("id", id);

  if (error) {
    console.error("❌ Error publishGatologia:", error.message);
    return null;
  }
  return true;
}
/**
 * Obtener elecciones guardadas de un personaje
 */
export async function fetchEleccionesPorPersonaje(personajeId) {
  const { data, error } = await supabase
    .from("elecciones")
    .select("id, decision, created_at, timestamp")
    .eq("personaje_id", personajeId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("❌ Error fetchEleccionesPorPersonaje:", error.message);
    return [];
  }
  return data || [];
}

/**
 * Guardar una elección en la tabla "elecciones"
 */
export async function guardarEleccion(payload = {}) {
  const row = {
    decision: payload.fraseFinal ?? null,
    timestamp: new Date(),
  };

  if (payload.usuarioId) row.usuario_id = payload.usuarioId;
  if (payload.personajeId) row.personaje_id = payload.personajeId;

  const { data, error } = await supabase
    .from("elecciones")
    .insert([row])
    .select();

  if (error) {
    console.error("❌ Error guardarEleccion:", error.message);
    return null;
  }
  return data;
}

/**
 * Obtener un nivel específico desde "niveles_semanticos"
 */
export async function getNivel(personajeId, nivel) {
  const { data, error } = await supabase
    .from("niveles_semanticos")
    .select(
      "frase_base, prefijos, sufijo, tablero, mensajes_victoria_x, mensajes_victoria_o"
    )
    .eq("personaje_id", personajeId)
    .eq("nivel", nivel)
    .single();

  if (error) {
    console.error("❌ Error getNivel:", error.message);
    return null;
  }

  return data;
}

export async function fetchPersonajeStats(slug) {
  const { data, error } = await supabase
    .from("personaje_stats")
    .select("plays_this_week, popularity, last_activity")
    .eq("personaje_slug", slug)
    .single();
  if (error) throw error;
  return data;
}

/**

/**
 * Llamar a la API local del Gato Enigmático para generar una nueva gatología
 */
export async function generarGatologiaDesdeAPI(personaje, frases = []) {
  const baseURL = import.meta.env?.VITE_API_BASE_URL || "http://localhost:5050";

  try {
    const response = await fetch(`${baseURL}/api/todxs/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ personaje, frases }),
    });

    if (!response.ok) {
      throw new Error(`Error HTTP ${response.status}`);
    }

    const data = await response.json();
    console.log("✅ Gatología generada:", data);
    return data; // { titulo, texto }
  } catch (err) {
    console.error("❌ Error generando gatología desde API:", err.message);
    return {
      titulo: `Susurros para ${personaje || "el escenario"}`,
      texto: `El Gato no respondió, pero susurra en silencio entre las frases: ${frases.join(", ")}...`,
      warning: true,
    };
  }
}
