import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "../../../lib/supabaseClient";
import {
  getPersonajeDisplay,
  isEntryOwnedBy,
  resolveOwnerId,
  resolveUserId,
} from "../../../utils/gatologiaUtils";
import "./ComunidadWidget.css";

const MAX_PREVIEW = 160;

export default function ComunidadWidget({ gatologias = [], user, personajes = [] }) {
  const [shareMode, setShareMode] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [updating, setUpdating] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [shareStatus, setShareStatus] = useState({});

  const recentEntries = useMemo(() => {
    return gatologias
      .filter((entry) => entry?.contenido)
      .slice()
      .sort((a, b) => new Date(b?.created_at || 0) - new Date(a?.created_at || 0))
      .slice(0, 14)
      .map((entry) => ({
        ...entry,
        ...getPersonajeDisplay(personajes, entry.personaje_slug),
      }));
  }, [gatologias, personajes]);

  const personalEntries = useMemo(() => {
    return recentEntries.filter((entry) => isEntryOwnedBy(entry, user));
  }, [recentEntries, user]);

  useEffect(() => {
    const defaults = {};
    personalEntries.forEach((entry) => {
      defaults[entry.id] = Boolean(entry.is_public);
    });
    setShareStatus(defaults);
    if (!selectedId && personalEntries.length > 0) {
      setSelectedId(personalEntries[0].id);
    }
  }, [personalEntries, selectedId]);

  useEffect(() => {
    if (!feedback) return;
    const timer = setTimeout(() => setFeedback(null), 3200);
    return () => clearTimeout(timer);
  }, [feedback]);

  const selectedEntry = personalEntries.find((entry) => entry.id === selectedId) || null;
  const userId = resolveUserId(user);
  const hasEntries = personalEntries.length > 0;

  async function togglePublic(targetId, nextValue) {
    if (!targetId) return;
    setUpdating(true);
    setShareStatus((prev) => ({ ...prev, [targetId]: nextValue }));

    if (!supabase) {
      console.warn("⚠️ Supabase no configurado. Marcamos solo en memoria.");
      setFeedback(nextValue ? "Marcada como compartida (modo local)." : "Marcada como privada (modo local).");
      setUpdating(false);
      return;
    }

    const { error } = await supabase
      .from("gatologias")
      .update({ is_public: nextValue, shared_at: nextValue ? new Date().toISOString() : null })
      .eq("id", targetId);

    if (error) {
      console.error("❌ Error actualizando is_public:", error.message);
      setShareStatus((prev) => ({ ...prev, [targetId]: !nextValue }));
      setFeedback("No pudimos actualizar la frase. Intenta más tarde.");
    } else {
      setFeedback(nextValue ? "Tu frase ahora vibra en el tablero colectivo." : "La frase volvió a ser privada.");
    }
    setUpdating(false);
  }

  return (
    <div className="wg comunidad-widget">
      <div className="wg__head comunidad-widget__head">
        <div className="wg__avatar comunidad-widget__icon">📣</div>
        <div>
          <h3 className="wg__title">Comunidad en Voz Alta</h3>
          <p className="wg__subtitle">Escucha, selecciona y comparte sin salir del panel.</p>
        </div>
      </div>

      <div className="comunidad-widget__body">
        <div className="comunidad-widget__scroll" role="list">
          {recentEntries.length === 0 ? (
            <p className="comunidad-widget__empty">La comunidad aún no ha dejado huella.</p>
          ) : (
            recentEntries.map((entry) => {
              const isMine = isEntryOwnedBy(entry, user);
              const isPublic = isMine ? shareStatus[entry.id] ?? entry.is_public : entry.is_public;
              return (
                <article
                  key={entry.id}
                  className={`comunidad-widget__item ${isPublic ? "comunidad-widget__item--public" : ""}`}
                  aria-label={`Frase de ${entry.nombre}`}
                >
                  <div className="comunidad-widget__item-head">
                    <span className="comunidad-widget__personaje">{entry.nombre}</span>
                    <span className="comunidad-widget__owner">
                      {isMine ? "Tu voz" : resolveOwnerId(entry) ? "Comunidad" : "Anónima"}
                    </span>
                  </div>
                  <p className="comunidad-widget__texto">
                    {entry.contenido.slice(0, MAX_PREVIEW)}
                    {entry.contenido.length > MAX_PREVIEW ? "…" : ""}
                  </p>
                  <footer className="comunidad-widget__meta">
                    {isPublic ? "Compartida" : "Privada"}
                    {entry.created_at && (
                      <time>
                        {new Intl.DateTimeFormat("es-MX", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        }).format(new Date(entry.created_at))}
                      </time>
                    )}
                  </footer>
                </article>
              );
            })
          )}
        </div>

        <button
          type="button"
          className="btn btn--ghost comunidad-widget__share-btn"
          onClick={() => setShareMode((prev) => !prev)}
          aria-expanded={shareMode}
        >
          📣 Compartir en el tablero de Gatologías
        </button>

        {shareMode && (
          <div className="comunidad-widget__share-panel" aria-live="polite">
            <header>
              <h4>Selecciona una frase para compartir</h4>
              <p>
                Usamos tu identificador{" "}
                <code>{userId || "anónimo"}</code> para compartirla en el tablero colectivo.
              </p>
            </header>

            {hasEntries ? (
              <>
                <label className="comunidad-widget__label" htmlFor="comunidad-share-select">
                  Tus frases recientes
                </label>
                <select
                  id="comunidad-share-select"
                  className="comunidad-widget__select"
                  value={selectedId || ""}
                  onChange={(event) => setSelectedId(event.target.value)}
                  disabled={updating}
                >
                  {personalEntries.map((entry) => (
                    <option key={entry.id} value={entry.id}>
                      {entry.contenido.slice(0, 52)}
                      {entry.contenido.length > 52 ? "…" : ""}
                    </option>
                  ))}
                </select>

                <div className="comunidad-widget__share-actions">
                  <button
                    type="button"
                    className="btn btn--ok"
                    onClick={() => togglePublic(selectedId, true)}
                    disabled={!selectedId || updating}
                    aria-label="Marcar la frase seleccionada como pública"
                  >
                    ✅ Marcar como pública
                  </button>
                  <button
                    type="button"
                    className="btn btn--ghost"
                    onClick={() => togglePublic(selectedId, false)}
                    disabled={!selectedId || updating || !shareStatus[selectedId]}
                    aria-label="Retirar la frase seleccionada del tablero público"
                  >
                    ↩︎ Volver a privado
                  </button>
                </div>

                {selectedEntry && (
                  <blockquote className="comunidad-widget__preview">
                    “{selectedEntry.contenido}”
                  </blockquote>
                )}
              </>
            ) : (
              <p className="comunidad-widget__empty comunidad-widget__empty--inline">
                Aún no registramos frases tuyas en este universo. Escribe o guarda una para compartirla aquí.
              </p>
            )}
          </div>
        )}

        {feedback && <p className="comunidad-widget__feedback">{feedback}</p>}
      </div>
    </div>
  );
}
