import useGameStore from "../store/useGameStore";

export default function SplashScreen() {
  const setScreen = useGameStore((s) => s.setScreen);
  const setPersonaje = useGameStore((s) => s.setPersonaje);

  const irAlGameBoard = () => {
    // ⚡ Fijamos personaje por defecto antes de entrar al tablero
    setPersonaje("la-maestra");  
    setScreen("gameboard");
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

      <button
        style={{
          ...btnStyle,
          background: "linear-gradient(135deg, #22c55e, #16a34a)",
        }}
        onClick={irAlGameBoard}
      >
        Ir al Tablero
      </button>

      <p style={{ fontSize: "clamp(16px, 3vw, 22px)", marginBottom: "3rem" }}>
        Una experiencia narrativa donde cada jugada revela una historia.
      </p>

      <div style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>
        <button style={btnStyle} onClick={() => setScreen("tutorial")}>
          Ver tutorial
        </button>
        <button style={btnStyle} onClick={() => setScreen("selector")}>
          Seleccionar personaje
        </button>
      </div>
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