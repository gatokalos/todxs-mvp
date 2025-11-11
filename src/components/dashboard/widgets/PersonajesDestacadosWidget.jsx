import React, { useMemo } from "react";
import { getPersonajeDisplay } from "../../../utils/gatologiaUtils";
import "./PersonajesDestacadosWidget.css";

function buildFallbackAvatar(nombre = "") {
  if (!nombre) return "🐾";
  return nombre
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default function PersonajesDestacadosWidget({ gatologias = [], personajes = [] }) {
  const ranking = useMemo(() => {
    const counts = new Map();
    gatologias
      .filter((entry) => entry?.is_pinned)
      .forEach((entry) => {
        const slug = entry?.personaje_slug;
        if (!slug) return;
        const current = counts.get(slug) || {
          slug,
          total: 0,
          posts: [],
        };
        current.total += 1;
        current.posts.push({
          id: entry.id,
          titulo: entry.titulo || entry.contenido?.slice(0, 60) || "Entrada destacada",
        });
        counts.set(slug, current);
      });

    return Array.from(counts.values())
      .map((item) => {
        const meta = getPersonajeDisplay(personajes, item.slug);
        return {
          ...item,
          nombre: meta.nombre,
          avatar: meta.avatar,
        };
      })
      .sort((a, b) => b.total - a.total)
      .slice(0, 3);
  }, [gatologias, personajes]);

  return (
    <div className="wg personajes-destacados-widget">
      <div className="wg__head personajes-destacados-widget__head">
        <div className="wg__avatar personajes-destacados-widget__avatar">📌</div>
        <div>
          <h3 className="wg__title">Personajes destacados</h3>
          <p className="wg__subtitle">Los más pineados del universo Gatológico.</p>
        </div>
      </div>

      <div className="personajes-destacados-widget__body">
        {ranking.length === 0 ? (
          <p className="personajes-destacados-widget__empty">
            Aún no hay personajes con publicaciones marcadas con PIN. Sé la primera persona en destacar uno.
          </p>
        ) : (
          <ol className="personajes-destacados-widget__list">
            {ranking.map((personaje, index) => (
              <li key={personaje.slug} className="personajes-destacados-widget__item">
                <div className="personajes-destacados-widget__badge">{index + 1}</div>
                <div className="personajes-destacados-widget__info">
                  <div className="personajes-destacados-widget__image">
                    {personaje.avatar ? (
                      <img src={personaje.avatar} alt={`Retrato de ${personaje.nombre}`} />
                    ) : (
                      <span>{buildFallbackAvatar(personaje.nombre)}</span>
                    )}
                  </div>
                  <div>
                    <h4>{personaje.nombre}</h4>
                    <p>
                      <strong>{personaje.total}</strong> entradas con PIN
                    </p>
                    <button
                      type="button"
                      className="btn btn--ghost personajes-destacados-widget__btn"
                      onClick={() => {
                        const target = `/compendio/${personaje.slug}`;
                        if (typeof window !== "undefined" && window.open) {
                          window.open(target, "_blank", "noopener");
                        }
                      }}
                      aria-label={`Ver publicaciones de ${personaje.nombre}`}
                    >
                      Ver publicaciones
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
}
