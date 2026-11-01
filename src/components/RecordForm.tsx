import { useState } from "react";
import { BANKS, FONCTIONS, STRUCTURES } from "../catalog";
import { parseAmount, totalOf } from "../model";
import { formatNumber } from "../money";
import type { Beneficiary, Kind, Trainer } from "../types";
import { SelectField } from "./SelectField";

type BeneficiaryDraft = {
  nom: string;
  fonction: string;
  nni: string;
  telephone: string;
  compte: string;
  banque: string;
  transport: string;
  jours: string;
};

type TrainerDraft = {
  nom: string;
  structure: string;
  fonction: string;
  nni: string;
  compte: string;
  banque: string;
  montantJour: string;
  jours: string;
};

export function RecordForm({
  kind,
  initial,
  beneficiaries,
  selfId,
  allowKindChange,
  onKind,
  onSubmit,
  onDelete,
}: {
  kind: Kind;
  initial: Beneficiary | Trainer | null;
  beneficiaries: Beneficiary[];
  selfId?: string;
  allowKindChange: boolean;
  onKind: (kind: Kind) => void;
  onSubmit: (kind: Kind, person: Beneficiary | Trainer) => void;
  onDelete?: () => void;
}) {
  const [beneficiary, setBeneficiary] = useState<BeneficiaryDraft>(() =>
    initial && kind === "beneficiaries" ? beneficiaryToDraft(initial as Beneficiary) : emptyBeneficiary(),
  );
  const [trainer, setTrainer] = useState<TrainerDraft>(() =>
    initial && kind === "trainers" ? trainerToDraft(initial as Trainer) : emptyTrainer(),
  );
  const [error, setError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);

  const draftNni = kind === "beneficiaries" ? beneficiary.nni.trim() : trainer.nni.trim();
  const duplicateNni =
    draftNni !== "" &&
    beneficiaries.some((item) => item.id !== selfId && item.nni.trim() === draftNni);
  const duplicatePhone =
    kind === "beneficiaries" &&
    beneficiary.telephone.trim() !== "" &&
    beneficiaries.some(
      (item) => item.id !== selfId && item.telephone.trim() === beneficiary.telephone.trim(),
    );

  const transport = parseAmount(kind === "beneficiaries" ? beneficiary.transport : trainer.montantJour);
  const days = parseAmount(kind === "beneficiaries" ? beneficiary.jours : trainer.jours);
  const preview = transport.ok && days.ok ? totalOf(transport.value, days.value) : null;

  function save() {
    const name = (kind === "beneficiaries" ? beneficiary.nom : trainer.nom).trim();
    if (!name) {
      setError("الاسم مطلوب. / Le nom est obligatoire.");
      return;
    }
    if (!transport.ok || !days.ok) {
      setError("المبلغ أو عدد الأيام غير صالح. / Montant ou nombre de jours invalide.");
      return;
    }
    setError("");
    if (kind === "beneficiaries") {
      const existing = initial && "transport" in initial ? (initial as Beneficiary) : null;
      const numero = existing?.numero ?? 0;
      const id = selfId ?? crypto.randomUUID();
      const next: Beneficiary = {
        id,
        numero,
        nom: name,
        fonction: beneficiary.fonction.trim(),
        nni: beneficiary.nni.trim(),
        telephone: beneficiary.telephone.trim(),
        compte: beneficiary.compte.trim(),
        banque: beneficiary.banque.trim(),
        transport: transport.value,
        jours: days.value,
        texted: existing ? Boolean(existing.texted) : false,
      };
      onSubmit(kind, next);
      return;
    }
    const existing = initial && "montantJour" in initial ? (initial as Trainer) : null;
    const next: Trainer = {
      id: selfId ?? crypto.randomUUID(),
      numero: existing?.numero ?? 0,
      nom: name,
      structure: trainer.structure.trim(),
      fonction: trainer.fonction.trim(),
      nni: trainer.nni.trim(),
      compte: trainer.compte.trim(),
      banque: trainer.banque.trim(),
      montantJour: transport.value,
      jours: days.value,
      texted: existing ? Boolean(existing.texted) : false,
    };
    onSubmit(kind, next);
  }

  return (
    <form
      className="record-form"
      onSubmit={(event) => {
        event.preventDefault();
        save();
      }}
    >
      {allowKindChange ? (
        <div className="segment" role="tablist" aria-label="نوع السجل">
          <button
            type="button"
            className={kind === "beneficiaries" ? "is-on" : ""}
            onClick={() => onKind("beneficiaries")}
          >
            <b lang="ar">قابلة</b>
            <small lang="fr">Sage-femme</small>
          </button>
          <button
            type="button"
            className={kind === "trainers" ? "is-on" : ""}
            onClick={() => onKind("trainers")}
          >
            <b lang="ar">مكوّن</b>
            <small lang="fr">Formateur</small>
          </button>
        </div>
      ) : null}

      {kind === "beneficiaries" ? (
        <div className="form-grid">
          <InputField
            labelAr="الاسم واللقب"
            labelFr="Nom et prénom"
            value={beneficiary.nom}
            onChange={(nom) => setBeneficiary({ ...beneficiary, nom })}
            ltr
            wide
          />
          <SelectField
            labelAr="الوظيفة"
            labelFr="Fonction"
            value={beneficiary.fonction}
            onChange={(fonction) => setBeneficiary({ ...beneficiary, fonction })}
            options={FONCTIONS}
            allowOther
          />
          <InputField
            labelAr="الرقم الوطني"
            labelFr="NNI"
            value={beneficiary.nni}
            onChange={(nni) => setBeneficiary({ ...beneficiary, nni })}
            ltr
            emptyAsMissing
          />
          <InputField
            labelAr="الهاتف"
            labelFr="Téléphone"
            value={beneficiary.telephone}
            onChange={(telephone) => setBeneficiary({ ...beneficiary, telephone })}
            ltr
            emptyAsMissing
          />
          <InputField
            labelAr="رقم الحساب"
            labelFr="N° de compte"
            value={beneficiary.compte}
            onChange={(compte) => setBeneficiary({ ...beneficiary, compte })}
            ltr
            emptyAsMissing
            wide
          />
          <SelectField
            labelAr="البنك"
            labelFr="Banque"
            value={beneficiary.banque}
            onChange={(banque) => setBeneficiary({ ...beneficiary, banque })}
            options={BANKS}
            allowOther
          />
          <InputField
            labelAr="تعويض النقل"
            labelFr="Transport (MRU)"
            value={beneficiary.transport}
            onChange={(transportValue) => setBeneficiary({ ...beneficiary, transport: transportValue })}
            ltr
            emptyAsMissing
          />
          <InputField
            labelAr="عدد الأيام"
            labelFr="Jours"
            value={beneficiary.jours}
            onChange={(jours) => setBeneficiary({ ...beneficiary, jours })}
            ltr
            emptyAsMissing
          />
        </div>
      ) : (
        <div className="form-grid">
          <InputField
            labelAr="الاسم واللقب"
            labelFr="Nom et prénom"
            value={trainer.nom}
            onChange={(nom) => setTrainer({ ...trainer, nom })}
            ltr
            wide
          />
          <SelectField
            labelAr="المؤسسة"
            labelFr="Structure"
            value={trainer.structure}
            onChange={(structure) => setTrainer({ ...trainer, structure })}
            options={STRUCTURES}
            allowOther
          />
          <SelectField
            labelAr="الوظيفة"
            labelFr="Fonction"
            value={trainer.fonction}
            onChange={(fonction) => setTrainer({ ...trainer, fonction })}
            options={FONCTIONS}
            allowOther
          />
          <InputField
            labelAr="الرقم الوطني"
            labelFr="NNI"
            value={trainer.nni}
            onChange={(nni) => setTrainer({ ...trainer, nni })}
            ltr
            emptyAsMissing
          />
          <InputField
            labelAr="رقم الحساب"
            labelFr="N° de compte"
            value={trainer.compte}
            onChange={(compte) => setTrainer({ ...trainer, compte })}
            ltr
            emptyAsMissing
            wide
          />
          <SelectField
            labelAr="البنك"
            labelFr="Banque"
            value={trainer.banque}
            onChange={(banque) => setTrainer({ ...trainer, banque })}
            options={BANKS}
            allowOther
          />
          <InputField
            labelAr="المبلغ لليوم"
            labelFr="Montant / jour"
            value={trainer.montantJour}
            onChange={(montantJour) => setTrainer({ ...trainer, montantJour })}
            ltr
            emptyAsMissing
          />
          <InputField
            labelAr="عدد الأيام"
            labelFr="Nombre de jours"
            value={trainer.jours}
            onChange={(jours) => setTrainer({ ...trainer, jours })}
            ltr
            emptyAsMissing
          />
        </div>
      )}

      <div className="form-total">
        <div>
          <span lang="ar">المجموع المحسوب</span>
          <small lang="fr">Total calculé</small>
        </div>
        <strong className="num">{preview == null ? "—" : `${formatNumber(preview)} MRU`}</strong>
      </div>

      {duplicateNni ? (
        <p className="form-note">
          <span lang="ar">هذا الرقم الوطني مستخدم في سجل آخر.</span>
          <small lang="fr">Ce NNI est déjà utilisé.</small>
        </p>
      ) : null}
      {duplicatePhone ? (
        <p className="form-note">
          <span lang="ar">هذا الهاتف مستخدم في سجل آخر.</span>
          <small lang="fr">Ce téléphone est déjà utilisé.</small>
        </p>
      ) : null}
      {error ? <p className="form-error">{error}</p> : null}
      <p className="form-hint">
        <span lang="ar">كل خانة تُترك فارغة تظهر في السجل وفي البطاقة بختم أحمر: غير مُعطى.</span>
        <small lang="fr">Chaque champ vide apparaît avec un sceau rouge : Non renseigné.</small>
      </p>

      <footer className="form-actions">
        {onDelete ? (
          <button
            type="button"
            className="btn btn-danger"
            onClick={() => {
              if (!confirmDelete) {
                setConfirmDelete(true);
                return;
              }
              onDelete();
            }}
          >
            <span>
              <b lang="ar">{confirmDelete ? "تأكيد الحذف" : "حذف السجل"}</b>
              <small lang="fr">{confirmDelete ? "Confirmer" : "Supprimer"}</small>
            </span>
          </button>
        ) : (
          <span />
        )}
        <button type="submit" className="btn">
          <span>
            <b lang="ar">{initial ? "حفظ التحديث" : "إضافة السجل"}</b>
            <small lang="fr">{initial ? "Enregistrer" : "Ajouter"}</small>
          </span>
        </button>
      </footer>
    </form>
  );
}

