// src/App.jsx
import React, { useEffect } from "react";
import useGameStore from "./store/useGameStore";
import SplashScreen from "./components/SplashScreen";
import CharacterSelector from "./components/CharacterSelector";
import Camerino from "./components/Camerino";
import GameBoard from "./components/GameBoard";
import TutorialCarousel from "./components/TutorialCarousel";
import NarrativeResult from "./components/NarrativeResult";
import CurtainTransition from "./components/CurtainTransition";
import RoleSwitcher from "./components/RoleSwitcher";
import DashboardGatologias from "./components/dashboard/DashboardGatologias";

function App() {
  const screen = useGameStore((s) => s.screen);
  const setScreen = useGameStore((s) => s.setScreen);

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
      <RoleSwitcher />
      {screen === "splash" ? content : <CurtainTransition>{content}</CurtainTransition>}
    </>
  );
}

export default App;
