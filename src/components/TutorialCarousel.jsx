// src/components/TutorialCarousel.jsx
import { useState, useEffect, useRef, useCallback } from "react";
import useGameStore from "../store/useGameStore";

// Assets
import glitchTransp from "/assets/glitch-transp.png";
import curtainPlain from "/assets/curtain-plain.png";
import "./TutorialCarousel.css";
import frasesData from "../data/frases.json";

export default function TutorialCarousel() {
  const setScreen = useGameStore((s) => s.setScreen);


// Estados
const [step, setStep] = useState(0);
const [subStep, setSubStep] = useState(0);
const [open, setOpen] = useState(false);
const [isTransitioning, setIsTransitioning] = useState(false);
const [marks, setMarks] = useState([]); // 👈 marcas fantasma
const audioCtxRef = useRef(null);

const getAudioCtx = useCallback(() => {
  if (typeof window === "undefined") return null;
  const Ctx = window.AudioContext || window.webkitAudioContext;
  if (!Ctx) return null;
  if (!audioCtxRef.current) {
    audioCtxRef.current = new Ctx();
  } else if (audioCtxRef.current.state === "suspended") {
    audioCtxRef.current.resume().catch(() => {});
  }
  return audioCtxRef.current;
}, []);

const playCasillaPop = useCallback(() => {
  const ctx = getAudioCtx();
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  const bp = ctx.createBiquadFilter();
  const now = ctx.currentTime;
  osc.type = "sine";
  osc.frequency.setValueAtTime(220 + Math.random() * 60, now);
  bp.type = "bandpass";
  bp.frequency.value = 900 + Math.random() * 400;
  bp.Q.value = 6;
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.04, now + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);
  osc.connect(bp).connect(gain).connect(ctx.destination);
  osc.start(now);
  osc.stop(now + 0.22);
}, [getAudioCtx]);

// Hook para abrir el telón automáticamente
useEffect(() => {
  if (step === 6) {
    const t = setTimeout(() => setOpen(true), 50);
    return () => clearTimeout(t);
  }
}, [step]);

// Pop sutil cuando se explica la casilla (ASMR-ish)
useEffect(() => {
  if (step === 1) {
    playCasillaPop();
  }
}, [step, playCasillaPop]);

// Hook para registrar SOLO la revelación original de X y O
useEffect(() => {
  if (step !== 3) return;

  if (subStep === 1) {
    setMarks((m) => [...m, { symbol: "X", row: 2, col: 2 }]);
  }
  if (subStep === 2) {
    setMarks((m) => [...m, { symbol: "O", row: 3, col: 2 }]);
  }
}, [subStep, step]);

// Navegación
const next = () => {
  if (step === 3) {
    if (subStep < 7) {
      setSubStep(subStep + 1);
      return;
    } else {
      setStep(5); // saltamos al glitch
      setSubStep(0);
      return;
    }
  }

  if (step === 5) {
    // glitch → transición al telón
    handleClick();
    return;
  }

  if (step < 6) {
    setStep(step + 1);
  }
};

const skip = () => setScreen("gameboard");

