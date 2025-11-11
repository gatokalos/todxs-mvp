// src/components/TutorialBackground.jsx
export default function TutorialBackground({ step }) {
  if (step > 2) return null; // solo en pasos 0,1,2

  return (
    <div className={`bg-transition step-${step}`} />
  );
}