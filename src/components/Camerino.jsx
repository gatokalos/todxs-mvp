// src/components/Camerino.jsx
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
gsap.registerPlugin(ScrollTrigger);

import useGameStore from "../store/useGameStore";
import {
  fetchGatologias,
  fetchEleccionesPorPersonaje,
  fetchNivelesPersonaje,
  toggleEleccionFavorita,
  deleteEleccion,
  insertGatologia,
  updateGatologia,
  publishGatologia,
  deleteGatologia,
  togglePinned,
  publicarTransformacion,
} from "../services/api";
import "./Camerino.css";
import BlogEntry from "./BlogEntry";
import LecternStage from "./LecternStage";
import { supabase } from "../lib/supabaseClient";
import { BASE_CHARACTER_LAYOUT } from "./CharacterSelector";

const CAMERINO_IMAGES = {
  "payasito-triste": "/assets/camerino_payasito.png",
  "reina-de-espadas": "/assets/camerino_reina.png",
  silvestre: "/assets/camerino_silvestre.png",
  "la-maestra": "/assets/camerino_maestra.png",
  "la-doctora": "/assets/camerino_doctora.png",
  "don-polo": "/assets/camerino_polo.png",
  saturnina: "/assets/camerino_saturnina.png",
  lucinda: "/assets/camerino_lucinda.png",
  gato: "/assets/camerino_gato.png",
  andy: "/assets/camerino_andy.png",
};

async function fetchPersonajeStats(slug) {
  const { data, error } = await supabase
    .from("personaje_stats")
    .select("*")
    .eq("personaje_slug", slug)
    .maybeSingle();

  if (error) {
    console.error("❌ Error cargando stats:", error);
    return null;
  }
  return data;
}

