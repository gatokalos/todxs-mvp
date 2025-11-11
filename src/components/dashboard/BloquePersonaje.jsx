// src/components/dashboard/BloquePersonaje.jsx
import React from "react";

const PERSONAJES = [
  { slug: "la-maestra", nombre: "La Maestra", icon: "/assets/maestra_carita.svg" },
  { slug: "silvestre", nombre: "Silvestre", icon: "/assets/silvestre_carita.svg" },
  { slug: "reina-de-espadas", nombre: "Reina de Espadas", icon: "/assets/reina_carita.svg" },
  { slug: "don-polo", nombre: "Don Polo", icon: "/assets/polo_carita.svg" },
  { slug: "la-doctora", nombre: "La Doctora", icon: "/assets/doctora_carita.svg" },
  { slug: "payasito-triste", nombre: "Payasito Tiste", icon: "/assets/payasito_carita.svg" },
];

export default function BloquePersonaje({ gatologias }) {
  return (
    <section className="dashboard-section personajes-grid">
      {PERSONAJES.map((p) => {
        const entry = gatologias.find((g) => g.personaje_slug === p.slug);
        return (
          <div key={p.slug} className="personaje-card">
            <img src={p.icon} alt={p.nombre} />
            <h3>{p.nombre}</h3>
            <p>{entry?.titulo || "Sin título aún"}</p>
            <small>{entry?.contenido?.slice(0, 120) || "Sin contenido..."}</small>
          </div>
        );
      })}
    </section>
  );
}