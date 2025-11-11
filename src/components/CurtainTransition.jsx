// CurtainTransition.jsx
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import useGameStore from "../store/useGameStore";
import "./CurtainTransition.css";

const SCREEN_BEHAVIOR = {
  selector: { openLeft: -40, openRight: 40, openDuration: 1.2, openEase: "power1.out", closeDuration: 0.95, closeEase: "power2.inOut" },
  camerino: { openLeft: -70, openRight: 70, openDuration: 1.2, openEase: "power1.out", closeDuration: 0.95, closeEase: "power2.inOut" },
  compendio: { openLeft: -100, openRight: 100, openDuration: 1.2, openEase: "power1.out", closeDuration: 0.95, closeEase: "power2.inOut" },
  gameboard: { openLeft: -100, openRight: 100, openDuration: 3.55, openEase: "power2.out", closeDuration: 0.45, closeEase: "power2.in" },
  game: { openLeft: -100, openRight: 100, openDuration: 0.55, openEase: "power2.out", closeDuration: 0.45, closeEase: "power2.in" },
  default: { openLeft: -100, openRight: 100, openDuration: 0.65, openEase: "power2.out", closeDuration: 0.5, closeEase: "power2.in" },
};

// 🔑 función responsive
function getScreenBehavior(screen, width = window.innerWidth) {
  const base = SCREEN_BEHAVIOR[screen] || SCREEN_BEHAVIOR.default;
  if (width <= 768) {
    return { ...base, openLeft: -100, openRight: 100 };
  }
  return base;
}

export default function CurtainTransition({ children }) {
  const screen = useGameStore((state) => state.screen);
  const leftCurtainRef = useRef(null);
  const rightCurtainRef = useRef(null);
  const stageRef = useRef(null);
  const timelineRef = useRef(null);
  const leftWaveRef = useRef(null);
  const rightWaveRef = useRef(null);
  const hasOpenedRef = useRef(false);
  const pendingChildrenRef = useRef(children);

  const [renderedChildren, setRenderedChildren] = useState(() => children);
  const [isAnimating, setIsAnimating] = useState(false);
  const [viewportWidth, setViewportWidth] = useState(window.innerWidth);

  // 🖥️ listener de resize
  useEffect(() => {
    const handleResize = () => setViewportWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // 🎭 Configura wave de ambas cortinas
  useLayoutEffect(() => {
  if (!leftCurtainRef.current || !rightCurtainRef.current || !stageRef.current)
    return;

  const left = leftCurtainRef.current;
  const right = rightCurtainRef.current;

  // Estado inicial recto
  gsap.set([left, right], {
    xPercent: 0,
    y: 0,
    skewX: 0,
    transformOrigin: "80% 1%",
  });

  // 🎭 Selector: derecha infinita
  const rightWave = gsap.timeline({
    paused: true,
    repeat: -1,
    yoyo: true,
    defaults: { ease: "sine.inOut" },
  })
    .to(right, { y: -8, skewX: 3, duration: 2.4 })
    .to(right, { y: 8, skewX: -3, duration: 2.4 });

  // 🎭 Otros screens: sutil vaivén y regreso natural
  const subtleWave = gsap.timeline({
    paused: true,
    defaults: { ease: "sine.inOut" },
  })
    .to([left, right], { y: -4, skewX: -2, duration: 1.4 })
    .to([left, right], { y: 3, skewX: 1.2, duration: 1.2 })
    .to([left, right], { y: 0, skewX: 0, duration: 1.0, ease: "power2.out" });

  // Guarda refs
  rightWaveRef.current = rightWave;
  leftWaveRef.current = subtleWave; // usamos este para todos menos selector

  return () => {
    rightWave.kill();
    subtleWave.kill();
    rightWaveRef.current = null;
    leftWaveRef.current = null;
  };
}, []);

  // 👉 Helper: arranca derecha solo en selector
  const startRightWaveIfSelector = () => {
    const tl = rightWaveRef.current;
    if (!tl) return;

    tl.pause(0);
    if (screen === "selector") {
      gsap.delayedCall(2.5, () => {
        if (screen === "selector") tl.play(0);
      });
    }
  };

  useEffect(() => {
    pendingChildrenRef.current = children;
  }, [children]);

  useEffect(() => {
    if (!leftCurtainRef.current || !rightCurtainRef.current || !stageRef.current) return;
    if (timelineRef.current) timelineRef.current.kill();

    const config = getScreenBehavior(screen, viewportWidth);
    const stage = stageRef.current;

    setIsAnimating(true);

    if (!hasOpenedRef.current) {
      setRenderedChildren(pendingChildrenRef.current);
      gsap.set(stage, { opacity: 0 });

      const initialTimeline = gsap.timeline({
        delay: 0.1,
        onComplete: () => {
          setIsAnimating(false);
          hasOpenedRef.current = true;
        },
      });

      initialTimeline
        .to(leftCurtainRef.current, { xPercent: config.openLeft, duration: config.openDuration, ease: config.openEase })
        .to(rightCurtainRef.current, { xPercent: config.openRight, duration: config.openDuration, ease: config.openEase }, "<")
        .to(stage, { opacity: 1, duration: 0.9, ease: "power1.out" }, "-=0.5")
        .add(() => {
          startRightWaveIfSelector(); // 👈 aquí arranca la derecha con delay si toca
        }, "-=0.3");

      timelineRef.current = initialTimeline;
      return () => initialTimeline.kill();
    }

    const tl = gsap.timeline({ onComplete: () => setIsAnimating(false) });
    tl.to(stage, { opacity: 0, duration: 0.9, ease: "power2.inOut" })
      .to([leftCurtainRef.current, rightCurtainRef.current], { xPercent: 0, y: 0, skewX: 0, duration: config.closeDuration, ease: config.closeEase }, "-=0.4")
      .add(() => setRenderedChildren(pendingChildrenRef.current))
      .to(leftCurtainRef.current, { xPercent: config.openLeft, duration: config.openDuration, ease: config.openEase })
      .to(rightCurtainRef.current, { xPercent: config.openRight, duration: config.openDuration, ease: config.openEase }, "<")
      .to(stage, { opacity: 1, duration: 0.8, ease: "power1.out" }, "-=0.5")
      .add(() => {
        startRightWaveIfSelector(); // 👈 también al cambiar de pantalla
      }, "-=0.3");

    timelineRef.current = tl;
    return () => tl.kill();
  }, [screen, viewportWidth]);

  return (
    <div className="curtain-transition">
      <div ref={stageRef} className="curtain-stage">{renderedChildren}</div>
      <div className="curtain-panel curtain-panel--left" ref={leftCurtainRef} aria-hidden="true" data-animating={isAnimating} />
      <div className="curtain-panel curtain-panel--right" ref={rightCurtainRef} aria-hidden="true" data-animating={isAnimating} />
    </div>
  );
}