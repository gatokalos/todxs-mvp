import React, { useState, useRef, useEffect } from "react";
import SpotlightOverlay from "@/components/SpotlightOverlay";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";

export default function BlogEntry({ entry, onSave }) {
  const [isEditing, setIsEditing] = useState(false);
  const [titulo, setTitulo] = useState(entry.titulo);
  const [contenido, setContenido] = useState(entry.contenido);
  const [loading, setLoading] = useState(false);
  const postRef = useRef(null);

  // Toolbar Quill
  const modules = {
    toolbar: [
      [{ header: [1, 2, 3, false] }],
      ["bold", "italic", "underline"],
      [{ list: "ordered" }, { list: "bullet" }],
      [{ font: [] }],
      ["clean"],
    ],
  };

  // Bloqueo de scroll al editar
  useEffect(() => {
    document.body.style.overflow = isEditing ? "hidden" : "";
    return () => (document.body.style.overflow = "");
  }, [isEditing]);

  const handleGuardar = async () => {
    setLoading(true);
    try {
      await onSave({ ...entry, titulo, contenido });
      setIsEditing(false);
    } catch (e) {
      console.error("❌ Error guardando:", e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {isEditing ? (
        <SpotlightOverlay onClose={() => setIsEditing(false)}>
          <div className="draft-frame">
            <input
              type="text"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              className="draft-title"
            />
            <ReactQuill
              value={contenido}
              onChange={setContenido}
              modules={modules}
              theme="snow"
              className="draft-editor"
            />
            <div className="draft-actions">
              <button onClick={handleGuardar} disabled={loading}>
                💾 Guardar
              </button>
              <button onClick={() => setIsEditing(false)}>❌ Cancelar</button>
            </div>
          </div>
        </SpotlightOverlay>
      ) : (
        <article ref={postRef} className={`blog-card ${entry.pinned ? "pinned" : ""}`}>
    {/* Acciones arriba a la derecha */}
    <div className="blog-card__actions">
      <button
        className="blog-card__btn"
        title="Pinear"
        onClick={() => alert(`📌 Post pineado: ${entry.titulo}`)}
      >
        📌
      </button>
      <button
        className="blog-card__btn"
        title="Borrar"
        onClick={() => {
          if (confirm("¿Seguro que quieres borrar esta entrada?")) {
            alert(`🗑️ Borrado: ${entry.titulo}`);
          }
        }}
      >
        🗑️
      </button>
    </div>





    {/* Contenido */}
    <h3 className="blog-card__title">{titulo}</h3>
    <div
      className="blog-card__content"
      dangerouslySetInnerHTML={{ __html: contenido }}
    />

  

    {/* Acciones inferiores (las tuyas) */}
    <div className="camerino-blog__draft-actions">
      <button onClick={() => setIsEditing(true)}>✏️ Editar</button>
      <button onClick={() => alert("Compartir próximamente")}>🌐 Compartir</button>
      <button onClick={() => alert("Generar imagen próximamente")}>🖼️ Crear imagen</button>
    </div>
          {/* 🕒 Fecha */}
          <div className="blog-card__meta">
            {new Date(entry.created_at).toLocaleString("es-MX", {
              dateStyle: "medium",
              timeStyle: "short",
            })}
          </div>
        </article>
      )}
    </>
  );
}



