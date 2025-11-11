const mockFrasesFavoritas = [
  { id: 1, frase: "El aula estaba llena de gatos curiosos.", personaje_slug: "la-maestra" },
  { id: 2, frase: "Los cuadernos maullaban secretos de tiza.", personaje_slug: "la-maestra" },
  { id: 3, frase: "Saturnina guarda la noche en un termo de té.", personaje_slug: "saturnina" },
  { id: 4, frase: "Don Polo negocia con la siesta y siempre gana.", personaje_slug: "don-polo" },
  { id: 5, frase: "Lucinda escribe cartas que sólo los gatos entienden.", personaje_slug: "lucinda" },
];


export const fakeSupabase = {
  async fetchFrasesFavoritas(personajeSlugs = []) {
    if (!personajeSlugs.length) return [];
    return mockFrasesFavoritas.filter((item) => personajeSlugs.includes(item.personaje_slug));
  },

  async fetchEleccionesPorPersonaje(personajeId) {
    return mockElecciones
      .filter((item) => item.personaje_id === personajeId)
      .map((item) => ({ decision: item.decision, created_at: item.created_at }));
  },

  async insertEleccion(payload) {
    console.log("[mockSupabase] insertEleccion", payload);
    return { data: { ...payload, id: crypto.randomUUID?.() ?? Date.now() }, error: null };
  },
};

export const fakeGPT = {
  async generateFragment({ personajeId, frases }) {
    return `Fragmento generado para ${personajeId}: ${
      frases?.slice(0, 2).join(" · ") || "Los gatos aún están pensando."
    }`;
  },
};
