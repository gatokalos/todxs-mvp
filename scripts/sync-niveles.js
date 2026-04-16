// scripts/sync-niveles.js
// Uso: node --env-file=.env.local scripts/sync-niveles.js
//
// Lee todos los JSON de src/data/niveles/ y hace upsert en Supabase.
// Clave de conflicto: personaje_id + nivel (nunca borra registros).

import { createClient } from "@supabase/supabase-js";
import { readdir, readFile } from "fs/promises";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const NIVELES_DIR = join(__dirname, "../src/data/niveles");

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("❌ Faltan VITE_SUPABASE_URL o la clave de Supabase en .env.local");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function main() {
  const files = (await readdir(NIVELES_DIR)).filter((f) => f.endsWith(".json"));

  if (!files.length) {
    console.log("No hay archivos JSON en src/data/niveles/");
    return;
  }

  console.log(`\nSincronizando ${files.length} nivel(es)...\n`);

  for (const file of files) {
    const raw = await readFile(join(NIVELES_DIR, file), "utf-8");
    const data = JSON.parse(raw);
    const label = `${data.personaje_id} — nivel ${data.nivel}`;

    const { error } = await supabase
      .from("niveles_semanticos")
      .upsert(data, { onConflict: "personaje_id,nivel" });

    if (error) {
      console.error(`  ❌ ${label}: ${error.message}`);
    } else {
      console.log(`  ✅ ${label}`);
    }
  }

  console.log("\nListo.\n");
}

main().catch((err) => {
  console.error("❌ Error inesperado:", err.message);
  process.exit(1);
});
