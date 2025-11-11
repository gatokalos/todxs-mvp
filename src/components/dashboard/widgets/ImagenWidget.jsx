export default function ImagenWidget({ personaje }) {
  return (
    <div style={cardStyle}>
      <h3>🎨 Imágenes de {personaje?.nombre_visible || "Personaje"}</h3>
      <p>Aquí podrás generar y ver imágenes guardadas.</p>
      <button style={btnStyle}>Generar imagen</button>
    </div>
  );
}

const cardStyle = {
  background: "#1e1e1e",
  borderRadius: "12px",
  padding: "1.5rem",
  boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
  color: "#fff",
};

const btnStyle = {
  marginTop: "0.5rem",
  padding: "0.6rem 1rem",
  border: "none",
  borderRadius: "8px",
  background: "linear-gradient(135deg, #f59e0b, #ef4444)",
  color: "#fff",
  cursor: "pointer",
};