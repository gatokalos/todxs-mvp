import React, { useMemo, useState } from "react";
import { supabase } from "../../../lib/supabaseClient";
import { getPersonajeDisplay } from "../../../utils/gatologiaUtils";
import "./ActividadWidget.css";

const MAX_PREVIEW = 220;

function normalizeEntry(entry, personajes, defaults = {}) {
  const { nombre, avatar } = getPersonajeDisplay(personajes, entry?.personaje_slug);
  return {
    id: entry?.id ?? `local-${Math.random().toString(16).slice(2)}`,
    personaje_slug: entry?.personaje_slug,
    personajeNombre: nombre,
    personajeAvatar: entry?.personaje_avatar || avatar,
    titulo: entry?.titulo || defaults.titulo || nombre,
    contenido: entry?.contenido || entry?.texto || defaults.contenido || "",
    votes: entry?.votes ?? entry?.votos ?? 0,
    created_at: entry?.created_at,
    tipo: entry?.tipo || entry?.estado || defaults.tipo,
    enlace: entry?.enlace || null,
  };
}

export default function ActividadWidget({ gatologias = [], user, personajes = [] }) {
  const [optimisticVotes, setOptimisticVotes] = useState({});
  const [voting, setVoting] = useState({}); // id => boolean

  const frasesCompartidas = useMemo(() => {
    const filtered = gatologias.filter((entry) => entry?.is_public);
    return filtered
      .map((entry) =>
        normalizeEntry(entry, personajes, {
          titulo: "Frase compartida",
          tipo: "frase",
        })
      )
      .sort((a, b) => (optimisticVotes[b.id] ?? b.votes ?? 0) - (optimisticVotes[a.id] ?? a.votes ?? 0));
  }, [gatologias, personajes, optimisticVotes]);

  const blogsDestacados = useMemo(() => {
    const filtered = gatologias.filter((entry) => entry?.is_pinned);
    return filtered
      .map((entry) =>
        normalizeEntry(entry, personajes, {
          titulo: entry?.titulo || "Entrada destacada",
          tipo: "blog",
        })
      )
      .sort((a, b) => (optimisticVotes[b.id] ?? b.votes ?? 0) - (optimisticVotes[a.id] ?? a.votes ?? 0))
      .slice(0, 12);
  }, [gatologias, personajes, optimisticVotes]);

  const combinedIds = useMemo(() => {
    const ids = new Set();
    frasesCompartidas.forEach((item) => ids.add(item.id));
    blogsDestacados.forEach((item) => ids.add(item.id));
    return ids;
  }, [frasesCompartidas, blogsDestacados]);

  async function handleVote(item) {
    if (!item?.id || voting[item.id]) return;
    const current = optimisticVotes[item.id] ?? item.votes ?? 0;
    const next = current + 1;

    setVoting((prev) => ({ ...prev, [item.id]: true }));
    setOptimisticVotes((prev) => ({ ...prev, [item.id]: next }));

    if (!supabase) {
      console.warn("⚠️ Supabase no configurado. Voto registrado solo en memoria.");
      setTimeout(() => {
        setVoting((prev) => ({ ...prev, [item.id]: false }));
      }, 320);
      return;
    }

    const { error } = await supabase
      .from("gatologias")
      .update({ votes: next })
      .eq("id", item.id);

    if (error) {
      console.error("❌ Error registrando voto:", error.message);
      setOptimisticVotes((prev) => ({ ...prev, [item.id]: current }));
    }

    setVoting((prev) => ({ ...prev, [item.id]: false }));
  }

  return (
    <div className="wg actividad-widget actividad-widget--wide">
      <div className="wg__head actividad-widget__head">
        <div className="wg__avatar actividad-widget__avatar">🌌</div>
        <div>
          <h3 className="wg__title">Actividad Colectiva</h3>
          <p className="wg__subtitle">
            Resonancias públicas y piezas con PIN de la comunidad.
          </p>
        </div>
      </div>

      <div className="actividad-widget__body">
        <section className="actividad-widget__section" aria-label="Frases compartidas por la comunidad">
          <header className="actividad-widget__section-head">
            <h4>Frases compartidas</h4>
            <span>{frasesCompartidas.length} activas</span>
          </header>
          <div className="actividad-widget__scroll">
            {frasesCompartidas.length === 0 ? (
              <p className="actividad-widget__empty">Aún no hay frases públicas. Comparte desde Comunidad en Voz Alta.</p>
            ) : (
              <ul className="actividad-widget__list">
                {frasesCompartidas.map((item) => {
                  const votos = optimisticVotes[item.id] ?? item.votes ?? 0;
                  return (
                    <li key={item.id} className="actividad-widget__card">
                      <header className="actividad-widget__card-head">
                        <div className="actividad-widget__chip">
                          <span className="actividad-widget__chip-icon">✒️</span>
                          <span>{item.personajeNombre}</span>
                        </div>
                        {item.created_at && (
                          <time aria-hidden="true">
                            {new Intl.DateTimeFormat("es-MX", {
                              dateStyle: "medium",
                            }).format(new Date(item.created_at))}
                          </time>
                        )}
                      </header>
                      <p className="actividad-widget__content">
                        {item.contenido?.slice(0, MAX_PREVIEW)}
                        {item.contenido && item.contenido.length > MAX_PREVIEW ? "…" : ""}
                      </p>
                      <footer className="actividad-widget__footer">
                        <button
                          type="button"
                          className="actividad-widget__vote"
                          onClick={() => handleVote(item)}
                          aria-label="Votar esta frase compartida"
                          disabled={voting[item.id]}
                        >
                          🔮 {votos}
                        </button>
                      </footer>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </section>

        <section className="actividad-widget__section" aria-label="Blogs destacados con PIN">
          <header className="actividad-widget__section-head">
            <h4>Blogs destacados</h4>
            <span>{blogsDestacados.length} con PIN</span>
          </header>
          <div className="actividad-widget__scroll">
            {blogsDestacados.length === 0 ? (
              <p className="actividad-widget__empty">Nadie ha fijado blogs todavía. Marca tus textos con PIN desde el compendio.</p>
            ) : (
              <ul className="actividad-widget__list actividad-widget__list--grid">
                {blogsDestacados.map((item) => {
                  const votos = optimisticVotes[item.id] ?? item.votes ?? 0;
                  return (
                    <li key={`blog-${item.id}`} className="actividad-widget__card actividad-widget__card--blog">
                      <header className="actividad-widget__card-head">
                        <div className="actividad-widget__chip actividad-widget__chip--blog">
                          <span className="actividad-widget__chip-icon">📌</span>
                          <span>{item.personajeNombre}</span>
                        </div>
                        {item.created_at && (
                          <time aria-hidden="true">
                            {new Intl.DateTimeFormat("es-MX", {
                              dateStyle: "short",
                            }).format(new Date(item.created_at))}
                          </time>
                        )}
                      </header>
                      <h5 className="actividad-widget__title">{item.titulo}</h5>
                      <p className="actividad-widget__content">
                        {item.contenido?.slice(0, MAX_PREVIEW)}
                        {item.contenido && item.contenido.length > MAX_PREVIEW ? "…" : ""}
                      </p>
                      <footer className="actividad-widget__footer">
                        <button
                          type="button"
                          className="actividad-widget__vote"
                          onClick={() => handleVote(item)}
                          aria-label="Votar este blog destacado"
                          disabled={voting[item.id]}
                        >
                          🔮 {votos}
                        </button>
                        {item.enlace && (
                          <a
                            href={item.enlace}
                            className="actividad-widget__link"
                            target="_blank"
                            rel="noreferrer"
                          >
                            Abrir publicación →
                          </a>
                        )}
                      </footer>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </section>
      </div>

      <div className="actividad-widget__meta">
        {combinedIds.size} publicaciones vibrando ahora mismo.
      </div>
    </div>
  );
}
