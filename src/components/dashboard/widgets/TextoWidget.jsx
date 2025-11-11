import { TextT } from "@phosphor-icons/react";
import WidgetCard from "./WidgetCard";

export default function TextoWidget({ personaje }) {
  return (
    <WidgetCard
      icon={<TextT weight="duotone" />}
      title={`Textos de ${personaje?.nombre_visible || "Personaje"}`}
      description="Aquí aparecerán los textos generados con IA."
      accent="violet"
    >
      <button>Generar texto</button>
      <button>Reescribir</button>
    </WidgetCard>
  );
}