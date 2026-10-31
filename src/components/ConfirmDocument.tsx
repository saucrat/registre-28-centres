import { forwardRef } from "react";
import type { SheetModel } from "../sheet";

export const ConfirmDocument = forwardRef<HTMLElement, { model: SheetModel }>(function ConfirmDocument(
  { model },
  ref,
) {
  const id = model.identity;
  return (
    <article className="sheet" dir="rtl" ref={ref}>
      <header className="card-head">
        <strong lang="ar">الجمهورية الإسلامية الموريتانية</strong>
        <span lang="ar">وزارة الصحة</span>
        <em lang="fr">Ministère de la Santé · Nouakchott</em>
      </header>

      <div className="card-body">
        <p className="card-kicker">تأكيد المعطيات البنكية · Confirmation bancaire</p>
        <h2 className="card-title" lang="ar">بطاقة التأكيد</h2>
        <p className="card-title-fr" lang="fr">Fiche de confirmation</p>

        <section className={id.name.trim() ? "card-name" : "card-name is-empty"}>
          <span className="card-label">
            <b lang="ar">الاسم واللقب</b>
            <small lang="fr">Nom et prénom</small>
          </span>
          {id.name.trim() ? (
            <strong className="latin">{id.name}</strong>
          ) : (
            <strong className="card-missing">غير مُعطى · Non renseigné</strong>
          )}
        </section>

        <section className="card-rows">
          <Line ar="الرقم الوطني" fr="NNI" value={id.nni} />
          <Line ar="البنك" fr="Banque" value={id.banque} note={id.banqueNote} />
          <Line ar="رقم الحساب" fr="N° de compte" value={id.compte} />
        </section>

        <p className="card-ask">
          <span lang="ar">يرجى مراجعة هذه المعطيات والتأكد من صحتها.</span>
          <small lang="fr">Merci de vérifier ces informations.</small>
        </p>
      </div>
    </article>
  );
});

function Line({ ar, fr, value, note }: { ar: string; fr: string; value: string; note?: string }) {
  const missing = !value.trim();
  return (
    <div className={missing ? "card-row is-empty" : "card-row"}>
      <span className="card-label">
        <b lang="ar">{ar}</b>
        <small lang="fr">{fr}</small>
      </span>
      {missing ? (
        <strong className="card-missing">غير مُعطى · Non renseigné</strong>
      ) : (
        <strong className="latin">
          {value}
          {note ? <small>{note}</small> : null}
        </strong>
      )}
    </div>
  );
}
