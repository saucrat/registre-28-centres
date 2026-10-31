import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { getCollections } from "./db.js";

const root = dirname(fileURLToPath(import.meta.url));
const seed = JSON.parse(readFileSync(join(root, "seed-data.json"), "utf8"));

function renumber(list) {
  return list.map((item, index) => ({ ...item, numero: index + 1, texted: Boolean(item.texted) }));
}

function normalize(data) {
  return {
    beneficiaries: renumber(Array.isArray(data.beneficiaries) ? data.beneficiaries : []),
    trainers: renumber(Array.isArray(data.trainers) ? data.trainers : []),
  };
}

export function getSeed() {
  return normalize(structuredClone(seed));
}

export async function ensureIndexes() {
  const { beneficiaries, trainers } = await getCollections();
  await beneficiaries.createIndex({ id: 1 }, { unique: true });
  await trainers.createIndex({ id: 1 }, { unique: true });
}

export async function readRegistry() {
  const { beneficiaries, trainers } = await getCollections();
  const [bRows, tRows] = await Promise.all([
    beneficiaries.find({}, { projection: { _id: 0 } }).sort({ numero: 1 }).toArray(),
    trainers.find({}, { projection: { _id: 0 } }).sort({ numero: 1 }).toArray(),
  ]);

  if (!bRows.length && !tRows.length) {
    const fresh = getSeed();
    await writeRegistry(fresh);
    return fresh;
  }

  return normalize({ beneficiaries: bRows, trainers: tRows });
}

export async function writeRegistry(raw) {
  const data = normalize(raw);
  const { beneficiaries, trainers, meta } = await getCollections();

  await Promise.all([beneficiaries.deleteMany({}), trainers.deleteMany({})]);

  if (data.beneficiaries.length) {
    await beneficiaries.insertMany(data.beneficiaries);
  }
  if (data.trainers.length) {
    await trainers.insertMany(data.trainers);
  }

  await meta.updateOne(
    { _id: "registry" },
    {
      $set: {
        updatedAt: new Date(),
        beneficiaryCount: data.beneficiaries.length,
        trainerCount: data.trainers.length,
      },
    },
    { upsert: true },
  );

  return data;
}

export async function resetRegistry() {
  return writeRegistry(getSeed());
}
