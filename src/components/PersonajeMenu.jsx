// src/components/PersonajeMenu.jsx
import { useState } from "react"
import PersonajeModal from "./PersonajeModal"
import "./PersonajeMenu.css"

function PersonajeMenu({ personaje, mensaje }) {
  const [modalAbierto, setModalAbierto] = useState(false)

  const handleIconClick = () => {
    setModalAbierto((prev) => !prev)
  }

  const icono = personaje.icono?.trim()
  const iconoProps = {
    onClick: handleIconClick,
    role: "button",
    tabIndex: 0,
    onKeyDown: (evt) => {
      if (evt.key === "Enter" || evt.key === " ") {
        evt.preventDefault()
        handleIconClick()
      }
    },
  }

  return (
    <div className="personaje-menu">
      {icono ? (
        <img
          src={icono}
          alt={personaje.nombreVisible}
          {...iconoProps}
          className="personaje-icono"
        />
      ) : (
        <div
          {...iconoProps}
          className="personaje-icono personaje-icono--placeholder"
        >
          {personaje.nombreVisible?.[0] || "?"}
        </div>
      )}

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
