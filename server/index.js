import cors from "cors";
import express from "express";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { closeDb } from "./db.js";
import { ensureIndexes, readRegistry, resetRegistry, writeRegistry } from "./registry.js";

const port = Number(process.env.PORT || 8787);
const dbName = process.env.MONGODB_DB || "registre28";
const root = dirname(fileURLToPath(import.meta.url));
const dist = join(root, "..", "dist");
const app = express();

app.use(cors());
app.use(express.json({ limit: "4mb" }));

app.get("/api/health", async (_req, res) => {
  try {
    await ensureIndexes();
    res.json({ ok: true, db: dbName });
  } catch (error) {
    res.status(500).json({ ok: false, error: String(error?.message || error) });
  }
});

app.get("/api/registry", async (_req, res) => {
  try {
    await ensureIndexes();
    const data = await readRegistry();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: String(error?.message || error) });
  }
});

app.put("/api/registry", async (req, res) => {
  try {
    await ensureIndexes();
    const data = await writeRegistry(req.body ?? {});
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: String(error?.message || error) });
  }
});

app.post("/api/registry/reset", async (_req, res) => {
  if (process.env.ALLOW_RESET !== "1") {
    res.status(403).json({ error: "Reset is disabled. Set ALLOW_RESET=1 to enable." });
    return;
  }
  try {
    await ensureIndexes();
    const data = await resetRegistry();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: String(error?.message || error) });
  }
});

if (existsSync(dist)) {
  app.use(express.static(dist, { index: false }));
  app.get(/^(?!\/api(?:\/|$)).*/, (_req, res) => {
    res.sendFile(join(dist, "index.html"));
  });
}

const server = app.listen(port, "0.0.0.0", () => {
  console.log(`App listening on http://0.0.0.0:${port}`);
});

async function shutdown() {
  server.close();
  await closeDb();
  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
