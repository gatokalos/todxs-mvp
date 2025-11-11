import { useEffect } from "react";
import { createPortal } from "react-dom";
import "./SpotlightOverlay.css";

export default function SpotlightOverlay({ children, onClose }) {
  useEffect(() => {
    const body = document.body;
    const prevOverflow = body.style.overflow;
    const prevPosition = body.style.position;
    const prevTop = body.style.top;
    const prevWidth = body.style.width;
    const scrollY = window.scrollY;

    body.classList.add("has-spotlight-overlay");
    body.style.overflow = "hidden";
    body.style.position = "fixed";
    body.style.top = `-${scrollY}px`;
    body.style.width = "100%";

    return () => {
      body.classList.remove("has-spotlight-overlay");
      body.style.overflow = prevOverflow;
      body.style.position = prevPosition;
      body.style.top = prevTop;
      body.style.width = prevWidth;
      window.scrollTo({ top: scrollY, left: 0 });
    };
  }, []);

  return createPortal(
    <div className="spotlight-overlay" role="dialog" aria-modal="true">
      <div className="spotlight-overlay__backdrop" onClick={onClose} />
      <div className="spotlight-overlay__content">{children}</div>
    </div>,
    document.body
  );
}
