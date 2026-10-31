export type Beneficiary = {
  id: string;
  numero: number;
  nom: string;
  fonction: string;
  nni: string;
  telephone: string;
  compte: string;
  banque: string;
  transport: number | null;
  jours: number | null;
  texted?: boolean;
};

export type Trainer = {
  id: string;
  numero: number;
  nom: string;
  structure: string;
  fonction: string;
  montantJour: number | null;
  jours: number | null;
  emargement: string;
  texted?: boolean;
};

export type Registry = {
  beneficiaries: Beneficiary[];
  trainers: Trainer[];
};

export type Kind = "beneficiaries" | "trainers";

export type Option = {
  value: string;
  ar: string;
  fr: string;
};

export type Gap = {
  ar: string;
  fr: string;
};
