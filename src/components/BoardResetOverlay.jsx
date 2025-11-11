import { useEffect } from "react";
import "./BoardResetOverlay.css";

const ANIMATION_DURATION = 3100;

export default function BoardResetOverlay({ pieces, onComplete }) {
  useEffect(() => {
    if (!pieces || pieces.length === 0) return;
    const timeout = setTimeout(() => {
      onComplete?.();
    }, ANIMATION_DURATION);
    return () => clearTimeout(timeout);
  }, [pieces, onComplete]);

  if (!pieces || pieces.length === 0) return null;

  return (
    <div className="board-reset-overlay" aria-hidden="true">
      {pieces.map(({ index, jugador }) => {
        const row = Math.floor(index / 3) + 1;
        const col = (index % 3) + 1;
        return (
          <span
            key={`reset-piece-${index}-${jugador}`}
            className={`board-reset-piece board-reset-piece--${jugador}`}
            style={{ gridColumn: col, gridRow: row }}
          >
            {jugador}
          </span>
        );
      })}
    </div>
  );
}
