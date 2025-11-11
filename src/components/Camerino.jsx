// src/components/Camerino.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
gsap.registerPlugin(ScrollTrigger);

import useGameStore from "../store/useGameStore";
import {
  fetchGatologias,
  insertGatologia,
  updateGatologia,
  publishGatologia,
} from "../services/api";
import "./Camerino.css";
import BlogEntry from "./BlogEntry";
import GatologiasSticky from "./GatologiasSticky";
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
    .single();

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

  const personaje = useGameStore((s) => s.personajeSeleccionado);
  const [entries, setEntries] = useState([]);
  const [camerinoImage, setCamerinoImage] = useState(null);
  const [stats, setStats] = useState(null);

  const setScreen = useGameStore((s) => s.setScreen);
  const setPersonajeActual = useGameStore((s) => s.setPersonajeActual);
  const setPersonajeSeleccionado = useGameStore((s) => s.setPersonajeSeleccionado);
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

  // === Cortinas de apertura ===
  useEffect(() => {
    const left = curtainLeftRef.current;
    const right = curtainRightRef.current;
    if (!left || !right) return;

    const tl = gsap.timeline();
    gsap.set([left, right], { xPercent: 0 });
    tl.to(left, { xPercent: -100, duration: 1.8, ease: "power4.inOut" })
      .to(right, { xPercent: 100, duration: 1.8, ease: "power4.inOut" }, 0);

    return () => tl.kill();
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

  const handleEntrarEscenario = () => {
    if (!personaje) return;
    const personajeId = personaje.id || personaje.slug;
    setPersonajeActual(personajeId);
    setScreen("gameboard");
  };

  const isLocked =
    lockedPersonajeId === personaje.id || !canPlayPersonaje(personaje.id);

  // === Render ===
  if (!personaje) return null;

  return (
    <div className="camerino">
      {/* Cortinas */}
      <div ref={curtainLeftRef} className="curtain curtain-left" />
      <div ref={curtainRightRef} className="curtain curtain-right" />

      {/* Fondo */}
      <div
        className="camerino-bg"
        style={{ backgroundImage: `url(${camerinoImage})` }}
      />


      <GatologiasSticky onClick={() => setScreen("compendio")} />

      {/* Contenido principal */}
      <div
        className="camerino-blog"
        onTouchStart={handleSwipeStart}
        onTouchEnd={handleSwipeEnd}
      >
        <div key={currentSlug} className="camerino-blog__inner">
      
                    
    

        {/* Ficha + Post fijo */}
        <div className="camerino-blog__draft camerino-blog__draft--default">
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
          
   
           {/* Botones flotantes */}
      <button
        ref={btnRef}
        type="button"
        className="btn-entrar-sticky"
        onClick={handleEntrarEscenario}
        disabled={isLocked}
        title={
          isLocked
            ? "Este personaje está bloqueado para tu rol actual"
            : undefined
        }
      >
        <span>Entrar al escenario</span>
      </button>

                       <div className="draft-image" style={{ backgroundImage: `url(${camerinoImage})` }}>
  <div className="draft-image-overlay" />
  <div className="camerino-ficha">
    <h2>{personaje.nombre_visible}</h2>
    <h4>{personaje.genero_literario}</h4>
  </div>
</div>

          <div className="draft-content">
            <h3>Resumen semanal</h3>
            <p>
              Jugado <strong>{stats?.jugado_veces ?? "—"}</strong> veces esta
              semana · Popularidad ⭐⭐⭐⭐☆
              <br />
              Última actividad: hace{" "}
              {stats?.dias_desde_ultima_actividad ?? "—"} días.
              <br />
              Este bloque es informativo y solo editable por el superadmin.
            </p>
            
          </div>

        </div>
        

        {/* Gatologías Supabase */}
        {entries.map((entry) => (
          <BlogEntry key={entry.id} entry={entry} onSave={handleSave} />
        ))}

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
    </div>
  );
}
