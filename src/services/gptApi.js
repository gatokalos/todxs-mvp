import React, { useState } from "react";
import { comentarConGato } from "./services/gatoApi";

export default function GatoComentarioUI() {
  const [frase, setFrase] = useState("");
  const [comentario, setComentario] = useState("");
  const [loading, setLoading] = useState(false);

  const handleEnviar = async () => {
    setLoading(true);
    try {
      const resp = await comentarConGato("la-maestra", frase);
      setComentario(resp);
    } catch (err) {
      setComentario("😿 Error al obtener comentario del Gato");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2>Habla con el Gato</h2>
      <textarea
        value={frase}
        onChange={(e) => setFrase(e.target.value)}
        placeholder="Escribe algo..."
      />
      <button onClick={handleEnviar} disabled={loading}>
        {loading ? "Esperando al Gato..." : "Enviar"}
      </button>

      {comentario && (
        <div className="comentario-gato">
          <strong>🐾 El Gato:</strong> {comentario}
        </div>
      )}
    </div>
  );
}