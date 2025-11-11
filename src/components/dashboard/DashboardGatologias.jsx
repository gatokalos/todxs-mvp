import React, { useEffect, useMemo, useState } from "react";
import useGameStore from "../../store/useGameStore";
import { supabase } from "../../lib/supabaseClient";
import ProgresoWidget from "./widgets/ProgresoWidget";
import ActividadWidget from "./widgets/ActividadWidget";
import ComunidadWidget from "./widgets/ComunidadWidget";
import PersonajesDestacadosWidget from "./widgets/PersonajesDestacadosWidget";
import ReflexionGatoWidget from "./widgets/ReflexionGatoWidget";
import HuellaWidget from "./widgets/HuellaWidget";
import TusGatografiasWidget from "./widgets/TusGatografiasWidget";
import { resolveOwnerId } from "../../utils/gatologiaUtils";
import "./dashboard.css";

const PERSONAJES = [
  { id: "la-maestra", nombre: "La Maestra", avatar: "/assets/la-maestra.png" },
  { id: "silvestre", nombre: "Silvestre", avatar: "/assets/glitch-formal.png" },
  { id: "reina-de-espadas", nombre: "Reina de Espadas", avatar: "/assets/telon.png" },
  { id: "don-polo", nombre: "Don Polo", avatar: "/assets/atril_gato.svg" },
  { id: "la-doctora", nombre: "La Doctora", avatar: "/assets/doctora_carita.svg" },
  { id: "payasito-triste", nombre: "Payasito Tiste", avatar: "/assets/glitch-formal.png" },
  { id: "saturnina", nombre: "Saturnina", avatar: "/assets/esfera.svg" },
  { id: "lucinda", nombre: "Lucinda", avatar: "/assets/gato_colita.svg" },
  { id: "andy", nombre: "Andy", avatar: "/assets/logo_transmedia.png" },
];

const SELECT_FIELDS =
  "id, titulo, contenido, personaje_slug, user_id, usuario_id, anon_id, is_public, is_pinned, votes, created_at, estado, tipo";

export default function DashboardGatologias() {
  const role = useGameStore((state) => state.role);
  const setScreen = useGameStore((state) => state.setScreen);
  const [gatologias, setGatologias] = useState([]);
  const [globalStats, setGlobalStats] = useState({
    totalFrases: 0,
    totalPersonajes: 0,
    totalAutores: 0,
  });
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchData() {
      try {
        if (!supabase) {
          console.warn("⚠️ Supabase no configurado. Dashboard en modo local.");
          if (isMounted) {
            setGatologias([]);
            setUser(null);
            setGlobalStats({
              totalFrases: 0,
              totalPersonajes: 0,
              totalAutores: 0,
            });
          }
          return;
        }

        const [{ data: authData }, gatologiasRes] = await Promise.all([
          supabase.auth.getUser(),
          supabase
            .from("gatologias")
            .select(SELECT_FIELDS, { count: "exact" })
            .order("created_at", { ascending: false })
            .limit(160),
        ]);

        if (isMounted) {
          const fetched = Array.isArray(gatologiasRes.data) ? gatologiasRes.data : [];
          setGatologias(fetched);
          setUser(authData?.user ?? null);

          const uniquePersonajes = new Set(
            fetched.map((row) => row?.personaje_slug).filter(Boolean)
          );
          const uniqueAutores = new Set(
            fetched
              .map((row) => resolveOwnerId(row))
              .filter(Boolean)
          );

          setGlobalStats({
            totalFrases: typeof gatologiasRes.count === "number" ? gatologiasRes.count : fetched.length,
            totalPersonajes: uniquePersonajes.size,
            totalAutores: uniqueAutores.size,
          });
        }
      } catch (err) {
        console.error("❌ Error cargando dashboard:", err);
        if (isMounted) {
          setError(err);
          setGatologias([]);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchData();
    return () => {
      isMounted = false;
    };
  }, []);

  const dashboardUser = useMemo(() => {
    if (!user) return role ? { role } : null;
    if (role && role !== "anon") {
      return { ...user, client_role: role };
    }
    return user;
  }, [user, role]);

  if (loading) return <div className="dash">Cargando universo gatológico...</div>;

  return (
    <div className="dash">
      <button
        type="button"
        className="dash__selector-btn"
        onClick={() => setScreen("selector")}
        aria-label="Regresar al selector de personajes"
      >
        <img src="/assets/gato_carita.svg" alt="" aria-hidden="true" />
        <span>Selector</span>
      </button>

      <header className="dash__header">
        <h1>Gatologías</h1>
        <p>Un espacio narrativo-colaborativo que respira con la comunidad.</p>
      </header>

      {error && (
        <div className="dash__error" role="alert">
          Algo salió mal al conectar con Supabase. Mostramos datos locales por ahora.
        </div>
      )}

      <section className="dash__masonry" aria-live="polite">
        <ProgresoWidget gatologias={gatologias} user={dashboardUser} globalStats={globalStats} />
        <ActividadWidget gatologias={gatologias} user={dashboardUser} personajes={PERSONAJES} />
        <ComunidadWidget gatologias={gatologias} user={dashboardUser} personajes={PERSONAJES} />
        <PersonajesDestacadosWidget gatologias={gatologias} personajes={PERSONAJES} />
        <ReflexionGatoWidget />
        <HuellaWidget gatologias={gatologias} user={dashboardUser} globalStats={globalStats} />
        <TusGatografiasWidget />
      </section>

      <footer className="dash__footer">
        <button
          className="btn btn--ghost"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          aria-label="Volver al inicio del tablero"
        >
          ↑ Volver arriba
        </button>
      </footer>
    </div>
  );
}
