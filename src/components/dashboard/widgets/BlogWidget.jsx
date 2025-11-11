export default function BlogWidget({ personaje }) {
  return (
    <div style={cardStyle}>
      <h3>📝 Blog de {personaje?.nombre_visible || "Personaje"}</h3>
      <p>Aquí podrás escribir y editar entradas del blog.</p>
      <button style={btnStyle}>Nueva entrada</button>
    </div>
  );
}

const cardStyle = {
  background: "#111",
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
  background: "linear-gradient(135deg, #10b981, #3b82f6)",
  color: "#fff",
  cursor: "pointer",
};