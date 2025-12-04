import { useEffect, useState } from "react";
import useGameStore from "../store/useGameStore";

export default function SplashScreen() {
  const setScreen = useGameStore((s) => s.setScreen);
  const setPersonaje = useGameStore((s) => s.setPersonaje);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [installState, setInstallState] = useState("Instalación pendiente");

  useEffect(() => {
    const handleBeforeInstall = (event) => {
      event.preventDefault();
      setDeferredPrompt(event);
      setInstallState("Listo para instalar");
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    return () => window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    setInstallState(choice.outcome === "accepted" ? "Instalada" : "Instalación cancelada");
    setDeferredPrompt(null);
  };

  return (
    <div
      style={{
        height: "100vh",
        width: "100vw",
        background: "#9f9f9fff",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        color: "#fff",
        fontFamily: "'Arial Rounded MT Bold', system-ui",
        padding: "20px",
      }}
    >
      <h1 style={{ fontSize: "clamp(28px, 6vw, 54px)", marginBottom: "1rem" }}>
        Bienvenido a <br /> Tablero de Todxs
      </h1>

      <p style={{ fontSize: "clamp(16px, 3vw, 22px)", marginBottom: "3rem" }}>
        Una experiencia narrativa donde cada jugada revela una historia.
      </p>

      <div style={{ display: "flex", gap: "20px", flexWrap: "wrap", justifyContent: "center" }}>
        <button style={btnStyle} onClick={() => setScreen("tutorial")}>
          Ver tutorial
        </button>
        <button style={btnStyle} onClick={() => setScreen("selector")}>
          Seleccionar personaje
        </button>
        <button
          style={{ ...btnStyle, background: "linear-gradient(135deg, #10b981, #3b82f6)" }}
          onClick={handleInstall}
          disabled={!deferredPrompt}
        >
          Descarga la app a tu teléfono
        </button>
      </div>

      <p style={{ marginTop: "1.5rem", fontSize: "0.9rem", opacity: 0.85 }}>
        Cuando el botón esté disponible, la instalación pondrá un acceso directo en tu pantalla y
        ocultará la barra del navegador.
      </p>
      <p style={{ marginTop: "0.25rem", fontSize: "0.8rem", opacity: 0.6 }}>{installState}</p>
    </div>
  );
}

const btnStyle = {
  background: "linear-gradient(135deg, #8b5cf6, #ec4899)",
  color: "#fff",
  border: "none",
  borderRadius: "12px",
  padding: "14px 28px",
  fontSize: "clamp(16px, 2.5vw, 20px)",
  fontWeight: 700,
  fontFamily: "'Arial Rounded MT Bold', system-ui",
  cursor: "pointer",
  transition: "all 0.3s ease",
  boxShadow: "0 4px 12px rgba(0,0,0,0.35)",
};
