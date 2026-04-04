/**
 * @typedef {Object} CasillaSemantica
 * @property {number=} posicion
 * @property {string[]=} X
 * @property {string[]=} O
 * @property {string=} prefijo_X
 * @property {string=} prefijo_O
 * @property {string=} titulo_X
 * @property {string=} titulo_O
 * @property {string[]=} eslabones_X
 * @property {string[]=} eslabones_O
 */

export const DEFAULT_RITMO_FRASE = {
  base_x: "\n",
  x_o: "\n",
  x_creativa: "\n",
};

export const ensureText = (value) => (typeof value === "string" ? value : "");
export const toDisplayText = (text = "") => ensureText(text).replace(/\\n/g, "\n");

const normalizeConnector = (text) => {
  if (typeof text !== "string") return null;
  return text.replace(/\n/g, "\\n");
};

const pickConnector = (value, keys) => {
  for (const key of keys) {
    const raw = normalizeConnector(value?.[key]);
    if (typeof raw === "string") return raw;
  }
  return null;
};

export const sanitizeRitmoFrase = (value) => {
  if (!value || typeof value !== "object") return { ...DEFAULT_RITMO_FRASE };
  return {
    base_x: pickConnector(value, ["base_x", "baseX", "base"]) ?? DEFAULT_RITMO_FRASE.base_x,
    x_o: pickConnector(value, ["x_o", "xo", "between", "xO"]) ?? DEFAULT_RITMO_FRASE.x_o,
    x_creativa:
      pickConnector(value, ["x_creativa", "xCreativa", "creativa", "creative"]) ??
      DEFAULT_RITMO_FRASE.x_creativa,
  };
};

const sanitizeLabel = (value) => {
  if (typeof value !== "string") return undefined;
  const next = value.trim();
  return next ? next : undefined;
};

const sanitizeConnectorText = (value) => {
  if (typeof value !== "string") return undefined;
  const next = value.replace(/^\s+/, "");
  return next.trim() ? next : undefined;
};

const sanitizeStringArray = (value, { preserveTrailing = false } = {}) => {
  if (!Array.isArray(value)) return undefined;
  const next = value
    .map((item) => {
      if (typeof item !== "string") return null;
      return preserveTrailing ? item.replace(/^\s+/, "") : item.trim();
    })
    .filter((item) => typeof item === "string" && item.trim().length > 0);
  return next.length ? next : undefined;
};

export const sanitizeCasillaSemantica = (casilla) => {
  if (!casilla || typeof casilla !== "object") return {};

  const next = { ...casilla };
  const tituloX = sanitizeLabel(casilla.titulo_X);
  const tituloO = sanitizeLabel(casilla.titulo_O);
  const eslabonesX = sanitizeStringArray(casilla.eslabones_X, { preserveTrailing: true });
  const eslabonesO = sanitizeStringArray(casilla.eslabones_O, { preserveTrailing: true });
  const x = sanitizeStringArray(casilla.X);
  const o = sanitizeStringArray(casilla.O);
  const prefijoX = sanitizeConnectorText(casilla.prefijo_X);
  const prefijoO = sanitizeConnectorText(casilla.prefijo_O);

  if (tituloX) next.titulo_X = tituloX;
  else delete next.titulo_X;

  if (tituloO) next.titulo_O = tituloO;
  else delete next.titulo_O;

  if (eslabonesX) next.eslabones_X = eslabonesX;
  else delete next.eslabones_X;

  if (eslabonesO) next.eslabones_O = eslabonesO;
  else delete next.eslabones_O;

  if (x) next.X = x;
  else next.X = [];

  if (o) next.O = o;
  else next.O = [];

  if (prefijoX) next.prefijo_X = prefijoX;
  else delete next.prefijo_X;

  if (prefijoO) next.prefijo_O = prefijoO;
  else delete next.prefijo_O;

  return next;
};

export const normalizeTableroSemantico = (tablero) =>
  Array.isArray(tablero) ? tablero.map((casilla) => sanitizeCasillaSemantica(casilla)) : [];

const getCasillaPrefijo = (casilla, jugador, prefijos = {}, rng = Math.random) => {
  const safeCasilla = sanitizeCasillaSemantica(casilla);
  const casillaPrefijo = jugador === "X" ? safeCasilla.prefijo_X : safeCasilla.prefijo_O;
  if (typeof casillaPrefijo === "string") return casillaPrefijo;
  const globalPrefijo = jugador === "X" ? prefijos?.X : prefijos?.O;
  return pickFromValue(globalPrefijo, rng);
};

const getSufijoJugador = (jugador, sufijos = {}) =>
  ensureText(jugador === "X" ? sufijos?.X : sufijos?.O);

const joinWithConnector = (current, next, connector = DEFAULT_RITMO_FRASE.base_x) => {
  if (!next) return current;
  if (!current) return next;
  return `${current}${connector}${next}`;
};

const composeFraseLegacy = (
  base,
  lineaX,
  lineaTercera,
  ritmo = DEFAULT_RITMO_FRASE,
  usarCreativo = false
) => {
  let resultado = ensureText(base);
  if (lineaX) {
    resultado = joinWithConnector(resultado, lineaX, ritmo.base_x);
  }
  if (lineaTercera) {
    const conector = usarCreativo ? ritmo.x_creativa : ritmo.x_o;
    resultado = joinWithConnector(resultado, lineaTercera, conector);
  }
  return resultado;
};

const buildLegacySegment = ({ jugador, palabra, casilla, prefijos, sufijos, rng }) => {
  if (!palabra) return "";
  const prefijo = getCasillaPrefijo(casilla, jugador, prefijos, rng);
  const sufijo = getSufijoJugador(jugador, sufijos);
  return `${prefijo}${palabra}${sufijo}`;
};

