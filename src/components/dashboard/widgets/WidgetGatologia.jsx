export default function WidgetGatologia({ personaje, expanded, onToggle }) {
  return (
    <div
      className={`widget ${expanded ? "expanded" : ""}`}
      onClick={onToggle}
    >
      <div className="widget-header">
        <img
          src={personaje.icono}
          alt={personaje.nombre}
          className="icon"
          style={{ width: "40px", height: "40px" }}
        />
        <h3>{personaje.nombre}</h3>
      </div>

      {expanded && (
        <div className="widget-body">
          <p>
            ✍️ Aquí aparecerá el texto generado por la API para{" "}
            <strong>{personaje.nombre}</strong>.
          </p>
          <div className="widget-actions">
            <button title="Reescribir">🔄</button>
            <button title="Borrar">🗑️</button>
            <button title="Guardar en blog">📥</button>
          </div>
        </div>
      )}
    </div>
  );
}