import { create } from 'zustand'
import campos from '../data/camposSemanticos.json'

// Exporto named y default para evitar errores de import en otros componentes
export const useGameStore = create((set, get) => ({
  screen: "splash", // arranca en el Splash
  setScreen: (pantalla) => set({ screen: pantalla }),
  curtainsOpen: false,
  // acción para abrir/cerrar cortinas
  setCurtainsOpen: (isOpen) => set({ curtainsOpen: isOpen }),

  role: "anon", // anon | subscriber | superadmin
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
    setPersonajeActual: (personajeId) => set({ personajeActual: personajeId }),

    // Para la lógica de compendio/camerino
    personajeSeleccionado: null,
    setPersonajeSeleccionado: (p) => set({ personajeSeleccionado: p }),

    draft: null,
    setDraft: (d) => set({ draft: d }),
    
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
  setNivelActual: (nuevoNivel) => set({ nivelActual: nuevoNivel }),

  setFraseBase: (nueva) => set({ fraseBase: nueva }),

  // Registrar la jugada del usuario (sin IA — tú pones X y O manualmente)
  registrarJugada: (index, jugador, palabra) => {
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

    const personaje = state.personajeActual
    const camposPersonaje = campos[personaje] || {}
    const prefijos = camposPersonaje.prefijos || {}
    const fraseBase = camposPersonaje.fraseBase || ''
    const sufijo = camposPersonaje.sufijo || '.'

    let fraseFinal = state.fraseFinal
    if (nuevaPalabraX && nuevaPalabraO) {
      fraseFinal =
        fraseBase +
        prefijos.X + nuevaPalabraX + ', ' +
        prefijos.O + nuevaPalabraO + sufijo
    }

    set({
      jugadas: nuevas,
      frases: [...state.frases, `${jugador}: ${palabra}`],
      turno: jugador === 'X' ? 'O' : 'X',
      palabraX: nuevaPalabraX,
      palabraO: nuevaPalabraO,
      ultimaCasillaX: jugador === 'X' ? index : state.ultimaCasillaX,
      ultimaCasillaO: jugador === 'O' ? index : state.ultimaCasillaO,
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
