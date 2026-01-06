// src/components/VictoryEffect.jsx
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";

export default function VictoryEffect({ show, shapes, winningCells, markedCells }) {
  const [cellPositions, setCellPositions] = useState([]);
  const [boardSize, setBoardSize] = useState({ width: 0, height: 0 });
  const [boardOffset, setBoardOffset] = useState({ left: 0, top: 0 });
  const [isVisible, setIsVisible] = useState(show);

  useEffect(() => {
    if (show) {
      setIsVisible(true);
      return;
    }

    if (!isVisible) return;
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, 450);
    return () => clearTimeout(timer);
  }, [show, isVisible]);

  useEffect(() => {
    if (isVisible) return;
    setCellPositions([]);
    setBoardOffset({ left: 0, top: 0 });
    setBoardSize({ width: 0, height: 0 });
  }, [isVisible]);

  useEffect(() => {
    const cells = markedCells?.length ? markedCells : winningCells;
    if (!show || !cells?.length) {
      return;
    }

    const board = document.querySelector(".cuadricula");
    if (!board) return;

    const boardRect = board.getBoundingClientRect();
    const cardRect = board.closest(".tablero-card")?.getBoundingClientRect();
    const casillas = board.querySelectorAll(".casilla");
    const positions = cells
      .map((idx) => {
        const cell = casillas[idx];
        if (!cell) return null;
        const r = cell.getBoundingClientRect();
        return {
          index: idx,
          isGarra: idx < 3,
          left: r.left - boardRect.left + r.width / 2,
          top: r.top - boardRect.top + r.height / 2,
        };
      })
      .filter(Boolean);

    setBoardSize({ width: boardRect.width, height: boardRect.height });
    if (cardRect) {
      setBoardOffset({
        left: boardRect.left - cardRect.left,
        top: boardRect.top - cardRect.top,
      });
    }
    setCellPositions(positions);
  }, [show, winningCells, markedCells]);

  if (!isVisible || !cellPositions.length) return null;

  return (
    <motion.div
      style={{
        position: "absolute",
        top: boardOffset.top,
        left: boardOffset.left,
        width: boardSize.width,
        height: boardSize.height,
        pointerEvents: "none",
      }}
      initial={false}
      animate={{ opacity: show ? 1 : 0 }}
      transition={{ duration: 0.45, ease: "easeOut" }}
    >
      {/* Capa 1: más nítida */}
      <AnimatePresence>
        {cellPositions.map((pos, i) => {
          const clockwise = i % 2 === 0; // alterna dirección
          const shape = shapes[pos.index % shapes.length];
          const size = pos.isGarra ? 96 : 80;
          return (
            <div
              key={`layer1-${i}`}
              style={{
                position: "absolute",
                left: pos.left,
                top: pos.top,
                transform: "translate(-50%, -50%)",
              }}
            >
              <motion.img
                src={shape}
                initial={{
                  x: 0,
                  y: 0,
                  opacity: 0.8,
                  scale: 0.9,
                  rotate: 0,
                  filter: "blur(2px)",
                }}
                animate={{
                  x: Math.random() * 80 - 40,
                  y: Math.random() * 80 - 40,
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
                  width: size,
                  height: size,
                  mixBlendMode: "screen",
                }}
              />
            </div>
          );
        })}
      </AnimatePresence>

      {/* Capa 2: más etérea */}
      <AnimatePresence>
        {cellPositions.map((pos, i) => {
          const clockwise = i % 2 !== 0; // invertimos la dirección en esta capa
          const shape = shapes[pos.index % shapes.length];
          const size = pos.isGarra ? 120 : 100;
          return (
            <div
              key={`layer2-${i}`}
              style={{
                position: "absolute",
                left: pos.left,
                top: pos.top,
                transform: "translate(-50%, -50%)",
              }}
            >
              <motion.img
                src={shape}
                initial={{
                  x: 0,
                  y: 0,
                  opacity: 0.5,
                  scale: 1.2,
                  rotate: 0,
                  filter: "blur(6px) hue-rotate(0deg)",
                }}
                animate={{
                  x: Math.random() * 100 - 50,
                  y: Math.random() * 100 - 50,
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
                  width: size,
                  height: size,
                  mixBlendMode: "overlay",
                }}
              />
            </div>
          );
        })}
      </AnimatePresence>
    </motion.div>
  );
}
