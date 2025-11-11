import { useEffect, useState } from "react";
import "./FadeOverlay.css";

export default function FadeOverlay({ isActive, duration = 600 }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isActive) {
      setVisible(true);
    } else {
      // Espera el tiempo del fade antes de desmontar
      const timeout = setTimeout(() => setVisible(false), duration);
      return () => clearTimeout(timeout);
    }
  }, [isActive, duration]);

  if (!visible) return null;

  return (
    <div
      className={`fade-overlay ${isActive ? "fade-in" : "fade-out"}`}
      style={{ transitionDuration: `${duration}ms` }}
    >
      <img
    src="/assets/logoapp.png"
    alt="Watermark"
    className="watermark-logo"
    />
    </div>
  );
}