// Glitch → telón
const handleClick = () => {
  setIsTransitioning(true);
  setTimeout(() => {
    setStep(6); // pasamos al telón
  }, 1000); // dura 1s la transición
};
  return (
    <div
      onClick={next}
      style={{
        height: "100vh",
        width: "100vw",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        color: step <= 2 ? "#292929ff" : "#fff",
        fontFamily: "'Arial Rounded MT Bold', system-ui",
        background:
          step === 0
            ? "#D9C4F3"
            : step === 1
            ? "#F9B4D4"
            : step === 2
            ? "#F9A374"
            : "#222222ff",
        position: "relative",
        overflow: "hidden",
        cursor: "pointer",
      }}
    >
      {/* Botón Saltar demo */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          skip();
        }}
        style={{
          position: "absolute",
          top: 16,
          right: 16,
          background: "#555",
          color: "#fff",
          border: "none",
          padding: "8px 14px",
          borderRadius: "8px",
          cursor: "pointer",
        }}
      >
        Saltar demo
      </button>

      {/* Slides intro */}
      {step === 0 && (
        <h2>
          Aquí no escribes la historia. La improvisas…
        </h2>
      )}
      {step === 1 && (
        <h2>
          Cada casilla es un pie escénico.</h2>
      )}
      {step === 2 && (
        <h2>
          Tú decides si el aplauso se queda… o se va.
        </h2>
      )}
{/* === Negro / Torre con cuadrícula === */}
{step === 3 && (
  <>
    {/* Grid exclusivo para shapes */}
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gridTemplateRows: "1.5fr 1fr 1fr auto",
        rowGap: "4vh",
        width: "min(50vw, 400px)",
        height: "min(70vh, 600px)",
        margin: "0 auto",
        position: "relative",
        placeItems: "center",
        overflow: "visible",
      }}
    >
      {/* Garra */}
      <img
        src="/assets/garra.svg"
        alt="garra"
        style={{
          gridColumn: 2,
          gridRow: 1,
          width: "12.5vh",
          height: "12.5vh",
          alignSelf: "end",
          transformOrigin: "50% 100%",
          transform:
            subStep === 1
              ? "translateX(100%) scale(1.35)" // revelatorio
              : subStep === 3
              ? "translate(-100%, 100%) scale(1.35)" // diagonal ↘
              : subStep === 4
              ? "translate(100%, 100%) scale(1.35)" // diagonal ↙
              : subStep === 5
              ? "translate(0, 200%) scale(1.35)" // horizontal baja
              : "scale(1.35)",
          transition: "all 0.8s ease-in-out",
        }}
      />

      {/* Esfera rosa */}
      <div
        style={{
          gridColumn: 2,
          gridRow: 2,
          width: "10vh",
          height: "10vh",
          borderRadius: "50%",
          background: "#F9B4D4",
          transform:
            subStep === 1
              ? "translateX(-100%)"
              : subStep === 3
              ? "translate(0, -100%)"
              : subStep === 4
              ? "translate(0, -100%)"
              : subStep === 5
              ? "translate(-100%, 0)"
              : "translate(0, 0)",
          transition: "all 0.8s ease-in-out",
          zIndex: 2,
          position: "relative",
        }}
      />

      {/* X */}
      {subStep >= 1 && (
        <span
          style={{
            gridColumn: 2,
            gridRow: 2,
            fontSize: "5vh",
            fontWeight: "bold",
            color: "#fff",
            position: "relative",
            zIndex: 1,
            transition: "opacity 600ms ease",
            opacity: subStep >= 2 ? 0 : 1,
            pointerEvents: "none",
          }}
        >
          X
        </span>
      )}

      {/* Esfera naranja */}
      <div
        style={{
          gridColumn: 2,
          gridRow: 3,
          width: "10vh",
          height: "10vh",
          borderRadius: "50%",
          background: "#F9A374",
          transform:
            subStep === 2
              ? "translateX(-100%)"
              : subStep === 3
              ? "translate(100%, -100%)"
              : subStep === 4
              ? "translate(-100%, -100%)"
              : subStep === 5
              ? "translate(0, -200%)"
              : "translate(0, 0)",
          transition: "all 0.8s ease-in-out",
          zIndex: 2,
          position: "relative",
          opacity: subStep >= 7 ? 0 : 1,
        }}
      />

      {/* O con fade */}
      {subStep >= 2 && (
        <span
          style={{
            gridColumn: 2,
            gridRow: 3,
            fontSize: "5vh",
            fontWeight: "bold",
            color: "#fff",
            position: "relative",
            zIndex: 1,
            transition: "opacity 600ms ease",
            opacity: subStep >= 3 ? 0 : 1,
            pointerEvents: "none",
          }}
        >
          O
        </span>
      )}
    </div>

    {/* === Texto narrativo libre del grid === */}
    {subStep === 0 && (
      <div className="texto-narrativo">
        <h2>Solo tienes que jugar un gato.</h2>
      </div>
    )}
    {subStep === 1 && (
      <div className="texto-narrativo">
        <h2>X es decisión.</h2>
      </div>
    )}
    {subStep === 2 && (
      <div className="texto-narrativo">
        <h2>O es la posibilidad.</h2>
      </div>
    )}
    {subStep >= 3 && (
      <div className="texto-narrativo especial">
        <h2>No ganas por estrategia. Ganas si se te queda grabada la frase.</h2>
      </div>
    )}
  </>
)}

      {/* Chaos + Glitch emergente */}
      {subStep >= 3 && (
        <div
          className="chaos-layer"
          style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
          }}
        >
          {Array.from({
            length: subStep >= 7 ? 120 : subStep >= 6 ? 90 : 60,
          }).map((_, i) => {
            let pool;
            if (subStep === 4) pool = frasesData.nucleo;
            else if (subStep === 5) pool = frasesData.verbos;
            else if (subStep === 6) pool = frasesData.conceptos;
            else
              pool = [
                ...frasesData.nucleo,
                ...frasesData.verbos,
                ...frasesData.conceptos,
              ];

            const isFrase = Math.random() < 0.15;
            const content = isFrase
              ? pool[Math.floor(Math.random() * pool.length)]
              : Math.random() > 0.5
              ? "X"
              : "O";

            return (
              <span
                key={i}
                className="chaos-symbol"
                style={{
                  position: "absolute",
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  fontSize: isFrase ? "18px" : "24px",
                  fontWeight: isFrase ? "600" : "400",
                  opacity: isFrase ? 1 : 0.6,
                  animation: `float ${1 + Math.random()}s infinite alternate`,
                }}
              >
                {content}
              </span>
            );
          })}

          {/* Glitch aparece sobre el caos */}
          {subStep >= 7 && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                zIndex: 50,
                animation: "fadeIn 1s ease forwards",
              }}
            >
              <img
                src={glitchTransp}
                alt="glitch transp"
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  animation: "glitchStrobe 1s infinite",
                  mixBlendMode: "color dodge",
                }}
              />
            </div>
          )}
        </div>
      )}
{/* === Glitch con Channel Shift RGB (SEGUNDO GLITCH) === */}
{step === 5 && (
  <div
    className={`glitch-container ${isTransitioning ? "cutting" : ""}`}
    onClick={() => {
      setIsTransitioning(true);
      setTimeout(() => {
        setStep(6);   // pasamos al telón
        setOpen(false); // 👈 aseguramos que empiece cerrado
      }, 1200); // duración total del glitch RGB
    }}
    style={{
      position: "relative",
      width: "100%",
      height: "100%",
      cursor: "pointer",
      overflow: "hidden",
    }}
  >

    {/* Capas RGB */}
    <img src={glitchTransp} alt="glitch base" className="glitch-base" />
    <img src={glitchTransp} alt="glitch rojo" className="glitch-red" />
    <img src={glitchTransp} alt="glitch azul" className="glitch-blue" />
  </div>
)}

    {/* === Telón === */}
    {step === 6 && (
      <div className={`telon ${open ? "open" : ""}`}>
        <div className="telon-left"></div>
        <div className="telon-right"></div>
        {/* El contenido va aquí, pero no las cortinas */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            flexDirection: "column",
          }}
        >
          <img
            src="/assets/curtain-plain.png"
            alt="dummy telon"
            style={{
              height: "100vh",
              width: "auto",
              objectFit: "contain",
            }}
          />
          <button
            className="entrar-btn"
            style={{ marginTop: "20px" }}
            onClick={(e) => {
              e.stopPropagation();
              setScreen("selector");
            }}
          >
            ¿Quieres jugar?
          </button>
        </div>
      </div>
    )}
      {/* Indicador de progreso */}
      <div
        style={{
          position: "absolute",
          bottom: 20,
          left: "50%",
          transform: "translateX(-50%)",
          display: "flex",
          gap: "8px",
        }}
      >
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            style={{
              width: 40,
              height: 4,
              borderRadius: 2,
              background: i === step ? "#fff" : "rgba(255,255,255,0.3)",
              transition: "background 0.3s",
            }}
          />
        ))}
      </div>
    </div>
  );
}
