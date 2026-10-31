import { forwardRef } from "react";
import { formatIssued } from "../money";

export type UnreachableRow = {
  numero: number;
  name: string;
  phone: string;
  nni: string;
};

export const UnreachableReport = forwardRef<
  HTMLElement,
  { rows: UnreachableRow[]; issued: Date }
>(function UnreachableReport({ rows, issued }, ref) {
  const dates = formatIssued(issued);
  return (
    <article className="report" dir="rtl" ref={ref}>
      <header className="report-head">
        <strong lang="ar">الجمهورية الإسلامية الموريتانية</strong>
        <span lang="ar">وزارة الصحة</span>
        <em lang="fr">Ministère de la Santé · Nouakchott</em>
      </header>

      <h1 lang="ar">تقرير أرقام واتساب غير الواصلة</h1>
      <p className="report-fr" lang="fr">
        Rapport des numéros WhatsApp injoignables
      </p>
      <p className="report-meta">
        <span lang="ar">الأسماء غير المعلَّم عليها كـ «أُرسل» — يُفترض أن أرقامها غير قابلة للوصول.</span>
        <small lang="fr">Personnes non cochées comme envoyées — numéros présumés injoignables.</small>
      </p>

      <div className="report-summary">
        <span lang="ar">العدد: {rows.length}</span>
        <span className="latin" lang="fr">
          {dates.fr}
        </span>
      </div>

      <table className="report-table">
        <thead>
          <tr>
            <th lang="ar">
              ن°
              <small lang="fr">N°</small>
            </th>
            <th lang="ar">
              الاسم واللقب
              <small lang="fr">Nom et prénom</small>
            </th>
            <th lang="ar">
              الرقم الوطني
              <small lang="fr">NNI</small>
            </th>
            <th lang="ar">
              رقم واتساب
              <small lang="fr">WhatsApp</small>
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={`${row.numero}-${row.phone}`}>
              <td className="num">{row.numero}</td>
              <td className="latin">{row.name.trim() || "—"}</td>
              <td className="latin num">{row.nni.trim() || "—"}</td>
              <td className={row.phone.trim() ? "latin num" : "missing"}>
                {row.phone.trim() || "غير مُعطى · Non renseigné"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <footer className="report-foot">
        <span lang="ar">يُستخدم هذا التقرير لإبلاغ الأرقام غير الواصلة عبر واتساب.</span>
        <span lang="fr">Document destiné au signalement des numéros WhatsApp injoignables.</span>
      </footer>
    </article>
  );
});
