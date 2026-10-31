const XLSX = require("xlsx");
const fs = require("fs");
const path = require("path");

const source =
  process.argv[2] ||
  "c:/Users/INDEX INFORMATIQUE/Downloads/28_centre_ameliore.xlsx";

const wb = XLSX.readFile(source);

function text(value) {
  if (value == null) return "";
  return String(value).trim();
}

function num(value) {
  if (value == null || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function rowsOf(sheetName) {
  const sheet = wb.Sheets[sheetName];
  return XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null, raw: true });
}

const perdiemRows = rowsOf("Perdiems+Transp");
const beneficiaries = [];
for (const row of perdiemRows) {
  if (typeof row[0] !== "number") continue;
  beneficiaries.push({
    id: `b-${row[0]}`,
    numero: row[0],
    nom: text(row[1]),
    fonction: text(row[2]),
    nni: text(row[3]),
    telephone: text(row[4]),
    compte: text(row[5]),
    banque: text(row[6]),
    transport: num(row[7]),
    jours: num(row[8]),
  });
}

const trainerRows = rowsOf("Honoraraire formateur R");
const trainers = [];
for (const row of trainerRows) {
  if (typeof row[0] !== "number") continue;
  trainers.push({
    id: `t-${row[0]}`,
    numero: row[0],
    nom: text(row[1]),
    structure: text(row[2]),
    fonction: text(row[3]),
    montantJour: num(row[4]),
    jours: num(row[5]),
    emargement: text(row[7]),
  });
}

const out = `import type { Registry } from "./types";

/** Seeded from 28_centre_ameliore.xlsx — regenerate with npm run seed. */
export const SEED: Registry = ${JSON.stringify({ beneficiaries, trainers }, null, 2)};
`;

const payload = { beneficiaries, trainers };
const target = path.join(__dirname, "..", "src", "seed.ts");
const jsonTarget = path.join(__dirname, "..", "server", "seed-data.json");
fs.mkdirSync(path.dirname(target), { recursive: true });
fs.mkdirSync(path.dirname(jsonTarget), { recursive: true });
fs.writeFileSync(target, out, "utf8");
fs.writeFileSync(jsonTarget, JSON.stringify(payload, null, 2), "utf8");
console.log(
  `Wrote ${beneficiaries.length} beneficiaries and ${trainers.length} trainers`,
);
