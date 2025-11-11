// src/components/dashboard/WidgetCard.jsx
import React from "react";

export default function WidgetCard({ card, onReescribir, onGuardar, onBorrar }) {
  const fecha =
    card.created_at &&
    new Date(card.created_at).toLocaleString("es-MX", { dateStyle: "medium", timeStyle: "short" });

  return (
    <article className={`wg ${card.estado !== "mock" ? "wg--live" : ""}`}>
      <header className="wg__head">
        <img className="wg__avatar" src={card.icon} alt={card.nombre} />
        <div className="wg__titles">
          <h3 className="wg__title">{card.nombre}</h3>
          <small className="wg__subtitle">{card.titulo}</small>
        </div>
      </header>

      <div className="wg__body">
        <p>{card.texto}</p>
      </div>

      <div className="wg__meta">
        {fecha ? <span>Última: {fecha}</span> : <span>Sin publicación aún</span>}
      </div>

      <div className="wg__actions">
        <button className="btn btn--ghost" onClick={onReescribir}>✍️ Reescribir</button>
        <button className="btn btn--ok" onClick={onGuardar}>💾 Guardar</button>
        <button className="btn btn--danger" onClick={onBorrar} disabled={!card.dbId}>🗑️ Borrar</button>
      </div>
    </article>
  );
}