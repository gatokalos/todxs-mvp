// src/components/GameBoard.jsx
import { useState, useEffect, useRef, useCallback } from "react";
import useGameStore from "../store/useGameStore";
import { supabase } from "../lib/supabaseClient";
import { api } from "../services/api";
import SpeechBubbleModal from "./SpeechBubbleModal";
import PersonajeMenu from "./PersonajeMenu";
import VictoryEffect from "./VictoryEffect";
import BoardResetOverlay from "./BoardResetOverlay";
import "./GameBoard.css";
import useTypewriter from "../hooks/useTypewriter";
import personajesData from "../data/personajes.json";

const DEFAULT_RITMO_FRASE = {
  base_x: "\\n",
  x_o: "\\n",
  x_creativa: "\\n",
};

const normalizeConnector = (text) => {
  if (typeof text !== "string") return null;
  return text.replace(/\n/g, "\\n");
};

const pickConnector = (value, keys) => {
  for (const key of keys) {
    const raw = normalizeConnector(value?.[key]);
    if (typeof raw === "string") return raw;
  }
  return null;
};

const sanitizeRitmoFrase = (value) => {
  if (!value || typeof value !== "object") return { ...DEFAULT_RITMO_FRASE };
  return {
    base_x: pickConnector(value, ["base_x", "baseX", "base"]) ?? DEFAULT_RITMO_FRASE.base_x,
    x_o: pickConnector(value, ["x_o", "xo", "between", "xO"]) ?? DEFAULT_RITMO_FRASE.x_o,
    x_creativa:
      pickConnector(value, ["x_creativa", "xCreativa", "creativa", "creative"]) ??
      DEFAULT_RITMO_FRASE.x_creativa,
  };
};

const ensureText = (value) => (typeof value === "string" ? value : "");
const toDisplayText = (text = "") => text.replace(/\\n/g, "\n");
const renderConnector = (connector = "") => ensureText(connector).replace(/\\n/g, "\n");

const getPrefijoCasilla = (tablero, index, jugador) => {
  if (!Number.isInteger(index)) return null;
  const casilla = Array.isArray(tablero) ? tablero[index] : null;
  if (!casilla || typeof casilla !== "object") return null;
  return jugador === "X" ? casilla.prefijo_X : casilla.prefijo_O;
};

const buildLinea = ({ jugador, palabra, casillaIndex, prefijos, sufijos, tablero }) => {
  if (!palabra) return "";
  const prefijoBase = jugador === "X" ? prefijos?.X : prefijos?.O;
  const prefijoCasilla = getPrefijoCasilla(tablero, casillaIndex, jugador);
  const prefijo = ensureText(prefijoCasilla ?? prefijoBase);
  const sufijoBase = jugador === "X" ? sufijos?.X : sufijos?.O;
  const sufijo = ensureText(sufijoBase);
  return `${prefijo}${palabra}${sufijo}`;
};

const joinWithConnector = (current, next, connector = DEFAULT_RITMO_FRASE.base_x) => {
  if (!next) return current;
  if (!current) return next;
  return `${current}${connector}${next}`;
};

const composeFraseRaw = (
  base,
  lineaX,
  lineaTercera,
  ritmo = DEFAULT_RITMO_FRASE,
  usarCreativo = false
) => {
  let resultado = ensureText(base);
  if (lineaX) {
    resultado = joinWithConnector(resultado, lineaX, ritmo.base_x);
  }
  if (lineaTercera) {
    const conector = usarCreativo ? ritmo.x_creativa : ritmo.x_o;
    resultado = joinWithConnector(resultado, lineaTercera, conector);
  }
  return resultado;
};

// assets
import Garra from "/assets/garra.svg";
import Esfera from "/assets/esfera.svg";
import Lagrima from "/assets/esfera2.svg";

const O_THINK_DELAY_MS = 1400;
const TYPE_TICK_SPEED = 90;

