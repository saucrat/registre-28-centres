import { BANKS, FONCTIONS, STRUCTURES, optionNote } from "./catalog";
import { gapsOf, personTotal } from "./model";
import { formatNumber } from "./money";
import type { Beneficiary, Gap, Kind, Trainer } from "./types";

export type SheetField = {
  ar: string;
  fr: string;
  value: string;
  note?: string;
};

export type SheetIdentity = {
  name: string;
  nni: string;
  banque: string;
  banqueNote?: string;
  compte: string;
};

export type SheetModel = {
  kind: Kind;
  numero: number;
  name: string;
  identity: SheetIdentity;
  contextAr: string;
  contextFr: string;
  placeAr: string;
  placeFr: string;
  whenAr: string;
  whenFr: string;
  fields: SheetField[];
  dailyLabelAr: string;
  dailyLabelFr: string;
  daily: number | null;
  days: number | null;
  total: number | null;
  gaps: Gap[];
  reference: string;
};

function field(ar: string, fr: string, value: string, note?: string): SheetField {
  return { ar, fr, value, note };
}

export function toSheet(kind: Kind, person: Beneficiary | Trainer): SheetModel {
  if (kind === "beneficiaries") {
    const item = person as Beneficiary;
    return {
      kind,
      numero: item.numero,
      name: item.nom,
      identity: {
        name: item.nom,
        nni: item.nni,
        banque: item.banque,
        banqueNote: optionNote(BANKS, item.banque),
        compte: item.compte,
      },
      contextAr: "تكوين القابلات للمراكز الصحية الجديدة",
      contextFr: "Formation des sages-femmes des nouveaux centres",
      placeAr: "28 مركزاً صحياً · نواكشوط",
      placeFr: "28 centres de santé · Nouakchott",
      whenAr: "من 28 إلى 30 أكتوبر 2026",
      whenFr: "Du 28 au 30 octobre 2026",
      fields: [
        field("الوظيفة", "Fonction", item.fonction, optionNote(FONCTIONS, item.fonction)),
        field("الرقم الوطني", "NNI", item.nni),
        field("الهاتف", "Téléphone", item.telephone),
        field("رقم الحساب", "N° de compte", item.compte),
        field("البنك", "Banque", item.banque, optionNote(BANKS, item.banque)),
        field("تعويض النقل", "Transport (MRU)", item.transport == null ? "" : formatNumber(item.transport)),
        field("عدد الأيام", "Jours", item.jours == null ? "" : formatNumber(item.jours)),
      ],
      dailyLabelAr: "تعويض النقل",
      dailyLabelFr: "Transport (MRU)",
      daily: item.transport,
      days: item.jours,
      total: personTotal(kind, item),
      gaps: gapsOf(kind, item),
      reference: `NKTT-28-2026-${String(item.numero).padStart(3, "0")}`,
    };
  }

  const item = person as Trainer;
  return {
    kind,
    numero: item.numero,
    name: item.nom,
    identity: {
      name: item.nom,
      nni: item.nni,
      banque: item.banque,
      banqueNote: optionNote(BANKS, item.banque),
      compte: item.compte,
    },
    contextAr: "أتعاب المكوّنين الجهويين",
    contextFr: "Honoraires des formateurs régionaux",
    placeAr: "ورشة SONU · غيديماغا · سيلبابي",
    placeFr: "Atelier SONU · Guidimakha · Sélibaby",
    whenAr: "من 4 إلى 18 مايو 2026",
    whenFr: "Du 4 au 18 mai 2026",
    fields: [
      field("المؤسسة", "Structure", item.structure, optionNote(STRUCTURES, item.structure)),
      field("الوظيفة", "Fonction", item.fonction, optionNote(FONCTIONS, item.fonction)),
      field("الرقم الوطني", "NNI", item.nni),
      field("الهاتف", "Téléphone", item.telephone),
      field("رقم الحساب", "N° de compte", item.compte),
      field("البنك", "Banque", item.banque, optionNote(BANKS, item.banque)),
      field("المبلغ لليوم", "Montant / jour", item.montantJour == null ? "" : formatNumber(item.montantJour)),
      field("عدد الأيام", "Nombre de jours", item.jours == null ? "" : formatNumber(item.jours)),
    ],
    dailyLabelAr: "المبلغ لليوم",
    dailyLabelFr: "Montant / jour",
    daily: item.montantJour,
    days: item.jours,
    total: personTotal(kind, item),
    gaps: gapsOf(kind, item),
    reference: `SONU-2026-${String(item.numero).padStart(3, "0")}`,
  };
}
