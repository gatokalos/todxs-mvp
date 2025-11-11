// src/hooks/useSpotlightOverlay.js
import { useRef, useEffect, useState } from "react";

export function useSpotlightOverlay(isOpen) {
  const frameRef = useRef(null);
  const [clipPath, setClipPath] = useState(null);

  useEffect(() => {
    if (!isOpen) return;

    const update = () => {
      const r = frameRef.current?.getBoundingClientRect();
      if (!r) { setClipPath(null); return; }
      const { top, left, width, height } = r;
      setClipPath(`polygon(
        0 0, 100% 0, 100% 100%, 0 100%,
        0 ${top}px, ${left}px ${top}px,
        ${left}px ${top+height}px,
        ${left+width}px ${top+height}px,
        ${left+width}px ${top}px,
        0 ${top}px
      )`);
    };

    update();
    const ro = new ResizeObserver(update);
    if (frameRef.current) ro.observe(frameRef.current);
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, { passive: true });

    return () => {
      ro.disconnect();
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update);
    };
  }, [isOpen]);

  return { frameRef, clipPath };
}