// src/components/Blog.jsx
import { useEffect, useState } from "react";
import {
  fetchBlogEntries,
  updateGatologia,
  insertGatologia,
  deleteGatologia,
  togglePinned,
} from "../services/api";
import BlogEntry from "./BlogEntry";
import "./Blog.css";

export default function Blog() {
  const [entries, setEntries] = useState([]);

  useEffect(() => {
    fetchBlogEntries().then(setEntries);
  }, []);

  const handleSave = async (entry) => {
    let saved;

    if (entry.id) {
      saved = await updateGatologia(entry.id, {
        titulo: entry.titulo,
        contenido: entry.contenido,
      });

      setEntries((prev) =>
        prev.map((e) => (e.id === entry.id ? { ...e, ...entry } : e))
      );
    } else {
      const personajeSlug = entry.personaje_slug || entry.personaje || "blog";
      saved = await insertGatologia({
        personaje_slug: personajeSlug,
        titulo: entry.titulo,
        contenido: entry.contenido,
        estado: "blog",
      });

      if (saved) {
        setEntries((prev) => [saved, ...prev]);
      }
    }
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
            onDelete={handleDelete}
            onTogglePin={handleTogglePin}
          />
        ))}
      </div>
    </div>
  );
}
