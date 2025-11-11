import React, { useState, useEffect } from "react";

export default function FraseDelDiaWidget() {
  const [frase, setFrase] = useState(null);

  useEffect(() => {
    async function fetchFrase() {
      try {
        const res = await fetch("https://bienvenida.gatoencerrado.ai/api/todxs/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            personaje: "La Maestra",
            frases: ["El conocimiento no se enseña, se contagia."],
          }),
        });
        const data = await res.json();
        setFrase(data);
      } catch {
        setFrase({ titulo: "Reflexión del Gato", contenido: "Hoy, el silencio también enseña." });
      }
    }
    fetchFrase();
  }, []);

  return (
    <div className="wg wg--live">
      <div className="wg__head">
        <div className="wg__avatar">✨</div>
        <div>
          <h3 className="wg__title">Frase del día</h3>
          <p className="wg__subtitle">Por el Gato Enigmático</p>
        </div>
      </div>
      <div className="wg__body">
        {frase ? (
          <>
            <h4>{frase.titulo}</h4>
            <p>{frase.contenido}</p>
          </>
        ) : (
          <p>Cargando...</p>
        )}
      </div>
    </div>
  );
}