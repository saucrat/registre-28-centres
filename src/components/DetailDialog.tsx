import { X } from "lucide-react";
import { formatNumber } from "../money";
import { toSheet } from "../sheet";
import type { Beneficiary, Kind, Trainer } from "../types";

export function DetailDialog({
  kind,
  person,
  onClose,
  onEdit,
  onConfirm,
}: {
  kind: Kind;
  person: Beneficiary | Trainer;
  onClose: () => void;
  onEdit: () => void;
  onConfirm: () => void;
}) {
  const model = toSheet(kind, person);
  return (
    <>
      <button type="button" className="backdrop" aria-label="إغلاق" onClick={onClose} />
      <aside className="drawer" role="dialog" aria-labelledby="drawer-title">
        <header className="drawer-head">
          <div>
            <p>{kind === "beneficiaries" ? "قابلة · Sage-femme" : "مكوّن · Formateur"}</p>
            <h2 id="drawer-title" className="latin">
              {model.name.trim() || "بدون اسم"}
            </h2>
          </div>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="إغلاق">
            <X size={18} />
          </button>
        </header>
        <div className="drawer-body">
          <div className="due">
            <span>
              المبلغ المستحق
              <small>Montant dû</small>
            </span>
            <strong className="num">{model.total == null ? "—" : `${formatNumber(model.total)} MRU`}</strong>
          </div>
          <div className={model.gaps.length ? "pill bad" : "pill ok"}>
            {model.gaps.length ? "فيه خانات غير مُعطاة" : "المعطية مكتملة"}
          </div>
          <div className="facts">
            {model.fields.map((item) => (
              <div key={item.fr} className="fact">
                <span>
                  {item.ar}
                  <small>{item.fr}</small>
                </span>
                {item.value.trim() ? (
                  <strong className="latin">
                    {item.value}
                    {item.note ? <small>{item.note}</small> : null}
                  </strong>
                ) : (
                  <strong className="gap">غير مُعطى · Non renseigné</strong>
                )}
              </div>
            ))}
          </div>
        </div>
        <footer className="drawer-actions">
          <button type="button" className="btn" onClick={onConfirm}>
            بطاقة التأكيد
          </button>
          <button type="button" className="btn btn-ghost" onClick={onEdit}>
            تحديث
          </button>
        </footer>
      </aside>
    </>
  );
}
