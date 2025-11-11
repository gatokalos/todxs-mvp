import React from "react";
import "./TusGatografiasWidget.css";

export default function TusGatografiasWidget() {
  return (
    <div className="wg tus-gatografias-widget">
      <div className="wg__head tus-gatografias-widget__head">
        <div className="wg__avatar">🖼️</div>
        <div>
          <h3 className="wg__title">Tus Gatografías</h3>
          <p className="wg__subtitle">Zona reservada para tus collages narrativos.</p>
        </div>
      </div>

      <div className="tus-gatografias-widget__body">
        <p>
          Aquí podrás guardar y curar tus piezas visuales colaborativas. Estamos preparando la integración para
          conectar tus imágenes con la narrativa.
        </p>
        <ul>
          <li>Sube bocetos o collages inspirados en tus personajes.</li>
          <li>Conecta cada imagen con frases ancladas.</li>
          <li>Comparte con la comunidad cuando esté listo.</li>
        </ul>
        <button type="button" className="btn btn--ghost" disabled>
          Próximamente
        </button>
      </div>
    </div>
  );
}
