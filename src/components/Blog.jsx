// src/components/Blog.jsx
import { useEffect, useState } from "react";
import { fetchBlogEntries, updateGatologia } from "../services/api";
import BlogEntry from "./BlogEntry";
import "./Blog.css";
import { fetchBlogEntries, updateGatologia, insertGatologia } from "../services/api";

export default function Blog() {
  const [entries, setEntries] = useState([]);

  useEffect(() => {
    fetchBlogEntries().then(setEntries);
  }, []);

  const handleSave = async (entry) => {
  let saved;

  if (entry.id) {
    // Update en Supabase
    saved = await updateGatologia(entry.id, {
      titulo: entry.titulo,
      contenido: entry.contenido,
    });

    // Actualiza el estado local inmediatamente
    setEntries((prev) =>
      prev.map((e) => (e.id === entry.id ? { ...e, ...entry } : e))
    );
  } else {
    // Insert en Supabase (nueva gatología)
    saved = await insertGatologia({
      personaje_slug: personaje.slug,
      titulo: entry.titulo,
      contenido: entry.contenido,
      estado: "draft",
    });

    if (saved) {
      setEntries((prev) => [saved, ...prev]);
    }
  }

  // 🔄 Copia también al "blog" (otra tabla o mismo con estado diferente)
  if (saved) {
    try {
      await insertGatologia({
        personaje_slug: personaje.slug,
        titulo: saved.titulo,
        contenido: saved.contenido,
        estado: "blog", // 👈 aquí se marca para blog
      });
    } catch (err) {
      console.error("❌ Error guardando en blog:", err);
    }
  }
};
  

  return (
    <div className="blog">
      <h1>📝 Blog de Gatologías</h1>
      {entries.length === 0 && (
        <p className="blog-empty">No hay entradas en el blog todavía.</p>
      )}
      
      
      

      <div className="blog-grid">
        {entries.map((entry) => (
          <BlogEntry
            key={entry.id}
            entry={entry}
            context="blog"
            onSave={handleSave}
          />
        ))}
      </div>
    </div>
  );
}