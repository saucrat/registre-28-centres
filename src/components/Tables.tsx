import { FileCheck, Pencil } from "lucide-react";
import { FONCTIONS, optionNote } from "../catalog";
import { gapsOf, personTotal } from "../model";
import { formatNumber } from "../money";
import type { Beneficiary, Trainer } from "../types";
import { MissingMark } from "./MissingMark";

export function BeneficiaryTable({
  rows,
  onOpen,
  onEdit,
  onConfirm,
}: {
  rows: Beneficiary[];
  onOpen: (person: Beneficiary) => void;
  onEdit: (person: Beneficiary) => void;
  onConfirm: (person: Beneficiary) => void;
}) {
  return (
    <table className="grid">
      <thead>
        <tr>
          <Th ar="الرقم" fr="N°" />
          <Th ar="الاسم واللقب" fr="Nom et prénom" />
          <Th ar="الوظيفة" fr="Fonction" />
          <Th ar="الرقم الوطني" fr="NNI" />
          <Th ar="الهاتف" fr="Téléphone" />
          <Th ar="رقم الحساب" fr="N° de compte" />
          <Th ar="البنك" fr="Banque" />
          <Th ar="النقل" fr="Transport" />
          <Th ar="الأيام" fr="Jours" />
          <Th ar="المجموع" fr="Total MRU" />
          <Th ar="الحالة" fr="État" />
          <Th ar="الإجراءات" fr="Actions" />
        </tr>
      </thead>
      <tbody>
        {rows.map((person) => {
          const incomplete = gapsOf("beneficiaries", person).length > 0;
          const total = personTotal("beneficiaries", person);
          return (
            <tr key={person.id} className={incomplete ? "is-incomplete" : ""}>
              <td className="num">{person.numero}</td>
              <td>
                <button type="button" className="name-btn" onClick={() => onOpen(person)}>
                  {person.nom.trim() ? <span className="latin">{person.nom}</span> : <MissingMark dense />}
                </button>
              </td>
              <td title={optionNote(FONCTIONS, person.fonction)}>
                <Plain value={person.fonction} />
              </td>
              <td><Plain value={person.nni} numeric /></td>
              <td><Plain value={person.telephone} numeric /></td>
              <td><Plain value={person.compte} numeric /></td>
              <td><Plain value={person.banque} /></td>
              <td className="num">{person.transport == null ? <MissingMark dense /> : formatNumber(person.transport)}</td>
              <td className="num">{person.jours == null ? <MissingMark dense /> : formatNumber(person.jours)}</td>
              <td className="num total-cell">{total == null ? <MissingMark dense /> : formatNumber(total)}</td>
              <td><StatusBadge incomplete={incomplete} /></td>
              <td className="sticky-end">
                <Actions onEdit={() => onEdit(person)} onConfirm={() => onConfirm(person)} />
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

export function TrainerTable({
  rows,
  onOpen,
  onEdit,
  onConfirm,
}: {
  rows: Trainer[];
  onOpen: (person: Trainer) => void;
  onEdit: (person: Trainer) => void;
  onConfirm: (person: Trainer) => void;
}) {
  return (
    <table className="grid">
      <thead>
        <tr>
          <Th ar="الرقم" fr="N°" />
          <Th ar="الاسم واللقب" fr="Nom et prénom" />
          <Th ar="المؤسسة" fr="Structure" />
          <Th ar="الوظيفة" fr="Fonction" />
          <Th ar="الرقم الوطني" fr="NNI" />
          <Th ar="رقم الحساب" fr="N° de compte" />
          <Th ar="البنك" fr="Banque" />
          <Th ar="المبلغ لليوم" fr="Montant / jour" />
          <Th ar="الأيام" fr="Jours" />
          <Th ar="المجموع" fr="Total MRU" />
          <Th ar="الحالة" fr="État" />
          <Th ar="الإجراءات" fr="Actions" />
        </tr>
      </thead>
      <tbody>
        {rows.map((person) => {
          const incomplete = gapsOf("trainers", person).length > 0;
          const total = personTotal("trainers", person);
          return (
            <tr key={person.id} className={incomplete ? "is-incomplete" : ""}>
              <td className="num">{person.numero}</td>
              <td>
                <button type="button" className="name-btn" onClick={() => onOpen(person)}>
                  {person.nom.trim() ? <span className="latin">{person.nom}</span> : <MissingMark dense />}
                </button>
              </td>
              <td><Plain value={person.structure} /></td>
              <td title={optionNote(FONCTIONS, person.fonction)}>
                <Plain value={person.fonction} />
              </td>
              <td><Plain value={person.nni} numeric /></td>
              <td><Plain value={person.compte} numeric /></td>
              <td><Plain value={person.banque} /></td>
              <td className="num">{person.montantJour == null ? <MissingMark dense /> : formatNumber(person.montantJour)}</td>
              <td className="num">{person.jours == null ? <MissingMark dense /> : formatNumber(person.jours)}</td>
              <td className="num total-cell">{total == null ? <MissingMark dense /> : formatNumber(total)}</td>
              <td><StatusBadge incomplete={incomplete} /></td>
              <td className="sticky-end">
                <Actions onEdit={() => onEdit(person)} onConfirm={() => onConfirm(person)} />
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

function Th({ ar, fr }: { ar: string; fr: string }) {
  return (
    <th>
      <span className="th-ar" lang="ar">{ar}</span>
      <span className="th-fr" lang="fr">{fr}</span>
    </th>
  );
}

function Plain({ value, numeric = false }: { value: string; numeric?: boolean }) {
  if (!value.trim()) return <MissingMark dense />;
  return <span className={numeric ? "latin num" : "latin"}>{value}</span>;
}

export function StatusBadge({ incomplete }: { incomplete: boolean }) {
  return incomplete ? (
    <span className="badge badge-bad">
      <strong lang="ar">غير مكتمل</strong>
      <small lang="fr">Incomplet</small>
    </span>
  ) : (
    <span className="badge badge-ok">
      <strong lang="ar">مكتمل</strong>
      <small lang="fr">Complet</small>
    </span>
  );
}

function Actions({ onEdit, onConfirm }: { onEdit: () => void; onConfirm: () => void }) {
  return (
    <div className="row-actions">
      <button type="button" className="btn btn-sm btn-ghost" onClick={onEdit}>
        <Pencil size={14} />
        <span>
          <b lang="ar">تحديث</b>
          <small lang="fr">Mise à jour</small>
        </span>
      </button>
      <button type="button" className="btn btn-sm btn-line" onClick={onConfirm}>
        <FileCheck size={14} />
        <span>
          <b lang="ar">تأكيد</b>
          <small lang="fr">Confirmation</small>
        </span>
      </button>
    </div>
  );
}
