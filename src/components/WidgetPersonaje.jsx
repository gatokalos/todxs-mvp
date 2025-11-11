// src/components/WidgetPersonaje.jsx
import useGameStore from "../store/useGameStore";

export default function WidgetPersonaje({ personaje }) {
  const setScreen = useGameStore((s) => s.setScreen);

  return (
    <div
      className="widget-personaje"
      style={{
        background: "#222",
        borderRadius: "16px",
        padding: "20px",
        color: "#fff",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        boxShadow: "0 6px 18px rgba(0,0,0,0.4)",
        minHeight: "400px",
      }}
    >
      {/* Cabecera */}
      <div style={{ display: "flex", alignItems: "center", marginBottom: "1rem" }}>
        <img
          src={personaje.avatar}
          alt={personaje.nombre}
          style={{
            width: "64px",
            height: "64px",
            borderRadius: "50%",
            marginRight: "12px",
            objectFit: "cover",
          }}
        />
        <h2 style={{ fontSize: "1.3rem", fontWeight: 700 }}>{personaje.nombre}</h2>
      </div>

      {/* Preview tipo libreto */}
      <div
        className="preview-libretto"
        style={{
          flexGrow: 1,
          background: "rgba(255,255,255,0.08)",
          borderRadius: "12px",
          padding: "14px",
          fontFamily: "'Courier Prime', monospace",
          fontSize: "0.95rem",
          lineHeight: 1.6,
          overflowY: "auto",
          marginBottom: "1rem",
        }}
      >
        <p>
          {personaje.ultimoTexto ||
            "Todavía no has escrito nada en el camerino de este personaje."}
        </p>
      </div>

      {/* Acciones */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "12px" }}>
        <button
          style={btnStyle}
          onClick={() => console.log("Reescribir con IA")}
        >
          ✍️ Reescribir
        </button>
        <button style={btnStyle} onClick={() => setScreen("camerino")}>
          📝 Editar en Blog
        </button>
        <button
          style={btnStyle}
          onClick={() => console.log("Generar Imagen IA")}
        >
          🎨 Imagen
        </button>
        <button
          style={{ ...btnStyle, background: "linear-gradient(135deg,#f43f5e,#e11d48)" }}
          onClick={() => console.log("Like")}
        >
          ❤️ Like
        </button>
      </div>
    </div>
  );
}

const btnStyle = {
  background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
  color: "#fff",
  border: "none",
  borderRadius: "10px",
  padding: "10px 16px",
  fontSize: "0.9rem",
  fontWeight: 600,
  cursor: "pointer",
  flexGrow: 1,
  textAlign: "center",
};