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
        <img src="/assets/atril.png" alt="Atril" className="lectern-stage__atril" />
        <div className="lectern-stage__panel">
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
            Guardar en el Camerino
          </button>
        </div>
      </div>
    </div>
  );
}
