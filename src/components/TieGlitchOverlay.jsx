import { useEffect, useMemo, useState } from "react";
import frasesData from "../data/frases.json";
import glitchTransp from "/assets/glitch-transp.png";
import "./TieGlitchOverlay.css";

const ITEM_COUNT = 90;
const DEFAULT_DURATION_MS = 1400;

const buildPool = (data) =>
  [
    ...(data?.nucleo || []),
    ...(data?.verbos || []),
    ...(data?.conceptos || []),
  ].filter(Boolean);

export default function TieGlitchOverlay({
  active,
  onComplete,
  duration = DEFAULT_DURATION_MS,
}) {
  const pool = useMemo(() => buildPool(frasesData), []);
  const [items, setItems] = useState([]);

  useEffect(() => {
    if (!active) return;
    const nextItems = Array.from({ length: ITEM_COUNT }).map((_, index) => {
      const isPhrase = Math.random() < 0.18 && pool.length > 0;
      const content = isPhrase
        ? pool[Math.floor(Math.random() * pool.length)]
        : Math.random() > 0.5
          ? "X"
          : "O";
      const size = isPhrase
        ? "clamp(14px, 2.2vmin, 20px)"
        : "clamp(20px, 4vmin, 34px)";
      return {
        id: `tie-${index}-${Date.now()}`,
        content,
        isPhrase,
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
        size,
        opacity: isPhrase ? 1 : 0.75,
        duration: `${1.4 + Math.random() * 1.4}s`,
        delay: `${Math.random() * 0.6}s`,
      };
    });
    setItems(nextItems);
  }, [active, pool]);

  useEffect(() => {
    if (!active) return;
    if (!duration || duration <= 0) return;
    const timer = setTimeout(() => {
      onComplete?.();
    }, duration);
    return () => clearTimeout(timer);
  }, [active, duration, onComplete]);

  if (!active) return null;

  return (
    <div className="tie-glitch-overlay" aria-hidden="true">
      <div className="tie-glitch-chaos">
        {items.map((item) => (
          <span
            key={item.id}
            className={`tie-glitch-symbol${item.isPhrase ? " is-phrase" : ""}`}
            style={{
              left: item.left,
              top: item.top,
              fontSize: item.size,
              opacity: item.opacity,
              animationDuration: item.duration,
              animationDelay: item.delay,
            }}
          >
            {item.content}
          </span>
        ))}
      </div>
      <div className="tie-glitch-strobe">
        <img src={glitchTransp} alt="" />
      </div>
    </div>
  );
}
