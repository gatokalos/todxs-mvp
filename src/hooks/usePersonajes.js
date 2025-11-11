import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

export default function usePersonajes() {
  const [personajes, setPersonajes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchPersonajes() {
      try {
        const { data, error } = await supabase
          .from("personajes")
          .select("id, nombre, estilo_narrativo, genero_literario");

        if (error) throw error;
        setPersonajes(data || []);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }

    fetchPersonajes();
  }, []);

  return { personajes, loading, error };
}