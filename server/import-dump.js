/**
 * Import a registry JSON dump into the DB pointed at by MONGODB_URI.
 * Usage: MONGODB_URI=... node server/import-dump.js registry-dump.json
 */
import { readFileSync } from "node:fs";
import { closeDb } from "./db.js";
import { ensureIndexes, writeRegistry } from "./registry.js";

const file = process.argv[2];
if (!file) {
  console.error("Usage: node server/import-dump.js <dump.json>");
  process.exit(1);
}

try {
  const raw = JSON.parse(readFileSync(file, "utf8"));
  await ensureIndexes();
  const data = await writeRegistry(raw);
  console.log(
    `Imported into ${process.env.MONGODB_DB || "registre28"}: ${data.beneficiaries.length} beneficiaries, ${data.trainers.length} trainers`,
  );
} catch (error) {
  console.error(error);
  process.exitCode = 1;
} finally {
  await closeDb();
}
