// src/components/CustomEndingModal.jsx
import React, { useState } from "react";
import "./CustomEndingModal.css"; // 🎨 Estilo personalizado si lo deseas

export default function CustomEndingModal({
  fraseBase,
  onSubmit,
  onClose,
}) {
  const [remate, setRemate] = useState("");

  const handleSubmit = () => {
    if (remate.trim() === "") return;
    onSubmit(`${fraseBase} ${remate}`);
    setRemate("");
  };

  return (
    <div className="custom-ending-modal">
      <div className="modal-content">
        <h2>🐾 Has ganado con tres X</h2>
        <p>Ahora puedes escribir el remate final de esta frase:</p>

        <blockquote className="frase-base">"{fraseBase}"</blockquote>

        <textarea
          placeholder="Escribe aquí tu remate literario..."
          value={remate}
          onChange={(e) => setRemate(e.target.value)}
          rows={3}
        />

        <div className="modal-buttons">
          <button onClick={handleSubmit} disabled={!remate.trim()}>
            ✅ Confirmar
          </button>
          <button onClick={onClose}>❌ Cancelar</button>
        </div>
      </div>
    </div>
  );
}