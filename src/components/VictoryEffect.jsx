// src/components/VictoryEffect.jsx
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";

export default function VictoryEffect({ show, shapes, winningCells }) {
  const [cellPositions, setCellPositions] = useState([]);
  const [boardSize, setBoardSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (!show || !winningCells?.length) {
      setCellPositions([]);
      return;
    }

    const board = document.querySelector(".tablero-cuadricula");
    if (!board) return;

    const boardRect = board.getBoundingClientRect();
    const casillas = board.querySelectorAll(".casilla");
    const positions = winningCells
      .map((idx) => {
        const cell = casillas[idx];
        if (!cell) return null;
        const r = cell.getBoundingClientRect();
        return {
          left: r.left - boardRect.left + r.width / 2,
          top: r.top - boardRect.top + r.height / 2,
        };
      })
      .filter(Boolean);

    setBoardSize({ width: boardRect.width, height: boardRect.height });
    setCellPositions(positions);
  }, [show, winningCells]);

  if (!show || !cellPositions.length) return null;

  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: boardSize.width,
        height: boardSize.height,
        pointerEvents: "none",
      }}
    >
      {/* Capa 1: más nítida */}
      <AnimatePresence>
        {cellPositions.map((pos, i) => {
          const clockwise = i % 2 === 0; // alterna dirección
          return (
            <motion.img
              key={`layer1-${i}`}
              src={shapes[i % shapes.length]}
              initial={{
                x: pos.left,
                y: pos.top,
                opacity: 0.8,
                scale: 0.9,
                rotate: 0,
                filter: "blur(2px)",
              }}
              animate={{
                x: pos.left + (Math.random() * 80 - 40),
                y: pos.top + (Math.random() * 80 - 40),
                opacity: [0.8, 0.6, 0.4, 0],
                scale: [0.9, 1.1, 1.2],
                rotate: clockwise ? [0, 360] : [0, -360],
                filter: ["blur(2px)", "blur(3px)", "blur(4px)"],
              }}
              transition={{
                duration: (6 + Math.random() * 2) * (1 + Math.random() * 1.5),
                ease: "linear",
                repeat: Infinity,
                delay: Math.random() * 0.5,
              }}
              style={{
                position: "absolute",
                width: 80,
                height: 80,
                transform: "translate(-50%, -50%)",
                mixBlendMode: "screen",
              }}
            />
          );
        })}
      </AnimatePresence>

      {/* Capa 2: más etérea */}
      <AnimatePresence>
        {cellPositions.map((pos, i) => {
          const clockwise = i % 2 !== 0; // invertimos la dirección en esta capa
          return (
            <motion.img
              key={`layer2-${i}`}
              src={shapes[i % shapes.length]}
              initial={{
                x: pos.left,
                y: pos.top,
                opacity: 0.5,
                scale: 1.2,
                rotate: 0,
                filter: "blur(6px) hue-rotate(0deg)",
              }}
              animate={{
                x: pos.left + (Math.random() * 100 - 50),
                y: pos.top + (Math.random() * 100 - 50),
                opacity: [0.5, 0.3, 0.2, 0],
                scale: [1.2, 1.4, 1.6],
                rotate: clockwise ? [0, 360] : [0, -360],
                filter: [
                  "blur(6px) hue-rotate(0deg)",
                  "blur(8px) hue-rotate(90deg)",
                  "blur(10px) hue-rotate(180deg)",
                ],
              }}
              transition={{
                duration: 8 + Math.random() * 3,
                ease: "linear",
                repeat: Infinity,
                delay: Math.random() * 1,
              }}
              style={{
                position: "absolute",
                width: 100,
                height: 100,
                transform: "translate(-50%, -50%)",
                mixBlendMode: "overlay",
              }}
            />
          );
        })}
      </AnimatePresence>
    </div>
  );
}
