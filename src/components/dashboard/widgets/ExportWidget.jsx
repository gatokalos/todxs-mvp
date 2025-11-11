export default function ExportWidget({ personaje }) {
  return (
    <div style={cardStyle}>
      <h3>📤 Exportación de {personaje?.nombre_visible || "Personaje"}</h3>
      <p>Exporta tus textos como PDF o compártelos en redes.</p>
      <button style={btnStyle}>Exportar PDF</button>
      <button style={btnStyle}>Compartir</button>
    </div>
  );
}

const cardStyle = {
  background: "#1a1a1a",
  borderRadius: "12px",
  padding: "1.5rem",
  boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
  color: "#fff",
};

const btnStyle = {
  marginTop: "0.5rem",
  marginRight: "0.5rem",
  padding: "0.6rem 1rem",
  border: "none",
  borderRadius: "8px",
  background: "linear-gradient(135deg, #ec4899, #8b5cf6)",
  color: "#fff",
  cursor: "pointer",
};