export default function Camerino() {
  const headerRef = useRef(null);
  const curtainLeftRef = useRef(null);
  const curtainRightRef = useRef(null);
  const btnRef = useRef(null);
  const canvasRef = useRef(null);

  const personaje = useGameStore((s) => s.personajeSeleccionado);
  const [entries, setEntries] = useState([]);
  const [camerinoImage, setCamerinoImage] = useState(null);
  const [stats, setStats] = useState(null);
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterMode, setFilterMode] = useState("all");
  const [activePanel, setActivePanel] = useState("textos");
  const [fraseSearchTerm, setFraseSearchTerm] = useState("");
  const [fraseFilterMode, setFraseFilterMode] = useState("all");
  const [frases, setFrases] = useState([]);
  const [frasesLoading, setFrasesLoading] = useState(true);
  const [activeMemeFraseId, setActiveMemeFraseId] = useState(null);
  const [generatingMeme, setGeneratingMeme] = useState(false);
  const [isMobileView, setIsMobileView] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(max-width: 768px)").matches;
  });
  const [memePreview, setMemePreview] = useState({ frase: "", url: "" });
  const [memeOptions, setMemeOptions] = useState({
    bgColor: "#000000",
    textColor: "#ffffff",
    font: "Georgia",
  });

  const [niveles, setNiveles] = useState([]);
  const [nivelExpandido, setNivelExpandido] = useState(null);

  const transformacion = useGameStore((s) => s.transformacion);
  const clearTransformacion = useGameStore((s) => s.clearTransformacion);
  const [publicando, setPublicando] = useState(false);

  const setScreen = useGameStore((s) => s.setScreen);
  const setPersonajeActual = useGameStore((s) => s.setPersonajeActual);
  const setPersonajeSeleccionado = useGameStore((s) => s.setPersonajeSeleccionado);
  const setNivelActual = useGameStore((s) => s.setNivelActual);
  const canPlayPersonaje = useGameStore((s) => s.canPlayPersonaje);
  const lockedPersonajeId = useGameStore((s) => s.lockedPersonajeId);
  const setLockedPersonajeId = useGameStore((s) => s.setLockedPersonajeId);
  const draft = useGameStore((s) => s.draft);
  const swipeStateRef = useRef({ startX: 0, startTime: 0 });

  const availableCharacters = useMemo(
    () =>
      Object.entries(BASE_CHARACTER_LAYOUT).map(([slug, data]) => ({
        id: slug,
        slug,
        nombre_visible: data.nombre_visible,
        genero_literario: data.genero_literario,
        intro: data.intro,
        sticker_url: data.sticker_url,
        icono: data.icono || data.sticker_url,
      })),
    []
  );

  const charactersPool = useMemo(() => {
    if (!personaje) return availableCharacters;
    const slug = personaje.slug || personaje.id;
    const exists = availableCharacters.some((c) => c.slug === slug);
    if (exists) return availableCharacters;
    return [
      ...availableCharacters,
      {
        id: slug,
        slug,
        nombre_visible: personaje.nombre_visible || slug,
        genero_literario: personaje.genero_literario || "",
        intro: personaje.intro,
        sticker_url: personaje.sticker_url || personaje.icono || "/assets/gato_sticker.svg",
        icono: personaje.icono || personaje.sticker_url || "/assets/gato_sticker.svg",
      },
    ];
  }, [availableCharacters, personaje]);

  const currentSlug = personaje?.slug || personaje?.id;
  const currentIndex = charactersPool.findIndex((char) => char.slug === currentSlug);

  const filteredEntries = useMemo(() => {
    let list = entries;
    const term = searchTerm.trim().toLowerCase();

    if (term) {
      list = list.filter((entry) => {
        const titulo = entry?.titulo?.toLowerCase() || "";
        const contenido = entry?.contenido?.toLowerCase() || "";
        return titulo.includes(term) || contenido.includes(term);
      });
    }

    if (filterMode === "pinned") {
      list = list.filter((entry) => entry?.pinned);
    } else if (filterMode === "recent") {
      list = [...list].sort((a, b) => {
        const aDate = new Date(a?.updated_at || a?.created_at || 0).getTime();
        const bDate = new Date(b?.updated_at || b?.created_at || 0).getTime();
        return bDate - aDate;
      });
    }

    return list;
  }, [entries, filterMode, searchTerm]);

  const isFraseFavorita = useCallback(
    (frase) => Boolean(frase?.favorita ?? frase?.is_favorite ?? frase?.favorite),
    []
  );

  const filteredFrases = useMemo(() => {
    let list = frases;
    const term = fraseSearchTerm.trim().toLowerCase();

    if (term) {
      list = list.filter((frase) => {
        const decision = frase?.decision?.toLowerCase() || "";
        return decision.includes(term);
      });
    }

    if (fraseFilterMode === "favoritas") {
      list = list.filter((frase) => isFraseFavorita(frase));
    } else if (fraseFilterMode === "recientes") {
      list = [...list].sort((a, b) => {
        const aDate = new Date(a?.created_at || a?.timestamp || 0).getTime();
        const bDate = new Date(b?.created_at || b?.timestamp || 0).getTime();
        return bDate - aDate;
      });
    }

    return list;
  }, [fraseFilterMode, fraseSearchTerm, frases, isFraseFavorita]);

  const selectCarouselCharacter = (char) => {
    if (!char) return;
    const charId = char.slug || char.id;
    const canPlay = canPlayPersonaje(charId);
    setLockedPersonajeId(canPlay ? null : charId);
    setPersonajeSeleccionado({
      ...char,
      id: charId,
      slug: charId,
      sticker_url: char.sticker_url,
      icono: char.icono || char.sticker_url,
    });
    setPersonajeActual(charId);
  };

  const goToCharacterAt = (index) => {
    if (!charactersPool.length) return;
    const safeIndex = ((index % charactersPool.length) + charactersPool.length) % charactersPool.length;
    selectCarouselCharacter(charactersPool[safeIndex]);
  };

  const goNextCharacter = () => {
    const nextIndex = currentIndex === -1 ? 1 : currentIndex + 1;
    goToCharacterAt(nextIndex);
  };

  const goPrevCharacter = () => {
    const prevIndex = currentIndex === -1 ? charactersForCarousel.length - 1 : currentIndex - 1;
    goToCharacterAt(prevIndex);
  };

  const handleSwipeStart = (event) => {
    if (event.touches.length !== 1) return;
    swipeStateRef.current = {
      startX: event.touches[0].clientX,
      startTime: Date.now(),
    };
  };

  const handleSwipeEnd = (event) => {
    if (!swipeStateRef.current.startX) return;
    const deltaX = event.changedTouches[0].clientX - swipeStateRef.current.startX;
    const elapsed = Date.now() - swipeStateRef.current.startTime;
    swipeStateRef.current = { startX: 0, startTime: 0 };
    if (Math.abs(deltaX) > 60 && elapsed < 600) {
      if (deltaX < 0) {
        goNextCharacter();
      } else {
        goPrevCharacter();
      }
    }
  };

  // === Datos ===
  useEffect(() => {
    if (!personaje?.slug) return;
    fetchPersonajeStats(personaje.slug).then(setStats).catch(console.error);
  }, [personaje]);

  useEffect(() => {
    const id = personaje?.slug || personaje?.id;
    if (!id) return;
    fetchNivelesPersonaje(id).then(setNiveles);
  }, [personaje]);

  useEffect(() => {
    const mql = window.matchMedia("(hover: none), (pointer: coarse)");
    const update = () => setIsTouchDevice(mql.matches);
    update();
    mql.addEventListener?.("change", update);
    return () => mql.removeEventListener?.("change", update);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const mql = window.matchMedia("(max-width: 768px)");
    const handler = (event) => setIsMobileView(event.matches);
    handler(mql);
    mql.addEventListener?.("change", handler);
    return () => mql.removeEventListener?.("change", handler);
  }, []);

  // === Imagen de fondo ===
  useEffect(() => {
    const slug = personaje?.slug || personaje?.id;
    const bg = CAMERINO_IMAGES[slug] || "/assets/camerino.png";
    setCamerinoImage(bg);
  }, [personaje]);

  // === Cargar gatologías ===
  useEffect(() => {
    if (!personaje?.slug) return;
    fetchGatologias(personaje.slug).then(setEntries);
  }, [personaje]);

  useEffect(() => {
    let cancelled = false;
    async function fetchFrases() {
      if (!personaje?.id) {
        setFrases([]);
        setFrasesLoading(false);
        return;
      }
      setFrasesLoading(true);
      try {
        const data = await fetchEleccionesPorPersonaje(personaje.id);
        if (!cancelled) setFrases(Array.isArray(data) ? data : []);
      } catch (error) {
        if (!cancelled) setFrases([]);
        console.error("❌ Error cargando frases:", error);
      } finally {
        if (!cancelled) setFrasesLoading(false);
      }
    }
    fetchFrases();
    return () => {
      cancelled = true;
    };
  }, [personaje?.id]);

  useEffect(() => {
    if (activePanel !== "memes") {
      setActiveMemeFraseId(null);
      setMemePreview({ frase: "", url: "" });
    }
  }, [activePanel]);

  // === Parallax fade del header ===
