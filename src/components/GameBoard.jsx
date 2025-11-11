// src/components/GameBoard.jsx
import { useState, useEffect, useRef } from "react";
import useGameStore from "../store/useGameStore";
import { supabase } from "../lib/supabaseClient";
import { api } from "../services/api";
import SpeechBubbleModal from "./SpeechBubbleModal";
import PersonajeMenu from "./PersonajeMenu";
import VictoryEffect from "./VictoryEffect";
import "./GameBoard.css";
import useTypewriter from "../hooks/useTypewriter";
import personajesData from "../data/personajes.json";

// assets
import Garra from "/assets/garra.svg";
import Esfera from "/assets/esfera.svg";
import Lagrima from "/assets/esfera2.svg";

export default function GameBoard() {
  const {
    personajeActual,
    jugadas,
    turno,
    registrarJugada,
    guardarFraseFinal,
    setFraseBase,
    fraseBase,
    resetFraseActual,
    palabraX,
    palabraO,
    ultimaCasillaO,
    reiniciarTablero,
    nivelActual,
    setNivelActual,
    actualizarJugada,
  } = useGameStore();

  useEffect(() => {
    console.log("GameBoard personajeActual:", personajeActual);
  }, [personajeActual]);


  // --- estado UX / UI ---
  const [respuestaCreativa, setRespuestaCreativa] = useState("");
  const [fraseFinal, setFraseFinal] = useState("");
  const [fraseParcial, setFraseParcial] = useState("");
  const [generando, setGenerando] = useState(false); // NEW: bloquea doble llamada

  const [victory, setVictory] = useState(null);
  const [victoryActive, setVictoryActive] = useState(false);

  const [burbujaAbierta, setBurbujaAbierta] = useState(null);
  const [tailCoords, setTailCoords] = useState(null);
  const [mensajePersonaje, setMensajePersonaje] = useState(null);
  const [mensajeAnimado, setMensajeAnimado] = useState(""); // 👈 nuevo estado animado
  const [animando, setAnimando] = useState(false);
  const [menuAlternativasAbierto, setMenuAlternativasAbierto] = useState(false);
  const [alternativasAbucheo, setAlternativasAbucheo] = useState([]);
  const [palabraOriginalAbucheo, setPalabraOriginalAbucheo] = useState(null);

  // --- Estado local alimentado por Supabase ---
  const [nombreVisible, setNombreVisible] = useState("");
  const [icono, setIcono] = useState("");
  const [prefijos, setPrefijos] = useState({ X: "", O: "" });
  const [sufijos, setSufijos] = useState({ X: "", O: "" });
  const [tituloModal, setTituloModal] = useState({ X: "", O: "" });
  const [tablero, setTablero] = useState([]);
  const [msgsX, setMsgsX] = useState([]);
  const [msgsO, setMsgsO] = useState([]);
  const [frasesVictoria, setFrasesVictoria] = useState([]);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionMessage, setTransitionMessage] = useState("");
  const transitionTimeoutRef = useRef(null);
  const transitionStartTimeoutRef = useRef(null);
  const closeBubbleTimeoutRef = useRef(null);

  const beginTransition = (
    message = "Preparando el siguiente acto...",
    delay = 0
  ) => {
    if (transitionStartTimeoutRef.current) {
      clearTimeout(transitionStartTimeoutRef.current);
      transitionStartTimeoutRef.current = null;
    }
    if (transitionTimeoutRef.current) {
      clearTimeout(transitionTimeoutRef.current);
      transitionTimeoutRef.current = null;
    }
    if (closeBubbleTimeoutRef.current) {
      clearTimeout(closeBubbleTimeoutRef.current);
      closeBubbleTimeoutRef.current = null;
    }

    const start = () => {
      setTransitionMessage(message);
      setIsTransitioning(true);
      setBurbujaAbierta(null);
      setTailCoords(null);
    };

    if (delay > 0) {
      transitionStartTimeoutRef.current = setTimeout(() => {
        start();
        transitionStartTimeoutRef.current = null;
      }, delay);
    } else {
      start();
    }
  };

  const endTransition = (delay = 240) => {
    if (transitionStartTimeoutRef.current) {
      clearTimeout(transitionStartTimeoutRef.current);
      transitionStartTimeoutRef.current = null;
    }
    if (transitionTimeoutRef.current) {
      clearTimeout(transitionTimeoutRef.current);
    }
    transitionTimeoutRef.current = setTimeout(() => {
      setIsTransitioning(false);
      setTransitionMessage("");
      transitionTimeoutRef.current = null;
    }, delay);
  };

  useEffect(() => {
    return () => {
      if (transitionStartTimeoutRef.current) {
        clearTimeout(transitionStartTimeoutRef.current);
      }
      if (transitionTimeoutRef.current) {
        clearTimeout(transitionTimeoutRef.current);
      }
      if (closeBubbleTimeoutRef.current) {
        clearTimeout(closeBubbleTimeoutRef.current);
      }
    };
  }, []);
  // Modo creativo
  const creativeMode = victory?.winner === "X" && tresCasillasTodasX(jugadas);

  // 1) Base
  const { displayed: baseAnimada, done: baseDone } = useTypewriter(
    fraseBase || "",
    90
  );

  // 2) X
  const { displayed: xAnimada, done: xDone } = useTypewriter(
    palabraX ? `${prefijos.X}${palabraX}${sufijos.X || ""}` : "",
    90,
    baseDone ? 0 : 999999
  );

  // 3) O normal
  const { displayed: oAnimada } = useTypewriter(
    !creativeMode && palabraO
      ? `${prefijos.O}${palabraO}${sufijos.O || ""}`
      : "",
    90,
    xDone ? 0 : 999999
  );

  // 4) Tercera (respuesta creativa o fallback)
  const { displayed: terceraAnimada } = useTypewriter(
    creativeMode
      ? (respuestaCreativa
          ? `${prefijos.O}${respuestaCreativa}${sufijos.O || ""}`
          : (palabraO ? `${prefijos.O}${palabraO}${sufijos.O || ""}` : ""))
      : (palabraO ? `${prefijos.O}${palabraO}${sufijos.O || ""}` : ""),
    90,
    xDone ? 0 : 999999
  );

  const bloqueaClicks =
    !xDone || animando || burbujaAbierta !== null || generando || isTransitioning;


  const shapesArray = [Garra, Garra, Garra, Esfera, Esfera, Esfera, Lagrima, Lagrima, Lagrima];

  // ============ CARGA DE NIVEL ============
  useEffect(() => {
    async function cargarNivel() {
      const personajeSeguro = personajeActual || "la-maestra";
      if (!supabase || !personajeSeguro || !nivelActual) return;

      try {
        const { data, error } = await supabase
          .from("niveles_semanticos")
          .select(
            "nombre_visible, icono, frase_base, prefijos, sufijos, titulo_modal, tablero, mensajes_victoria_x, mensajes_victoria_o"
          )
          .eq("personaje_id", personajeSeguro)
          .eq("nivel", nivelActual)
          .single();

        if (error) {
          console.error("❌ Error cargando nivel:", error.message);
          endTransition();
          return;
        }

        setNombreVisible(data?.nombre_visible || "");
        setIcono(data?.icono || "");
        setFraseBase(data?.frase_base || "");
        setPrefijos(data?.prefijos || { X: "", O: "" });
        setSufijos(data?.sufijos || { X: "", O: "" });
        setTablero(Array.isArray(data?.tablero) ? data.tablero : []);
        setMsgsX(Array.isArray(data?.mensajes_victoria_x) ? data.mensajes_victoria_x : []);
        setMsgsO(Array.isArray(data?.mensajes_victoria_o) ? data.mensajes_victoria_o : []);
        setTituloModal(data?.titulo_modal || { X: "", O: "" });

        setMensajePersonaje(null);
        setMensajeAnimado(""); // reset animado
        setVictory(null);
        setVictoryActive(false);
        resetFraseActual();
        reiniciarTablero();
        setRespuestaCreativa("");
        setFraseFinal("");
        endTransition();
      } catch (e) {
        console.error("🚨 Error inesperado cargando nivel:", e);
        endTransition();
      }
    }

    cargarNivel();
  }, [personajeActual, nivelActual]);