function InputField({
  labelAr,
  labelFr,
  value,
  onChange,
  ltr = false,
  wide = false,
  emptyAsMissing = false,
}: {
  labelAr: string;
  labelFr: string;
  value: string;
  onChange: (value: string) => void;
  ltr?: boolean;
  wide?: boolean;
  emptyAsMissing?: boolean;
}) {
  const missing = emptyAsMissing && value.trim() === "";
  return (
    <label className={wide ? "form-field wide" : "form-field"}>
      <span className="field-label">
        <span lang="ar">{labelAr}</span>
        <small lang="fr">{labelFr}</small>
      </span>
      <input
        className={missing ? "input input-empty" : "input"}
        dir={ltr ? "ltr" : "auto"}
        value={value}
        placeholder={missing ? "غير مُعطى · Non renseigné" : " "}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function emptyBeneficiary(): BeneficiaryDraft {
  return {
    nom: "",
    fonction: "SFE",
    nni: "",
    telephone: "",
    compte: "",
    banque: "",
    transport: "500",
    jours: "3",
  };
}

function emptyTrainer(): TrainerDraft {
  return {
    nom: "",
    structure: "",
    fonction: "",
    nni: "",
    compte: "",
    banque: "",
    montantJour: "2000",
    jours: "15",
  };
}

function beneficiaryToDraft(person: Beneficiary): BeneficiaryDraft {
  return {
    nom: person.nom,
    fonction: person.fonction,
    nni: person.nni,
    telephone: person.telephone,
    compte: person.compte,
    banque: person.banque,
    transport: person.transport == null ? "" : String(person.transport),
    jours: person.jours == null ? "" : String(person.jours),
  };
}

function trainerToDraft(person: Trainer): TrainerDraft {
  return {
    nom: person.nom,
    structure: person.structure,
    fonction: person.fonction,
    nni: person.nni,
    compte: person.compte,
    banque: person.banque,
    montantJour: person.montantJour == null ? "" : String(person.montantJour),
    jours: person.jours == null ? "" : String(person.jours),
  };
}
