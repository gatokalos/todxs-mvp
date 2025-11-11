// src/components/OnboardingPlay.jsx
import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import useGameStore from '../store/useGameStore';

// Paleta (ajústala a tu tono real si quieres que coincida 1:1 con tus SVGs)
const COLORS = {
  lagrima: "#D9C4F3",
  esfera:  "#F9B4D4",
  garra:   "#F9A374",
};

// Texto de la escena negra (se escribe/borra en loop)
const TYPELINES = [
  "Donde X es el trazo sobre el escenario, la marca de una decisión.",
  "La O es el vacío, la pausa dramática, la posibilidad.",
  "No se trata de ganar, sino de fluir."
];

// Acciones que dispara el botón ▶ (X → O → fin)
const BOARD_ACTIONS = [
  { kind: "place", player: "X", cell: 5 }, 
  { kind: "place", player: "O", cell: 7 }, 
  { kind: "done" }
];

export default function OnboardingPlay() {
  const setScreen = useGameStore((s) => s.setScreen);

  const [phase, setPhase] = useState(0);      // 0:portadas, 1:escena, 2:glitch, 3:cortina
  const [coverIndex, setCoverIndex] = useState(0); 
  const [typed, setTyped] = useState("");     
  const [typeLineIdx, setTypeLineIdx] = useState(0);
  const [board, setBoard] = useState(Array(9).fill(null)); 
  const [actionIdx, setActionIdx] = useState(0);
  const [lifting, setLifting] = useState(false); 

  // === 1) PORTADAS DE COLOR ===
  const covers = useMemo(() => [
    { id:"cover-lagrima", color: COLORS.lagrima, text:"Hola. Soy una IA. Me llamo Gato Enigmático y te invito a leer una historia jamás contada." },
    { id:"cover-esfera",  color: COLORS.esfera,  text:"Lo digo literal: aquí las historias no se escriben; se eligen, se cruzan y toman vida." },
    { id:"cover-garra",   color: COLORS.garra,   text:"Es como tener un dispositivo de improvisación con la primera frase que lees." },
  ], []);

  // === 2) TYPE → ERASE LOOP (escena negra) ===
  useEffect(() => {
    if (phase !== 1) return;
    const full = TYPELINES[typeLineIdx];
    let i = 0;
    let dir = 1; // 1 escribe, -1 borra
    const tick = () => {
      i += dir;
      if (i < 0) { 
        dir = 1;
        setTypeLineIdx((x) => (x + 1) % TYPELINES.length);
        i = 0;
      } else if (i > full.length) { 
        dir = -1;
      }
      const next = full.slice(0, Math.max(0, Math.min(full.length, i)));
      setTyped(next);
    };
    const handle = setInterval(tick, 30);
    return () => clearInterval(handle);
  }, [phase, typeLineIdx]);

  // CONTROLES
  const nextCover = () => {
    if (phase !== 0) return;
    if (coverIndex < covers.length - 1) setCoverIndex((v) => v + 1);
    else setPhase(1); // pasa a escena negra
  };

  const triggerBoardAction = () => {
    if (phase !== 1) return;
    const action = BOARD_ACTIONS[actionIdx];
    if (!action) return;

    if (action.kind === "place") {
      setBoard((prev) => {
        if (prev[action.cell]) return prev;
        const copy = prev.slice();
        copy[action.cell] = { player: action.player };
        return copy;
      });
      setActionIdx((i) => i + 1);
    } else if (action.kind === "done") {
      setPhase(2);
      setActionIdx(0);
    }
  };

  const goGlitchToCurtain = () => setPhase(3);
  const openCurtain = () => {
    setLifting(true);
    setTimeout(() => setScreen("selector"), 800); 
  };

  return (
    <div style={{ position:"fixed", inset:0, background:"#000" }}>
      <ProgressDots phase={phase} covers={covers.length} />

      <AnimatePresence mode="wait">
        {/* PORTADAS */}
        {phase === 0 && (
          <CoverSlide
            key={covers[coverIndex].id}
            color={covers[coverIndex].color}
            text={covers[coverIndex].text}
            onNext={nextCover}
          />
        )}

        {/* ESCENA NEGRA */}
        {phase === 1 && (
          <motion.div
            key="scene"
            initial={{ opacity:0 }}
            animate={{ opacity:1 }}
            exit={{ opacity:0 }}
            className="scene"
            style={{
              position:"absolute", inset:0, display:"grid",
              gridTemplateRows:"auto 1fr auto", padding:"24px"
            }}
          >
            <div style={{ textAlign:"center", color:"#fff", fontSize:"clamp(20px,4vw,32px)", fontWeight:800, fontFamily:"Arial Rounded MT Bold, system-ui" }}>
              {typed}
            </div>

            <div style={{ display:"grid", placeItems:"center" }}>
              <BoardView board={board} />
            </div>

            <div style={{ display:"flex", justifyContent:"center", gap:12 }}>
              <button onClick={triggerBoardAction} style={btnStyle}>▶</button>
            </div>
          </motion.div>
        )}

        {/* GLITCH */}
        {phase === 2 && (
          <GlitchSlide key="glitch" onEnd={goGlitchToCurtain} />
        )}

        {/* CORTINA */}
        {phase === 3 && (
          <CurtainSlide key="curtain" lifting={lifting} onOpen={openCurtain} />
        )}
      </AnimatePresence>
    </div>
  );
}