useEffect(() => {
  const el = headerRef.current;
  if (!el) return;

  const handleScroll = () => {
    const y = window.scrollY;
    const opacity = Math.max(1 - y / 300, 0);
    const translateY = Math.min(y / 3, 80);
    el.style.opacity = opacity;
    el.style.transform = `translate(-50%, ${translateY}px)`;
  };

  window.addEventListener("scroll", handleScroll);
  return () => window.removeEventListener("scroll", handleScroll);
}, []);

  // === Handlers ===
  const handleSave = async (entry) => {
    if (entry.id) {
      await updateGatologia(entry.id, {
        titulo: entry.titulo,
        contenido: entry.contenido,
      });
    } else {
      const nueva = await insertGatologia({
        personaje_slug: personaje.slug,
        titulo: entry.titulo,
        contenido: entry.contenido,
        estado: "draft",
      });
      if (nueva) setEntries((prev) => [nueva, ...prev]);
    }
  };

  const handlePublish = async (id) => {
    await publishGatologia(id);
    setEntries((prev) =>
      prev.map((e) => (e.id === id ? { ...e, estado: "published" } : e))
    );
  };

  const handleDelete = async (entry) => {
    if (!entry?.id) return;
    const ok = await deleteGatologia(entry.id);
    if (ok) {
      setEntries((prev) => prev.filter((e) => e.id !== entry.id));
    }
  };

  const handleTogglePin = async (entry) => {
    if (!entry?.id) return;
    const nextPinned = !entry.pinned;
    const ok = await togglePinned(entry.id, nextPinned);
    if (ok) {
      setEntries((prev) =>
        prev.map((e) => (e.id === entry.id ? { ...e, pinned: nextPinned } : e))
      );
    }
  };

  const handleEntrarEscenario = (nivel = null) => {
    if (!personaje) return;
    const personajeId = personaje.id || personaje.slug;
    setPersonajeActual(personajeId);
    if (nivel) setNivelActual(nivel, personajeId);
    setScreen("gameboard");
  };

  const compartirTwitter = (texto) => {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
      texto
    )}`;
    window.open(url, "_blank");
  };

  const generarMeme = async (frase, opciones) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const ctx = canvas.getContext("2d");
    const width = 1000;
    const height = 600;
    canvas.width = width;
    canvas.height = height;

    ctx.fillStyle = opciones.bgColor;
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = opciones.textColor;
    ctx.font = `bold 40px '${opciones.font || "Georgia"}'`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    const maxWidth = width - 120;
    const lineHeight = 55;
    const words = frase.split(" ");
    let line = "";
    const lines = [];
    for (let i = 0; i < words.length; i++) {
      const testLine = `${line}${words[i]} `;
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxWidth && i > 0) {
        lines.push(line);
        line = `${words[i]} `;
      } else {
        line = testLine;
      }
    }
    lines.push(line);

    const totalHeight = lines.length * lineHeight;
    let y = height / 2 - totalHeight / 2;
    lines.forEach((l) => {
      ctx.fillText(l.trim(), width / 2, y);
      y += lineHeight;
    });

    return canvas.toDataURL("image/png");
  };

  const abrirPreview = async (frase) => {
    setGeneratingMeme(true);
    try {
      const url = await generarMeme(frase, memeOptions);
      setMemePreview({ frase, url });
    } catch (error) {
      console.error("❌ Error generando meme:", error);
      setMemePreview({ frase, url: "" });
    } finally {
      setGeneratingMeme(false);
    }
  };

  const cerrarPreview = () => setMemePreview({ frase: "", url: "" });

  const descargarMeme = async () => {
    if (!memePreview?.url || !activeMemeFraseId) return;
    const link = document.createElement("a");
    link.download = `meme-${Date.now()}.png`;
    link.href = memePreview.url;
    link.click();
  };

  const compartirWhatsApp = async () => {
    if (!memePreview?.url || !activeMemeFraseId) return;
    const wa = `https://wa.me/?text=${encodeURIComponent(
      "Mira este meme 😸 " + memePreview.url
    )}`;
    window.open(wa, "_blank");
  };

  const obtenerFraseId = (frase, index) => {
    if (frase?.id) return frase.id;
    if (frase?.created_at) return `${frase.created_at}-${index}`;
    return `${index}-${frase?.decision?.slice(0, 20) || "frase"}`;
  };

  const handleToggleMeme = async (frase, id) => {
    if (activeMemeFraseId === id) {
      setActiveMemeFraseId(null);
      cerrarPreview();
      return;
    }
    setActiveMemeFraseId(id);
    setMemePreview({ frase: "", url: "" });
    await abrirPreview(frase.decision);
  };

  const closeMemeInterface = () => {
    setActiveMemeFraseId(null);
    cerrarPreview();
  };

  const handleToggleFavorita = async (frase) => {
    if (!frase?.id) return;
    const nextFavorita = !isFraseFavorita(frase);
    const ok = await toggleEleccionFavorita(frase.id, nextFavorita);
    if (ok) {
      setFrases((prev) =>
        prev.map((item) =>
          item.id === frase.id
            ? {
                ...item,
                favorita: nextFavorita,
                is_favorite: nextFavorita,
              }
            : item
        )
      );
    }
  };

  const handleDeleteFrase = async (frase) => {
    if (!frase?.id) return;
    if (!confirm("¿Seguro que quieres borrar esta frase?")) return;
    const ok = await deleteEleccion(frase.id);
    if (ok) {
      setFrases((prev) => prev.filter((item) => item.id !== frase.id));
    }
  };

  const activeFrase = useMemo(() => {
    if (!activeMemeFraseId) return null;
    return (
      frases.find((frase, idx) => obtenerFraseId(frase, idx) === activeMemeFraseId) ||
      null
    );
  }, [activeMemeFraseId, frases]);

  const activePreviewReady =
    activeFrase &&
    memePreview.url &&
    memePreview.frase === activeFrase.decision;

  const renderMemeEditorBody = (frase, previewReady) => (
    <>
      <div className="camerino-meme-panel__preview">
        {generatingMeme && !memePreview.url ? (
          <p className="camerino-meme-panel__loading">Generando vista previa...</p>
        ) : previewReady ? (
          <img
            src={memePreview.url}
            alt={`Vista previa del meme para ${personaje?.nombre || "el personaje"}`}
          />
        ) : (
          <p className="camerino-meme-panel__placeholder">
            Toca Actualizar para ver la vista previa.
          </p>
        )}
      </div>

      <div className="camerino-meme-panel-actions">
        <button type="button" onClick={descargarMeme} disabled={!previewReady}>
          ⬇️ Descargar
        </button>
        <button type="button" onClick={compartirWhatsApp} disabled={!previewReady}>
          📱 WhatsApp
        </button>
      </div>

      <div className="camerino-meme-options">
        <div className="camerino-color-palette">
          {["#D9C4F3", "#F9B4D4", "#FCA17D", "#E94F37", "#F6A057"].map((color) => (
            <button
              key={color}
              type="button"
              className="camerino-color-swatch"
              style={{ background: color }}
              onClick={() => setMemeOptions((prev) => ({ ...prev, bgColor: color }))}
            />
          ))}

          <input
            type="color"
            value={memeOptions.bgColor}
            onChange={(e) =>
              setMemeOptions((prev) => ({ ...prev, bgColor: e.target.value }))
            }
            className="camerino-color-picker"
          />

          <button
            type="button"
            className="camerino-update-btn"
            onClick={() => abrirPreview(frase.decision)}
          >
            🔄 Actualizar
          </button>
        </div>

        <label>
          🔤 Texto
          <input
            type="color"
            value={memeOptions.textColor}
            onChange={(e) =>
              setMemeOptions((prev) => ({ ...prev, textColor: e.target.value }))
            }
          />
        </label>

        <label>
          ✍️ Fuente
          <select
            value={memeOptions.font || "Georgia"}
            onChange={(e) => setMemeOptions((prev) => ({ ...prev, font: e.target.value }))}
          >
            <option value="Georgia">Georgia</option>
            <option value="Courier New">Courier New</option>
            <option value="Arial">Arial</option>
            <option value="Comic Sans MS">Comic Sans</option>
            <option value="Times New Roman">Times New Roman</option>
          </select>
        </label>
      </div>
    </>
  );

  const renderMobileMemeEditor = (frase, previewReady, onClose) => (
    <div className="camerino-meme-panel">
      <div className="camerino-meme-panel__header">
        <strong>Editar meme</strong>
        <button
          type="button"
          className="camerino-meme-panel__close"
          onClick={onClose}
          aria-label="Cerrar panel de meme"
        >
          ✖️
        </button>
      </div>
      {renderMemeEditorBody(frase, previewReady)}
    </div>
  );

  const isLocked =
    lockedPersonajeId === personaje.id || !canPlayPersonaje(personaje.id);

  // === Render ===
  if (!personaje) return null;

  return (
    <div className="camerino">
      {/* Fondo */}
      <div
        className="camerino-bg"
        style={{ backgroundImage: `url(${camerinoImage})` }}
      />

      {/* Contenido principal */}
      <div
        className={`camerino-blog${currentSlug ? ` camerino-blog--${currentSlug}` : ""}`}
        onTouchStart={handleSwipeStart}
        onTouchEnd={handleSwipeEnd}
      >
        <div key={currentSlug} className="camerino-blog__inner">
          {/* Ficha + Post fijo */}
          <div className="camerino-blog__draft camerino-blog__draft--default">
            {!isTouchDevice && (
              <>
                <button
                  type="button"
                  className="camerino-draft-nav camerino-draft-nav--prev"
                  onClick={goPrevCharacter}
                  aria-label="Personaje anterior"
                >
                  ‹
                </button>
                <button
                  type="button"
                  className="camerino-draft-nav camerino-draft-nav--next"
                  onClick={goNextCharacter}
                  aria-label="Siguiente personaje"
                >
                  ›
                </button>
              </>
            )}
            <div
              className="draft-image"
              style={{ backgroundImage: `url(${camerinoImage})`, cursor: nivelExpandido !== null ? "pointer" : "default" }}
              onClick={() => nivelExpandido !== null && setNivelExpandido(null)}
              role={nivelExpandido !== null ? "button" : undefined}
              aria-label={nivelExpandido !== null ? "Ver descripción del personaje" : undefined}
            >
              <div className="draft-image-overlay" />

              {/* Copies — parte inferior de la imagen: info del personaje o detalle del nivel */}
              <div className="camerino-hero-copy">
                {nivelExpandido === null ? (
                  <>
                    <p style={{ margin: 0, fontSize: "1.6rem", fontWeight: 800, color: "#fff", lineHeight: 1.1 }}>{personaje.nombre_visible}</p>
                    <p style={{ margin: "0.2rem 0 0", fontSize: "0.75rem", fontWeight: 700, color: "#ffd28a", letterSpacing: "0.08em" }}>{personaje.genero_literario}</p>
                    {personaje.intro && (
                      <p className="camerino-escenario__frase">{personaje.intro}</p>
                    )}
                  </>
                ) : (() => {
                  const n = niveles.find((nv) => nv.nivel === nivelExpandido);
                  return (
                    <>
                      <p style={{ margin: 0, fontSize: "1.6rem", fontWeight: 800, color: "#fff", lineHeight: 1.1 }}>{n?.nombre_nivel || `Nivel ${n?.nivel}`}</p>
                      <p style={{ margin: "0.2rem 0 0", fontSize: "0.75rem", fontWeight: 700, color: "#ffd28a", letterSpacing: "0.08em" }}>frase a improvisar</p>
                      <p className="camerino-escenario__frase">
                        {n?.frase_base
                          ? `${n.frase_base} …`
                          : "Mi mejor amiga es una gata muy ocurrente; fragmentada internamente y para colmo es terca como una tuerca oxidada."}
                      </p>
                    </>
                  );
                })()}
              </div>

            </div>

            {/* draft-content: chips siempre visibles + ojos (default) o botón ensayar (nivel seleccionado) */}
            <div className="draft-content">
              <div className={`camerino-escenario${nivelExpandido !== null ? " is-open" : ""}`}>
                <div className="camerino-escenario__burbuja">
                  {niveles.length > 0 && (
                    <div className="camerino-niveles" role="tablist">
                      {niveles.map((n) => (
                        <button
                          key={n.nivel}
                          type="button"
                          role="tab"
                          aria-selected={nivelExpandido === n.nivel}
                          className={`camerino-nivel__chip${nivelExpandido === n.nivel ? " is-active" : ""}`}
                          onClick={(e) => { e.stopPropagation(); setNivelExpandido(nivelExpandido === n.nivel ? null : n.nivel); }}
                        >
                          {n.nombre_nivel || `Nivel ${n.nivel}`}
                        </button>
                      ))}
                    </div>
                  )}
                  {nivelExpandido === null ? (
                    <div className="camerino-escenario__top">
                      <div className="character-selector__host-avatar camerino-escenario__host" aria-hidden="true">
                        <img src="/assets/gato_sticker.svg" alt="" className="character-selector__host-img" />
                        <span className="character-selector__host-blink" />
                      </div>
                    </div>
                  ) : (
                    <button
                      ref={btnRef}
                      type="button"
                      className="camerino-escenario__ensayar"
                      disabled={isLocked}
                      onClick={() => handleEntrarEscenario(nivelExpandido)}
                    >
                      Bajar a ensayar &#8594;
                    </button>
                  )}
                </div>
              </div>
            </div>

          </div>

          <LecternStage
            active={!!transformacion}
            genero={personaje?.genero_literario || ""}
            titulo={personaje?.nombre_visible || ""}
            lines={(transformacion?.texto_transformado || "")
              .split(/\n+/)
              .map((l) => l.trim())
              .filter(Boolean)}
            loading={false}
            onSave={async () => {
              if (!transformacion?.id) return;
              setPublicando(true);
              try {
                await publicarTransformacion(transformacion.id);
              } catch (err) {
                console.error("publicar:", err);
              } finally {
                setPublicando(false);
                clearTransformacion();
              }
            }}
            ctaLabel={publicando ? "Publicando…" : "Publicar en Gatologías →"}
          />

          <div className="camerino-quick-actions">
            <button
              type="button"
              className={`camerino-cta camerino-cta--ghost${activePanel === "textos" ? " is-active" : ""}`}
              onClick={() => setActivePanel("textos")}
            >
              Textos
            </button>
            <button
              type="button"
              className={`camerino-cta camerino-cta--ghost${activePanel === "memes" ? " is-active" : ""}`}
              onClick={() => setActivePanel("memes")}
            >
              Memes
            </button>
            <button
              type="button"
              className="camerino-cta camerino-cta--ghost"
              onClick={() => setScreen("compendio")}
            >
              Gatologias
            </button>
            <button
              type="button"
              className="camerino-cta camerino-cta--ghost"
              onClick={() => setScreen("selector")}
            >
              Selector
            </button>
          </div>

          {activePanel === "textos" && (
            <>
              <div className="camerino-filters" aria-label="Filtrar gatologias">
                <label className="camerino-filters__search">
                  <span className="camerino-filters__label">Buscar</span>
                  <input
                    type="search"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Titulo o contenido"
                  />
                </label>
                <div className="camerino-filters__chips">
                  <button
                    type="button"
                    className={`camerino-chip${filterMode === "all" ? " is-active" : ""}`}
                    onClick={() => setFilterMode("all")}
                  >
                    Todas
                  </button>
                  <button
                    type="button"
                    className={`camerino-chip${filterMode === "pinned" ? " is-active" : ""}`}
                    onClick={() => setFilterMode("pinned")}
                  >
                    Pineadas
                  </button>
                  <button
                    type="button"
                    className={`camerino-chip${filterMode === "recent" ? " is-active" : ""}`}
                    onClick={() => setFilterMode("recent")}
                  >
                    Recientes
                  </button>
                </div>
              </div>

              {/* Gatologías Supabase */}
              {filteredEntries.map((entry) => (
                <BlogEntry
                  key={entry.id}
                  entry={entry}
                  onSave={handleSave}
                  onDelete={handleDelete}
                  onTogglePin={handleTogglePin}
                />
              ))}

              {!filteredEntries.length && (
                <div className="camerino-filters__empty">
                  No hay gatologias que coincidan con tu busqueda.
                </div>
              )}
            </>
          )}

          {activePanel === "memes" && (
            <div className="camerino-memes">
              {frasesLoading && (
                <p className="camerino-memes__status">Cargando frases...</p>
              )}
              {!frasesLoading && frases.length === 0 && (
                <p className="camerino-memes__status">
                  Aun no hay frases guardadas.
                </p>
              )}
              {!frasesLoading && frases.length > 0 && (
                <>
                  <div className="camerino-meme-filters" aria-label="Filtrar frases">
                    <label className="camerino-meme-filters__search">
                      <span>Buscar</span>
                      <input
                        type="search"
                        value={fraseSearchTerm}
                        onChange={(e) => setFraseSearchTerm(e.target.value)}
                        placeholder="Buscar frases"
                      />
                    </label>
                    <div className="camerino-meme-filters__chips">
                      <button
                        type="button"
                        className={`camerino-chip${fraseFilterMode === "all" ? " is-active" : ""}`}
                        onClick={() => setFraseFilterMode("all")}
                      >
                        Todas
                      </button>
                      <button
                        type="button"
                        className={`camerino-chip${fraseFilterMode === "favoritas" ? " is-active" : ""}`}
                        onClick={() => setFraseFilterMode("favoritas")}
                      >
                        Favoritas
                      </button>
                      <button
                        type="button"
                        className={`camerino-chip${fraseFilterMode === "recientes" ? " is-active" : ""}`}
                        onClick={() => setFraseFilterMode("recientes")}
                      >
                        Recientes
                      </button>
                    </div>
                  </div>
                  <ul className="camerino-memes__list">
                    {filteredFrases.map((f, idx) => {
                      const fraseId = obtenerFraseId(f, idx);
                      const estaAbierto = activeMemeFraseId === fraseId;
                      const favorita = isFraseFavorita(f);
                      const previewReady =
                        estaAbierto &&
                        memePreview.url &&
                        memePreview.frase === f.decision;
                      return (
                        <li key={`${f.created_at}-${idx}`} className="camerino-meme-item">
                          <div className="camerino-meme-item__meta">
                            <button
                              type="button"
                              className={`camerino-meme-star${favorita ? " is-active" : ""}`}
                              onClick={() => handleToggleFavorita(f)}
                              aria-label={favorita ? "Quitar de favoritas" : "Marcar como favorita"}
                            >
                              ★
                            </button>
                            <button
                              type="button"
                              className="camerino-meme-delete"
                              onClick={() => handleDeleteFrase(f)}
                              aria-label="Borrar frase"
                            >
                              🗑️
                            </button>
                          </div>
                          <p>{f.decision}</p>
                          <div className="camerino-meme-actions">
                            <button onClick={() => compartirTwitter(f.decision)}>
                              🐦 Tweet
                            </button>
                            <button
                              type="button"
                              onClick={() => handleToggleMeme(f, fraseId)}
                            >
                              📱 Meme
                            </button>
                          </div>

                          {estaAbierto &&
                            isMobileView &&
                            renderMobileMemeEditor(f, previewReady, closeMemeInterface)}
                        </li>
                      );
                    })}
                  </ul>
                  {!filteredFrases.length && (
                    <div className="camerino-memes__status">
                      No hay frases que coincidan con tu busqueda.
                    </div>
                  )}
                  <canvas ref={canvasRef} style={{ display: "none" }} />
                </>
              )}
            </div>
          )}

          {/* Nuevo draft (modo edición) */}
          {draft?.status === "nuevo" && (
            <BlogEntry
              key={draft.id}
              entry={draft}
              onSave={async (updatedEntry) => {
                const { error } = await supabase
                  .from("gatologias")
                  .update({
                    titulo: updatedEntry.titulo,
                    contenido: updatedEntry.contenido,
                  })
                  .eq("id", updatedEntry.id);

                if (error)
                  console.error("❌ Error actualizando gatología:", error.message);
                else console.log("✅ Gatología actualizada:", updatedEntry.titulo);
              }}
            />
          )}
        </div>
      </div>

      {activePanel === "memes" && !isMobileView && activeFrase && (
        <div className="camerino-meme-overlay" onClick={closeMemeInterface}>
          <div
            className="camerino-meme-container"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="camerino-meme-overlay__header">
              <strong>Editar meme</strong>
              <button
                type="button"
                className="camerino-meme-overlay__close"
                onClick={closeMemeInterface}
                aria-label="Cerrar panel de meme"
              >
                ✖️
              </button>
            </div>
            {renderMemeEditorBody(activeFrase, activePreviewReady)}
          </div>
        </div>
      )}
    </div>
  );
}
