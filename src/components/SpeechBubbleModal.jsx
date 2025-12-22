import React, { useState, useEffect, useRef, useCallback } from "react";
import "./SpeechBubbleModal.css";

export default function SpeechBubbleModal({
  opciones,
  titulo,
  onSelect,
  onClose,
  tailCoords,
  creativeMode = false,
  onConfirmCreative,
  tiempoLimite = 10,
}) {
  const [remate, setRemate] = useState("");
  const [countdown, setCountdown] = useState(tiempoLimite);
  const [letterboxIndex, setLetterboxIndex] = useState(0);
  const [rouletteTurnsLeft, setRouletteTurnsLeft] = useState(0);
  const [isRouletteSpinning, setIsRouletteSpinning] = useState(false);
  const contentRef = useRef(null);
  const audioCtxRef = useRef(null);
  const rouletteTimeoutRef = useRef(null);

  useEffect(() => {
    if (creativeMode && contentRef.current) {
      contentRef.current.scrollTo({
        top: contentRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [creativeMode]);

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

  const playTick = useCallback(() => {
    const ctx = getAudioCtx();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const now = ctx.currentTime;
    osc.type = "square";
    osc.frequency.setValueAtTime(880, now);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(0.04, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.16);
    osc.connect(gain).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.18);
  }, [getAudioCtx]);

  const playScrollTick = useCallback(() => {
    const ctx = getAudioCtx();
    if (!ctx) return;
    const now = ctx.currentTime;

    const noiseBuffer = ctx.createBuffer(1, ctx.sampleRate * 0.12, ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.6;
    }
    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuffer;

    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 900 + Math.random() * 400;
    lp.Q.value = 0.7;

    const pan = ctx.createStereoPanner();
    pan.pan.value = (Math.random() - 0.5) * 0.6;

    const gainNoise = ctx.createGain();
    gainNoise.gain.setValueAtTime(0.0001, now);
    gainNoise.gain.exponentialRampToValueAtTime(0.03, now + 0.018);
    gainNoise.gain.exponentialRampToValueAtTime(0.0001, now + 0.14);

    noise.connect(lp).connect(pan).connect(gainNoise).connect(ctx.destination);
    noise.start(now);
    noise.stop(now + 0.16);
  }, [getAudioCtx]);

  const cancelRouletteTimer = useCallback(() => {
    if (rouletteTimeoutRef.current) {
      clearTimeout(rouletteTimeoutRef.current);
      rouletteTimeoutRef.current = null;
    }
  }, []);

  const handleRoulette = useCallback(() => {
    if (!opciones?.length || isRouletteSpinning) return;
    cancelRouletteTimer();
    const rounds = 12;
    setIsRouletteSpinning(true);
    setRouletteTurnsLeft(rounds);
    let remaining = rounds;

    const scheduleNext = (fn, delay) => {
      const timer = typeof window === "undefined" ? setTimeout : window.setTimeout;
      rouletteTimeoutRef.current = timer(fn, delay);
    };

    const runShuffle = () => {
      if (!opciones?.length) {
        cancelRouletteTimer();
        setIsRouletteSpinning(false);
        setRouletteTurnsLeft(0);
        return;
      }
      const randomIdx = Math.floor(Math.random() * opciones.length);
      setLetterboxIndex(randomIdx);
      playScrollTick();
      remaining -= 1;
      setRouletteTurnsLeft(remaining);

      if (remaining <= 0) {
        setIsRouletteSpinning(false);
        setRouletteTurnsLeft(0);
        cancelRouletteTimer();
        return;
      }
      const delay = 200 + remaining * 60;
      scheduleNext(runShuffle, delay);
    };

    runShuffle();
  }, [cancelRouletteTimer, isRouletteSpinning, opciones, playScrollTick]);

  const handleLetterboxSelect = useCallback(() => {
    const option = opciones?.[letterboxIndex];
    if (option) {
      onSelect(option);
    }
  }, [letterboxIndex, opciones, onSelect]);

  useEffect(() => {
    cancelRouletteTimer();
    setIsRouletteSpinning(false);
    setRouletteTurnsLeft(0);
    if (!opciones?.length) {
      setLetterboxIndex(0);
      return;
    }
    setLetterboxIndex((prev) => (prev < opciones.length ? prev : 0));
  }, [opciones?.length, cancelRouletteTimer]);

  useEffect(() => cancelRouletteTimer(), [cancelRouletteTimer]);

  const handleConfirm = useCallback(() => {
    const remateLimpio = (remate || "").trim();
    onConfirmCreative(remateLimpio);
    onClose();
  }, [onClose, onConfirmCreative, remate]);

  useEffect(() => {
    if (!creativeMode) return;

    setCountdown(tiempoLimite);
    playTick();
    const interval = setInterval(() => {
      setCountdown((prev) => {
        const next = prev - 1;
        if (next <= 0) {
          clearInterval(interval);
          handleConfirm();
          return 0;
        }
        playTick();
        return next;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [creativeMode, tiempoLimite, handleConfirm, playTick]);

  if (!creativeMode && !opciones?.length) return null;

  const displayedOption = opciones?.[letterboxIndex] ?? opciones?.[0] ?? "";

  return (
    <div className="speech-bubble-container">
      <div className="speech-bubble">
        <div className="speech-header">
          <strong>{titulo}</strong>
          <button className="btn-close" onClick={onClose} aria-label="Regresar">
            ↩
          </button>
        </div>

        <div
          className={`speech-content${!creativeMode ? " speech-content--centered" : ""}`}
          ref={contentRef}
          style={
            !creativeMode
              ? {
                  overflowY: "hidden",
                }
              : undefined
          }
        >
          {!creativeMode && opciones?.length > 0 && (
            <div className="speech-letterbox">
              <button
                type="button"
                className="speech-letterbox-btn"
                onClick={handleLetterboxSelect}
              >
                <span>{displayedOption}</span>
              </button>
              <p className="speech-letterbox-hint">Toca para confirmar esta frase</p>
            </div>
          )}

          {tailCoords?.x1 && (
            <svg className="speech-tail" xmlns="http://www.w3.org/2000/svg">
              <polygon
                points={`${tailCoords.x1},${tailCoords.y1} ${tailCoords.x2},${tailCoords.y2} ${tailCoords.x3},${tailCoords.y3}`}
                fill="currentColor"
              />
            </svg>
          )}

          {creativeMode && (
            <div className="speech-creative-block">
              <p className="speech-instruction">
                Has ganado con tres X 🐾 — Escribe tu remate creativo
              </p>
              <div className="digital-timer">
                {countdown.toString().padStart(2, "0")}
              </div>
              <textarea
                className="speech-textarea"
                placeholder="Escribe aquí tu final creativo..."
                value={remate}
                onChange={(e) => setRemate(e.target.value)}
              />
              <div className="speech-actions">
                <button onClick={handleConfirm} disabled={!remate.trim()}>
                  ✔️ Confirmar
                </button>
              </div>
            </div>
          )}
        </div>
        {!creativeMode && opciones?.length > 0 && (
          <button
            type="button"
            className={`speech-roulette-icon${isRouletteSpinning ? " is-spinning" : ""}`}
            onClick={handleRoulette}
            disabled={isRouletteSpinning}
            aria-label={
              isRouletteSpinning
                ? `Ruleta girando, ${rouletteTurnsLeft} turnos restantes`
                : "Activar ruleta rusa"
            }
            title="Activar ruleta rusa"
          >
            <span aria-hidden="true">🎲</span>
          </button>
        )}
      </div>
    </div>
  );
}
