// src/components/dashboard/HeaderResumen.jsx
import React from "react";

export default function HeaderResumen({ gatologias, user }) {
  const total = gatologias.length;
  const fraseDelDia =
    gatologias[Math.floor(Math.random() * total)]?.contenido ||
    "El Gato observa en silencio, esperando tu próxima palabra.";

  return (
    <section className="dashboard-section header-resumen">
      <h1>🐾 Bienvenido, {user?.nombre || "Gatólogo"}</h1>
      <p className="dashboard-subtitle">
        Has descubierto <strong>{total}</strong> gatologías hasta ahora.
      </p>
      <blockquote className="dashboard-frase">
        <em>“{fraseDelDia}”</em>
      </blockquote>
    </section>
  );
}