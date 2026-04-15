import { useEffect, useState } from "react";
import "./LecternStage.css";

export default function LecternStage({
  active,
  genero,
  titulo,
  lines = [],
  loading = false,
  error = null,
  onSave,
  ctaLabel = "Guardar en el Camerino",
}) {
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    if (!active) {
      setEntered(false);
      return;
    }
    const raf = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(raf);
  }, [active]);

  if (!active) return null;

  return (
    <div className="lectern-stage" role="dialog" aria-modal="true">
      <div className={`lectern-stage__track${entered ? " is-active" : ""}`}>
        <img src="/assets/atril.png" alt="" aria-hidden="true" className="lectern-stage__atril" />
        <span className="lectern-stage__genre">{genero}</span>
        <h2 className="lectern-stage__title">{titulo}</h2>
        <div className="lectern-stage__body">
          {loading ? (
            <p className="lectern-stage__status">Generando texto...</p>
          ) : (
            lines.map((line, idx) => (
              <p key={`${idx}-${line.slice(0, 12)}`}>{line}</p>
            ))
          )}
          {!loading && error ? (
            <p className="lectern-stage__status">Se usó un texto de respaldo.</p>
          ) : null}
        </div>
        <button
          type="button"
          className="lectern-stage__cta"
          onClick={onSave}
          disabled={loading}
        >
          {ctaLabel}
        </button>
      </div>
    </div>
  );
}
