import test from "node:test";
import assert from "node:assert/strict";

import {
  getTituloCasilla,
  normalizeTableroSemantico,
  resolverFraseSemantica,
} from "./resolverFraseSemantica.js";

test("nivel viejo sin eslabones dinamicos conserva el flujo legacy", () => {
  const result = resolverFraseSemantica({
    fraseBase: "Los gatos",
    casillaX: { posicion: 1, prefijo_X: "cuando ", X: ["maullan"] },
    opcionX: "maullan",
    casillaO: { posicion: 2, prefijo_O: "entonces ", O: ["duermen"] },
    opcionO: "duermen",
    prefijos: { X: "", O: "" },
    sufijos: { X: ",", O: "." },
    ritmoFrase: { base_x: " ", x_o: " ", x_creativa: " " },
  });

  assert.equal(result.raw, "Los gatos cuando maullan, entonces duermen.");
  assert.equal(result.meta.mode, "legacy");
  assert.equal(result.meta.eslabonX, null);
  assert.equal(result.meta.eslabonO, null);
});

test("nivel nuevo con eslabones dinamicos elige conectores y devuelve meta", () => {
  const cache = new Map();
  const result = resolverFraseSemantica({
    fraseBase: "Los gatos siempre caemos de pie porque",
    casillaX: {
      posicion: 1,
      eslabones_X: ["cuando ", "si ", "cada vez que "],
      X: ["el cuerpo se adelanta a mi cabeza"],
    },
    opcionX: "el cuerpo se adelanta a mi cabeza",
    casillaO: {
      posicion: 1,
      eslabones_O: ["entonces ", "asi ", "y de pronto "],
      O: ["el suelo se vuelve casi amable"],
    },
    opcionO: "el suelo se vuelve casi amable",
    prefijos: { X: "", O: "" },
    sufijos: { X: "", O: "" },
    ritmoFrase: { base_x: " ", x_o: " ", x_creativa: " " },
    rng: () => 0.9,
    cache,
  });

  assert.equal(
    result.raw,
    "Los gatos siempre caemos de pie porque cada vez que el cuerpo se adelanta a mi cabeza y de pronto el suelo se vuelve casi amable"
  );
  assert.equal(result.meta.mode, "dynamic");
  assert.equal(result.meta.eslabonX, "cada vez que ");
  assert.equal(result.meta.eslabonO, "y de pronto ");
});

test("casillas con titulos pero sin eslabones usan titulo por casilla y fallback legacy", () => {
  const casilla = {
    posicion: 3,
    titulo_X: "CUANDO / SI",
    titulo_O: "ENTONCES / ASI",
    X: ["me abandono al movimiento"],
    O: ["la caida se vuelve ligera"],
  };

  assert.equal(getTituloCasilla(casilla, "X", { X: "LEGACY" }), "CUANDO / SI");
  assert.equal(getTituloCasilla(casilla, "O", { O: "LEGACY" }), "ENTONCES / ASI");

  const result = resolverFraseSemantica({
    fraseBase: "Base",
    casillaX: casilla,
    opcionX: "me abandono al movimiento",
    casillaO: casilla,
    opcionO: "la caida se vuelve ligera",
    prefijos: { X: "si ", O: "entonces " },
    sufijos: { X: ",", O: "." },
    ritmoFrase: { base_x: " ", x_o: " ", x_creativa: " " },
  });

  assert.equal(result.meta.mode, "legacy");
  assert.equal(result.raw, "Base si me abandono al movimiento, entonces la caida se vuelve ligera.");
});

test("normaliza espacios y valida arreglos opcionales", () => {
  const [casilla] = normalizeTableroSemantico([
    {
      posicion: 1,
      titulo_X: "  CUANDO  ",
      eslabones_X: ["  cuando ", "", null],
      eslabones_O: [" asi ", "   "],
      X: ["  salto  ", ""],
      O: [" caigo ", 42],
    },
  ]);

  assert.equal(casilla.titulo_X, "CUANDO");
  assert.deepEqual(casilla.eslabones_X, ["cuando "]);
  assert.deepEqual(casilla.eslabones_O, ["asi "]);
  assert.deepEqual(casilla.X, ["salto"]);
  assert.deepEqual(casilla.O, ["caigo"]);
});

test("construye frase en dos turnos sin espacios duplicados", () => {
  const result = resolverFraseSemantica({
    fraseBase: "Los gatos",
    casillaX: {
      posicion: 1,
      eslabones_X: ["si ", "cuando "],
      X: ["el aire me sostiene un segundo"],
    },
    opcionX: "el aire me sostiene un segundo",
    casillaO: {
      posicion: 2,
      eslabones_O: ["entonces ", "asi "],
      O: ["algo me acomoda en silencio"],
    },
    opcionO: "algo me acomoda en silencio",
    prefijos: { X: "", O: "" },
    sufijos: { X: "", O: "" },
    ritmoFrase: { base_x: " ", x_o: " ", x_creativa: " " },
    rng: () => 0,
  });

  assert.equal(
    result.raw,
    "Los gatos si el aire me sostiene un segundo entonces algo me acomoda en silencio"
  );
  assert.ok(!/\s{2,}/.test(result.raw));
});
