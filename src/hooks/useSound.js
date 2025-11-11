import { useRef } from "react";

// Hook personalizado para manejar sonidos
export default function useSound(soundsMap) {
  // Guardamos los objetos de Audio en refs para no recrearlos
  const soundsRef = useRef({});

  // Inicializar solo una vez
  if (Object.keys(soundsRef.current).length === 0) {
    for (const key in soundsMap) {
      const audio = new Audio(soundsMap[key]);
      audio.preload = "auto";
      soundsRef.current[key] = audio;
    }
  }

  // Función para reproducir
  const play = (key) => {
    const audio = soundsRef.current[key];
    if (audio) {
      audio.currentTime = 0; // reinicia desde el inicio
      audio.play().catch(() => {});
    }
  };

  // Función para detener
  const stop = (key) => {
    const audio = soundsRef.current[key];
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
  };

  return { play, stop };
}