// src/components/CharacterSelector.jsx
import { useLayoutEffect, useMemo, useRef, useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import useGameStore from "../store/useGameStore";
import usePersonajesSupabase from "../hooks/usePersonajesSupabase";
import "./CharacterSelector.css";



const DEFAULT_INTRO = "¡Hola! Pronto conocerás nuestras historias desde el balcón.";
const DEFAULT_WIDTH_RATIO = 0.18;

export const BASE_CHARACTER_LAYOUT = {
  "reina-de-espadas": {
    top: "33%",
    left: "50%",
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
    intro: "🦉 Domina el tablero antes del primer movimiento.",
    nombre_visible: "Don Polo",
    genero_literario: "Cronicón costumbrista",
    frase_base: "Negocia tu papel… pero nunca tu alma.",
    sticker_url: "/assets/polo_sticker.svg",
    widthRatio: 0.18,
  },
  saturnina: {
    top: "38%",
    left: "20%",
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
    intro: "📚 Corrige mientras juega. No se equivoca dos veces.",
    nombre_visible: "La Maestra",
    genero_literario: "Ensayo corto",
    frase_base: "ESe enseña mejor desde la herida.",
    sticker_url: "/assets/maestra_sticker.svg",
    widthRatio: 0.19,
  },
  "la-doctora": {
    top: "71%",
    left: "20%",
    intro: "🔬 Detecta tus fallas antes que tú mismo.",
    nombre_visible: "La Doctora",
    genero_literario: "Informe poético / análisis simbólico",
    frase_base: "Cada herida tuya escribe una escena nueva.",    
    sticker_url: "/assets/doctora_sticker.svg",
    widthRatio: 0.17,
  },
  silvestre: {
    top: "69%",
    left: "50%",
    intro: "🎭 Improvisa tan bien… que parece guion.",
    nombre_visible: "Silvestre",
    genero_literario: "Monólogo dramático",
    frase_base: "No hay guion. Solo verdad escénica.",
    sticker_url: "/assets/silvestre_sticker.svg",
    widthRatio: 0.2,
  },
  andy: {
    top: "71%",
    left: "82%",
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
  const bubbleTimeoutRef = useRef(null);
  const hostRef = useRef(null);
  const [bubblePosition, setBubblePosition] = useState(null);

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
  }, []);

  const scheduleAutoClose = useCallback(() => {
    if (!isTouchMode) return;
    clearBubbleTimeout();
    bubbleTimeoutRef.current = setTimeout(() => {
      setClosing(true);
    }, 4200);
  }, [clearBubbleTimeout, isTouchMode]);

  const updateBubblePosition = useCallback(() => {
    if (!hostRef.current) return;
    const rect = hostRef.current.getBoundingClientRect();
    const eyeOffset = rect.height * 0.16;
    setBubblePosition({
      left: rect.left + rect.width / 2,
      top: rect.top + eyeOffset,
    });
  }, []);

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
        widthRatio: info.widthRatio ?? DEFAULT_WIDTH_RATIO,
      }));
    }

    return mapped;
  }, [personajes]);

  const handleHover = (char) => {
    if (isTouchMode) return;
    setClosing(false); // evita que se corte al re-hover
    setHovered(char.id);
    setIntroText(char.intro || DEFAULT_INTRO);
    setBubbleCharacter(char);
  };

  const handleLeave = () => {
    if (isTouchMode) return;
    clearBubbleTimeout();
    if (introText) setClosing(true); // dispara fade-out
  };

  const previewCharacter = (char) => {
    setClosing(false);
    setHovered(char.id);
    setIntroText(char.intro || DEFAULT_INTRO);
    setBubbleCharacter(char);
  };

  const handleCharacterActivate = (char) => {
    if (!isTouchMode) {
      handleSelect(char);
      return;
    }

    if (bubbleCharacter?.id === char.id) {
      clearBubbleTimeout();
      handleSelect(char);
      return;
    }

    previewCharacter(char);
  };

  useEffect(() => {
    if (!isTouchMode || !bubbleCharacter || closing) {
      clearBubbleTimeout();
      return;
    }
    scheduleAutoClose();
    return () => clearBubbleTimeout();
  }, [bubbleCharacter, isTouchMode, closing, scheduleAutoClose, clearBubbleTimeout]);

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
              top: `${bubblePosition.top}px`,
              transform: "translate(-50%, -100%)",
              bottom: "auto",
              zIndex: 12000,
            }}
            onClick={(evt) => evt.stopPropagation()}
            onAnimationEnd={() => {
              if (closing) {
                setClosing(false);
                setIntroText(null);
                setBubbleCharacter(null);
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
          </div>,
          document.body
        )
      : null;

  return (
    <div className="character-selector">
      <div
        className="building-wrap"
        ref={buildingRef}
        style={buildingWidth ? { "--building-width": `${buildingWidth}px` } : undefined}
      >
        <img src="/assets/edificio.svg" alt="Edificio canon" className="character-selector__building" />

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
                }`}
                style={{
                  top: p.top,
                  left: p.left,
                  "--sticker-width": `calc(var(--building-width, 1px) * ${p.widthRatio ?? DEFAULT_WIDTH_RATIO})`,
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
        <img
          src={hostCharacter.src}
          alt="Gato anfitrión"
          className="character-selector__host-img"
        />

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
