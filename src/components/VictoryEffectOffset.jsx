// src/components/VictoryEffectOffset.jsx
import { motion, AnimatePresence } from "framer-motion";

export default function VictoryEffectOffset({ show, winningCells, shapes }) {
  if (!show) return null;

  // Generamos dos capas de efectos:
  // - La primera normal
  // - La segunda con un ligero offset + blur para el efecto psicodélico
  return (
    <AnimatePresence>
      {show && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            pointerEvents: "none",
            overflow: "hidden",
          }}
        >
          {/* === Capa 1 (principal) === */}
          {winningCells.map((cellIndex, i) => {
            const row = Math.floor(cellIndex / 3);
            const col = cellIndex % 3;
            const size = 100; // ajusta al tamaño de tus casillas
            const x = col * size + size / 2;
            const y = row * size + size / 2;

            return (
              <motion.img
                key={`main-${i}`}
                src={shapes[cellIndex]}
                initial={{ opacity: 0, scale: 0 }}
                animate={{
                  opacity: [1, 0.7, 1],
                  scale: [1, 1.3, 1],
                  rotate: i % 2 === 0 ? [0, 360] : [0, -360], // giro en direcciones opuestas
                }}
                exit={{ opacity: 0, scale: 0 }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                style={{
                  position: "absolute",
                  top: y,
                  left: x,
                  width: 40,
                  height: 40,
                  transform: "translate(-50%, -50%)",
                }}
              />
            );
          })}

          {/* === Capa 2 (offset psicodélico con blur) === */}
          {winningCells.map((cellIndex, i) => {
            const row = Math.floor(cellIndex / 3);
            const col = cellIndex % 3;
            const size = 100;
            const x = col * size + size / 2 + 10; // 👈 offset horizontal
            const y = row * size + size / 2;

            return (
              <motion.img
                key={`psycho-${i}`}
                src={shapes[cellIndex]}
                initial={{ opacity: 0, scale: 0 }}
                animate={{
                  opacity: [0.7, 0.3, 0.7],
                  scale: [1, 1.5, 1],
                  rotate: i % 2 === 0 ? [0, -360] : [0, 360], // 👈 opuesto a la capa 1
                }}
                exit={{ opacity: 0, scale: 0 }}
                transition={{
                  duration: 5,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                style={{
                  position: "absolute",
                  top: y,
                  left: x,
                  width: 40,
                  height: 40,
                  transform: "translate(-50%, -50%)",
                  filter: "blur(3px)", // 👈 blur psicodélico
                  mixBlendMode: "screen", // 👈 se fusiona como en Photoshop
                }}
              />
            );
          })}
        </div>
      )}
    </AnimatePresence>
  );
}