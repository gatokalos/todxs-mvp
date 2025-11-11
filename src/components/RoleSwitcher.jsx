import useGameStore from "../store/useGameStore";
import "./RoleSwitcher.css";

const ROLES = [
  { id: "anon", label: "Anónimo" },
  { id: "subscriber", label: "Suscriptor" },
  { id: "superadmin", label: "Superadmin" },
];

export default function RoleSwitcher() {
  const role = useGameStore((s) => s.role);
  const setRole = useGameStore((s) => s.setRole);

  return (
    <div className="role-switcher" aria-label="Cambiar rol simulado">
      {ROLES.map((r) => (
        <button
          key={r.id}
          type="button"
          className={`role-switcher__btn ${role === r.id ? "is-active" : ""}`}
          onClick={() => setRole(r.id)}
        >
          {r.label}
        </button>
      ))}
    </div>
  );
}
