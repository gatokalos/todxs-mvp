import React, { useState, useEffect, useRef } from "react";
import "./SpeechBubbleModal.css";

export default function SpeechBubbleModal({
  opciones,
  titulo,
  onSelect,
  onClose,
  tailCoords,            // sí lo usas
  creativeMode = false,  // sí
  onConfirmCreative,     // sí
  tiempoLimite = 10,     // sí
}) {

  const [remate, setRemate] = useState("");
  const [countdown, setCountdown] = useState(tiempoLimite);
  const contentRef = useRef(null); // 👈 referencia al scroll interno

  // Scroll automático al entrar en modo creativo
  useEffect(() => {
    if (creativeMode && contentRef.current) {
      contentRef.current.scrollTo({
        top: contentRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [creativeMode]);

  // Timer ⏳
  useEffect(() => {
    if (!creativeMode) return;

    setCountdown(tiempoLimite);
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleConfirm();
          return 0;
        }
        return prev - 1;
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [creativeMode, tiempoLimite]);

  // Línea 51 aprox. en SpeechBubbleModal.jsx
const handleConfirm = () => {
  const remateLimpio = (remate || "").trim();
  onConfirmCreative(remateLimpio);
  onClose();
};

  if (!creativeMode && !opciones?.length) return null;

  return (
    <div className="speech-bubble-container">
      <div className="speech-bubble">
        {/* HEADER fijo */}
        <div className="speech-header">
          <strong>{titulo}</strong>
          <button className="btn-close" onClick={onClose}>✕</button>
        </div>

        {/* CONTENIDO scrollable */}
        <div className="speech-content" ref={contentRef}>
          {opciones?.length > 0 && (
            <div className="speech-options-block">
              <ul className="speech-options">
                {opciones.map((op, idx) => (
                  <li key={idx} onClick={() => onSelect(op)}>{op}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Colita consentida */}
      {tailCoords?.x1 && (
        <svg className="speech-tail" xmlns="http://www.w3.org/2000/svg">
          <polygon
            points={`${tailCoords.x1},${tailCoords.y1} ${tailCoords.x2},${tailCoords.y2} ${tailCoords.x3},${tailCoords.y3}`}
            fill="#bbb"
          />
        </svg>
      )}

          {creativeMode && (
            <div className="speech-creative-block">
              <p className="speech-instruction">
                Has ganado con tres X 🐾 — Escribe tu remate creativo
              </p>
              <div className="digital-timer">
                {countdown.toString().padStart(2, "0")}
              </div>
              <textarea
                className="speech-textarea"
                placeholder="Escribe aquí tu final creativo..."
                value={remate}
                onChange={(e) => setRemate(e.target.value)}
              />
              <div className="speech-actions">
                <button onClick={handleConfirm} disabled={!remate.trim()}>
                  ✔️ Confirmar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}