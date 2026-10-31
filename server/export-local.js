/**
 * Dump current Mongo registry to stdout as JSON (for migrating to Atlas).
 * Usage: node server/export-local.js > registry-dump.json
 */
import { closeDb } from "./db.js";
import { ensureIndexes, readRegistry } from "./registry.js";

try {
  await ensureIndexes();
  const data = await readRegistry();
  process.stdout.write(JSON.stringify(data, null, 2));
} catch (error) {
  console.error(error);
  process.exitCode = 1;
} finally {
  await closeDb();
}
