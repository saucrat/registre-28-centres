import { SEED } from "./seed";
import type { Beneficiary, Gap, Kind, Registry, Trainer } from "./types";

const STORAGE_KEY = "registre-28-centres.v1";

export function totalOf(a: number | null, b: number | null): number | null {
  if (a == null || b == null) return null;
  const value = a * b;
  if (!Number.isFinite(value)) return null;
  return Math.round(value * 100) / 100;
}

export function isBlank(value: string | null | undefined): boolean {
  return value == null || value.trim() === "";
}

function text(value: unknown): string {
  return typeof value === "string" ? value : value == null ? "" : String(value);
}

function amount(value: unknown): number | null {
  if (value == null || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function beneficiaryGaps(person: Beneficiary): Gap[] {
  const gaps: Gap[] = [];
  const add = (blank: boolean, ar: string, fr: string) => {
    if (blank) gaps.push({ ar, fr });
  };
  add(isBlank(person.nom), "الاسم واللقب", "Nom et prénom");
  add(isBlank(person.fonction), "الوظيفة", "Fonction");
  add(isBlank(person.nni), "الرقم الوطني", "NNI");
  add(isBlank(person.telephone), "الهاتف", "Téléphone");
  add(isBlank(person.compte), "رقم الحساب", "N° de compte");
  add(isBlank(person.banque), "البنك", "Banque");
  add(person.transport == null, "تعويض النقل", "Transport (MRU)");
  add(person.jours == null, "عدد الأيام", "Jours");
  return gaps;
}

function trainerGaps(person: Trainer): Gap[] {
  const gaps: Gap[] = [];
  const add = (blank: boolean, ar: string, fr: string) => {
    if (blank) gaps.push({ ar, fr });
  };
  add(isBlank(person.nom), "الاسم واللقب", "Nom et prénom");
  add(isBlank(person.structure), "المؤسسة", "Structure");
  add(isBlank(person.fonction), "الوظيفة", "Fonction");
  add(person.montantJour == null, "المبلغ لليوم", "Montant / jour");
  add(person.jours == null, "عدد الأيام", "Nombre de jours");
  add(isBlank(person.emargement), "الإمضاء", "Émargement");
  return gaps;
}

export function gapsOf(kind: Kind, person: Beneficiary | Trainer): Gap[] {
  return kind === "beneficiaries"
    ? beneficiaryGaps(person as Beneficiary)
    : trainerGaps(person as Trainer);
}

export function personTotal(kind: Kind, person: Beneficiary | Trainer): number | null {
  if (kind === "beneficiaries") {
    const item = person as Beneficiary;
    return totalOf(item.transport, item.jours);
  }
  const item = person as Trainer;
  return totalOf(item.montantJour, item.jours);
}

export function registryTotal(kind: Kind, data: Registry): number {
  const list = kind === "beneficiaries" ? data.beneficiaries : data.trainers;
  return list.reduce((sum, person) => sum + (personTotal(kind, person) ?? 0), 0);
}

export function incompleteCount(kind: Kind, data: Registry): number {
  const list = kind === "beneficiaries" ? data.beneficiaries : data.trainers;
  return list.filter((person) => gapsOf(kind, person).length > 0).length;
}

function renumber<T extends { numero: number }>(list: T[]): T[] {
  return list.map((item, index) => ({ ...item, numero: index + 1 }));
}

export function normalize(data: Registry): Registry {
  return {
    beneficiaries: renumber(
      data.beneficiaries.map((person) => ({ ...person, texted: Boolean(person.texted) })),
    ),
    trainers: renumber(data.trainers.map((person) => ({ ...person, texted: Boolean(person.texted) }))),
  };
}

function coerceBeneficiary(value: unknown, index: number): Beneficiary | null {
  if (!value || typeof value !== "object") return null;
  const row = value as Record<string, unknown>;
  if (typeof row.nom !== "string") return null;
  return {
    id: typeof row.id === "string" ? row.id : `b-${index + 1}`,
    numero: Number(row.numero) || index + 1,
    nom: row.nom,
    fonction: text(row.fonction),
    nni: text(row.nni),
    telephone: text(row.telephone),
    compte: text(row.compte),
    banque: text(row.banque),
    transport: amount(row.transport),
    jours: amount(row.jours),
    texted: row.texted === true,
  };
}

function coerceTrainer(value: unknown, index: number): Trainer | null {
  if (!value || typeof value !== "object") return null;
  const row = value as Record<string, unknown>;
  if (typeof row.nom !== "string") return null;
  return {
    id: typeof row.id === "string" ? row.id : `t-${index + 1}`,
    numero: Number(row.numero) || index + 1,
    nom: row.nom,
    structure: text(row.structure),
    fonction: text(row.fonction),
    montantJour: amount(row.montantJour),
    jours: amount(row.jours),
    emargement: text(row.emargement),
    texted: row.texted === true,
  };
}

export function parseRegistry(value: unknown): Registry | null {
  if (!value || typeof value !== "object") return null;
  const parsed = value as { beneficiaries?: unknown; trainers?: unknown };
  if (!Array.isArray(parsed.beneficiaries) || !Array.isArray(parsed.trainers)) return null;
  const beneficiaries = parsed.beneficiaries
    .map(coerceBeneficiary)
    .filter((item): item is Beneficiary => item != null);
  const trainers = parsed.trainers
    .map(coerceTrainer)
    .filter((item): item is Trainer => item != null);
  if (!beneficiaries.length && !trainers.length) return null;
  return normalize({ beneficiaries, trainers });
}

export function loadRegistry(): Registry {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return normalize(structuredClone(SEED));
    return parseRegistry(JSON.parse(raw)) ?? normalize(structuredClone(SEED));
  } catch {
    return normalize(structuredClone(SEED));
  }
}

export function saveRegistry(data: Registry) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function cacheRegistry(data: Registry) {
  saveRegistry(data);
}

export function freshSeed(): Registry {
  return normalize(structuredClone(SEED));
}

export function parseAmount(raw: string): { ok: true; value: number | null } | { ok: false } {
  const cleaned = raw.trim().replace(/\s/g, "").replace(",", ".");
  if (!cleaned) return { ok: true, value: null };
  if (!/^\d+(\.\d{1,2})?$/.test(cleaned)) return { ok: false };
  const value = Number(cleaned);
  if (!Number.isFinite(value) || value < 0) return { ok: false };
  return { ok: true, value: Math.round(value * 100) / 100 };
}

export function matchesQuery(parts: Array<string | number | null>, query: string): boolean {
  const needle = query.trim().toLowerCase();
  if (!needle) return true;
  return parts
    .filter((part) => part != null && String(part).trim() !== "")
    .join(" ")
    .toLowerCase()
    .includes(needle);
}

export function pdfFilename(numero: number, nom: string): string {
  const safe =
    nom
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^A-Za-z0-9]+/g, "_")
      .replace(/^_|_$/g, "")
      .slice(0, 48) || "personne";
  return `Confirmation_${String(numero).padStart(2, "0")}_${safe}.pdf`;
}