// ============ DETECCIÓN DE VICTORIA Y MENSAJE ============
useEffect(() => {
  const result = checkWinner(jugadas); // {winner, combo} | null
  const tableroLleno = jugadas.every((j) => j !== null);

  // No hacemos nada si no hay resultado y el tablero no está lleno
  if (!result && !tableroLleno) return;

  if (result) {
    setVictory({ winner: result.winner, cells: result.combo });

    // 💬 Mensaje directo desde Supabase (mensajes_victoria_x / mensajes_victoria_o)
    if (result.winner === "X" && msgsX.length) {
      const pick = msgsX[Math.floor(Math.random() * msgsX.length)];
      setMensajePersonaje(pick);
    } else {
      // fallback sin mensaje
      setMensajePersonaje(null);
    }

    // 💥 Si ganó X con tres en línea → abre la burbuja creativa
    if (result.winner === "X" && tresCasillasTodasX(jugadas)) {
      setBurbujaAbierta(-1);
      setTailCoords(null);

    }
  } 
  else if (tableroLleno && !result) {
    setMensajePersonaje("Empate… prueben otra vez.");
  }
}, [jugadas, msgsX, msgsO]);

  // ============ ANIMACIÓN MENSAJE (TYPEWRITER EFECTO) ============
  useEffect(() => {
    if (!mensajePersonaje) {
      setMensajeAnimado("");
      return;
    }

    let i = 0;
    setMensajeAnimado("");
    const interval = setInterval(() => {
      setMensajeAnimado((prev) => prev + mensajePersonaje[i]);
      i++;
      if (i >= mensajePersonaje.length) clearInterval(interval);
    }, 45);

    return () => clearInterval(interval);
  }, [mensajePersonaje]);

  // activar/desactivar efecto de victoria
  useEffect(() => {
    if (palabraX && (palabraO || creativeMode) && victory?.cells?.length) {
      setVictoryActive(true);
    } else {
      setVictoryActive(false);
    }
  }, [palabraX, palabraO, creativeMode, victory]);

  // ============ FRASE PARCIAL ============
  useEffect(() => {
    const nueva = [
      fraseBase,
      palabraX ? `${prefijos.X}${palabraX}${sufijos.X || ""}` : null,
      !creativeMode && palabraO ? `${prefijos.O}${palabraO}${sufijos.O || ""}` : null,
    ].filter(Boolean).join("\n");
    setFraseParcial(nueva);
  }, [fraseBase, palabraX, palabraO, prefijos, sufijos, creativeMode]);

  // ============ COLITA ============
  function calcularColita(cx, cy, modalRect, anchoBase = 60) {
    const modalCenterX = modalRect.left + modalRect.width / 2;
    const modalY = modalRect.top;
    return {
      x1: cx, y1: cy,
      x2: modalCenterX - anchoBase, y2: modalY,
      x3: modalCenterX + anchoBase, y3: modalY,
    };
  }

  const finalizarTurnoO = () => {
    setVictoryActive(false);
    setVictory(null);
    terminarRonda(checkWinner(jugadas));
  };

  const limpiarMenuAbucheo = () => {
    setMenuAlternativasAbierto(false);
    setAlternativasAbucheo([]);
    setPalabraOriginalAbucheo(null);
  };

  const abrirMenuAbucheo = () => {
    if (!Number.isInteger(ultimaCasillaO)) {
      finalizarTurnoO();
      return;
    }

    const opciones = tablero?.[ultimaCasillaO]?.O || [];
    if (!opciones.length) {
      finalizarTurnoO();
      return;
    }

    setAlternativasAbucheo(opciones);
    setPalabraOriginalAbucheo(palabraO);
    setMenuAlternativasAbierto(true);
  };

  const cerrarMenuAbucheo = (restaurar = false) => {
    if (restaurar && palabraOriginalAbucheo && Number.isInteger(ultimaCasillaO)) {
      actualizarJugada(ultimaCasillaO, "O", palabraOriginalAbucheo);
    }
    limpiarMenuAbucheo();
  };

  const aplicarAlternativaAbucheo = (opcion) => {
    if (!menuAlternativasAbierto) return;
    if (!Number.isInteger(ultimaCasillaO)) return;
    if (!opcion) return;
    actualizarJugada(ultimaCasillaO, "O", opcion);
  };

  const confirmarSalvada = () => {
    limpiarMenuAbucheo();
    finalizarTurnoO();
  };

  // --- confirmar remate creativo ---
  function handleConfirmCreative(remateLimpio) {
    const terceraLinea = remateLimpio
      ? `${prefijos.O}${remateLimpio}${sufijos.O || ""}`
      : (palabraO ? `${prefijos.O}${palabraO}${sufijos.O || ""}` : "");

    const nueva = [
      fraseBase,
      palabraX ? `${prefijos.X}${palabraX}${sufijos.X || ""}` : "",
      terceraLinea,
    ].filter(Boolean).join("\n");

    setRespuestaCreativa(remateLimpio || "");
    setFraseFinal(nueva);

    if (api?.insertEleccion) {
      api
        .insertEleccion({
          personajeId: personajeActual,
          fraseFinal: nueva,
          usuarioId: null,
          timestamp: new Date().toISOString(),
        })
        .catch((e) => console.warn("⚠️ insertEleccion falló:", e?.message));
    }

    if (closeBubbleTimeoutRef.current) {
      clearTimeout(closeBubbleTimeoutRef.current);
    }
    closeBubbleTimeoutRef.current = setTimeout(() => {
      setBurbujaAbierta(null);
      setTailCoords(null);
      closeBubbleTimeoutRef.current = null;
    }, 3000);
  }

  // ============ INTERACCIÓN ============
  const handleCasillaClick = (index) => {
    if (jugadas[index]) return;

    const cell = document.querySelectorAll(".casilla")[index];
    if (!cell) return;

    const rect = cell.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;

    setBurbujaAbierta(index);

    setTimeout(() => {
      const modal = document.querySelector(".speech-bubble");
      if (!modal) return;
      const modalRect = modal.getBoundingClientRect();
      setTailCoords(calcularColita(cx, cy, modalRect, 60));
    }, 0);
  };

  const handleSeleccion = (palabra) => {
    registrarJugada(burbujaAbierta, turno, palabra);
    setBurbujaAbierta(null);
  };

