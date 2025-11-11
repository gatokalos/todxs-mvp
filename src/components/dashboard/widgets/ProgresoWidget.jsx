import React, { useMemo } from "react";
import { isEntryOwnedBy, isAdminUser, resolveUserId } from "../../../utils/gatologiaUtils";
import "./ProgresoWidget.css";

const FALLBACK_STATS = { totalFrases: 0, totalPersonajes: 0, totalAutores: 0 };

export default function ProgresoWidget({ gatologias = [], user, globalStats = FALLBACK_STATS }) {
  const personalEntries = useMemo(
    () => gatologias.filter((entry) => isEntryOwnedBy(entry, user)),
    [gatologias, user]
  );

  const personalPersonajes = useMemo(() => {
    const set = new Set(personalEntries.map((entry) => entry?.personaje_slug).filter(Boolean));
    return set.size;
  }, [personalEntries]);

  const universoPersonajes = Math.max(globalStats.totalPersonajes ?? 0, personalPersonajes, 1);
  const universoAutores = Math.max(globalStats.totalAutores ?? 1, 1);
  const universoFrases = globalStats.totalFrases ?? gatologias.length ?? 0;
  const promedioColectivo = universoAutores > 0 ? universoFrases / universoAutores : 0;

  const maxFrases = Math.max(promedioColectivo, personalEntries.length, 1);
  const maxPersonajes = Math.max(universoPersonajes, personalPersonajes, 1);

  const adminVisible = isAdminUser(user);
  const userId = resolveUserId(user);
  const potentialUsername =
    user?.user_metadata?.username ||
    user?.username ||
    user?.user?.user_metadata?.username ||
    null;

  return (
    <div className="wg progreso-widget" aria-label="Progreso del universo gatológico">
      <div className="wg__head progreso-widget__head">
        <div className="wg__avatar">🧭</div>
        <div>
          <h3 className="wg__title">Progreso del Universo</h3>
          <p className="wg__subtitle">
            Tu viaje y el pulso colectivo en números vivos.
          </p>
        </div>
      </div>

      <div className="wg__body progreso-widget__body">
        <section className="progreso-widget__section">
          <header>
            <h4>Frases creadas</h4>
            <p>
              Tú: <strong>{personalEntries.length}</strong> · Promedio colectivo:{" "}
              <strong>{promedioColectivo.toFixed(1)}</strong>
            </p>
          </header>
          <div className="progreso-widget__bars" role="presentation">
            <div className="progreso-widget__bar">
              <span className="progreso-widget__bar-label">Personal</span>
              <div className="progreso-widget__track" aria-hidden="true">
                <div
                  className="progreso-widget__fill progreso-widget__fill--personal"
                  style={{ width: `${(personalEntries.length / maxFrases) * 100}%` }}
                />
              </div>
            </div>
            <div className="progreso-widget__bar">
              <span className="progreso-widget__bar-label">Promedio</span>
              <div className="progreso-widget__track" aria-hidden="true">
                <div
                  className="progreso-widget__fill progreso-widget__fill--colectivo"
                  style={{ width: `${(promedioColectivo / maxFrases) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </section>

        <section className="progreso-widget__section">
          <header>
            <h4>Personajes explorados</h4>
            <p>
              Tú: <strong>{personalPersonajes}</strong> · Universo:{" "}
              <strong>{universoPersonajes}</strong>
            </p>
          </header>
          <div className="progreso-widget__bars" role="presentation">
            <div className="progreso-widget__bar">
              <span className="progreso-widget__bar-label">Personal</span>
              <div className="progreso-widget__track" aria-hidden="true">
                <div
                  className="progreso-widget__fill progreso-widget__fill--personal"
                  style={{ width: `${(personalPersonajes / maxPersonajes) * 100 || 0}%` }}
                />
              </div>
            </div>
            <div className="progreso-widget__bar">
              <span className="progreso-widget__bar-label">Universo</span>
              <div className="progreso-widget__track" aria-hidden="true">
                <div
                  className="progreso-widget__fill progreso-widget__fill--colectivo"
                  style={{ width: `${(universoPersonajes / maxPersonajes) * 100 || 0}%` }}
                />
              </div>
            </div>
          </div>
        </section>

        <div className="progreso-widget__meta">
          <span>
            Total de frases en el universo: <strong>{universoFrases}</strong>
          </span>
          <span>
            Autores activos detectados: <strong>{globalStats.totalAutores}</strong>
          </span>
        </div>

        {adminVisible && (
          <div className="progreso-widget__admin" data-admin-only="true">
            <span>
              ID visible: <code>{userId || "sin-registro"}</code>
            </span>
            <span>
              username reservado: <code>{potentialUsername || "—"}</code>
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
