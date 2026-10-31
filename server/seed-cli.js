import { closeDb } from "./db.js";
import { ensureIndexes, resetRegistry } from "./registry.js";

try {
  await ensureIndexes();
  const data = await resetRegistry();
  console.log(
    `MongoDB registre28 seeded: ${data.beneficiaries.length} beneficiaries, ${data.trainers.length} trainers`,
  );
} catch (error) {
  console.error(error);
  process.exitCode = 1;
} finally {
  await closeDb();
}
