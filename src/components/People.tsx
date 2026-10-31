import { MessageCircle, Trash2 } from "lucide-react";

export type PersonRow = {
  id: string;
  numero: number;
  name: string;
  meta: string;
  gap: string;
  amount: string;
  incomplete: boolean;
  phone: string;
  texted: boolean;
};

export function People({
  rows,
  activeId,
  sendingId,
  selectedIds,
  onOpen,
  onSend,
  onToggleTexted,
  onToggleSelect,
  onDelete,
}: {
  rows: PersonRow[];
  activeId?: string;
  sendingId?: string;
  selectedIds: Set<string>;
  onOpen: (id: string) => void;
  onSend: (id: string) => void;
  onToggleTexted: (id: string) => void;
  onToggleSelect: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="panel">
      {rows.map((row) => {
        const canSend = Boolean(row.phone);
        const busy = sendingId === row.id;
        const selected = selectedIds.has(row.id);
        return (
          <div key={row.id} className={row.id === activeId || selected ? "person is-on" : "person"}>
            <label className="pick-check" title="تحديد للحذف">
              <input
                type="checkbox"
                checked={selected}
                onChange={() => onToggleSelect(row.id)}
                aria-label={`تحديد ${row.name}`}
              />
            </label>
            <label className={row.texted ? "sent-check is-on" : "sent-check"} title={row.texted ? "تم الإرسال" : "لم يُرسل بعد"}>
              <input
                type="checkbox"
                checked={row.texted}
                onChange={() => onToggleTexted(row.id)}
                aria-label={row.texted ? "تم إرسال الرسالة" : "علم كمرسل"}
              />
              <span>{row.texted ? "أُرسل" : "إرسال"}</span>
            </label>
            <button type="button" className="person-hit" onClick={() => onOpen(row.id)}>
              <span className="person-no num">{row.numero}</span>
              <span className="person-main">
                <strong className="latin">{row.name}</strong>
                <span>
                  <span className="latin">{row.meta}</span>
                  {row.gap ? <em>{row.gap}</em> : null}
                </span>
              </span>
              <span className="person-amount num">{row.amount}</span>
              <span className={row.incomplete ? "pill bad" : "pill ok"}>
                {row.incomplete ? "ناقص" : "مكتمل"}
              </span>
            </button>
            <button
              type="button"
              className="wa-btn"
              disabled={!canSend || Boolean(sendingId)}
              title={canSend ? `واتساب ${row.phone}` : "لا يوجد رقم هاتف"}
              onClick={() => onSend(row.id)}
            >
              <MessageCircle size={15} />
              <span>{busy ? "…" : "واتساب"}</span>
            </button>
            <button
              type="button"
              className="del-btn"
              title="حذف"
              aria-label={`حذف ${row.name}`}
              onClick={() => onDelete(row.id)}
            >
              <Trash2 size={15} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
