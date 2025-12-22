import { useState, useEffect, useRef, useCallback } from "react";

const DEFAULT_TITLE = "ESCOGE TU IMPROV";
const IDLE_HINT = "Desliza hacia la derecha o a la izquierda para escoger.";

export default function useHubHint({
  initialTitle = DEFAULT_TITLE,
  inactivityDelay = 4500,
}) {
  const [hintText, setHintText] = useState(initialTitle || DEFAULT_TITLE);
  const titleRef = useRef(initialTitle || DEFAULT_TITLE);
  const interactedRef = useRef(false);
  const idleTimerRef = useRef(null);

  const clearIdleTimer = useCallback(() => {
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
      idleTimerRef.current = null;
    }
  }, []);

  const startIdleTimer = useCallback(() => {
    clearIdleTimer();
    if (interactedRef.current) return;
    idleTimerRef.current = setTimeout(() => {
      setHintText(IDLE_HINT);
    }, inactivityDelay);
  }, [clearIdleTimer, inactivityDelay]);

  useEffect(() => {
    const nextTitle = initialTitle || DEFAULT_TITLE;
    titleRef.current = nextTitle;
    interactedRef.current = false;
    setHintText(nextTitle);
    startIdleTimer();
    return () => {
      clearIdleTimer();
    };
  }, [initialTitle, startIdleTimer, clearIdleTimer]);

  const markInteraction = useCallback(() => {
    interactedRef.current = true;
    clearIdleTimer();
    setHintText(titleRef.current);
  }, [clearIdleTimer]);

  const setLevelTitle = useCallback(
    (title) => {
      const normalized = title?.trim() || titleRef.current || DEFAULT_TITLE;
      titleRef.current = normalized;
      setHintText(normalized);
    },
    []
  );

  const setHint = useCallback((text) => {
    if (!text) return;
    setHintText(text);
  }, []);

  const resetHint = useCallback(() => {
    setHintText(titleRef.current);
    if (!interactedRef.current) {
      startIdleTimer();
    }
  }, [startIdleTimer]);

  const showIdleHint = useCallback(() => {
    setHintText(IDLE_HINT);
  }, []);

  return {
    hintText,
    setLevelTitle,
    markInteraction,
    setHint,
    resetHint,
    showIdleHint,
  };
}
