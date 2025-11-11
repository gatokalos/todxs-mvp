import React, { useMemo } from "react";
import { isEntryOwnedBy, resolveUserId } from "../../../utils/gatologiaUtils";
import "./HuellaWidget.css";

export default function HuellaWidget({ gatologias = [], user, globalStats = {} }) {
  const personales = useMemo(
    () => gatologias.filter((entry) => isEntryOwnedBy(entry, user)),
    [gatologias, user]
  );

  const simbolo =
    personales.length > 6 ? "🌕" : personales.length > 3 ? "🌗" : personales.length > 0 ? "🌘" : "🌑";

  const userId = resolveUserId(user);
  const universoTotal = globalStats.totalFrases ?? gatologias.length ?? 0;

  return (
    <div className="wg huella-widget">
      <div className="wg__head huella-widget__head">
        <div className="wg__avatar huella-widget__avatar">{simbolo}</div>
        <div>
          <h3 className="wg__title">Huella Literaria</h3>
          <p className="wg__subtitle">Tu paso deja señales para futuras constelaciones.</p>
        </div>
      </div>

      <div className="huella-widget__body">
        <div className="huella-widget__stat">
          <span className="huella-widget__label">Huellas personales</span>
          <strong className="huella-widget__value">{personales.length}</strong>
        </div>
        <div className="huella-widget__stat">
          <span className="huella-widget__label">Huella colectiva</span>
          <strong className="huella-widget__value">{universoTotal}</strong>
        </div>
        <div className="huella-widget__meta">
          <span>Identificador activo:</span>
          <code>{userId || "anónimo"}</code>
        </div>
      </div>
    </div>
  );
}
