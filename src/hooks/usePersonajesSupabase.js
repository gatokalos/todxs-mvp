import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

export default function usePersonajesSupabase() {
  const supabaseReady = Boolean(supabase);
  const [personajes, setPersonajes] = useState([]);
  const [loading, setLoading] = useState(supabaseReady);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchPersonajes() {
      if (!supabase) {
        setError("Supabase no está configurado");
        setLoading(false);
        return;
      }

      setLoading(true);

      const { data, error: queryError } = await supabase
        .from("personajes")
        .select(
          "id, nombre, estilo_narrativo, genero_literario, sticker_url, icono, slug"
        )
        .order("nombre", { ascending: true });

      if (cancelled) return;

      if (queryError) {
        setError(queryError.message);
        setLoading(false);
        return;
      }

      setPersonajes(data ?? []);
      setError(null);
      setLoading(false);
    }

    fetchPersonajes();

    return () => {
      cancelled = true;
    };
  }, []);

  return { personajes, loading, error };
}
