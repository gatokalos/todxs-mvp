import { create } from 'zustand'
import campos from '../data/camposSemanticos.json'
import { normalizeTableroSemantico, resolverFraseSemantica } from '../utils/resolverFraseSemantica'

const normalizePersonajeId = (personajeId, fallback = "la-maestra") => {
  if (typeof personajeId !== "string") return fallback;
  const normalized = personajeId.trim().toLowerCase().replace(/\s+/g, "-");
  return normalized || fallback;
};

const normalizeNivel = (nivel, fallback = 1) => {
  const parsed = Number(nivel);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(1, Math.floor(parsed));
};

// Exporto named y default para evitar errores de import en otros componentes
export const useGameStore = create((set, get) => ({
  screen: "selector", // arranca en el Selector (splash deshabilitado temporalmente)
  setScreen: (pantalla) => set({ screen: pantalla }),
  curtainsOpen: false,
  // acción para abrir/cerrar cortinas
  setCurtainsOpen: (isOpen) => set({ curtainsOpen: isOpen }),

  role: "subscriber", // anon | subscriber | superadmin
  setRole: (nuevoRol) => set({ role: nuevoRol, lockedPersonajeId: null }),
  defaultFreeCharacter: "la-maestra",
  lockedPersonajeId: null,
  setLockedPersonajeId: (personajeId) => set({ lockedPersonajeId: personajeId }),
  canPlayPersonaje: (personajeId) => {
    const { role, defaultFreeCharacter } = get()
    if (role === "subscriber" || role === "superadmin") return true
    return personajeId === defaultFreeCharacter
  },

  hasFullAccess: () => {
    const { role } = get()
    return role === "subscriber" || role === "superadmin"
  },

    // Para el selector clásico
    personajeActual: null,
    nivelesPorPersonaje: {},
    setPersonajeActual: (personajeId) =>
      set((state) => {
        const safePersonaje = normalizePersonajeId(
          personajeId,
          state.defaultFreeCharacter
        );
        const niveles = state.nivelesPorPersonaje || {};
        const nivelGuardado = normalizeNivel(niveles[safePersonaje], 1);
        return {
          personajeActual: safePersonaje,
          nivelActual: nivelGuardado,
        };
      }),

    // Para la lógica de compendio/camerino
    personajeSeleccionado: null,
    setPersonajeSeleccionado: (p) => set({ personajeSeleccionado: p }),

    draft: null,
    setDraft: (d) => set({ draft: d }),

    // Texto oracular transformado que llega desde Oráculo
    transformacion: null,  // { id, personaje_id, texto_original, texto_transformado }
    setTransformacion: (t) => set({ transformacion: t }),
    clearTransformacion: () => set({ transformacion: null }),
    
  hoveredPersonaje: null,
  setHoveredPersonaje: (personaje) => set({ hoveredPersonaje: personaje }),

  // Estado del tablero
  turno: 'X',
  jugadas: Array(9).fill(null),   // [ { jugador:'X'|'O', palabra:'...' } | null, ...]
  palabraX: null,
  palabraO: null,
  ultimaCasillaX: null,
  ultimaCasillaO: null,
  fraseBase: '',
  fraseFinal: '',
  frases: [],        // 👈 aseguramos que sea siempre array
  frasesFinales: [],

  // Estado del nivel actual (nuevo)
  nivelActual: 1,
  setNivelActual: (nuevoNivel, personajeId) =>
    set((state) => {
      const safePersonaje = normalizePersonajeId(
        personajeId || state.personajeActual,
        state.defaultFreeCharacter
      );
      const safeNivel = normalizeNivel(nuevoNivel, 1);
      return {
        nivelActual: safeNivel,
        nivelesPorPersonaje: {
          ...(state.nivelesPorPersonaje || {}),
          [safePersonaje]: safeNivel,
        },
      };
    }),

  setFraseBase: (nueva) => set({ fraseBase: nueva }),

  // Registrar la jugada del usuario (sin IA — tú pones X y O manualmente)
  // nivelCtx: { tablero, prefijos, sufijos, fraseBase, ritmoFrase } — datos de Supabase.
  // Si no se provee, se usa el fallback legacy del JSON estático (sin eslabones).
  registrarJugada: (index, jugador, palabra, nivelCtx = null) => {
    const state = get()
    const nuevas = [...state.jugadas]
    nuevas[index] = { jugador, palabra }

    let nuevaPalabraX = state.palabraX
    let nuevaPalabraO = state.palabraO

    if (jugador === 'X') {
      nuevaPalabraX = palabra
    } else if (jugador === 'O') {
      nuevaPalabraO = palabra
    }

    let prefijos, fraseBase, tablero, sufijos, ritmoFrase
    if (nivelCtx) {
      tablero = nivelCtx.tablero
      prefijos = nivelCtx.prefijos || {}
      fraseBase = nivelCtx.fraseBase || state.fraseBase || ''
      sufijos = nivelCtx.sufijos || { X: '', O: '' }
      ritmoFrase = nivelCtx.ritmoFrase || { base_x: ' ', x_o: ' ', x_creativa: '\n' }
    } else {
      const personaje = state.personajeActual
      const camposPersonaje = campos[personaje] || {}
      prefijos = camposPersonaje.prefijos || {}
      fraseBase = camposPersonaje.fraseBase || ''
      tablero = normalizeTableroSemantico(camposPersonaje.tablero || [])
      const sufijosConfig = camposPersonaje.sufijos
      const legacySufijo =
        typeof camposPersonaje.sufijo === 'string'
          ? camposPersonaje.sufijo
          : typeof sufijosConfig?.O === 'string'
            ? sufijosConfig.O
            : typeof sufijosConfig?.X === 'string'
              ? sufijosConfig.X
              : '.'
      sufijos = {
        X: typeof sufijosConfig?.X === 'string' ? sufijosConfig.X : '',
        O: typeof sufijosConfig?.O === 'string' ? sufijosConfig.O : legacySufijo,
      }
      ritmoFrase = { base_x: ' ', x_o: ' ', x_creativa: '\n' }
    }

    const nextUltimaCasillaX = jugador === 'X' ? index : state.ultimaCasillaX
    const nextUltimaCasillaO = jugador === 'O' ? index : state.ultimaCasillaO

    let fraseFinal = state.fraseFinal
    if (nuevaPalabraX && nuevaPalabraO) {
      const fraseResuelta = resolverFraseSemantica({
        fraseBase,
        casillaX: Number.isInteger(nextUltimaCasillaX) ? tablero[nextUltimaCasillaX] : null,
        opcionX: nuevaPalabraX,
        casillaO: Number.isInteger(nextUltimaCasillaO) ? tablero[nextUltimaCasillaO] : null,
        opcionO: nuevaPalabraO,
        prefijos,
        sufijos,
        ritmoFrase,
      })
      fraseFinal = fraseResuelta.display
    }

    set({
      jugadas: nuevas,
      frases: [...state.frases, `${jugador}: ${palabra}`],
      turno: jugador === 'X' ? 'O' : 'X',
      palabraX: nuevaPalabraX,
      palabraO: nuevaPalabraO,
      ultimaCasillaX: nextUltimaCasillaX,
      ultimaCasillaO: nextUltimaCasillaO,
      fraseFinal
    })
  },

  actualizarJugada: (index, jugador, palabra) => {
    const state = get()
    const jugadas = [...state.jugadas]
    if (!jugadas[index]) return
    jugadas[index] = { jugador, palabra }

    const updates = {
      jugadas,
    }

    if (jugador === 'X') {
      updates.palabraX = palabra
      updates.ultimaCasillaX = index
    } else if (jugador === 'O') {
      updates.palabraO = palabra
      updates.ultimaCasillaO = index
    }

    set(updates)
  },

  // Simulación de IA muy básica
  jugarIA: () => {
    const state = get()
    if (state.turno !== 'O') return

    const personaje = state.personajeActual
    const tablero = campos[personaje]?.tablero || []

    const disponibles = state.jugadas
      .map((val, idx) => (val === null ? idx : null))
      .filter(idx => idx !== null)

    if (disponibles.length === 0) return

    const index = disponibles[Math.floor(Math.random() * disponibles.length)]
    const opciones = tablero[index]?.O || []

    if (opciones.length === 0) return

    const palabra = opciones[Math.floor(Math.random() * opciones.length)]
    get().registrarJugada(index, 'O', palabra)
  },

  // Guarda SOLO en memoria de la app (no toca el tablero)
  guardarFraseFinal: (payload) =>
    set((state) => ({ frasesFinales: [...state.frasesFinales, payload] })),

  // Limpia la frase (pero NO el tablero)
  resetFraseActual: () =>
    set({
      palabraX: null,
      palabraO: null,
      ultimaCasillaX: null,
      ultimaCasillaO: null,
      fraseFinal: '',
      frases: []    // 👈 evitamos el bug, siempre array
    }),
    
    draft: null,
setDraft: (draft) => set({ draft }),
    
  // Si quieres resetear el tablero, llama esto (no se invoca automáticamente)
  reiniciarTablero: () =>
    set({
      jugadas: Array(9).fill(null),
      palabraX: null,
      palabraO: null,
      ultimaCasillaX: null,
      ultimaCasillaO: null,
      fraseFinal: '',
      frases: [],
      turno: 'X',
    }),
}))

export default useGameStore
