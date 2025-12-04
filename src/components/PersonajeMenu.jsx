// src/components/PersonajeMenu.jsx
import { useState } from "react"
import PersonajeModal from "./PersonajeModal"
import "./PersonajeMenu.css"

function PersonajeMenu({ personaje, mensaje }) {
  const [modalAbierto, setModalAbierto] = useState(false)

  const handleIconClick = () => {
    setModalAbierto((prev) => !prev)
  }

  return (
    <div className="personaje-menu">
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

      {mensaje && <div className="personaje-mensaje">{mensaje}</div>}

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
