// src/App.jsx
import React, { useEffect, useMemo, useState } from "react";
import useGameStore from "./store/useGameStore";
import { BASE_CHARACTER_LAYOUT } from "./components/CharacterSelector";
import { fetchTransformacion } from "./services/api";
import SplashScreen from "./components/SplashScreen";
import CharacterSelector from "./components/CharacterSelector";
import Camerino from "./components/Camerino";
import GameBoard from "./components/GameBoard";
import TutorialCarousel from "./components/TutorialCarousel";
import NarrativeResult from "./components/NarrativeResult";
import CurtainTransition from "./components/CurtainTransition";
import DashboardGatologias from "./components/dashboard/DashboardGatologias";
import "./app-frame.css";

const EMBED_HASH = "app-embedded";

function getViewportPreset(width, height) {
  const isLandscape = width >= height;
  const shortSide = Math.min(width, height);
  const longSide = Math.max(width, height);
  const isTablet = shortSide >= 700 || longSide >= 1024;

  if (isTablet) {
    return isLandscape
      ? { device: "iPad Pro 12.9", orientation: "landscape", width: 1366, height: 1024 }
      : { device: "iPad Pro 12.9", orientation: "portrait", width: 1024, height: 1366 };
  }

  return isLandscape
    ? { device: "Phone", orientation: "landscape", width: 844, height: 390 }
    : { device: "Phone", orientation: "portrait", width: 390, height: 844 };
}

function AppRuntime() {
  const screen = useGameStore((s) => s.screen);
  const setScreen = useGameStore((s) => s.setScreen);
  const setPersonajeSeleccionado = useGameStore((s) => s.setPersonajeSeleccionado);
  const setPersonajeActual = useGameStore((s) => s.setPersonajeActual);
  const setTransformacion = useGameStore((s) => s.setTransformacion);

  // Deep-link desde Oráculo: ?transformacion=<id>&personaje=<slug>
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tid = params.get("transformacion");
    const slug = params.get("personaje");
    if (!tid || !slug) return;

    const layout = BASE_CHARACTER_LAYOUT[slug];
    if (!layout) return;

    setPersonajeSeleccionado({ id: slug, slug, ...layout });
    setPersonajeActual(slug);

    fetchTransformacion(tid)
      .then((data) => {
        setTransformacion(data);
        setScreen("camerino");
      })
      .catch((err) => console.error("deep-link transformacion:", err));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const handleBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, []);

  let content = null;

  switch (screen) {
    case "splash":
      content = <SplashScreen />;
      break;
    case "selector":
      content = <CharacterSelector />;
      break;
    case "camerino":
      content = <Camerino />;
      break;
    case "compendio":
    case "blog":
      content = <DashboardGatologias />;
      break;
    case "tutorial":
      content = <TutorialCarousel />;
      break;
    case "result":
      content = <NarrativeResult />;
      break;
    default:
      content = <GameBoard />;
      break;
  }

  return (
    <>
      {screen === "splash" ? content : <CurtainTransition>{content}</CurtainTransition>}
    </>
  );
}

function AppEmbedShell() {
  const [viewport, setViewport] = useState(() => ({
    width: window.innerWidth,
    height: window.innerHeight,
  }));

  useEffect(() => {
    const onResize = () => {
      setViewport({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener("resize", onResize);
    window.addEventListener("orientationchange", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("orientationchange", onResize);
    };
  }, []);

  const preset = useMemo(
    () => getViewportPreset(viewport.width, viewport.height),
    [viewport.width, viewport.height]
  );

  const scale = useMemo(() => {
    const framePadding = 24;
    const maxWidth = Math.max(320, viewport.width - framePadding * 2);
    const maxHeight = Math.max(320, viewport.height - framePadding * 2);
    return Math.min(maxWidth / preset.width, maxHeight / preset.height, 1);
  }, [viewport.width, viewport.height, preset.width, preset.height]);

  const iframeSrc = useMemo(() => {
    const url = new URL(window.location.href);
    url.hash = EMBED_HASH;
    return url.toString();
  }, []);

  return (
    <div className="app-embed-host">
      <div
        className="app-embed-stage"
        style={{
          width: `${preset.width}px`,
          height: `${preset.height}px`,
          transform: `scale(${scale})`,
        }}
      >
        <iframe
          className="app-embed-iframe"
          src={iframeSrc}
          title={`${preset.device} ${preset.orientation}`}
        />
      </div>
    </div>
  );
}

function App() {
  const isEmbeddedRuntime =
    typeof window !== "undefined" &&
    window.location.hash.replace(/^#/, "") === EMBED_HASH;

  if (!isEmbeddedRuntime) {
    return <AppEmbedShell />;
  }

  return <AppRuntime />;
}

export default App;
