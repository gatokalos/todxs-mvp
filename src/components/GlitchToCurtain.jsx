// src/components/GlitchToCurtain.jsx
import { useEffect, useState } from "react";
import "./GlitchToCurtain.css";

export default function GlitchToCurtain({ onFinish }) {
  const [phase, setPhase] = useState("transp");

  useEffect(() => {
    const t1 = setTimeout(() => setPhase("fijo"), 2000);
    const t2 = setTimeout(() => setPhase("curtainGlitch"), 4000);
    const t3 = setTimeout(() => setPhase("curtainPlain"), 6000);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, []);

  useEffect(() => {
    if (phase === "curtainPlain") {
      const t4 = setTimeout(() => {
        if (onFinish) onFinish();
      }, 2000);
      return () => clearTimeout(t4);
    }
  }, [phase, onFinish]);

  return (
    <div className="glitch-curtains">
      <img src="/assets/glitch-transp.png" className={`layer transp ${phase}`} />
      <img src="/assets/glitch-fijo.png" className={`layer fijo ${phase}`} />
      <img src="/assets/curtain-glitch.png" className={`layer curtainGlitch ${phase}`} />
      <img src="/assets/curtain-plain.png" className={`layer curtainPlain ${phase}`} />
    </div>
  );
}