// ============ AVANZAR NIVEL O GENERAR GATOLOGÍA FINAL ============
async function terminarRonda(ganador) {

  setAnimando(true);

  setTimeout(async () => {
    try {
      if (ganador?.winner === "X") {
        await avanzarNivel();
      } else if (ganador?.winner === "O") {
        reiniciarTablero();
        resetFraseActual();
      } else {
        resetFraseActual();
      }
    } catch (err) {
      console.error("⚠️ Error al avanzar nivel:", err);
      endTransition();
    } finally {
      setVictory(null);
      setVictoryActive(false);
      setAnimando(false);
      if (!ganador || ganador.winner !== "X") {
        endTransition();
      }
    }
  }, ganador ? 800 : 600);
}

// ============ CONSULTA TOTAL DE NIVELES Y AVANZA ============
async function avanzarNivel() {
  const personaje = personajeActual || "la-maestra";

  // 1️⃣ Consultar cuántos niveles existen para este personaje
  const { data: niveles, error } = await supabase
    .from("niveles_semanticos")
    .select("nivel")
    .eq("personaje_id", personaje);

  if (error) {
    console.error("❌ Error consultando niveles:", error.message);
    return;
  }

  const totalNiveles = niveles?.length || 1;
  const siguiente = nivelActual + 1;

  // 2️⃣ Si todavía hay niveles, avanza (sin transición aquí; ya la maneja terminarRonda)
  if (siguiente <= totalNiveles) {
    console.log(`📈 Avanzando al nivel ${siguiente}/${totalNiveles}`);
    setNivelActual(siguiente);
  } else {
    console.log("🏁 Todos los niveles completados. Generando gatología final...");
    await handleGenerarGatologiaFinal(personaje);
  }
}

  const handleAbuchear = () => {
    if (menuAlternativasAbierto) {
      cerrarMenuAbucheo(true);
      return;
    }

    if (!palabraO) {
      finalizarTurnoO();
      return;
    }

    abrirMenuAbucheo();
  };

  const handleAplaudir = async () => {
    if (menuAlternativasAbierto) {
      cerrarMenuAbucheo(false);
    }

    if (!palabraX) return;

    const lineaTercera = creativeMode
      ? (respuestaCreativa
          ? `${prefijos.O}${respuestaCreativa}${sufijos.O || ""}`
          : (palabraO ? `${prefijos.O}${palabraO}${sufijos.O || ""}` : ""))
      : (palabraO ? `${prefijos.O}${palabraO}${sufijos.O || ""}` : "");

    const payload = {
      usuarioId: null,
      personajeId: personajeActual,
      fraseBase,
      palabraX,
      palabraO: respuestaCreativa || palabraO || "",
      prefijoX: prefijos.X,
      prefijoO: prefijos.O,
      sufijoX: sufijos.X || "",
      sufijoO: sufijos.O || "",
      fraseFinal: [fraseBase, `${prefijos.X}${palabraX}${sufijos.X || ""}`, lineaTercera]
        .filter(Boolean).join("\n"),
      timestamp: new Date().toISOString(),
    };

    setFraseFinal(payload.fraseFinal);
    guardarFraseFinal(payload);

    try {
      await api.insertEleccion(payload);
    } catch (e) {
      console.error("❌ Error guardando en mock API:", e);
    }

    finalizarTurnoO();
  };