export default function GameBoard() {
  const {
    personajeActual,
    jugadas,
    turno,
    registrarJugada,
    guardarFraseFinal,
    setFraseBase,
    fraseBase,
    resetFraseActual,
    palabraX,
    palabraO,
    ultimaCasillaX,
    ultimaCasillaO,
    reiniciarTablero,
    nivelActual,
    setNivelActual,
    actualizarJugada,
  } = useGameStore();

  useEffect(() => {
    console.log("GameBoard personajeActual:", personajeActual);
  }, [personajeActual]);

  const personajeActivoRef = useRef(personajeActual);
  personajeActivoRef.current = personajeActual;

  // --- estado UX / UI ---
  const [respuestaCreativa, setRespuestaCreativa] = useState("");
  const [fraseFinal, setFraseFinal] = useState("");
  const [fraseParcial, setFraseParcial] = useState("");
  const [generando, setGenerando] = useState(false); // NEW: bloquea doble llamada

  const [victory, setVictory] = useState(null);
  const [victoryActive, setVictoryActive] = useState(false);

  const [burbujaAbierta, setBurbujaAbierta] = useState(null);
  const [tailCoords, setTailCoords] = useState(null);
  const [mensajePersonaje, setMensajePersonaje] = useState(null);
  const [mensajeAnimado, setMensajeAnimado] = useState(""); // 👈 nuevo estado animado
  const [animando, setAnimando] = useState(false);
  const [resetOverlayPieces, setResetOverlayPieces] = useState([]);
  const [phraseResetting, setPhraseResetting] = useState(false);
  const [boardReady, setBoardReady] = useState(true);
  const [animateEntry, setAnimateEntry] = useState(false);
  const resetCallbackRef = useRef(null);
  const entryTimeoutRef = useRef(null);
  const [ghostCell, setGhostCell] = useState(null);
  const ghostIntervalRef = useRef(null);
  const thinkTimeoutRef = useRef(null);
  const [menuAlternativasAbierto, setMenuAlternativasAbierto] = useState(false);
  const [alternativasAbucheo, setAlternativasAbucheo] = useState([]);
  const [palabraOriginalAbucheo, setPalabraOriginalAbucheo] = useState(null);
  const [shouldOpenCreativeModal, setShouldOpenCreativeModal] = useState(false);

  // --- Estado local alimentado por Supabase ---
  const [nombreVisible, setNombreVisible] = useState("");
  const [icono, setIcono] = useState("");
  const [prefijos, setPrefijos] = useState({ X: "", O: "" });
  const [sufijos, setSufijos] = useState({ X: "", O: "" });
  const [tituloModal, setTituloModal] = useState({ X: "", O: "" });
  const [tablero, setTablero] = useState([]);
  const [msgsX, setMsgsX] = useState([]);
  const [msgsO, setMsgsO] = useState([]);
  const [frasesVictoria, setFrasesVictoria] = useState([]);
  const [ritmoFrase, setRitmoFrase] = useState({ ...DEFAULT_RITMO_FRASE });
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionMessage, setTransitionMessage] = useState("");
  const transitionTimeoutRef = useRef(null);
  const transitionStartTimeoutRef = useRef(null);
  const closeBubbleTimeoutRef = useRef(null);
  const pendingAutoORef = useRef(false);

  const stopGhostCursor = useCallback(() => {
    if (ghostIntervalRef.current) {
      clearInterval(ghostIntervalRef.current);
      ghostIntervalRef.current = null;
    }
    setGhostCell(null);
  }, []);

  const clearThinkTimeout = useCallback(() => {
    if (thinkTimeoutRef.current) {
      clearTimeout(thinkTimeoutRef.current);
      thinkTimeoutRef.current = null;
    }
  }, []);

  // --- Sonido (sin assets: Web Audio sutil) ---
  const audioCtxRef = useRef(null);
  const typeProgressRef = useRef(0);
  const typeOProgressRef = useRef(0);
  const thinkOscRef = useRef(null);
  const thinkGainRef = useRef(null);
  const asmrPadRef = useRef(null);
  const noiseBufferRef = useRef(null);

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

  const getNoiseBuffer = useCallback(() => {
    if (noiseBufferRef.current) return noiseBufferRef.current;
    const ctx = getAudioCtx();
    if (!ctx) return null;
    const buffer = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let pink = 0;
    for (let i = 0; i < data.length; i++) {
      const white = Math.random() * 2 - 1;
      pink = 0.97 * pink + 0.03 * white; // filtro simple para ruido rosa
      data[i] = pink * 0.9;
    }
    noiseBufferRef.current = buffer;
    return buffer;
  }, [getAudioCtx]);

  const playTypeTick = useCallback(() => {
    const ctx = getAudioCtx();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const now = ctx.currentTime;
    osc.type = "triangle";
    osc.frequency.setValueAtTime(340 + Math.random() * 120, now);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(0.02, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.09);
    osc.connect(gain).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.12);
  }, [getAudioCtx]);

  const playTypeTickO = useCallback(() => {
    const ctx = getAudioCtx();
    if (!ctx) return;

    const master = ctx.createGain();
    const osc = ctx.createOscillator();
    const now = ctx.currentTime;

    osc.type = "sine";
    osc.frequency.setValueAtTime(230 + Math.random() * 70, now);

    const noiseBuffer = getNoiseBuffer();
    let noise = null;
    let bp = null;
    let noiseGain = null;
    if (noiseBuffer) {
      noise = ctx.createBufferSource();
      noise.buffer = noiseBuffer;
      noise.loop = false;
      bp = ctx.createBiquadFilter();
      bp.type = "bandpass";
      bp.frequency.value = 1300 + Math.random() * 300;
      bp.Q.value = 5;
      noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.0001, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.015, now + 0.01);
      noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);
      noise.connect(bp).connect(noiseGain).connect(master);
    }

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.03, now + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.14);

    osc.connect(gain).connect(master);
    master.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.2);
    if (noise) {
      noise.start(now);
      noise.stop(now + 0.18);
    }
  }, [getAudioCtx, getNoiseBuffer]);

  const playCasillaPop = useCallback(() => {
    const ctx = getAudioCtx();
    if (!ctx) return;
    const master = ctx.createGain();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const bp = ctx.createBiquadFilter();
    const now = ctx.currentTime;
    osc.type = "sine";
    osc.frequency.setValueAtTime(240 + Math.random() * 90, now);
    bp.type = "bandpass";
    bp.frequency.value = 800 + Math.random() * 500;
    bp.Q.value = 6;
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.22, now + 0.012); // 🔊 pop mucho más presente
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);

    const noiseBuffer = getNoiseBuffer();
    if (noiseBuffer) {
      const noise = ctx.createBufferSource();
      const noiseFilter = ctx.createBiquadFilter();
      const noiseGain = ctx.createGain();
      noise.buffer = noiseBuffer;
      noise.loop = false;
      noiseFilter.type = "bandpass";
      noiseFilter.frequency.value = 600 + Math.random() * 600;
      noiseFilter.Q.value = 5.5;
      noiseGain.gain.setValueAtTime(0.0001, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.08, now + 0.01);
      noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);
      noise.connect(noiseFilter).connect(noiseGain).connect(master);
      noise.start(now);
      noise.stop(now + 0.18);
    }

    master.gain.setValueAtTime(0.0001, now);
    master.gain.exponentialRampToValueAtTime(0.95, now + 0.005);
    master.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);

    osc.connect(bp).connect(gain).connect(master).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.2);
  }, [getAudioCtx, getNoiseBuffer]);

  const stopAsmrPad = useCallback(() => {
    const ctx = audioCtxRef.current;
    const nodes = asmrPadRef.current;
    if (!nodes) return;
    const now = ctx?.currentTime || 0;
    nodes.gain?.gain?.exponentialRampToValueAtTime(0.0001, now + 0.2);
    try {
      nodes.source?.stop(now + 0.25);
      nodes.lfo?.stop(now + 0.25);
    } catch {
      /* noop */
    }
    asmrPadRef.current = null;
  }, []);

  const startAsmrPad = useCallback(() => {
    const ctx = getAudioCtx();
    if (!ctx) return;
    stopAsmrPad();
    const buffer = getNoiseBuffer();
    if (!buffer) return;

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    const hp = ctx.createBiquadFilter();
    hp.type = "highpass";
    hp.frequency.value = 120 + Math.random() * 80;

    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 1800 + Math.random() * 400;

    const gain = ctx.createGain();
    const now = ctx.currentTime;
    const target = 0.025 + Math.random() * 0.01;
    const duration = 5.5 + Math.random() * 2.5;
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(target, now + 0.35);
    gain.gain.setValueAtTime(target, now + duration - 0.9);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    const panner = ctx.createStereoPanner();
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.frequency.value = 0.09 + Math.random() * 0.05;
    lfoGain.gain.value = 0.4 + Math.random() * 0.2;
    lfo.connect(lfoGain).connect(panner.pan);

    source
      .connect(hp)
      .connect(lp)
      .connect(gain)
      .connect(panner)
      .connect(ctx.destination);

    source.start(now);
    lfo.start(now);
    source.stop(now + duration + 0.1);
    lfo.stop(now + duration + 0.1);

    asmrPadRef.current = { source, lfo, gain };
  }, [getAudioCtx, getNoiseBuffer, stopAsmrPad]);

  const stopThinkHum = useCallback(() => {
    const ctx = audioCtxRef.current;
    if (thinkOscRef.current && thinkGainRef.current) {
      const now = ctx?.currentTime || 0;
      thinkGainRef.current.gain.exponentialRampToValueAtTime(0.00001, now + 0.08);
      thinkOscRef.current.stop(now + 0.1);
    }
    thinkOscRef.current = null;
    thinkGainRef.current = null;
  }, []);

  const startThinkHum = useCallback(() => {
    const ctx = getAudioCtx();
    if (!ctx) return;
    stopThinkHum();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const now = ctx.currentTime;
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(150, now);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.014, now + 0.25);
    osc.connect(gain).connect(ctx.destination);
    osc.start(now);
    thinkOscRef.current = osc;
    thinkGainRef.current = gain;
  }, [getAudioCtx, stopThinkHum]);

  const playOWithDelay = useCallback(() => {
    pendingAutoORef.current = false;
    const { jugadas: jugadasState, registrarJugada: registrarJugadaState } = useGameStore.getState();
    if (checkWinner(jugadasState)) return;
    const libres = jugadasState
      .map((celda, idx) => (celda ? null : idx))
      .filter((idx) => idx !== null);
    if (!libres.length) return;

    const randomIndex = libres[Math.floor(Math.random() * libres.length)];
    const opcionesO = tablero[randomIndex]?.O || [];
    const palabraIA = opcionesO.length
      ? opcionesO[Math.floor(Math.random() * opcionesO.length)]
      : "...";

    registrarJugadaState(randomIndex, "O", palabraIA);
  }, [tablero]);

  const resetContextState = useCallback(() => {
    resetFraseActual();
    reiniciarTablero();
    setFraseBase("");
    setVictory(null);
    setVictoryActive(false);
    setBurbujaAbierta(null);
    setTailCoords(null);
    setMensajePersonaje(null);
    setMensajeAnimado("");
    setRespuestaCreativa("");
    setFraseFinal("");
    setFraseParcial("");
    setGenerando(false);
    setAnimando(false);
    setResetOverlayPieces([]);
    setPhraseResetting(false);
    setBoardReady(true);
    setMenuAlternativasAbierto(false);
    setAlternativasAbucheo([]);
    setPalabraOriginalAbucheo(null);
    setTransitionMessage("");
    setIsTransitioning(false);
    stopGhostCursor();
    stopThinkHum();
    stopAsmrPad();
    typeOProgressRef.current = 0;
    setShouldOpenCreativeModal(false);
    pendingAutoORef.current = false;
    typeProgressRef.current = 0;
    clearThinkTimeout();

    if (transitionTimeoutRef.current) {
      clearTimeout(transitionTimeoutRef.current);
      transitionTimeoutRef.current = null;
    }
    if (transitionStartTimeoutRef.current) {
      clearTimeout(transitionStartTimeoutRef.current);
      transitionStartTimeoutRef.current = null;
    }
    if (closeBubbleTimeoutRef.current) {
      clearTimeout(closeBubbleTimeoutRef.current);
      closeBubbleTimeoutRef.current = null;
    }
    if (entryTimeoutRef.current) {
      clearTimeout(entryTimeoutRef.current);
      entryTimeoutRef.current = null;
    }
  }, [
    reiniciarTablero,
    resetFraseActual,
    setFraseBase,
    stopGhostCursor,
    clearThinkTimeout,
    stopThinkHum,
    stopAsmrPad,
  ]);

  const prevPersonajeRef = useRef(personajeActual);
  useEffect(() => {
    const previo = prevPersonajeRef.current;
    if (personajeActual && previo && personajeActual !== previo) {
      resetContextState();
    }
    prevPersonajeRef.current = personajeActual;
  }, [personajeActual, resetContextState]);

  const beginTransition = (
    message = "Preparando el siguiente acto...",
    delay = 0
  ) => {
    if (transitionStartTimeoutRef.current) {
      clearTimeout(transitionStartTimeoutRef.current);
      transitionStartTimeoutRef.current = null;
    }
    if (transitionTimeoutRef.current) {
      clearTimeout(transitionTimeoutRef.current);
      transitionTimeoutRef.current = null;
    }
    if (closeBubbleTimeoutRef.current) {
      clearTimeout(closeBubbleTimeoutRef.current);
      closeBubbleTimeoutRef.current = null;
    }

    const start = () => {
      setTransitionMessage(message);
      setIsTransitioning(true);
      setBurbujaAbierta(null);
      setTailCoords(null);
    };

    if (delay > 0) {
      transitionStartTimeoutRef.current = setTimeout(() => {
        start();
        transitionStartTimeoutRef.current = null;
      }, delay);
    } else {
      start();
    }
  };

  const endTransition = (delay = 240) => {
    if (transitionStartTimeoutRef.current) {
      clearTimeout(transitionStartTimeoutRef.current);
      transitionStartTimeoutRef.current = null;
    }
    if (transitionTimeoutRef.current) {
      clearTimeout(transitionTimeoutRef.current);
    }
    transitionTimeoutRef.current = setTimeout(() => {
      setIsTransitioning(false);
      setTransitionMessage("");
      transitionTimeoutRef.current = null;
    }, delay);
  };

  useEffect(() => {
    return () => {
      if (transitionStartTimeoutRef.current) {
        clearTimeout(transitionStartTimeoutRef.current);
      }
      if (transitionTimeoutRef.current) {
        clearTimeout(transitionTimeoutRef.current);
      }
      if (closeBubbleTimeoutRef.current) {
        clearTimeout(closeBubbleTimeoutRef.current);
      }
      if (entryTimeoutRef.current) {
        clearTimeout(entryTimeoutRef.current);
      }
      clearThinkTimeout();
      stopGhostCursor();
      stopThinkHum();
      stopAsmrPad();
    };
  }, [clearThinkTimeout, stopGhostCursor, stopThinkHum, stopAsmrPad]);
  // Modo creativo
  const creativeMode = victory?.winner === "X" && tresCasillasTodasX(jugadas);

  useEffect(() => {
    if (creativeMode) {
      startAsmrPad();
      return () => stopAsmrPad();
    }
    stopAsmrPad();
  }, [creativeMode, startAsmrPad, stopAsmrPad]);

  const baseRawOriginal = ensureText(fraseBase);
  const baseRaw = baseRawOriginal
    .replace(/[\r\n]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const lineaXRaw = palabraX
    ? buildLinea({
        jugador: "X",
        palabra: palabraX,
        casillaIndex: ultimaCasillaX,
        prefijos,
        sufijos,
        tablero,
      })
    : "";
  const lineaORaw = palabraO
    ? buildLinea({
        jugador: "O",
        palabra: palabraO,
        casillaIndex: ultimaCasillaO,
        prefijos,
        sufijos,
        tablero,
      })
    : "";
  const lineaCreativaRaw = respuestaCreativa
    ? buildLinea({
        jugador: "O",
        palabra: respuestaCreativa,
        casillaIndex: ultimaCasillaO,
        prefijos,
        sufijos,
        tablero,
      })
    : lineaORaw;

  const fraseCompuestaRaw = composeFraseRaw(
    baseRaw,
    lineaXRaw,
    creativeMode ? lineaCreativaRaw : lineaORaw,
    ritmoFrase,
    creativeMode
  );
  const fraseCompuestaDisplay = toDisplayText(fraseCompuestaRaw);

  const baseDisplayText = toDisplayText(baseRaw);
  const xSegmentDisplay = lineaXRaw
    ? `${baseRaw ? renderConnector(ritmoFrase.base_x) : ""}${toDisplayText(lineaXRaw)}`
    : "";
  const contenidoPrevioParaO = Boolean(baseRaw || lineaXRaw);
  const oSegmentDisplay = !creativeMode && lineaORaw
    ? `${contenidoPrevioParaO ? renderConnector(ritmoFrase.x_o) : ""}${toDisplayText(lineaORaw)}`
    : "";
  const creativeSegmentDisplay = creativeMode && lineaCreativaRaw
    ? `${contenidoPrevioParaO ? renderConnector(ritmoFrase.x_creativa) : ""}${toDisplayText(lineaCreativaRaw)}`
    : "";

  const { displayed: baseAnimada, done: baseDone } = useTypewriter(
    baseDisplayText,
    TYPE_TICK_SPEED
  );

  const { displayed: xAnimada, done: xDone } = useTypewriter(
    xSegmentDisplay,
    TYPE_TICK_SPEED,
    baseDone ? 0 : 999999
  );

  const { displayed: oAnimada } = useTypewriter(
    !creativeMode ? oSegmentDisplay : "",
    TYPE_TICK_SPEED,
    xDone ? 0 : 999999
  );

  const { displayed: terceraAnimada } = useTypewriter(
    creativeMode ? creativeSegmentDisplay : "",
    TYPE_TICK_SPEED,
    xDone ? 0 : 999999
  );

  const bloqueaClicks =
    !xDone || animando || burbujaAbierta !== null || generando || isTransitioning;


  const shapesArray = [Garra, Garra, Garra, Esfera, Esfera, Esfera, Lagrima, Lagrima, Lagrima];

  // ============ EFECTO SONORO DE TYPEWRITER (solo fase X) ============
  useEffect(() => {
    if (xDone) return;
    const currentLen = `${baseAnimada}${xAnimada}`.length;
    if (currentLen === 0) {
      typeProgressRef.current = 0;
      return;
    }
    if (currentLen > typeProgressRef.current) {
      playTypeTick();
      typeProgressRef.current = currentLen;
    }
  }, [baseAnimada, xAnimada, xDone, playTypeTick]);

  useEffect(() => {
    if (xDone) {
      typeProgressRef.current = `${baseAnimada}${xAnimada}`.length;
    }
  }, [xDone, baseAnimada, xAnimada]);

  // Sonido de tecleo para O (segunda parte)
  useEffect(() => {
    if (creativeMode) return;
    const currentLen = oAnimada.length;
    if (currentLen === 0) {
      typeOProgressRef.current = 0;
      return;
    }
    if (currentLen > typeOProgressRef.current) {
      playTypeTickO();
      typeOProgressRef.current = currentLen;
    }
  }, [oAnimada, creativeMode, playTypeTickO]);

  useEffect(() => {
    if (!creativeMode && oAnimada) {
      typeOProgressRef.current = oAnimada.length;
    }
  }, [creativeMode, oAnimada]);

  // ============ CURSOR FANTASMA (TURNO O) ============
  useEffect(() => {
    const canThink =
      turno === "O" &&
      boardReady &&
      xDone &&
      !victory?.winner &&
      !isTransitioning &&
      !menuAlternativasAbierto &&
      pendingAutoORef.current;

    if (!canThink) {
      stopGhostCursor();
      stopThinkHum();
      return;
    }

    const libres = jugadas
      .map((celda, idx) => (celda ? null : idx))
      .filter((idx) => idx !== null);

    if (!libres.length) {
      stopGhostCursor();
      stopThinkHum();
      return;
    }

    let lastPick = null;
    const pickNext = () => {
      const pool = libres.filter((idx) => idx !== lastPick);
      const choice =
        pool.length > 0
          ? pool[Math.floor(Math.random() * pool.length)]
          : libres[0];
      lastPick = choice;
      setGhostCell(choice);
    };

    pickNext();
    startThinkHum();
    ghostIntervalRef.current = setInterval(pickNext, 240);

    return () => {
      stopGhostCursor();
      stopThinkHum();
    };
  }, [
    turno,
    jugadas,
    boardReady,
    isTransitioning,
    victory,
    menuAlternativasAbierto,
    xDone,
    stopGhostCursor,
    startThinkHum,
    stopThinkHum,
  ]);

  // ============ TIMER DE JUGADA O (después de escribir X) ============
  useEffect(() => {
    const canQueueAutoO =
      turno === "O" &&
      xDone &&
      boardReady &&
      !victory?.winner &&
      !isTransitioning &&
      pendingAutoORef.current;

    if (canQueueAutoO) {
      if (!thinkTimeoutRef.current) {
        thinkTimeoutRef.current = setTimeout(() => {
          thinkTimeoutRef.current = null;
          pendingAutoORef.current = false;
          stopThinkHum();
          stopGhostCursor();
          playOWithDelay();
        }, O_THINK_DELAY_MS);
      }
    } else {
      clearThinkTimeout();
    }
  }, [
    turno,
    xDone,
    boardReady,
    isTransitioning,
    victory,
    playOWithDelay,
    clearThinkTimeout,
    stopGhostCursor,
    stopThinkHum,
  ]);

  // ============ CARGA DE NIVEL ============
  useEffect(() => {
    let cancelled = false;

    async function cargarNivel() {
      const personajeSeguro = personajeActual || "la-maestra";
      if (!supabase || !personajeSeguro || !nivelActual) return;
      if (personajeSeguro !== personajeActivoRef.current) return;

      try {
        const { data, error } = await supabase
          .from("niveles_semanticos")
          .select(
            "nombre_visible, icono, frase_base, prefijos, sufijos, titulo_modal, tablero, mensajes_victoria_x, mensajes_victoria_o, ritmo_frase"
          )
          .eq("personaje_id", personajeSeguro)
          .eq("nivel", nivelActual)
          .limit(1);

        if (error) {
          console.error("❌ Error cargando nivel:", error.message);
          endTransition();
          return;
        }

        const row = Array.isArray(data) ? data[0] : data;
        if (!row) {
          console.error(
            `⚠️ No se encontró nivel ${nivelActual} para ${personajeSeguro}.`
          );
          endTransition();
          return;
        }

        if (Array.isArray(data) && data.length > 1) {
          console.warn(
            `⚠️ Se encontraron ${data.length} filas para ${personajeSeguro} nivel ${nivelActual}. Usando la primera.`
          );
        }

        if (cancelled || personajeActivoRef.current !== personajeSeguro) return;
        setNombreVisible(row?.nombre_visible || "");
        setIcono(row?.icono || "");
        setFraseBase(row?.frase_base || "");
        setPrefijos(row?.prefijos || { X: "", O: "" });
        setSufijos(row?.sufijos || { X: "", O: "" });
        setTablero(Array.isArray(row?.tablero) ? row.tablero : []);
        setMsgsX(Array.isArray(row?.mensajes_victoria_x) ? row.mensajes_victoria_x : []);
        setMsgsO(Array.isArray(row?.mensajes_victoria_o) ? row.mensajes_victoria_o : []);
        setTituloModal(row?.titulo_modal || { X: "", O: "" });
        setRitmoFrase(sanitizeRitmoFrase(row?.ritmo_frase));

        setMensajePersonaje(null);
        setMensajeAnimado(""); // reset animado
        setVictory(null);
        setVictoryActive(false);
        resetFraseActual();
        reiniciarTablero();
        setRespuestaCreativa("");
        setFraseFinal("");
        endTransition();
      } catch (e) {
        console.error("🚨 Error inesperado cargando nivel:", e);
        endTransition();
      }
    }

    cargarNivel();
    return () => {
      cancelled = true;
    };
  }, [personajeActual, nivelActual]);

// ============ DETECCIÓN DE VICTORIA Y MENSAJE ============
useEffect(() => {
  const result = checkWinner(jugadas); // {winner, combo} | null
  const tableroLleno = jugadas.every((j) => j !== null);

  // No hacemos nada si no hay resultado y el tablero no está lleno
  if (!result && !tableroLleno) return;

  if (result) {
    setVictory({ winner: result.winner, cells: result.combo });
    if (result.winner === "X") {
      pendingAutoORef.current = false;
      clearThinkTimeout();
      stopGhostCursor();
      stopThinkHum();
      if (tresCasillasTodasX(jugadas)) {
        setShouldOpenCreativeModal(true);
      }
    }

    // 💬 Mensaje directo desde Supabase (mensajes_victoria_x / mensajes_victoria_o)
    if (result.winner === "X" && msgsX.length) {
      const pick = msgsX[Math.floor(Math.random() * msgsX.length)];
      setMensajePersonaje(pick);
    } else {
      // fallback sin mensaje
      setMensajePersonaje(null);
    }

    // 💥 Si ganó X con tres en línea → abre la burbuja creativa
    if (result.winner === "X" && tresCasillasTodasX(jugadas)) {
      // apertura diferida al terminar typewriter de X
    }
  } 
  else if (tableroLleno && !result) {
    setMensajePersonaje("Empate… prueben otra vez.");
  }
}, [jugadas, msgsX, msgsO, clearThinkTimeout, stopGhostCursor, stopThinkHum]);

  // ============ ANIMACIÓN MENSAJE (TYPEWRITER EFECTO) ============
  useEffect(() => {
    if (!mensajePersonaje) {
      setMensajeAnimado("");
      return;
    }

    let i = 0;
    setMensajeAnimado("");
    const interval = setInterval(() => {
      setMensajeAnimado((prev) => prev + mensajePersonaje[i]);
      i++;
      if (i >= mensajePersonaje.length) clearInterval(interval);
    }, 45);

    return () => clearInterval(interval);
  }, [mensajePersonaje]);

  // activar/desactivar efecto de victoria
  useEffect(() => {
    if (palabraX && (palabraO || creativeMode) && victory?.cells?.length) {
      setVictoryActive(true);
    } else {
      setVictoryActive(false);
    }
  }, [palabraX, palabraO, creativeMode, victory]);

  // Abrir modal creativo solo cuando X terminó de escribir
  useEffect(() => {
    if (!shouldOpenCreativeModal) return;
    if (!xDone) return;
    setBurbujaAbierta(-1);
    setTailCoords(null);
    setShouldOpenCreativeModal(false);
  }, [shouldOpenCreativeModal, xDone]);

  // ============ FRASE PARCIAL ============
  useEffect(() => {
    setFraseParcial(fraseCompuestaDisplay);
  }, [fraseCompuestaDisplay]);

  // ============ COLITA ============
  function calcularColita(cx, cy, modalRect, anchoBase = 60) {
    const modalCenterX = modalRect.left + modalRect.width / 2;
    const modalY = modalRect.top;
    return {
      x1: cx, y1: cy,
      x2: modalCenterX - anchoBase, y2: modalY,
      x3: modalCenterX + anchoBase, y3: modalY,
    };
  }

  const startBoardReset = useCallback((afterReset) => {
    const snapshot = jugadas
      .map((jugada, index) => (jugada ? { index, jugador: jugada.jugador } : null))
      .filter(Boolean);

    if (!snapshot.length) {
      afterReset?.();
      return;
    }

    setPhraseResetting(true);
    setBoardReady(false);
    setResetOverlayPieces(snapshot);
    resetCallbackRef.current = afterReset;
  }, [jugadas]);

  const handleResetOverlayComplete = useCallback(async () => {
    const callback = resetCallbackRef.current;
    resetCallbackRef.current = null;

    if (callback) {
      await callback();
    }

    setResetOverlayPieces([]);
    setPhraseResetting(false);
    setBoardReady(true);
    setAnimateEntry(true);
    if (entryTimeoutRef.current) clearTimeout(entryTimeoutRef.current);
    entryTimeoutRef.current = setTimeout(() => {
      setAnimateEntry(false);
      entryTimeoutRef.current = null;
    }, 700);
  }, []);

  const finalizarTurnoO = () => {
    terminarRonda(checkWinner(jugadas));
  };

  const limpiarMenuAbucheo = () => {
    setMenuAlternativasAbierto(false);
    setAlternativasAbucheo([]);
    setPalabraOriginalAbucheo(null);
  };

  const abrirMenuAbucheo = () => {
    if (!Number.isInteger(ultimaCasillaO)) {
      finalizarTurnoO();
      return;
    }

    const opciones = tablero?.[ultimaCasillaO]?.O || [];
    if (!opciones.length) {
      finalizarTurnoO();
      return;
    }

    setAlternativasAbucheo(opciones);
    setPalabraOriginalAbucheo(palabraO);
    setMenuAlternativasAbierto(true);
  };

  const cerrarMenuAbucheo = (restaurar = false) => {
    if (restaurar && palabraOriginalAbucheo && Number.isInteger(ultimaCasillaO)) {
      actualizarJugada(ultimaCasillaO, "O", palabraOriginalAbucheo);
    }
    limpiarMenuAbucheo();
  };

  const aplicarAlternativaAbucheo = (opcion) => {
    if (!menuAlternativasAbierto) return;
    if (!Number.isInteger(ultimaCasillaO)) return;
    if (!opcion) return;
    actualizarJugada(ultimaCasillaO, "O", opcion);
  };

  const continuarDespuesDeFrase = () => {
    const resultado = checkWinner(jugadas);
    const tableroLleno = jugadas.every((j) => j !== null);
    if (resultado || tableroLleno) {
      finalizarTurnoO();
    } else {
      resetFraseActual();
    }
  };

  const confirmarSalvada = () => {
    limpiarMenuAbucheo();
    continuarDespuesDeFrase();
  };

  // --- confirmar remate creativo ---
  function handleConfirmCreative(remateLimpio) {
    const remate = remateLimpio || palabraO || "";
    const terceraLineaRaw = remate
      ? buildLinea({
          jugador: "O",
          palabra: remate,
          casillaIndex: ultimaCasillaO,
          prefijos,
          sufijos,
          tablero,
        })
      : "";

    const nuevaRaw = composeFraseRaw(
      baseRaw,
      lineaXRaw,
      terceraLineaRaw,
      ritmoFrase,
      true
    );
    const nuevaDisplay = toDisplayText(nuevaRaw);

    setRespuestaCreativa(remateLimpio || "");
    setFraseFinal(nuevaDisplay);

    if (api?.insertEleccion) {
      api
        .insertEleccion({
          personajeId: personajeActual,
          fraseFinal: nuevaRaw,
          usuarioId: null,
          timestamp: new Date().toISOString(),
        })
        .catch((e) => console.warn("⚠️ insertEleccion falló:", e?.message));
    }

    if (closeBubbleTimeoutRef.current) {
      clearTimeout(closeBubbleTimeoutRef.current);
    }
    closeBubbleTimeoutRef.current = setTimeout(() => {
      setBurbujaAbierta(null);
      setTailCoords(null);
      closeBubbleTimeoutRef.current = null;
    }, 3000);
  }

  // ============ INTERACCIÓN ============
  const handleCasillaClick = (index) => {
    if (jugadas[index]) return;

    playCasillaPop();

    const cell = document.querySelectorAll(".casilla")[index];
    if (!cell) return;

    const rect = cell.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;

    setBurbujaAbierta(index);

    setTimeout(() => {
      const modal = document.querySelector(".speech-bubble");
      if (!modal) return;
      const modalRect = modal.getBoundingClientRect();
      setTailCoords(calcularColita(cx, cy, modalRect, 60));
    }, 0);
  };

  const handleSeleccion = (palabra) => {
    registrarJugada(burbujaAbierta, turno, palabra);
    setBurbujaAbierta(null);
    if (turno === "X") {
      clearThinkTimeout();
      const preview = [...jugadas];
      preview[burbujaAbierta] = { jugador: "X", palabra };
      const ganaX = checkWinner(preview)?.winner === "X";
      pendingAutoORef.current = !ganaX;
      if (ganaX) {
        stopThinkHum();
        stopGhostCursor();
      }
    }
  };

// ============ AVANZAR NIVEL O GENERAR GATOLOGÍA FINAL ============
async function terminarRonda(ganador) {
  setAnimando(true);

  const limpiarEstado = () => {
    reiniciarTablero();
    resetFraseActual();
    setRespuestaCreativa("");
    setFraseFinal("");
  };

  const procesarResultado = async () => {
    try {
      if (ganador?.winner === "X") {
        await avanzarNivel();
      }
    } catch (err) {
      console.error("⚠️ Error al avanzar nivel:", err);
      endTransition();
    } finally {
      setVictory(null);
      setVictoryActive(false);
      setAnimando(false);
      if (!ganador || ganador.winner !== "X") {
        endTransition();
      }
    }
  };

  const ejecutarPostAnimacion = async (limpiar = false) => {
    if (limpiar) {
      limpiarEstado();
    }
    await procesarResultado();
  };

  const debeAnimarReset = ganador?.winner === "X" && tresCasillasTodasX(jugadas);

  if (debeAnimarReset && jugadas.some(Boolean)) {
    startBoardReset(() => ejecutarPostAnimacion(true));
  } else {
    setPhraseResetting(false);
    setBoardReady(true);
    setResetOverlayPieces([]);
    await ejecutarPostAnimacion(false);
  }
}

// ============ CONSULTA DEL SIGUIENTE NIVEL ============
async function avanzarNivel() {
  const personajeSnapshot = personajeActivoRef.current || personajeActual || "la-maestra";

  const siguiente = (nivelActual || 1) + 1;

  const { data: siguienteNivel, error } = await supabase
    .from("niveles_semanticos")
    .select("nivel")
    .eq("personaje_id", personajeSnapshot)
    .eq("nivel", siguiente)
    .limit(1);

  if (error) {
    console.error("❌ Error consultando siguiente nivel:", error.message);
    return;
  }

  if (personajeActivoRef.current !== personajeSnapshot) {
    console.warn("⚠️ Cambio de personaje durante avanzarNivel. Se descarta la actualización.");
    return;
  }

  const row = Array.isArray(siguienteNivel) ? siguienteNivel[0] : siguienteNivel;
  const existeSiguiente = Boolean(row);

  if (existeSiguiente) {
    console.log(`📈 Avanzando al nivel ${siguiente}`);
    setNivelActual(siguiente, personajeSnapshot);
    return;
  }

  console.log("🏁 No hay más niveles registrados para este personaje. Generando gatología final...");
  await handleGenerarGatologiaFinal(personajeSnapshot);
}

  const handleAbuchear = () => {
    if (menuAlternativasAbierto) {
      cerrarMenuAbucheo(true);
      return;
    }

    if (!palabraO) {
      return;
    }

    abrirMenuAbucheo();
  };

  const handleAplaudir = async () => {
    if (menuAlternativasAbierto) {
      cerrarMenuAbucheo(false);
    }

    if (!palabraX) return;

    const lineaTerceraRaw = creativeMode ? lineaCreativaRaw : lineaORaw;
    const fraseFinalRaw = composeFraseRaw(
      baseRaw,
      lineaXRaw,
      lineaTerceraRaw,
      ritmoFrase,
      creativeMode
    );
    const fraseFinalDisplay = toDisplayText(fraseFinalRaw);

    const payload = {
      usuarioId: null,
      personajeId: personajeActual,
      fraseBase,
      palabraX,
      palabraO: respuestaCreativa || palabraO || "",
      prefijoX: prefijos.X,
      prefijoO: prefijos.O,
      sufijoX: sufijos.X || "",
      sufijoO: sufijos.O || "",
      fraseFinal: fraseFinalRaw,
      timestamp: new Date().toISOString(),
    };

    setFraseFinal(fraseFinalDisplay);
    guardarFraseFinal(payload);

    try {
      await api.insertEleccion(payload);
    } catch (e) {
      console.error("❌ Error guardando en mock API:", e);
    }

    continuarDespuesDeFrase();
  };

// === Estado del modal final de gatología ===
const [modalGatologia, setModalGatologia] = useState({
  visible: false,
  personaje: "",
  titulo: "",
});


// ============ GENERAR GATOLOGÍA FINAL ============
async function handleGenerarGatologiaFinal(personajeSlug) {
  try {
    setGenerando(true);

    // 🧩 Normalizar slug por si llega con guiones, mayúsculas o espacios
    const safeSlug = personajeSlug?.toLowerCase().trim().replace(/\s+/g, "-");

    const personajeData = personajesData[safeSlug];
    if (!personajeData) {
      console.error("❌ No se encontró data para:", safeSlug, personajesData);
      throw new Error(`No se encontró data para ${safeSlug}`);
    }

    const base = import.meta.env?.VITE_API_BASE_URL || "http://localhost:5050";

    const payload = {
      personaje: { id: safeSlug, ...personajeData },
      frases: [
        fraseBase,
        palabraX ? `${prefijos.X}${palabraX}${sufijos.X || ""}` : "",
        respuestaCreativa || palabraO || "Victoria de X",
      ].filter(Boolean)
    };

    const response = await fetch(`${base}/api/todxs/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    const contenido = data.contenido ?? data.texto;
    if (!contenido) throw new Error("Respuesta inválida del servidor");

    await api.insertGatologia({
      personaje_slug: safeSlug,
      titulo: data.titulo,
      contenido,
      estado: "draft",
      created_at: new Date().toISOString(),
    });

    console.log(`🐾 Gatología generada para ${safeSlug}: “${data.titulo}”`);

    setModalGatologia({
      visible: true,
      personaje: personajeData.nombre,
      titulo: data.titulo,
    });

  } catch (e) {
    console.error("❌ Error generando gatología final:", e.message);
  } finally {
    setGenerando(false);
  }
}

    // ============ RENDER ============
  return (
    <div className="tablero tablero-invertido">
      {isTransitioning && (
        <div className="gameboard-transition-blur" role="status" aria-live="polite">
          <div className="transition-overlay" />
          <div className="transition-text-container">
            <div className="transition-glow" />
            <p className="transition-text">
              {transitionMessage || "El Gato teje las palabras..."}
            </p>
          </div>
        </div>
      )}

      <PersonajeMenu personaje={{ nombreVisible, icono, id: personajeActual }} mensaje={mensajeAnimado} />

      {/* Base → X → (O/tercera) */}
      <div className={`frase-construida ${phraseResetting ? "frase-resetting" : ""}`}>
        <span className="typewriter">
          {baseAnimada}
          {xAnimada}
          {creativeMode ? terceraAnimada : oAnimada}
        </span>
        <span className="cursor">|</span>
      </div>

      {/* Tablero */}
      <div className="tablero-cuadricula">
        {turno === "O" && boardReady && !isTransitioning && (
          <div className="turno-chip turno-chip--o" aria-live="polite">
            <span className="turno-dot" />
            <span className="turno-chip__text">O está eligiendo cómo cerrar la frase...</span>
          </div>
        )}
        <div className={`cuadricula ${bloqueaClicks ? "no-clicks" : ""} ${!boardReady ? "board-hidden" : ""} ${animateEntry ? "board-entry" : ""}`}>
          {tablero.map((_, index) => {
            const fila = Math.floor(index / 3);
            const isGarra = fila === 0;
            const jugada = jugadas[index];
            const mark = jugada ? jugada.jugador : null;
            const isGhosting = turno === "O" && ghostCell === index && !jugada;

            return (
              <div
                key={index}
                className={`casilla ${isGarra ? "garra" : ""} ${jugada ? "ocupada" : ""} ${(palabraX && palabraO) ? "deshabilitada" : ""} ${isGhosting ? "ghosting" : ""}`}
                onClick={() => { if (!(palabraX && palabraO)) handleCasillaClick(index); }}
              >
                {isGarra ? (
                  <img src={Garra} alt="garra" className="garra-img" />
                ) : (
                  <div className="esfera"></div>
                )}
                {isGhosting && (
                  <div className="ghost-cursor" aria-hidden="true">
                    <span className="ghost-cursor__spark" />
                  </div>
                )}
                {mark && (
                  <span className={`marca ${mark === "X" ? "marca-x" : "marca-o"}`}>{mark}</span>
                )}
              </div>
            );
          })}
        </div>
        <BoardResetOverlay pieces={resetOverlayPieces} onComplete={handleResetOverlayComplete} />

        <div className="hub-botones">
          <button
            className={`btn-icono ${!(palabraX && (palabraO || creativeMode)) ? "oculto" : ""}`}
            onClick={handleAbuchear}
            title="Abuchear (elige otro remate)"
          >
            <img src="/assets/abuchea.png" alt="Abuchear" />
          </button>
          <button
            className={`btn-icono ${!(palabraX && (palabraO || creativeMode)) ? "oculto" : ""}`}
            onClick={handleAplaudir}
            title="Aplaudir (guardar frase)"
          >
            <img src="/assets/aplaude.png" alt="Aplaudir" />
          </button>

          {menuAlternativasAbierto && (
            <div className="alternativas-panel">
              <div className="alternativas-header">
                <strong>Otras frases para cerrar</strong>
                <button className="alternativas-close" onClick={() => cerrarMenuAbucheo(true)}>✕</button>
              </div>
              <p className="alternativas-subtitle">Toca una frase para probarla, luego confirma con Salvada.</p>
              <div className="alternativas-lista">
                {alternativasAbucheo.map((opcion) => (
                  <button
                    key={opcion}
                    className={`alternativa-chip ${palabraO === opcion ? "seleccionada" : ""}`}
                    onClick={() => aplicarAlternativaAbucheo(opcion)}
                  >
                    {buildLinea({
                      jugador: "O",
                      palabra: opcion,
                      casillaIndex: ultimaCasillaO,
                      prefijos,
                      sufijos,
                      tablero,
                    }) || opcion}
                  </button>
                ))}
              </div>
              <div className="alternativas-actions">
                <button className="alternativa-confirmar" onClick={confirmarSalvada}>Salvada</button>
                <button className="alternativa-cancelar" onClick={() => cerrarMenuAbucheo(true)}>Cancelar</button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Efecto de victoria */}
      <VictoryEffect show={victoryActive} winningCells={victory?.cells || []} shapes={shapesArray} />

      {/* Modal creativo (burbuja) */}
      {burbujaAbierta !== null && (
        <SpeechBubbleModal
          creativeMode={victory?.winner === "X" && tresCasillasTodasX(jugadas)}
          titulo={
            burbujaAbierta === -1
              ? (tituloModal?.default || "Yo escojo")
              : (tituloModal?.[turno] || tituloModal?.default || "Yo escojo")
          }
          prefijo={burbujaAbierta === -1 ? "" : (prefijos[turno] || "")}
          opciones={burbujaAbierta === -1 ? [] : (tablero[burbujaAbierta]?.[turno] || [])}
          fraseBase={fraseBase}
          jugadasX={jugadas.filter(j => j?.jugador === "X").map(j => j.palabra)}
          personaje={personajeActual}
          tailCoords={tailCoords}
          onSelect={handleSeleccion}
          onConfirmCreative={handleConfirmCreative}
          onClose={() => setBurbujaAbierta(null)}
        />
      )}

      {/* Overlay de animación entre niveles */}
      {(!xDone || animando) && <div className="nivel-animando-overlay" />}

      {/* Modal final de gatología */}
      {modalGatologia.visible && (
        <div className="gatologia-modal-overlay">
          <div className="gatologia-modal">
            <h2>
              ✨ {modalGatologia.personaje} ha escrito una{" "}
              <span className="gatologia-destacada">Gatología</span> en su bitácora.
            </h2>
            <p className="gatologia-titulo">“{modalGatologia.titulo}”</p>
            <div className="gatologia-botones">
              <button onClick={() => window.location.reload()}>Volver a jugar</button>
              <button
                onClick={() =>
                  window.dispatchEvent(new CustomEvent("abrirCamerino"))
                }
              >
                Ir a leerla
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============ helpers ============
function checkWinner(jugadas) {
  const combos = [
    [0,1,2],[3,4,5],[6,7,8],
    [0,3,6],[1,4,7],[2,5,8],
    [0,4,8],[2,4,6],
  ];
  for (const [a,b,c] of combos) {
    const j1 = jugadas[a], j2 = jugadas[b], j3 = jugadas[c];
    if (j1 && j2 && j3 && j1.jugador === j2.jugador && j2.jugador === j3.jugador) {
      return { winner: j1.jugador, combo: [a,b,c] };
    }
  }
  return null;
}

function tresCasillasTodasX(jugadas) {
  const combos = [
    [0,1,2],[3,4,5],[6,7,8],
    [0,3,6],[1,4,7],[2,5,8],
    [0,4,8],[2,4,6],
  ];
  return combos.some(([a,b,c]) =>
    jugadas[a]?.jugador === "X" &&
    jugadas[b]?.jugador === "X" &&
    jugadas[c]?.jugador === "X"
  );
}
