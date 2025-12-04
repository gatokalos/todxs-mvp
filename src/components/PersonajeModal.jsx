import { useEffect, useMemo, useRef, useState } from "react";
import useGameStore from "../store/useGameStore";
import { api } from "../services/api";
import "./PersonajeModal.css";

const PANEL_TRANSITION_MS = 600;

export default function PersonajeModal({ personaje, onClose }) {
  const [frases, setFrases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const closeTimerRef = useRef(null);
  const setScreen = useGameStore((s) => s.setScreen);
  const [notificacion, setNotificacion] = useState(null);

  // 👇 canvas para generar memes
  const canvasRef = useRef(null);

  const [activeMemeFraseId, setActiveMemeFraseId] = useState(null);
  const [generatingMeme, setGeneratingMeme] = useState(false);
  const [isMobileView, setIsMobileView] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(max-width: 768px)").matches;
  });

  // Estado del overlay
  const [memePreview, setMemePreview] = useState({ frase: "", url: "" });
  const [memeOptions, setMemeOptions] = useState({
    bgColor: "#000000",
    textColor: "#ffffff",
  });


useEffect(() => {
  function handleNuevaGatologia(e) {
    setNotificacion(e.detail);
    setTimeout(() => setNotificacion(null), 8000); // desaparece en 8 seg
  }

  window.addEventListener("nuevaGatologia", handleNuevaGatologia);
  return () => window.removeEventListener("nuevaGatologia", handleNuevaGatologia);
}, []);

useEffect(() => {
  if (typeof window === "undefined") return undefined;
  const mql = window.matchMedia("(max-width: 768px)");
  const handler = (event) => setIsMobileView(event.matches);
  handler(mql);
  mql.addEventListener?.("change", handler);
  return () => mql.removeEventListener?.("change", handler);
}, []);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setIsOpen(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function fetchFrases() {
      if (!personaje?.id) {
        setFrases([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const data = await api.fetchEleccionesPorPersonaje(personaje.id);
        if (cancelled) return;
        setFrases(Array.isArray(data) ? data : []);
      } catch (error) {
        if (cancelled) return;
        console.error("❌ Error cargando elecciones:", error);
        setFrases([]);
      }
      setLoading(false);
    }
    fetchFrases();
    return () => {
      cancelled = true;
    };
  }, [personaje?.id]);

  const startClose = (afterClose) => {
    setIsOpen(false);
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    closeTimerRef.current = setTimeout(() => {
      closeTimerRef.current = null;
      onClose();
      afterClose?.();
    }, PANEL_TRANSITION_MS);
  };

  const handleGoSelector = () => startClose(() => setScreen("selector"));
  const handleGoCamerino = () => startClose(() => setScreen("camerino"));

  // ==================== COMPARTIR ====================
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
    const width = 1000,
      height = 600;
    canvas.width = width;
    canvas.height = height;

    // Fondo
    ctx.fillStyle = opciones.bgColor;
    ctx.fillRect(0, 0, width, height);

    // Texto
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
      const testLine = line + words[i] + " ";
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxWidth && i > 0) {
        lines.push(line);
        line = words[i] + " ";
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
    // ⚠️ Mejor si subes a Supabase y usas un link público
    const wa = `https://wa.me/?text=${encodeURIComponent(
      "Mira este meme 😸 " + memePreview.url
    )}`;
    window.open(wa, "_blank");
  };
  // ==================================================

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
      <div className="meme-panel__preview">
        {generatingMeme && !memePreview.url ? (
          <p className="meme-panel__loading">Generando vista previa...</p>
        ) : previewReady ? (
          <img
            src={memePreview.url}
            alt={`Vista previa del meme para ${personaje?.nombre || "el personaje"}`}
          />
        ) : (
          <p className="meme-panel__placeholder">
            Toca Actualizar para ver la vista previa.
          </p>
        )}
      </div>

      <div className="meme-actions">
        <button type="button" onClick={descargarMeme} disabled={!previewReady}>
          ⬇️ Descargar
        </button>
        <button type="button" onClick={compartirWhatsApp} disabled={!previewReady}>
          📱 WhatsApp
        </button>
      </div>

      <div className="meme-options">
        <div className="color-palette">
          {["#D9C4F3", "#F9B4D4", "#FCA17D", "#E94F37", "#F6A057"].map((color) => (
            <button
              key={color}
              type="button"
              className="color-swatch"
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
            className="color-picker"
          />

          <button
            type="button"
            className="update-btn"
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
    <div className="meme-panel">
      <div className="meme-panel__header">
        <strong>Editar meme</strong>
        <button
          type="button"
          className="meme-panel__close"
          onClick={onClose}
          aria-label="Cerrar panel de meme"
        >
          ✖️
        </button>
      </div>
      {renderMemeEditorBody(frase, previewReady)}
    </div>
  );

  return (
    <div
      className={`modal-backdrop ${isOpen ? "is-active" : ""}`}
      role="presentation"
      onClick={() => startClose()}
    >
      <aside
        className={`modal-panel ${isOpen ? "is-open" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label={`Frases guardadas de ${personaje?.nombre ?? "la Maestra"}`}
        onClick={(e) => e.stopPropagation()}
      >
        <header className="modal-header">
          <h2>{personaje?.nombre ?? "La Maestra"}</h2>
          <div className="modal-header-actions">
            <button onClick={handleGoSelector}>🏠 Inicio</button>
            <button onClick={handleGoCamerino}>🎭 Camerino</button>
            <button onClick={() => startClose()}>✖️</button>
          </div>
        </header>

        {loading && <p className="modal-status">Cargando frases...</p>}
        {!loading && frases.length === 0 && (
          <p className="modal-status">Aún no hay frases guardadas.</p>
        )}

        {!loading && frases.length > 0 && (
          <>
            <ul className="modal-frase-list">
              {frases.map((f, idx) => {
                const fraseId = obtenerFraseId(f, idx);
                const estaAbierto = activeMemeFraseId === fraseId;
                const previewReady =
                  estaAbierto &&
                  memePreview.url &&
                  memePreview.frase === f.decision;
                return (
                  <li key={`${f.created_at}-${idx}`} className="frase-item">
                    <p>{f.decision}</p>
                    <div className="acciones">
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
            <canvas ref={canvasRef} style={{ display: "none" }} />
          </>
        )}
      </aside>
      {!isMobileView && activeFrase && (
        <div className="meme-overlay" onClick={closeMemeInterface}>
          <div className="meme-container" onClick={(event) => event.stopPropagation()}>
            <div className="meme-overlay__header">
              <strong>Editar meme</strong>
              <button
                type="button"
                className="meme-overlay__close"
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
