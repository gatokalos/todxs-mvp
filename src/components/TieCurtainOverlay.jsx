import { useEffect, useState } from "react";
import "./TieCurtainOverlay.css";

const CLOSE_DURATION_MS = 900;

export default function TieCurtainOverlay({ active, onClosed }) {
  const [closed, setClosed] = useState(false);

  useEffect(() => {
    if (!active) {
      setClosed(false);
      return;
    }
    const raf = requestAnimationFrame(() => setClosed(true));
    const timer = setTimeout(() => {
      onClosed?.();
    }, CLOSE_DURATION_MS);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(timer);
    };
  }, [active, onClosed]);

  if (!active) return null;

  return (
    <div className={`tie-curtains${closed ? " is-closed" : ""}`} aria-hidden="true">
      <div className="tie-curtains__panel tie-curtains__panel--left" />
      <div className="tie-curtains__panel tie-curtains__panel--right" />
    </div>
  );
}
