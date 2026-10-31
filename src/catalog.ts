import type { Option } from "./types";

export const BANKS: Option[] = [
  {
    value: "BMCI",
    ar: "BMCI",
    fr: "Banque Mauritanienne pour le Commerce International",
  },
  {
    value: "BPM",
    ar: "BPM",
    fr: "Banque Populaire de Mauritanie",
  },
  {
    value: "BNM",
    ar: "BNM",
    fr: "Banque Nationale de Mauritanie",
  },
  { value: "BMI", ar: "BMI", fr: "BMI" },
  { value: "BIMBANAQUE", ar: "BIMBANAQUE", fr: "BIM Banque" },
  { value: "BII", ar: "BII", fr: "BII" },
  { value: "ABM", ar: "ABM", fr: "ABM" },
];

export const FONCTIONS: Option[] = [
  { value: "SFE", ar: "SFE", fr: "Sage-femme d'État · قابلة دولة" },
  { value: "Médecin", ar: "Médecin", fr: "Médecin · طبيب" },
  {
    value: "GYNECO_OBST",
    ar: "GYNECO_OBST",
    fr: "Gynécologue-obstétricien · طبيب نساء وتوليد",
  },
];

export const STRUCTURES: Option[] = [
  {
    value: "DRS",
    ar: "DRS",
    fr: "Direction régionale de la santé · المديرية الجهوية للصحة",
  },
  { value: "CHS", ar: "CHS", fr: "CHS" },
];

export function optionNote(options: Option[], value: string): string | undefined {
  const found = options.find((item) => item.value === value);
  if (!found || !found.fr || found.fr === found.ar || found.fr === value) return undefined;
  return found.fr;
}

export const PERDIEM_TITLE =
  "États de paiement de perdiems et transport de formations des sages femmes pour les nouveaux 28 centres de Sante de NKTT du 28 au 30 octobre 2026";

export const PROJECT_TITLE =
  "Projet d'appui aux services de la santé maternelle et neonatale (Bichara 2)";

export const ATELIER_TITLE =
  "Atelier de formation de SONU destiné aux prestataires de services du Guidimakha, du 04 au 18 mai 2026, à Sélibaby.";