// === Estado del modal final de gatología ===
const [modalGatologia, setModalGatologia] = useState({
  visible: false,
  personaje: "",
  titulo: "",
});


// ============ GENERAR GATOLOGÍA FINAL ============
async function handleGenerarGatologiaFinal(personajeSlug) {
  try {
    setGenerando(true);

    // 🧩 Normalizar slug por si llega con guiones, mayúsculas o espacios
    const safeSlug = personajeSlug?.toLowerCase().trim().replace(/\s+/g, "-");

    const personajeData = personajesData[safeSlug];
    if (!personajeData) {
      console.error("❌ No se encontró data para:", safeSlug, personajesData);
      throw new Error(`No se encontró data para ${safeSlug}`);
    }

    const base = import.meta.env?.VITE_API_BASE_URL || "http://localhost:5050";

    const payload = {
      personaje: { id: safeSlug, ...personajeData },
      frases: [
        fraseBase,
        palabraX ? `${prefijos.X}${palabraX}${sufijos.X || ""}` : "",
        respuestaCreativa || palabraO || "Victoria de X",
      ].filter(Boolean)
    };

    const response = await fetch(`${base}/api/todxs/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    const contenido = data.contenido ?? data.texto;
    if (!contenido) throw new Error("Respuesta inválida del servidor");

    await api.insertGatologia({
      personaje_slug: safeSlug,
      titulo: data.titulo,
      contenido,
      estado: "draft",
      created_at: new Date().toISOString(),
    });

    console.log(`🐾 Gatología generada para ${safeSlug}: “${data.titulo}”`);

    setModalGatologia({
      visible: true,
      personaje: personajeData.nombre,
      titulo: data.titulo,
    });

  } catch (e) {
    console.error("❌ Error generando gatología final:", e.message);
  } finally {
    setGenerando(false);
  }
}

    // ============ RENDER ============
  return (
    <div className="tablero tablero-invertido">
      {isTransitioning && (
        <div className="gameboard-transition-blur" role="status" aria-live="polite">
          <div className="transition-overlay" />
          <div className="transition-text-container">
            <div className="transition-glow" />
            <p className="transition-text">
              {transitionMessage || "El Gato teje las palabras..."}
            </p>
          </div>
        </div>
      )}

      <PersonajeMenu
        personaje={{ nombreVisible, icono, id: personajeActual }}
        frases={[]}
        mensaje={mensajeAnimado}
      />

      {/* Base → X → (O/tercera) */}
      <div className="frase-construida">
        <span className="typewriter">
          {baseAnimada}
          {baseDone && (
            <>
              <br />
              {xAnimada}
            </>
          )}
          {xDone && (
            <>
              <br />
              {creativeMode ? terceraAnimada : oAnimada}
            </>
          )}
        </span>
        <span className="cursor">|</span>
      </div>

      {/* Hub de acciones */}
      <div className="hub-botones">
        <button
          className={`btn-icono ${!(palabraX && (palabraO || creativeMode)) ? "oculto" : ""}`}
          onClick={handleAbuchear}
          title="Abuchear (elige otro remate)"
        >🙀</button>
        <button
          className={`btn-icono ${!(palabraX && (palabraO || creativeMode)) ? "oculto" : ""}`}
          onClick={handleAplaudir}
          title="Aplaudir (guardar frase)"
        >👏</button>

        {menuAlternativasAbierto && (
          <div className="alternativas-panel">
            <div className="alternativas-header">
              <strong>Otras frases para cerrar</strong>
              <button className="alternativas-close" onClick={() => cerrarMenuAbucheo(true)}>✕</button>
            </div>
            <p className="alternativas-subtitle">Toca una frase para probarla, luego confirma con Salvada.</p>
            <div className="alternativas-lista">
              {alternativasAbucheo.map((opcion) => (
                <button
                  key={opcion}
                  className={`alternativa-chip ${palabraO === opcion ? "seleccionada" : ""}`}
                  onClick={() => aplicarAlternativaAbucheo(opcion)}
                >
                  {opcion}
                </button>
              ))}
            </div>
            <div className="alternativas-actions">
              <button className="alternativa-confirmar" onClick={confirmarSalvada}>Salvada</button>
              <button className="alternativa-cancelar" onClick={() => cerrarMenuAbucheo(true)}>Cancelar</button>
            </div>
          </div>
        )}
      </div>

      {/* Tablero */}
      <div className="tablero-cuadricula">
        <div className={`cuadricula ${bloqueaClicks ? "no-clicks" : ""}`}>
          {tablero.map((_, index) => {
            const fila = Math.floor(index / 3);
            const isGarra = fila === 0;
            const jugada = jugadas[index];
            const mark = jugada ? jugada.jugador : null;

            return (
              <div
                key={index}
                className={`casilla ${isGarra ? "garra" : ""} ${jugada ? "ocupada" : ""} ${(palabraX && palabraO) ? "deshabilitada" : ""}`}
                onClick={() => { if (!(palabraX && palabraO)) handleCasillaClick(index); }}
              >
                {isGarra ? (
                  <img src={Garra} alt="garra" className="garra-img" />
                ) : (
                  <div className="esfera"></div>
                )}
                {mark && (
                  <span className={`marca ${mark === "X" ? "marca-x" : "marca-o"}`}>{mark}</span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Efecto de victoria */}
      <VictoryEffect show={victoryActive} winningCells={victory?.cells || []} shapes={shapesArray} />

      {/* Modal creativo (burbuja) */}
      {burbujaAbierta !== null && (
        <SpeechBubbleModal
          creativeMode={victory?.winner === "X" && tresCasillasTodasX(jugadas)}
          titulo={
            burbujaAbierta === -1
              ? (tituloModal?.default || "Yo escojo")
              : (tituloModal?.[turno] || tituloModal?.default || "Yo escojo")
          }
          prefijo={burbujaAbierta === -1 ? "" : (prefijos[turno] || "")}
          opciones={burbujaAbierta === -1 ? [] : (tablero[burbujaAbierta]?.[turno] || [])}
          fraseBase={fraseBase}
          jugadasX={jugadas.filter(j => j?.jugador === "X").map(j => j.palabra)}
          personaje={personajeActual}
          tailCoords={tailCoords}
          onSelect={handleSeleccion}
          onConfirmCreative={handleConfirmCreative}
          onClose={() => setBurbujaAbierta(null)}
        />
      )}

      {/* Overlay de animación entre niveles */}
      {(!xDone || animando) && <div className="nivel-animando-overlay" />}

      {/* Modal final de gatología */}
      {modalGatologia.visible && (
        <div className="gatologia-modal-overlay">
          <div className="gatologia-modal">
            <h2>
              ✨ {modalGatologia.personaje} ha escrito una{" "}
              <span className="gatologia-destacada">Gatología</span> en su bitácora.
            </h2>
            <p className="gatologia-titulo">“{modalGatologia.titulo}”</p>
            <div className="gatologia-botones">
              <button onClick={() => window.location.reload()}>Volver a jugar</button>
              <button
                onClick={() =>
                  window.dispatchEvent(new CustomEvent("abrirCamerino"))
                }
              >
                Ir a leerla
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============ helpers ============
function checkWinner(jugadas) {
  const combos = [
    [0,1,2],[3,4,5],[6,7,8],
    [0,3,6],[1,4,7],[2,5,8],
    [0,4,8],[2,4,6],
  ];
  for (const [a,b,c] of combos) {
    const j1 = jugadas[a], j2 = jugadas[b], j3 = jugadas[c];
    if (j1 && j2 && j3 && j1.jugador === j2.jugador && j2.jugador === j3.jugador) {
      return { winner: j1.jugador, combo: [a,b,c] };
    }
  }
  return null;
}

function tresCasillasTodasX(jugadas) {
  const combos = [
    [0,1,2],[3,4,5],[6,7,8],
    [0,3,6],[1,4,7],[2,5,8],
    [0,4,8],[2,4,6],
  ];
  return combos.some(([a,b,c]) =>
    jugadas[a]?.jugador === "X" &&
    jugadas[b]?.jugador === "X" &&
    jugadas[c]?.jugador === "X"
  );
}
