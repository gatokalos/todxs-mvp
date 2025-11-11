import { useLayoutEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import "./GatologiasSticky.css";

gsap.registerPlugin(ScrollTrigger);

export default function GatologiasSticky({ onClick }) {
  const btnRef = useRef(null);

  useLayoutEffect(() => {
    const btn = btnRef.current;
    if (!btn) return;

    // posición inicial (visible arriba a la derecha)
    gsap.set(btn, {
      position: "fixed",
      top: 120,
      right: 32,
      zIndex: 20000,   // por encima de cortinas y role switcher
      pointerEvents: "auto",
    });

    // Calcula la posición de destino justo BAJO el role switcher
    const moveBelowRoleSwitcher = () => {
      const rs = document.querySelector(".role-switcher, .app-role-switcher");
      if (!rs) return; // si no existe, no pasa nada

      const rect = rs.getBoundingClientRect();
      const top = rect.bottom + 12; // 12px debajo del switcher
      const right = Math.max(16, window.innerWidth - rect.right); // ajusta al borde derecho del switcher

      gsap.to(btn, {
        top,
        right,
        duration: 0.6,
        ease: "power3.out",
        overwrite: "auto",
      });
    };

    const moveToStart = () => {
      gsap.to(btn, {
        top: 120,
        right: 32,
        duration: 0.6,
        ease: "power3.out",
        overwrite: "auto",
      });
    };
    
    
    // Trigger: al empezar a scrollear baja junto al switcher; al volver arriba, regresa
    const st = ScrollTrigger.create({
      start: 10,         // a partir de 10px de scroll
      end: "max",        // toda la página
      onEnter: moveBelowRoleSwitcher,
      onRefresh: self => { if (self.progress > 0) moveBelowRoleSwitcher(); },
      onLeaveBack: moveToStart,
      // markers: true,   // <-- activa para depurar
    });

    // Recalcular al hacer resize
    const onResize = () => {
      if (ScrollTrigger.isInViewport(document.body, 10)) {
        if (window.scrollY > 10) moveBelowRoleSwitcher();
      }
    };
    window.addEventListener("resize", onResize);

    return () => {
      st.kill();
      window.removeEventListener("resize", onResize);
    };
  }, []);

  // Portal al body para salir del stacking context de las cortinas
  return createPortal(
    <button
      ref={btnRef}
      className="gatologias-sticky"
  
      type="button"
      aria-label="Ir a Gatologías"
      onClick={onClick}
    >
       <img src="/assets/gato_carita.svg" alt="Ir a Gatologías" />
    </button>,
    document.body
  );
}
