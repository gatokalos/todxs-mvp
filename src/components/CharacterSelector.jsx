// src/components/CharacterSelector.jsx
import { useLayoutEffect, useMemo, useRef, useState } from "react";
import useGameStore from "../store/useGameStore";
import usePersonajesSupabase from "../hooks/usePersonajesSupabase";
import "./CharacterSelector.css";



const DEFAULT_INTRO = "¡Hola! Pronto conocerás nuestras historias desde el balcón.";
const DEFAULT_WIDTH_RATIO = 0.18;

export const BASE_CHARACTER_LAYOUT = {
  "reina-de-espadas": {
    top: "33%",
    left: "50%",
    intro: "Todo gato sabe cortar el silencio...",
    nombre_visible: "La Reina de Espadas",
    genero_literario: "Aforismo filosófico",
    frase_base: "Todo gato sabe cortar el silencio...",
    sticker_url: "/assets/reina_sticker.svg",
    widthRatio: 0.21,
  },
  "don-polo": {
    top: "37%",
    left: "83%",
    intro: "No hay gato encerrado que no maúlle la verdad.",
    nombre_visible: "Don Polo",
    genero_literario: "Cronicón costumbrista",
    frase_base: "El gato negocia incluso con la siesta...",
    sticker_url: "/assets/polo_sticker.svg",
    widthRatio: 0.18,
  },
  saturnina: {
    top: "38%",
    left: "20%",
    intro: "Cuenta anécdotas de la vida cotidiana, con un toque de surrealismo.",
    nombre_visible: "Saturnina",
    genero_literario: "Haiku expandido / microcuento",
    frase_base: "Un gato cabe en una taza, y en un momento...",
    sticker_url: "/assets/saturnina_sticker.svg",
    widthRatio: 0.17,
  },
  lucinda: {
    top: "51%",
    left: "50%",
    intro: "Confiesa sueños y secretos en cartas.",
    nombre_visible: "Lucinda",
    genero_literario: "Carta confesional",
    frase_base: "A veces el gato se esconde en los sueños...",
    sticker_url: "/assets/lucinda_sticker.svg",
    widthRatio: 0.18,
  },
  "payasito-triste": {
    top: "55%",
    left: "20%",
    intro: "Humor negro, ironía existencial y ruptura teatral para confrontar verdades incómodas.Si el telón sube, no es por gloria. Es por necesidad.",
    nombre_visible: "Payasito Triste",
    genero_literario: "Poema en prosa / cuento breve onírico",
    frase_base: "El gato que ríe por fuera...",
    sticker_url: "/assets/payasito_sticker.svg",
    widthRatio: 0.17,
  },
  "la-maestra": {
    top: "55%",
    left: "82%",
    intro: "Eres un gato que enseña con el ejemplo.",
    nombre_visible: "La Maestra",
    genero_literario: "Ensayo corto",
    frase_base: "Eres un gato que enseña con el ejemplo...",
    sticker_url: "/assets/maestra_sticker.svg",
    widthRatio: 0.19,
  },
  "la-doctora": {
    top: "71%",
    left: "20%",
    intro: "Especialista en patologías del alma felina.",
    nombre_visible: "La Doctora",
    genero_literario: "Informe poético / análisis simbólico",
    frase_base: "Todo gato tiene heridas que no se ven...",
    sticker_url: "/assets/doctora_sticker.svg",
    widthRatio: 0.17,
  },
  silvestre: {
    top: "69%",
    left: "50%",
    intro: "Actor sin papel fijo. Vive atrapado entre funciones pasadas y un guion que cambia con cada emoción. Si entras a escena con él, no olvides tu verdad.",
    nombre_visible: "Silvestre",
    genero_literario: "Monólogo dramático",
    frase_base:
      "«El telón no cae hasta que te atreves a sentir».",
    sticker_url: "/assets/silvestre_sticker.svg",
    widthRatio: 0.2,
  },
  andy: {
    top: "71%",
    left: "82%",
    intro: "Ensaya, falla, juega, vuelve a intentar. Andy no busca ganar, sino entender cómo funciona todo (¡incluido tu corazón!). Presiona “entrar” y empieza el experimento.",
    nombre_visible: "Andy",
    genero_literario: "Flash fiction / meme narrativo",
    frase_base: "«Si nada explota, no fue un buen intento.»",
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
    setClosing(false); // evita que se corte al re-hover
    setHovered(char.id);
    setIntroText(char.intro || DEFAULT_INTRO);
  };

  const handleLeave = () => {
    if (introText) setClosing(true); // dispara fade-out
  };

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
                onClick={() => handleSelect(p)}
                onKeyDown={(evt) => {
                  if (evt.key === "Enter" || evt.key === " ") {
                    evt.preventDefault();
                    handleSelect(p);
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

        {introText && (
          <div
            className={`cs-speech-bubble ${closing ? "is-closing" : ""}`}
            onAnimationEnd={() => {
              if (closing) {
                setClosing(false);
                setIntroText(null);
              }
            }}
          >
            {introText}
          </div>
        )}
      </div>
              </div>
      </div>

            


      {/* Cortinas al fondo */}
      <div className="curtain curtain-left" />
      <div className="curtain curtain-right" />
    </div>
  );
}
