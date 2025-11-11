import { useState, useEffect } from "react";

export default function useTypewriter(text = "", speed = 100, delay = 0) {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!text) {
      setDisplayed("");
      setDone(true);
      return;
    }

    let i = 0;
    setDisplayed(""); // reset limpio
    setDone(false);

    const startTimer = setTimeout(() => {
      const interval = setInterval(() => {
        setDisplayed((prev) => {
          // ✅ calculamos el nuevo texto usando slice, no acumulando manualmente
          const next = text.slice(0, i + 1);
          return next;
        });
        i++;

        if (i >= text.length) {
          clearInterval(interval);
          setDone(true);
        }
      }, speed);
    }, delay);

    return () => clearTimeout(startTimer);
  }, [text, speed, delay]);

  return { displayed, done };
}