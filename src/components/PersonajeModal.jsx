import { useEffect, useRef, useState } from "react";
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

  // Estado del overlay
  const [memePreview, setMemePreview] = useState(null);
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
    const url = await generarMeme(frase, memeOptions);
    setMemePreview({ frase, url });
  };

  const cerrarPreview = () => setMemePreview(null);

  const descargarMeme = async () => {
    if (!memePreview?.url) return;
    const link = document.createElement("a");
    link.download = `meme-${Date.now()}.png`;
    link.href = memePreview.url;
    link.click();
  };

  const compartirWhatsApp = async () => {
    if (!memePreview?.url) return;
    // ⚠️ Mejor si subes a Supabase y usas un link público
    const wa = `https://wa.me/?text=${encodeURIComponent(
      "Mira este meme 😸 " + memePreview.url
    )}`;
    window.open(wa, "_blank");
  };
  // ==================================================

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
              {frases.map((f, idx) => (
                <li key={`${f.created_at}-${idx}`} className="frase-item">
                  <p>{f.decision}</p>
                  <div className="acciones">
                    <button onClick={() => compartirTwitter(f.decision)}>
                      🐦 Tweet
                    </button>
                    <button onClick={() => abrirPreview(f.decision)}>
                      📱 Meme
                    </button>
                  </div>
                </li>
              ))}
            </ul>
            <canvas ref={canvasRef} style={{ display: "none" }} />
          </>
        )}
      </aside>

     {memePreview && (
  <div
    className="meme-overlay"
    onClick={(e) => e.stopPropagation()} // evita que se cierre al hacer click dentro
  >
    <button className="close-btn" onClick={cerrarPreview}>✖️</button>
    
    <div className="meme-container">
      <img
        src={memePreview.url}
        alt="Meme preview"
        style={{ maxWidth: "80%", maxHeight: "60vh" }}
      />

      {/* Acciones principales */}
      <div className="meme-actions">
        <button type="button" onClick={descargarMeme}>⬇️ Descargar</button>
        <button type="button" onClick={compartirWhatsApp}>📱 WhatsApp</button>
      </div>

      {/* Opciones de estilo */}
      <div className="meme-options">
        {/* Paleta de colores */}
        <div className="color-palette">
    {["#D9C4F3", "#F9B4D4", "#FCA17D", "#E94F37", "#F6A057"].map((color) => (
      <button
        key={color}
        type="button"
        className="color-swatch"
        style={{ background: color }}
        onClick={(e) => {
          e.stopPropagation();
          setMemeOptions({ ...memeOptions, bgColor: color });
        }}
      />
    ))}

    {/* Opción infinita */}
    <input
      type="color"
      value={memeOptions.bgColor}
      onClick={(e) => e.stopPropagation()}
      onChange={(e) =>
        setMemeOptions({ ...memeOptions, bgColor: e.target.value })
      }
      className="color-picker"
    />

    {/* Botón actualizar */}
    <button
      type="button"
      className="update-btn"
      onClick={(e) => {
        e.stopPropagation();
        abrirPreview(memePreview.frase);
      }}
    >
      🔄 Actualizar
    </button>
  </div>

  {/* Input manual de texto */}
  <label>
    🔤 Texto
    <input
      type="color"
      value={memeOptions.textColor}
      onClick={(e) => e.stopPropagation()}
      onChange={(e) =>
        setMemeOptions({ ...memeOptions, textColor: e.target.value })
      }
    />
  </label>

  {/* Selector de tipografía */}
  <label>
    ✍️ Fuente
    <select
      value={memeOptions.font || "Georgia"}
      onClick={(e) => e.stopPropagation()}
      onChange={(e) =>
        setMemeOptions({ ...memeOptions, font: e.target.value })
      }
    >
      <option value="Georgia">Georgia</option>
      <option value="Courier New">Courier New</option>
      <option value="Arial">Arial</option>
      <option value="Comic Sans MS">Comic Sans</option>
      <option value="Times New Roman">Times New Roman</option>
    </select>
  </label>
  
 
      </div>
    </div>
  </div>
)}
    </div>
  );
}