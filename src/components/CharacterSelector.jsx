// src/components/CharacterSelector.jsx
import { useLayoutEffect, useMemo, useRef, useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import useGameStore from "../store/useGameStore";
import usePersonajesSupabase from "../hooks/usePersonajesSupabase";
import { playVictoryXSound } from "../utils/victorySound";
import "./CharacterSelector.css";



const DEFAULT_INTRO = "¡Hola! Pronto conocerás nuestras historias desde el balcón.";
const DEFAULT_WIDTH_RATIO = 0.18;

export const BASE_CHARACTER_LAYOUT = {
  "reina-de-espadas": {
    top: "33%",
    left: "50%",
    glowRow: "top",
    intro: "🗡️ Cuidado: sabe cortar sin levantar la voz.",
    nombre_visible: "La Reina de Espadas",
    genero_literario: "Aforismo filosófico",
    frase_base: "Si juegas con filo, corta con verdad.",
    sticker_url: "/assets/reina_sticker.svg",
    widthRatio: 0.21,
  },
  "don-polo": {
    top: "37%",
    left: "83%",
    glowRow: "top",
    intro: "🦉 Domina el tablero antes del primer movimiento.",
    nombre_visible: "Don Polo",
    genero_literario: "Cronicón costumbrista",
    frase_base: "Negocia tu papel… pero nunca tu alma.",
    sticker_url: "/assets/polo_sticker.svg",
    widthRatio: 0.18,
  },
  saturnina: {
    top: "40%",
    left: "20%",
    glowRow: "top",
    intro: "🎠 Convierte el absurdo en táctica impredecible.",
    nombre_visible: "Saturnina",
    genero_literario: "Haiku expandido / microcuento",
    frase_base: "Si entiendes el chiste, ya comenzaste.",
    sticker_url: "/assets/saturnina_sticker.svg",
    widthRatio: 0.17,
  },
  lucinda: {
    top: "51%",
    left: "50%",
    glowRow: "middle",
    intro: "🕯️ Juega con emociones que otros no resisten.",
    nombre_visible: "Lucinda",
    genero_literario: "Carta confesional",
    frase_base: "Las cartas revelan más de lo que esconden.",
    sticker_url: "/assets/lucinda_sticker.svg",
    widthRatio: 0.18,
  },
  "payasito-triste": {
    top: "55%",
    left: "20%",
    glowRow: "middle",
    intro: "🎭 Hace trampa… pero con verdades incómodas.",
    nombre_visible: "Payasito Triste",
    genero_literario: "Poema en prosa / cuento breve onírico",
    frase_base: "Ríe conmigo… si te atreves, claro.",
    sticker_url: "/assets/payasito_sticker.svg",
    widthRatio: 0.17,
  },
  "la-maestra": {
    top: "55%",
    left: "82%",
    glowRow: "middle",
    intro: "📚 Corrige mientras juega. No se equivoca dos veces.",
    nombre_visible: "La Maestra",
    genero_literario: "Ensayo corto",
    frase_base: "ESe enseña mejor desde la herida.",
    sticker_url: "/assets/maestra_sticker.svg",
    widthRatio: 0.19,
  },
  "la-doctora": {
    top: "74%",
    left: "20%",
    glowRow: "bottom",
    intro: "🔬 Detecta tus fallas antes que tú mismo.",
    nombre_visible: "La Doctora",
    genero_literario: "Análisis simbólico",
    frase_base: "Cada herida tuya escribe una escena nueva.",    
    sticker_url: "/assets/doctora_sticker.svg",
    widthRatio: 0.17,
  },
  silvestre: {
    top: "70%",
    left: "50%",
    glowRow: "bottom",
    intro: "🎭 Improvisa tan bien… que parece guion.",
    nombre_visible: "Silvestre",
    genero_literario: "Monólogo dramático",
    frase_base: "No hay guion. Solo verdad escénica.",
    sticker_url: "/assets/silvestre_sticker.svg",
    widthRatio: 0.2,
  },
  andy: {
    top: "75%",
    left: "82%",
    glowRow: "bottom",
    intro: "💥 Juega a romper las reglas… científicamente.",
    nombre_visible: "Andy",
    genero_literario: "Flash fiction / meme narrativo",
    frase_base: "Si explota, vas bien. Bienvenidx, jugadorx.",
    sticker_url: "/assets/andy_sticker.svg",
    widthRatio: 0.18,
  },
};

const hostCharacter = {
  id: "gato-anfitrion",
  src: "/assets/gato_sticker.svg",
  top: "80%",
  left: "50%",
};


export default function CharacterSelector() {
  const [hovered, setHovered] = useState(null);
  const [introText, setIntroText] = useState(null);
  const [closing, setClosing] = useState(false);
  const [bubbleCharacter, setBubbleCharacter] = useState(null);
  const [isTouchMode, setIsTouchMode] = useState(false);
  const [spotlightTarget, setSpotlightTarget] = useState(null);
  const selectionTimeoutRef = useRef(null);
  const bubbleTimeoutRef = useRef(null);
  const bubbleCloseTimeoutRef = useRef(null);
  const hostRef = useRef(null);
  const [bubblePosition, setBubblePosition] = useState(null);
  const audioCtxRef = useRef(null);

  const { personajes, loading } = usePersonajesSupabase();
  const buildingRef = useRef(null);
  const [buildingWidth, setBuildingWidth] = useState(null);

  useLayoutEffect(() => {
    const el = buildingRef.current;
    if (!el) return;

    const updateWidth = () => {
      const rect = el.getBoundingClientRect();
      setBuildingWidth(rect.width || null);
    };

    updateWidth();

    const resizeObserver = new ResizeObserver(() => updateWidth());
    resizeObserver.observe(el);

    window.addEventListener("resize", updateWidth);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", updateWidth);
    };
  }, []);

  useEffect(() => {
    const mql = window.matchMedia("(hover: none), (pointer: coarse)");
    const updateMode = () => setIsTouchMode(mql.matches);
    updateMode();
    mql.addEventListener?.("change", updateMode);
    return () => mql.removeEventListener?.("change", updateMode);
  }, []);

  const clearBubbleTimeout = useCallback(() => {
    if (bubbleTimeoutRef.current) {
      clearTimeout(bubbleTimeoutRef.current);
      bubbleTimeoutRef.current = null;
    }
    if (bubbleCloseTimeoutRef.current) {
      clearTimeout(bubbleCloseTimeoutRef.current);
      bubbleCloseTimeoutRef.current = null;
    }
  }, []);

  const clearSelectionTimeout = useCallback(() => {
    if (selectionTimeoutRef.current) {
      clearTimeout(selectionTimeoutRef.current);
      selectionTimeoutRef.current = null;
    }
  }, []);

  const getAudioCtx = useCallback(() => {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!audioCtxRef.current) {
      audioCtxRef.current = new Ctx();
    } else if (audioCtxRef.current.state === "suspended") {
      audioCtxRef.current.resume().catch(() => {});
    }
    return audioCtxRef.current;
  }, []);

  const playVictoryX = useCallback(() => {
    const ctx = getAudioCtx();
    if (!ctx) return;
    playVictoryXSound(ctx);
  }, [getAudioCtx]);

  const getSpotlightOffset = useCallback(() => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    if (w <= 430 && h > w) return { x: 0, y: -50 };
    if (h <= 500 && w > h) return { x: 0, y: -(h * 0.15) };
    return { x: 0, y: 0 };
  }, []);

  const getCharacterCenter = useCallback((id) => {
    const root = buildingRef.current;
    if (!root) return null;
    const isPortrait = window.innerHeight > window.innerWidth;
    const isSmallScreen =
      window.innerWidth <= 430 || window.innerHeight <= 500;
    const isTabletPortrait = isPortrait && window.innerWidth >= 700;
    const isTabletLandscape =
      !isPortrait && window.innerWidth >= 900 && window.innerHeight >= 600;
    const offset = getSpotlightOffset();
    if (isTabletPortrait || isTabletLandscape) {
      return {
        x: window.innerWidth / 2 + offset.x,
        y: window.innerHeight / 2 + offset.y,
      };
    }
    if (isSmallScreen) {
      const rect = root.getBoundingClientRect();
      return {
        x: rect.left + rect.width / 2 + offset.x,
        y: rect.top + rect.height / 2 + offset.y,
      };
    }
    const el = root.querySelector(`[data-character-id="${id}"]`);
    if (!el) return null;
    const rect = el.getBoundingClientRect();
    return {
      x: rect.left + rect.width / 2 + offset.x,
      y: rect.top + rect.height / 2 + offset.y,
    };
  }, [getSpotlightOffset]);

  const scheduleAutoClose = useCallback(() => {
    clearBubbleTimeout();
    bubbleTimeoutRef.current = setTimeout(() => {
      setSpotlightTarget(null);
      setHovered(null);
      bubbleCloseTimeoutRef.current = setTimeout(() => {
        setClosing(true);
      }, 200);
    }, 5200);
  }, [clearBubbleTimeout]);

  const updateBubblePosition = useCallback(() => {
    const isDesktop = window.matchMedia(
      "(hover: hover) and (pointer: fine) and (min-width: 1200px)"
    ).matches;
    const targetId = bubbleCharacter?.id;

    if (isDesktop && targetId) {
      const root = buildingRef.current;
      const slot = root?.querySelector(`[data-character-id="${targetId}"]`);
      const sticker = slot?.querySelector(".character-selector__sticker");
      const rect = (sticker || slot)?.getBoundingClientRect();
      if (rect) {
        setBubblePosition({
          left: rect.left + rect.width / 2,
          top: rect.bottom,
          align: "center",
        });
        return;
      }
    }

    if (!hostRef.current) return;
    const rect = hostRef.current.getBoundingClientRect();
    const eyeOffset = rect.height * 0.16;
    setBubblePosition({
      left: rect.left + rect.width / 2,
      top: rect.top + eyeOffset,
      align: "center",
    });
  }, [bubbleCharacter]);

  useEffect(() => {
    return () => clearBubbleTimeout();
  }, [clearBubbleTimeout]);

  const setPersonajeActual = useGameStore((s) => s.setPersonajeActual);
  const setPersonajeSeleccionado = useGameStore((s) => s.setPersonajeSeleccionado);
  const setScreen = useGameStore((s) => s.setScreen);
  const canPlayPersonaje = useGameStore((s) => s.canPlayPersonaje);
  const setLockedPersonajeId = useGameStore((s) => s.setLockedPersonajeId);
  const role = useGameStore((s) => s.role);
  const defaultFreeCharacter = useGameStore((s) => s.defaultFreeCharacter);

  const openCompendio = () => {
    setScreen("compendio");
  };

  const handleSelect = (p) => {
    clearBubbleTimeout();
    clearSelectionTimeout();
    setSpotlightTarget(null);
    setHovered(null);
    const canPlay = canPlayPersonaje(p.id);

    setPersonajeActual(p.id);
    setPersonajeSeleccionado({
      ...p,
      sticker_url: p.sticker_url,
      nombre_visible: p.nombre_visible,
      genero_literario: p.genero_literario,
      icono: p.icono || p.sticker_url,
      slug: p.slug,
    });

    setLockedPersonajeId(canPlay ? null : p.id);
    setScreen("camerino");
    setIntroText(null);
    setBubbleCharacter(null);
    setClosing(false);
  };

  const characters = useMemo(() => {
    if (!personajes || personajes.length === 0) {
      return Object.entries(BASE_CHARACTER_LAYOUT).map(([slug, info]) => ({
        id: slug,
        slug,
        ...info,
        sticker_url: info.sticker_url,
        glowRow: info.glowRow,
      }));
    }

    const mapped = personajes
      .map((personaje) => {
        const slug = personaje.slug || personaje.id;
        const layout = BASE_CHARACTER_LAYOUT[slug];
        if (!layout) return null;

        return {
          id: slug,
          slug,
          top: layout.top,
          left: layout.left,
          intro: layout.intro,
          glowRow: layout.glowRow,
          nombre_visible: personaje.nombre_visible || personaje.nombre || layout.nombre_visible,
          genero_literario: personaje.genero_literario || layout.genero_literario,
          frase_base: personaje.frase_base || layout.frase_base,
          sticker_url: personaje.sticker_url || layout.sticker_url,
          icono: personaje.icono,
          raw: personaje,
          widthRatio: layout.widthRatio ?? DEFAULT_WIDTH_RATIO,
        };
      })
      .filter(Boolean);

    if (mapped.length === 0) {
      return Object.entries(BASE_CHARACTER_LAYOUT).map(([slug, info]) => ({
        id: slug,
        slug,
        ...info,
        sticker_url: info.sticker_url,
        glowRow: info.glowRow,
        widthRatio: info.widthRatio ?? DEFAULT_WIDTH_RATIO,
      }));
    }

    return mapped;
  }, [personajes]);

  const handleHover = (char) => {
    if (isTouchMode) return;
    setHovered(char.id);
  };

  const handleLeave = () => {
    if (isTouchMode) return;
    setHovered(null);
  };

  const previewCharacter = (char) => {
    setClosing(false);
    setHovered(char.id);
    setIntroText(char.intro || DEFAULT_INTRO);
    setBubbleCharacter(char);
  };

  const handleCharacterActivate = (char) => {
    if (!isTouchMode) {
      if (bubbleCharacter?.id === char.id) {
        clearBubbleTimeout();
        handleSelect(char);
        return;
      }

      playVictoryX();
      const center = getCharacterCenter(char.id);
      if (center) {
        const yOffset =
          typeof window !== "undefined" && window.innerHeight > window.innerWidth
            ? -window.innerHeight * 0.08
            : 0;
        setSpotlightTarget({
          id: char.id,
          x: center.x,
          y: center.y + yOffset,
        });
      } else {
        setSpotlightTarget(null);
      }
      previewCharacter(char);
      return;
    }

    if (bubbleCharacter?.id === char.id) {
      clearBubbleTimeout();
      handleSelect(char);
      return;
    }

    playVictoryX();
    const center = getCharacterCenter(char.id);
    if (center) {
      const yOffset =
        typeof window !== "undefined" && window.innerHeight > window.innerWidth
          ? -window.innerHeight * 0.08
          : 0;
      setSpotlightTarget({
        id: char.id,
        x: center.x,
        y: center.y + yOffset,
      });
    } else {
      setSpotlightTarget(null);
    }
    previewCharacter(char);
  };

  useEffect(() => {
    if (!bubbleCharacter || closing) {
      clearBubbleTimeout();
      return;
    }
    scheduleAutoClose();
    return () => clearBubbleTimeout();
  }, [bubbleCharacter, closing, scheduleAutoClose, clearBubbleTimeout]);

  useEffect(() => {
    return () => clearSelectionTimeout();
  }, [clearSelectionTimeout]);

  useEffect(() => {
    if (!introText) {
      setBubblePosition(null);
      return;
    }
    updateBubblePosition();
    window.addEventListener("resize", updateBubblePosition);
    window.addEventListener("scroll", updateBubblePosition, { passive: true });
    return () => {
      window.removeEventListener("resize", updateBubblePosition);
      window.removeEventListener("scroll", updateBubblePosition);
    };
  }, [introText, updateBubblePosition]);

  const bubbleContent =
    introText && bubblePosition
      ? createPortal(
          <div
            className={`cs-speech-bubble cs-speech-bubble--floating ${closing ? "is-closing" : ""}`}
            style={{
              position: "fixed",
              left: `${bubblePosition.left}px`,
              top: `calc(${bubblePosition.top}px - var(--bubble-raise, 0px))`,
              transform: "translate(-50%, var(--bubble-translate-y, -100%))",
              bottom: "auto",
              zIndex: 12000,
            }}
            onClick={(evt) => evt.stopPropagation()}
            onAnimationEnd={() => {
              if (closing) {
                setClosing(false);
                setIntroText(null);
                setBubbleCharacter(null);
                setSpotlightTarget(null);
                setHovered(null);
                clearBubbleTimeout();
              }
            }}
          >
            {bubbleCharacter ? (
              <>
                <div className="cs-bubble-header">
                  <div className="cs-bubble-header-row">
                    <button
                      type="button"
                      className="cs-bubble-name-link"
                      onClick={(evt) => {
                        evt.stopPropagation();
                        handleSelect(bubbleCharacter);
                      }}
                    >
                      {bubbleCharacter.nombre_visible}
                    </button>
                    <p className="cs-bubble-genre">{bubbleCharacter.genero_literario}</p>
                  </div>
                </div>
                <p className="cs-bubble-body">{introText}</p>
              </>
            ) : (
              <p className="cs-bubble-body">{introText}</p>
            )}
            <svg
              className="cs-speech-tail"
              viewBox="0 0 120 80"
              aria-hidden="true"
              focusable="false"
            >
              <defs>
                <linearGradient id="csBubbleTailGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="rgba(108, 108, 108, 1)" />
                  <stop offset="100%" stopColor="rgba(170, 166, 166, 0.96)" />
                </linearGradient>
              </defs>
              <polygon points="0,0 60,80 120,0" fill="url(#csBubbleTailGradient)" />
            </svg>
          </div>,
          document.body
        )
      : null;

  const spotlightStyle = spotlightTarget
    ? {
        "--spotlight-x": `${spotlightTarget.x}px`,
        "--spotlight-y": `${spotlightTarget.y}px`,
      }
    : undefined;

  const curtainSpotlight = spotlightTarget
    ? createPortal(
        <div
          className="character-selector__curtain-spotlight is-active"
          style={spotlightStyle}
          aria-hidden="true"
        />,
        document.body
      )
    : null;

  return (
    <div className="character-selector">
      {curtainSpotlight}
      <div
        className="building-wrap"
        ref={buildingRef}
        style={buildingWidth ? { "--building-width": `${buildingWidth}px` } : undefined}
      >
        <img src="/assets/edificio.svg" alt="Edificio canon" className="character-selector__building" />
        <div
          className={`character-selector__selection-overlay ${
            spotlightTarget ? "is-active" : ""
          }`}
          style={spotlightStyle}
          aria-hidden="true"
        />

        <div className="characters-layer">
          {loading && (
            <div className="character-selector__loading" role="status">
              Cargando elenco...
            </div>
          )}
          {characters.map((p) => {
            const isLocked = !canPlayPersonaje(p.id);
            return (
              <div
                key={p.id}
                className={`character-selector__slot ${hovered === p.id ? "is-hover" : ""} ${
                  isLocked ? "is-locked" : ""
                } ${spotlightTarget && spotlightTarget.id !== p.id ? "is-dimmed" : ""} ${
                  spotlightTarget?.id === p.id ? "is-spotlight" : ""
                } row-${p.glowRow || "top"}`}
                style={{
                  top: p.top,
                  left: p.left,
                  "--sticker-width": `calc(var(--building-width, 1px) * ${
                    p.widthRatio ?? DEFAULT_WIDTH_RATIO
                  } * var(--sticker-scale, 1.9))`,
                }}
                data-character-id={p.id}
                role="button"
                tabIndex={0}
                onClick={() => handleCharacterActivate(p)}
                onKeyDown={(evt) => {
                  if (evt.key === "Enter" || evt.key === " ") {
                    evt.preventDefault();
                    handleCharacterActivate(p);
                  }
                }}
                onMouseEnter={() => handleHover(p)}
                onMouseLeave={handleLeave}
              >
                <img
                  src={p.sticker_url}
                  alt={p.nombre_visible}
                  className={`character-selector__sticker ${hovered === p.id ? "is-hover" : ""}`}
                />
                {isLocked && (
                  <div className="character-selector__lock">
                    <span>Suscríbete para jugar</span>
                  </div>
                )}
                {!isLocked && p.id === defaultFreeCharacter && role === "anon" && (
                  <div className="character-selector__badge">Gratis para ti</div>
                )}
              </div>
            );
          })}

      {/* Gato anfitrión */}
      <div
        className="character-selector__host"
        ref={hostRef}
        style={{ top: hostCharacter.top, left: hostCharacter.left }}
        role="button"
        tabIndex={0}
        onClick={openCompendio}
        onKeyDown={(evt) => {
          if (evt.key === "Enter" || evt.key === " ") {
            evt.preventDefault();
            openCompendio();
          }
        }}
        aria-label="Visitar Gatologías"
      >
        <div className="character-selector__host-avatar">
          <img
            src={hostCharacter.src}
            alt="Gato anfitrión"
            className="character-selector__host-img"
          />
          <span className="character-selector__host-blink" aria-hidden="true" />
        </div>

        {/* Colita SVG */}
        <img
          src="/assets/gato_colita.svg"
          alt=""
          className="tail-svg"
          aria-hidden="true"
        />

        {bubbleContent}
      </div>
              </div>
      </div>

            


      {/* Cortinas al fondo */}
      <div className="curtain curtain-left" />
      <div className="curtain curtain-right" />
    </div>
  );
}
