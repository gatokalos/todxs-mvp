// src/components/PersonajeMenu.jsx
import { useState } from "react"
import useGameStore from "../store/useGameStore"
import PersonajeModal from "./PersonajeModal"
import "./PersonajeMenu.css"

function PersonajeMenu({ personaje, frases, mensaje }) {
  const [abierto, setAbierto] = useState(false)
  const [modalAbierto, setModalAbierto] = useState(false)
  const setScreen = useGameStore((s) => s.setScreen)

  const handleGoToSelector = () => {
    setScreen("selector")
    setAbierto(false)
  }

 const handleIconClick = () => {
  const personajeId = personaje.id || personaje.slug
  console.log("DEBUG click →", personajeId, personaje.nombreVisible)

  const esMaestra =
  personajeId?.toLowerCase().includes("maestra") ||
  personaje.nombreVisible?.toLowerCase().includes("maestra")

  if (esMaestra) {
    console.log("Es maestra → abriendo modal")
    setAbierto(false)
    setModalAbierto(true)
    return
  }

  setAbierto((prev) => !prev)
}

  return (
    <div className="personaje-menu">
      {/* Carita */}
      <img
        src={personaje.icono}
        alt={personaje.nombreVisible}
        className="personaje-icono"
        onClick={handleIconClick}
        role="button"
        tabIndex={0}
        onKeyDown={(evt) => {
          if (evt.key === "Enter" || evt.key === " ") {
            evt.preventDefault()
            handleIconClick()
          }
        }}
      />

      {/* Menú desplegable */}
      {abierto && (
        <div className="personaje-dropdown">
          <h3>{personaje.nombreVisible}</h3>
          <ul>
            {frases.length > 0 ? (
              frases.map((f, i) => <li key={i}>{f}</li>)
            ) : (
              <li className="placeholder">Todavía no hay frases</li>
            )}
          </ul>
          <button
            type="button"
            className="personaje-dropdown__link"
            onClick={handleGoToSelector}
          >
            Cambiar de personaje
          </button>
        </div>
      )}

      {/* 💬 Burbuja de mensaje del personaje */}
      {mensaje && <div className="personaje-mensaje">{mensaje}</div>}

      {/* Modal para la Maestra */}
      {modalAbierto && (
        <PersonajeModal
          personaje={{
            id: personaje.id || personaje.slug || "la-maestra",
            nombre: personaje.nombreVisible || "La Maestra",
          }}
          onClose={() => setModalAbierto(false)}
        />
      )}
    </div>
  )
}

export default PersonajeMenu