const buildCacheKey = ({ fraseBase, jugador, casilla, palabra }) => {
  const posicion = Number.isInteger(casilla?.posicion) ? casilla.posicion : "na";
  return [ensureText(fraseBase), jugador, posicion, ensureText(palabra)].join("::");
};

const pickRandomItem = (items, rng = Math.random) => {
  if (!Array.isArray(items) || items.length === 0) return null;
  const randomValue = typeof rng === "function" ? rng() : Math.random();
  const safeRandom = Number.isFinite(randomValue)
    ? Math.min(Math.max(randomValue, 0), 0.999999)
    : Math.random();
  return items[Math.floor(safeRandom * items.length)] ?? items[0] ?? null;
};

// Soporta prefijos como string fijo o array rotatorio.
const pickFromValue = (value, rng = Math.random) => {
  if (Array.isArray(value)) return pickRandomItem(value, rng) ?? "";
  return ensureText(value);
};

const resolveDynamicConnector = ({ fraseBase, jugador, casilla, palabra, fallback, cache, rng }) => {
  const safeCasilla = sanitizeCasillaSemantica(casilla);
  const key = jugador === "X" ? "eslabones_X" : "eslabones_O";
  const options = safeCasilla[key];
  if (!Array.isArray(options) || options.length === 0) {
    return ensureText(fallback);
  }

  const cacheKey = buildCacheKey({ fraseBase, jugador, casilla: safeCasilla, palabra });
  if (cache instanceof Map && cache.has(cacheKey)) {
    return cache.get(cacheKey);
  }

  const selected = pickRandomItem(options, rng) ?? ensureText(fallback);
  if (cache instanceof Map) {
    cache.set(cacheKey, selected);
  }
  return selected;
};

const normalizeInlineSentence = (text) =>
  ensureText(text)
    .replace(/[ \t]+/g, " ")
    .replace(/ ?\n ?/g, " ")
    .replace(/\s+([,.;:!?])/g, "$1")
    .trim();

export const getTituloCasilla = (casilla, jugador, fallbackTituloModal = null) => {
  const safeCasilla = sanitizeCasillaSemantica(casilla);
  const dynamicTitle = jugador === "X" ? safeCasilla.titulo_X : safeCasilla.titulo_O;
  if (dynamicTitle) return dynamicTitle;
  if (fallbackTituloModal && typeof fallbackTituloModal === "object") {
    return fallbackTituloModal?.[jugador] || fallbackTituloModal?.default || "";
  }
  return "";
};

export const resolverFraseSemantica = ({
  fraseBase,
  casillaX,
  opcionX,
  casillaO,
  opcionO,
  prefijos = {},
  sufijos = {},
  ritmoFrase = DEFAULT_RITMO_FRASE,
  usarCreativo = false,
  rng = Math.random,
  cache = null,
}) => {
  const safeRitmo = sanitizeRitmoFrase(ritmoFrase);
  const safeBase = ensureText(fraseBase).replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim();
  const safeCasillaX = sanitizeCasillaSemantica(casillaX);
  const safeCasillaO = sanitizeCasillaSemantica(casillaO);
  const hasDynamicX = Array.isArray(safeCasillaX.eslabones_X) && safeCasillaX.eslabones_X.length > 0;
  const hasDynamicO = Array.isArray(safeCasillaO.eslabones_O) && safeCasillaO.eslabones_O.length > 0;

  if (!hasDynamicX && !hasDynamicO) {
    const legacyX = buildLegacySegment({
      jugador: "X",
      palabra: opcionX,
      casilla: safeCasillaX,
      prefijos,
      sufijos,
      rng,
    });
    const legacyO = buildLegacySegment({
      jugador: "O",
      palabra: opcionO,
      casilla: safeCasillaO,
      prefijos,
      sufijos,
      rng,
    });
    const raw = composeFraseLegacy(safeBase, legacyX, legacyO, safeRitmo, usarCreativo);
    return {
      raw,
      display: toDisplayText(raw),
      meta: {
        mode: "legacy",
        eslabonX: null,
        eslabonO: null,
        segmentX: legacyX,
        segmentO: legacyO,
      },
    };
  }

  const eslabonX = resolveDynamicConnector({
    fraseBase: safeBase,
    jugador: "X",
    casilla: safeCasillaX,
    palabra: opcionX,
    fallback: getCasillaPrefijo(safeCasillaX, "X", prefijos, rng),
    cache,
    rng,
  });
  const eslabonO = resolveDynamicConnector({
    fraseBase: safeBase,
    jugador: "O",
    casilla: safeCasillaO,
    palabra: opcionO,
    fallback: getCasillaPrefijo(safeCasillaO, "O", prefijos, rng),
    cache,
    rng,
  });

  const segmentX = opcionX
    ? `${ensureText(eslabonX)}${ensureText(opcionX)}${hasDynamicX ? "" : getSufijoJugador("X", sufijos)}`
    : "";
  const segmentO = opcionO
    ? `${ensureText(eslabonO)}${ensureText(opcionO)}${hasDynamicO ? "" : getSufijoJugador("O", sufijos)}`
    : "";

  let raw = safeBase;
  if (segmentX) raw = joinWithConnector(raw, segmentX, safeRitmo.base_x);
  if (segmentO) raw = joinWithConnector(raw, segmentO, usarCreativo ? safeRitmo.x_creativa : safeRitmo.x_o);
  raw = normalizeInlineSentence(raw);

  return {
    raw,
    display: toDisplayText(raw),
    meta: {
      mode: "dynamic",
      eslabonX: hasDynamicX ? ensureText(eslabonX) : null,
      eslabonO: hasDynamicO ? ensureText(eslabonO) : null,
      segmentX,
      segmentO,
    },
  };
};
