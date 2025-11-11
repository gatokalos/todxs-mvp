import React, { useEffect, useRef, useState } from "react";
import "./ReflexionGatoWidget.css";

const DEFAULT_REFLEXION = {
  titulo: "Reflexión en espera",
  texto: "El Gato Enigmático está afilando sus palabras. Intenta generar una nueva reflexión.",
};

export default function ReflexionGatoWidget() {
  const [reflexion, setReflexion] = useState(DEFAULT_REFLEXION);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const aliveRef = useRef(true);

  useEffect(() => {
    aliveRef.current = true;
    const controller = new AbortController();

    async function load() {
      await generarNuevaReflexion({ signal: controller.signal });
    }

    load();
    return () => {
      aliveRef.current = false;
      controller.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function generarNuevaReflexion({ signal } = {}) {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/todxs/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ personaje: "Gato Enigmático" }),
        signal,
      });

      if (!response.ok) {
        throw new Error(`Respuesta ${response.status}`);
      }

      const data = await response.json();
      if (!aliveRef.current) return;
      setReflexion({
        titulo: data?.titulo || "Reflexión del Gato",
        texto: data?.texto || data?.contenido || DEFAULT_REFLEXION.texto,
      });
    } catch (err) {
      console.error("❌ Error generando reflexión:", err);
      if (!aliveRef.current) return;
      setError("El gato se escurrió entre las sombras. Intenta otra vez.");
      setReflexion(DEFAULT_REFLEXION);
    } finally {
      if (aliveRef.current) setLoading(false);
    }
  }

  const handleClick = () => {
    aliveRef.current = true;
    generarNuevaReflexion();
  };

  return (
    <div className="wg reflexion-gato-widget">
      <div className="wg__head reflexion-gato-widget__head">
        <div className="wg__avatar reflexion-gato-widget__avatar">🐾</div>
        <div>
          <h3 className="wg__title">Reflexión del Gato</h3>
          <p className="wg__subtitle">Mensajes efímeros desde el escenario.</p>
        </div>
      </div>

      <div className="reflexion-gato-widget__body">
        {loading ? (
          <p className="reflexion-gato-widget__status">El Gato Enigmático está hilando palabras...</p>
        ) : (
          <>
            <h4>{reflexion.titulo}</h4>
            <p>{reflexion.texto}</p>
          </>
        )}
        {error && <p className="reflexion-gato-widget__error">{error}</p>}
      </div>

      <div className="wg__actions">
        <button
          type="button"
          className="btn btn--ghost"
          onClick={handleClick}
          aria-label="Generar una nueva reflexión del Gato Enigmático"
          disabled={loading}
        >
          ↻ Generar nueva reflexión
        </button>
      </div>
    </div>
  );
}
