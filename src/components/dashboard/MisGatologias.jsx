// src/components/dashboard/MisGatologias.jsx
import React from "react";
import useGameStore from "../../store/useGameStore";

export default function MisGatologias({ gatologias }) {
  const user = useGameStore((s) => s.usuario);
  const propias = gatologias.filter((g) => g.autor_id === user?.id);

  return (
    <section className="dashboard-section mis-gatologias">
      <h2>🪶 Mis Gatologías</h2>
      {propias.length === 0 && <p>Aún no has creado ninguna gatología.</p>}
      {propias.map((g) => (
        <article key={g.id} className="gatologia-item">
          <h4>{g.titulo}</h4>
          <p>{g.contenido}</p>
        </article>
      ))}
    </section>
  );
}