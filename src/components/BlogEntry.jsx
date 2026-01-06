import React, { useState, useRef, useEffect, useCallback } from "react";
import SpotlightOverlay from "@/components/SpotlightOverlay";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";

export default function BlogEntry({
  entry,
  onSave,
  onDelete,
  onTogglePin,
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [titulo, setTitulo] = useState(entry.titulo);
  const [contenido, setContenido] = useState(entry.contenido);
  const [loading, setLoading] = useState(false);
  const postRef = useRef(null);
  const shareInFlightRef = useRef(false);

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

  const stripHtml = useCallback((html = "") => {
    if (!html) return "";
    const tmp = document.createElement("div");
    tmp.innerHTML = html;
    return (tmp.textContent || tmp.innerText || "").trim();
  }, []);

  const buildShareText = useCallback(() => {
    const title = titulo?.trim() || "Gatología";
    const body = stripHtml(contenido);
    return `${title}\n\n${body}`;
  }, [contenido, stripHtml, titulo]);

  const handleShare = useCallback(async () => {
    if (shareInFlightRef.current) return;
    shareInFlightRef.current = true;
    const text = buildShareText();
    try {
      if (navigator.share) {
        await navigator.share({ title: titulo || "Gatología", text });
      } else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        window.prompt("Copia este texto:", text);
      }
    } catch (err) {
      console.warn("⚠️ Error compartiendo:", err);
    } finally {
      shareInFlightRef.current = false;
    }
  }, [buildShareText, titulo]);

  const handleCreateImage = useCallback(() => {
    const text = buildShareText();
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = 900;
    const padding = 56;
    const maxTextWidth = width - padding * 2;
    const fontTitle = "600 36px Fraunces, Georgia, serif";
    const fontBody = "28px Fraunces, Georgia, serif";

    ctx.font = fontBody;
    const words = text.split(/\s+/);
    const lines = [];
    let line = "";
    words.forEach((word) => {
      const test = line ? `${line} ${word}` : word;
      const metrics = ctx.measureText(test);
      if (metrics.width > maxTextWidth && line) {
        lines.push(line);
        line = word;
      } else {
        line = test;
      }
    });
    if (line) lines.push(line);

    const lineHeight = 38;
    const height = padding * 2 + 80 + lines.length * lineHeight;
    canvas.width = width;
    canvas.height = Math.max(520, height);

    const gradient = ctx.createLinearGradient(0, 0, width, canvas.height);
    gradient.addColorStop(0, "rgba(34, 26, 50, 1)");
    gradient.addColorStop(1, "rgba(18, 12, 26, 1)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "rgba(255, 255, 255, 0.08)";
    ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
    ctx.lineWidth = 2;
    const cardX = padding - 12;
    const cardY = padding - 12;
    const cardW = width - (padding - 12) * 2;
    const cardH = canvas.height - (padding - 12) * 2;
    const radius = 24;
    ctx.beginPath();
    ctx.moveTo(cardX + radius, cardY);
    ctx.arcTo(cardX + cardW, cardY, cardX + cardW, cardY + cardH, radius);
    ctx.arcTo(cardX + cardW, cardY + cardH, cardX, cardY + cardH, radius);
    ctx.arcTo(cardX, cardY + cardH, cardX, cardY, radius);
    ctx.arcTo(cardX, cardY, cardX + cardW, cardY, radius);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "rgba(255, 239, 231, 0.95)";
    ctx.font = fontTitle;
    ctx.fillText(titulo || "Gatología", padding, padding + 36);

    ctx.fillStyle = "rgba(235, 230, 245, 0.9)";
    ctx.font = fontBody;
    let y = padding + 80;
    lines.forEach((l) => {
      ctx.fillText(l, padding, y);
      y += lineHeight;
    });

    const link = document.createElement("a");
    link.download = `${(titulo || "gatologia").replace(/\s+/g, "_")}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  }, [buildShareText, titulo]);

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
        title={entry.pinned ? "Despinear" : "Pinear"}
        onClick={() => onTogglePin?.(entry)}
      >
        📌
      </button>
      <button
        className="blog-card__btn"
        title="Borrar"
        onClick={() => {
          if (confirm("¿Seguro que quieres borrar esta entrada?")) {
            onDelete?.(entry);
          }
        }}
      >
        🗑️
      </button>
    </div>





    <div
      className={`blog-card__image${entry.imagen_url ? "" : " blog-card__image--placeholder"}`}
      style={{
        backgroundImage: entry.imagen_url
          ? `url(${entry.imagen_url})`
          : "linear-gradient(140deg, rgba(255, 210, 160, 0.25), rgba(120, 86, 180, 0.35))",
      }}
      aria-hidden="true"
    />
    <button
      className="blog-card__image-cta"
      type="button"
      onClick={handleCreateImage}
    >
      🖼️ Crear imagen
    </button>

    {/* Contenido */}
    <h3 className="blog-card__title">{titulo}</h3>
    <div
      className="blog-card__content"
      dangerouslySetInnerHTML={{ __html: contenido }}
    />

  

    {/* Acciones inferiores (las tuyas) */}
    <div className="camerino-blog__draft-actions">
      <button onClick={() => setIsEditing(true)}>✏️ Editar</button>
      <button onClick={handleShare}>🌐 Compartir</button>
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