/* ---------- Subcomponentes ---------- */

function CoverSlide({ color, text, onNext }) {
  return (
    <motion.div
      initial={{ opacity:0, scale:0.98 }}
      animate={{ opacity:1, scale:1 }}
      exit={{ opacity:0, scale:0.98 }}
      transition={{ duration:0.5 }}
      style={{
        position:"absolute", inset:0, background:color,
        display:"grid", placeItems:"center", padding:"24px"
      }}
      onClick={onNext}
    >
      <div style={{
        color:"#000", textAlign:"center",
        fontFamily:"Arial Rounded MT Bold, system-ui",
        fontWeight:800, lineHeight:1.25,
        fontSize:"clamp(20px,5vw,36px)", maxWidth:720
      }}>
        {text}
      </div>
      <div style={{ position:"absolute", bottom:24, left:0, right:0, textAlign:"center", color:"rgba(0,0,0,.6)" }}>
        toca para continuar
      </div>
    </motion.div>
  );
}

function BoardView({ board }) {
  return (
    <div style={{
      width:"min(88vw, 520px)", aspectRatio:"1/1",
      display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:"16px"
    }}>
      {Array.from({length:9}).map((_,i) => {
        const mark = board[i]?.player ?? null;
        return (
          <div key={i} style={{
            borderRadius:24,
            background:"rgba(255,255,255,0.06)",
            display:"grid", placeItems:"center"
          }}>
            <span style={{
              color:"rgba(255,255,255,0.85)",
              fontFamily:"Arial Rounded MT Bold, system-ui",
              fontSize:"clamp(24px,6vw,40px)", fontWeight:800
            }}>{mark ?? ""}</span>
          </div>
        );
      })}
    </div>
  );
}

function GlitchSlide({ onEnd }) {
  useEffect(() => {
    const t = setTimeout(onEnd, 800);
    return () => clearTimeout(t);
  }, [onEnd]);

  return (
    <motion.div
      initial={{ opacity:0 }}
      animate={{ opacity:[0,1,0.3,1,0.4,1] }}
      exit={{ opacity:0 }}
      transition={{ duration:0.8, ease:"easeInOut" }}
      style={{ position:"absolute", inset:0, background:"#000" }}
    >
      <div style={{
        position:"absolute", inset:0,
        backgroundImage:"url(/assets/glitch.png)",
        backgroundSize:"cover", backgroundPosition:"center",
        mixBlendMode:"screen", opacity:0.9
      }}/>
    </motion.div>
  );
}

function CurtainSlide({ lifting, onOpen }) {
  return (
    <motion.div
      initial={{ opacity:0 }}
      animate={{ opacity:1 }}
      exit={{ opacity:0 }}
      style={{ position:"absolute", inset:0, background:"#000" }}
    >
      <motion.div
        animate={{ height: lifting ? 0 : "100%" }}
        transition={{ duration:0.8, ease:"easeInOut" }}
        style={{
          position:"absolute", left:0, right:0, top:0, height:"100%",
          backgroundImage:"url(/assets/curtain.jpg)",
          backgroundSize:"cover", backgroundPosition:"center",
        }}
      />
      {!lifting && (
        <div style={{ position:"absolute", inset:0, display:"grid", placeItems:"center" }}>
          <button onClick={onOpen} style={btnStyle}>¿Le entras?</button>
        </div>
      )}
    </motion.div>
  );
}

function ProgressDots({ phase, covers }) {
  const total = covers + 3;
  const active = Math.min(phase + (phase===0?0: (phase===1?1: (phase===2?2:3))), total-1);
  return (
    <div style={{ position:"absolute", top:12, left:0, right:0, display:"flex", gap:6, justifyContent:"center" }}>
      {Array.from({length:total}).map((_,i)=>(
        <div key={i} style={{
          width: i===active ? 38 : 26, height: 4, borderRadius: 4,
          background: i<=active ? "rgba(255,255,255,.95)" : "rgba(255,255,255,.25)",
          transition:"all .25s"
        }}/>
      ))}
    </div>
  );
}

const btnStyle = {
  background:"#111", color:"#fff", border:"none",
  borderRadius:12, padding:"12px 18px",
  fontFamily:"Arial Rounded MT Bold, system-ui", fontWeight:800,
  cursor:"pointer", fontSize:"18px", boxShadow:"0 6px 16px rgba(0,0,0,.35)"
};