import { Download, FileDown, FileWarning, Plus, Search, Trash2, X } from "lucide-react";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { fetchRegistry, putRegistry } from "./api";
import { BANKS } from "./catalog";
import { ConfirmDocument } from "./components/ConfirmDocument";
import { DetailDialog } from "./components/DetailDialog";
import { Modal } from "./components/Modal";
import { People, type PersonRow } from "./components/People";
import { RecordForm } from "./components/RecordForm";
import { SelectField } from "./components/SelectField";
import { UnreachableReport, type UnreachableRow } from "./components/UnreachableReport";
import { downloadRegistry } from "./excelExport";
import {
  gapsOf,
  incompleteCount,
  loadRegistry,
  matchesQuery,
  normalize,
  parseRegistry,
  pdfFilename,
  personTotal,
  registryTotal,
  saveRegistry,
} from "./model";
import { formatNumber } from "./money";
import { downloadConfirmation, downloadReportPdf } from "./pdfExport";
import { toSheet } from "./sheet";
import type { Beneficiary, Kind, Registry, Trainer } from "./types";
import { toWhatsAppPhone, whatsappChatUrl, whatsappMessage } from "./whatsapp";

type FormRequest =
  | { mode: "create"; kind: Kind }
  | { mode: "edit"; kind: Kind; id: string };

type PersonRef = { kind: Kind; id: string };

type DeleteAsk =
  | { mode: "one"; id: string; name: string }
  | { mode: "many"; ids: string[] }
  | { mode: "all" };

const STATUS_OPTIONS = [
  { value: "all", ar: "الكل", fr: "Tous" },
  { value: "incomplete", ar: "ناقص", fr: "Incomplet" },
  { value: "complete", ar: "مكتمل", fr: "Complet" },
];

export function App() {
  const [data, setData] = useState<Registry | null>(null);
  const [dbReady, setDbReady] = useState(false);
  const [tab, setTab] = useState<Kind>("beneficiaries");
  const [query, setQuery] = useState("");
  const [bank, setBank] = useState("all");
  const [status, setStatus] = useState("all");
  const [form, setForm] = useState<FormRequest | null>(null);
  const [detail, setDetail] = useState<PersonRef | null>(null);
  const [confirming, setConfirming] = useState<PersonRef | null>(null);
  const [sending, setSending] = useState<PersonRef | null>(null);
  const [selected, setSelected] = useState<Set<string>>(() => new Set());
  const [deleteAsk, setDeleteAsk] = useState<DeleteAsk | null>(null);
  const [busy, setBusy] = useState<"excel" | "pdf" | "whatsapp" | "unreachable" | null>(null);
  const [toast, setToast] = useState<{ ar: string; fr: string } | null>(null);
  const [reportRows, setReportRows] = useState<UnreachableRow[] | null>(null);
  const toastTimer = useRef<number | null>(null);
  const skipSave = useRef(true);
  const sendRef = useRef<HTMLElement>(null);
  const reportRef = useRef<HTMLElement>(null);

  function notify(ar: string, fr: string) {
    setToast({ ar, fr });
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 3600);
  }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const remote = parseRegistry(await fetchRegistry());
        if (cancelled) return;
        if (remote) {
          skipSave.current = true;
          setData(remote);
          saveRegistry(remote);
          setDbReady(true);
          return;
        }
        throw new Error("empty");
      } catch {
        if (cancelled) return;
        const local = loadRegistry();
        skipSave.current = true;
        setData(local);
        setDbReady(false);
        notify(
          "تعذر الاتصال بقاعدة Mongo — العمل محلياً مؤقتاً.",
          "Connexion Mongo impossible — mode local temporaire.",
        );
        try {
          const saved = parseRegistry(await putRegistry(local));
          if (!cancelled && saved) {
            skipSave.current = true;
            setData(saved);
            saveRegistry(saved);
            setDbReady(true);
            notify("تم ربط السجل بقاعدة MongoDB.", "Le registre est synchronisé avec MongoDB.");
          }
        } catch {
          /* stay local */
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!data) return;
    saveRegistry(data);
    if (skipSave.current) {
      skipSave.current = false;
      return;
    }
    if (!dbReady) return;
    const timer = window.setTimeout(() => {
      void putRegistry(data).catch(() => {
        setDbReady(false);
        notify("تعذر حفظ التعديل في MongoDB.", "Échec de l'enregistrement MongoDB.");
      });
    }, 450);
    return () => window.clearTimeout(timer);
  }, [data, dbReady]);

  function commit(recipe: (current: Registry) => Registry) {
    setData((current) => (current ? normalize(recipe(current)) : current));
  }

  function markTexted(kind: Kind, id: string, value: boolean) {
    commit((current) => {
      if (kind === "beneficiaries") {
        return {
          ...current,
          beneficiaries: current.beneficiaries.map((person) =>
            person.id === id ? { ...person, texted: value } : person,
          ),
        };
      }
      return {
        ...current,
        trainers: current.trainers.map((person) => (person.id === id ? { ...person, texted: value } : person)),
      };
    });
  }

  function toggleTexted(id: string) {
    if (!data) return;
    const person = findPerson(data, tab, id);
    if (!person) return;
    markTexted(tab, id, !Boolean(person.texted));
  }

  function toggleSelect(id: string) {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function setTabAndClear(next: Kind) {
    setTab(next);
    setSelected(new Set());
    setDetail(null);
  }

  function removePeople(ids: string[]) {
    if (!ids.length) return;
    const drop = new Set(ids);
    commit((current) => {
      if (tab === "beneficiaries") {
        return {
          ...current,
          beneficiaries: current.beneficiaries.filter((person) => !drop.has(person.id)),
        };
      }
      return {
        ...current,
        trainers: current.trainers.filter((person) => !drop.has(person.id)),
      };
    });
    setSelected((current) => {
      const next = new Set(current);
      for (const id of ids) next.delete(id);
      return next;
    });
    setDetail((current) => (current && drop.has(current.id) ? null : current));
    setForm((current) => (current?.mode === "edit" && drop.has(current.id) ? null : current));
    setConfirming((current) => (current && drop.has(current.id) ? null : current));
    setSending((current) => (current && drop.has(current.id) ? null : current));
  }

  function confirmDelete() {
    if (!deleteAsk || !data) return;
    if (deleteAsk.mode === "one") {
      removePeople([deleteAsk.id]);
      notify("تم حذف السجل.", "Le dossier a été supprimé.");
    } else if (deleteAsk.mode === "many") {
      const count = deleteAsk.ids.length;
      removePeople(deleteAsk.ids);
      notify(`تم حذف ${count} سجلات.`, `${count} dossier(s) supprimé(s).`);
    } else {
      const ids =
        tab === "beneficiaries"
          ? data.beneficiaries.map((person) => person.id)
          : data.trainers.map((person) => person.id);
      const count = ids.length;
      removePeople(ids);
      notify(`تم حذف كل السجلات (${count}).`, `Tous les dossiers ont été supprimés (${count}).`);
    }
    setDeleteAsk(null);
  }

  const bankOptions = useMemo(() => {
    const options = [...BANKS];
    for (const person of data?.beneficiaries ?? []) {
      if (person.banque && !options.some((item) => item.value === person.banque)) {
        options.push({ value: person.banque, ar: person.banque, fr: person.banque });
      }
    }
    return [
      { value: "all", ar: "كل البنوك", fr: "Toutes les banques" },
      { value: "__missing__", ar: "غير مُعطى", fr: "Non renseigné" },
      ...options,
    ];
  }, [data?.beneficiaries]);

  const beneficiaries = (data?.beneficiaries ?? []).filter((person) => {
    if (!matchesQuery([person.nom, person.nni, person.telephone, person.compte, person.banque, person.fonction, person.numero], query)) {
      return false;
    }
    if (bank === "__missing__" && person.banque.trim()) return false;
    if (bank !== "all" && bank !== "__missing__" && person.banque !== bank) return false;
    return passStatus("beneficiaries", person, status);
  });

  const trainers = (data?.trainers ?? []).filter((person) => {
    if (!matchesQuery([person.nom, person.structure, person.fonction, person.emargement, person.numero], query)) {
      return false;
    }
    return passStatus("trainers", person, status);
  });

  const visible = tab === "beneficiaries" ? beneficiaries.length : trainers.length;
  const total = tab === "beneficiaries" ? (data?.beneficiaries.length ?? 0) : (data?.trainers.length ?? 0);
  const editing = data && form?.mode === "edit" ? findPerson(data, form.kind, form.id) : null;
  const detailed = data && detail ? findPerson(data, detail.kind, detail.id) : null;
  const confirmed = data && confirming ? findPerson(data, confirming.kind, confirming.id) : null;
  const outbound = data && sending ? findPerson(data, sending.kind, sending.id) : null;

  useLayoutEffect(() => {
    if (!sending || !data) return;
    const found = findPerson(data, sending.kind, sending.id);
    if (!found) {
      setSending(null);
      return;
    }
    const target = found;
    const kind = sending.kind;
    const id = sending.id;
    let cancelled = false;
    const phone = kind === "beneficiaries" ? (target as Beneficiary).telephone : "";
    const wa = toWhatsAppPhone(phone);

    async function run() {
      if (!wa) {
        notify("لا يوجد رقم واتساب لهذا السجل.", "Aucun numéro WhatsApp pour ce dossier.");
        setSending(null);
        return;
      }
      setBusy("whatsapp");
      await new Promise<void>((resolve) => {
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
      });
      if (cancelled) return;
      const node = sendRef.current;
      if (!node) {
        notify("تعذر تجهيز البطاقة.", "La fiche n'a pas pu être préparée.");
        setBusy(null);
        setSending(null);
        return;
      }
      try {
        await downloadConfirmation(node, pdfFilename(target.numero, target.nom));
        if (cancelled) return;
        window.open(whatsappChatUrl(wa, whatsappMessage(target.nom)), "_blank", "noopener,noreferrer");
        markTexted(kind, id, true);
        notify(
          "تم تنزيل البطاقة وفتح واتساب. أرفق ملف PDF من التنزيلات.",
          "Fiche téléchargée et WhatsApp ouvert. Joignez le PDF depuis les téléchargements.",
        );
      } catch {
        if (!cancelled) notify("تعذر إنشاء ملف PDF.", "Le PDF n'a pas pu être créé.");
      } finally {
        if (!cancelled) {
          setBusy(null);
          setSending(null);
        }
      }
    }

    void run();
    return () => {
      cancelled = true;
    };
    // Only when a new send is requested — not when texted/data updates mid-send.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sending]);

  async function onDownloadExcel() {
    if (!data) return;
    setBusy("excel");
    try {
      await downloadRegistry(data);
      notify("تم تنزيل ملف إكسل بالمعطيات الحالية.", "Le fichier Excel a été téléchargé avec les données actuelles.");
    } catch {
      notify("تعذر إنشاء ملف إكسل.", "Le fichier Excel n'a pas pu être créé.");
    } finally {
      setBusy(null);
    }
  }

  function onExportUnreachable() {
    if (!data) return;
    const rows = data.beneficiaries
      .filter((person) => !person.texted)
      .map((person) => ({
        numero: person.numero,
        name: person.nom.trim() || "بدون اسم",
        phone: person.telephone.trim(),
        nni: person.nni.trim(),
      }));
    if (rows.length === 0) {
      notify("لا توجد أسماء غير معلَّم عليها.", "Aucune personne non cochée.");
      return;
    }
    setReportRows(rows);
    setBusy("unreachable");
  }

  useLayoutEffect(() => {
    if (!reportRows) return;
    const rows = reportRows;
    let cancelled = false;
    async function run() {
      await new Promise<void>((resolve) => {
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
      });
      if (cancelled) return;
      const node = reportRef.current;
      if (!node) {
        notify("تعذر تجهيز التقرير.", "Le rapport n'a pas pu être préparé.");
        setBusy(null);
        setReportRows(null);
        return;
      }
      try {
        await downloadReportPdf(node, "Rapport_WhatsApp_injoignables.pdf");
        if (!cancelled) {
          notify(
            `تم تنزيل تقرير ${rows.length} رقماً غير واصل.`,
            `Rapport de ${rows.length} numéro(s) injoignable(s) téléchargé.`,
          );
        }
      } catch {
        if (!cancelled) notify("تعذر إنشاء ملف PDF.", "Le PDF n'a pas pu être créé.");
      } finally {
        if (!cancelled) {
          setBusy(null);
          setReportRows(null);
        }
      }
    }
    void run();
    return () => {
      cancelled = true;
    };
  }, [reportRows]);

  const rows: PersonRow[] =
    tab === "beneficiaries" ? beneficiaries.map(beneficiaryRow) : trainers.map(trainerRow);
  const pageTitle = tab === "beneficiaries" ? "القابلات" : "المكوّنون";
  const pageFr =
    tab === "beneficiaries"
      ? "Perdiems et transport · Nouakchott · 28–30 octobre 2026"
      : "Honoraires · Sélibaby · 4–18 mai 2026";

  if (!data) {
    return (
      <div className="boot">
        <strong>جارٍ فتح السجل…</strong>
        <span>Connexion à MongoDB</span>
      </div>
    );
  }

  return (
    <div className="shell">
      <aside className="side">
        <div className="brand">
          <strong>سجل المراكز</strong>
          <small>{dbReady ? "MongoDB · نواكشوط" : "محلي · نواكشوط"}</small>
        </div>
        <nav>
          <button type="button" className={tab === "beneficiaries" ? "nav is-on" : "nav"} onClick={() => setTabAndClear("beneficiaries")}>
            <span>القابلات</span>
            <em>{data.beneficiaries.length}</em>
          </button>
          <button type="button" className={tab === "trainers" ? "nav is-on" : "nav"} onClick={() => setTabAndClear("trainers")}>
            <span>المكوّنون</span>
            <em>{data.trainers.length}</em>
          </button>
        </nav>
        <div className="side-actions">
          <p className="side-label">
            <b lang="ar">حذف</b>
            <small lang="fr">Suppression</small>
          </p>
          <button
            type="button"
            className="side-act"
            disabled={selected.size === 0}
            onClick={() => setDeleteAsk({ mode: "many", ids: [...selected] })}
          >
            <Trash2 size={15} />
            <span>حذف المحدد</span>
            <em>{selected.size}</em>
          </button>
          <button
            type="button"
            className="side-act is-danger"
            disabled={total === 0}
            onClick={() => setDeleteAsk({ mode: "all" })}
          >
            <Trash2 size={15} />
            <span>حذف الكل</span>
            <em>{total}</em>
          </button>
        </div>
      </aside>

      <main className="main">
        <header className="main-head">
          <div>
            <h1>{pageTitle}</h1>
            <p>{pageFr}</p>
          </div>
          <div className="head-actions">
            <button
              type="button"
              className="btn btn-ghost"
              onClick={onExportUnreachable}
              disabled={busy === "unreachable" || busy === "excel"}
              title="تقرير الأسماء غير المعلَّم عليها وأرقام واتسابها"
            >
              <FileWarning size={16} />
              {busy === "unreachable" ? "جارٍ التقرير…" : "غير الواصلين"}
            </button>
            <button type="button" className="btn btn-ghost" onClick={onDownloadExcel} disabled={busy === "excel"}>
              <Download size={16} />
              {busy === "excel" ? "جارٍ التحضير…" : "تحميل Excel"}
            </button>
            <button type="button" className="btn" onClick={() => setForm({ mode: "create", kind: tab })}>
              <Plus size={16} />
              إضافة
            </button>
          </div>
        </header>

        <section className="stats">
          <div className="stat">
            <strong className="num">{formatNumber(visible)}</strong>
            <span>ظاهر من {formatNumber(total)}</span>
          </div>
          <div className="stat">
            <strong className="num">{formatNumber(registryTotal(tab, data))}</strong>
            <span>المجموع <em>MRU</em></span>
          </div>
          <button
            type="button"
            className={status === "incomplete" ? "stat is-alert is-on" : "stat is-alert"}
            onClick={() => setStatus(status === "incomplete" ? "all" : "incomplete")}
          >
            <strong className="num">{formatNumber(incompleteCount(tab, data))}</strong>
            <span>سجلات ناقصة</span>
          </button>
        </section>

        <section className="filters">
          <label className="search">
            <Search size={16} />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="ابحث بالاسم أو الهاتف أو الرقم الوطني"
              aria-label="بحث"
            />
            {query ? (
              <button type="button" className="search-clear" onClick={() => setQuery("")} aria-label="مسح البحث">
                <X size={14} />
              </button>
            ) : null}
          </label>
          <div className="chips" role="tablist">
            {STATUS_OPTIONS.map((item) => (
              <button
                key={item.value}
                type="button"
                className={status === item.value ? "is-on" : ""}
                onClick={() => setStatus(item.value)}
              >
                {item.ar}
              </button>
            ))}
          </div>
          {tab === "beneficiaries" ? (
            <SelectField
              dense
              hideLabel
              allowEmpty={false}
              labelAr="البنك"
              labelFr="Banque"
              value={bank}
              onChange={setBank}
              options={bankOptions}
            />
          ) : null}
        </section>

        {rows.length > 0 ? (
          <section className="bulk-bar">
            <label className="pick-all">
              <input
                type="checkbox"
                checked={rows.every((row) => selected.has(row.id))}
                onChange={() => {
                  const allOn = rows.every((row) => selected.has(row.id));
                  setSelected((current) => {
                    const next = new Set(current);
                    if (allOn) {
                      for (const row of rows) next.delete(row.id);
                    } else {
                      for (const row of rows) next.add(row.id);
                    }
                    return next;
                  });
                }}
              />
              <span>تحديد الظاهر ({rows.length})</span>
            </label>
          </section>
        ) : null}

        <div className="stage">
          {rows.length === 0 ? (
            <div className="empty">
              <strong>لا أحد بهذا البحث</strong>
              <span>جرّب اسماً آخر، أو أزل التصفية.</span>
            </div>
          ) : (
            <People
              rows={rows}
              activeId={detail?.kind === tab ? detail.id : undefined}
              sendingId={sending?.kind === tab ? sending.id : undefined}
              selectedIds={selected}
              onOpen={(id) => setDetail({ kind: tab, id })}
              onSend={(id) => setSending({ kind: tab, id })}
              onToggleTexted={toggleTexted}
              onToggleSelect={toggleSelect}
              onDelete={(id) => {
                const person = findPerson(data, tab, id);
                setDeleteAsk({
                  mode: "one",
                  id,
                  name: person?.nom.trim() || "هذا السجل",
                });
              }}
            />
          )}
        </div>
      </main>

      {sending && outbound ? (
        <div className="sheet-offscreen" aria-hidden="true">
          <ConfirmDocument ref={sendRef} model={toSheet(sending.kind, outbound)} />
        </div>
      ) : null}

      {reportRows ? (
        <div className="sheet-offscreen" aria-hidden="true">
          <UnreachableReport ref={reportRef} rows={reportRows} issued={new Date()} />
        </div>
      ) : null}

      {form ? (
        <Modal
          open
          wide
          onClose={() => setForm(null)}
          titleAr={form.mode === "create" ? "إضافة سجل" : "تحديث المعطيات"}
          titleFr={form.mode === "create" ? "Ajouter un dossier" : "Mettre à jour"}
        >
          <RecordForm
            key={`${form.mode}-${form.kind}-${form.mode === "edit" ? form.id : "new"}`}
            kind={form.kind}
            allowKindChange={form.mode === "create"}
            onKind={(kind) => setForm({ mode: "create", kind })}
            initial={form.mode === "edit" ? editing : null}
            beneficiaries={data.beneficiaries}
            selfId={form.mode === "edit" ? form.id : undefined}
            onSubmit={(kind, person) => {
              commit((current) => {
                if (kind === "beneficiaries") {
                  const next = person as Beneficiary;
                  const exists = current.beneficiaries.some((item) => item.id === next.id);
                  return {
                    ...current,
                    beneficiaries: exists
                      ? current.beneficiaries.map((item) => (item.id === next.id ? next : item))
                      : [...current.beneficiaries, next],
                  };
                }
                const next = person as Trainer;
                const exists = current.trainers.some((item) => item.id === next.id);
                return {
                  ...current,
                  trainers: exists
                    ? current.trainers.map((item) => (item.id === next.id ? next : item))
                    : [...current.trainers, next],
                };
              });
              setTab(kind);
              setForm(null);
              notify(
                form.mode === "create" ? "تمت إضافة السجل." : "تم حفظ التحديث.",
                form.mode === "create" ? "Le dossier a été ajouté." : "La mise à jour a été enregistrée.",
              );
            }}
            onDelete={
              form.mode === "edit"
                ? () => {
                    removePeople([form.id]);
                    setForm(null);
                    notify("تم حذف السجل.", "Le dossier a été supprimé.");
                  }
                : undefined
            }
          />
        </Modal>
      ) : null}

      {detail && detailed ? (
        <DetailDialog
          kind={detail.kind}
          person={detailed}
          onClose={() => setDetail(null)}
          onEdit={() => {
            setForm({ mode: "edit", kind: detail.kind, id: detail.id });
            setDetail(null);
          }}
          onConfirm={() => {
            setConfirming({ kind: detail.kind, id: detail.id });
            setDetail(null);
          }}
        />
      ) : null}

      {confirming && confirmed ? (
        <ConfirmDialog
          kind={confirming.kind}
          person={confirmed}
          busy={busy === "pdf"}
          onClose={() => setConfirming(null)}
          onDownload={async (node) => {
            setBusy("pdf");
            try {
              await downloadConfirmation(node, pdfFilename(confirmed.numero, confirmed.nom));
              notify("تم تنزيل بطاقة التأكيد.", "La fiche de confirmation a été téléchargée.");
            } catch {
              notify("تعذر إنشاء ملف PDF.", "Le PDF n'a pas pu être créé.");
            } finally {
              setBusy(null);
            }
          }}
        />
      ) : null}

      {deleteAsk ? (
        <Modal
          open
          onClose={() => setDeleteAsk(null)}
          titleAr={
            deleteAsk.mode === "all"
              ? "حذف كل السجلات"
              : deleteAsk.mode === "many"
                ? "حذف المحدد"
                : "حذف السجل"
          }
          titleFr={
            deleteAsk.mode === "all"
              ? "Tout supprimer"
              : deleteAsk.mode === "many"
                ? "Supprimer la sélection"
                : "Supprimer le dossier"
          }
        >
          <div className="delete-ask">
            <p lang="ar">
              {deleteAsk.mode === "all"
                ? `سيتم حذف كل سجلات «${pageTitle}» (${total}). لا يمكن التراجع من الواجهة.`
                : deleteAsk.mode === "many"
                  ? `سيتم حذف ${deleteAsk.ids.length} سجلات محددة.`
                  : `سيتم حذف «${deleteAsk.name}».`}
            </p>
            <p lang="fr">
              {deleteAsk.mode === "all"
                ? "Cette action vide la liste actuelle."
                : deleteAsk.mode === "many"
                  ? "Les dossiers sélectionnés seront retirés."
                  : "Le dossier sera retiré du registre."}
            </p>
            <footer className="form-actions">
              <button type="button" className="btn btn-ghost" onClick={() => setDeleteAsk(null)}>
                تراجع
              </button>
              <button type="button" className="btn btn-danger" onClick={confirmDelete}>
                تأكيد الحذف
              </button>
            </footer>
          </div>
        </Modal>
      ) : null}

      {toast ? (
        <div className="toast" role="status">
          <strong lang="ar">{toast.ar}</strong>
          <span lang="fr">{toast.fr}</span>
        </div>
      ) : null}
    </div>
  );
}

function ConfirmDialog({
  kind,
  person,
  busy,
  onClose,
  onDownload,
}: {
  kind: Kind;
  person: Beneficiary | Trainer;
  busy: boolean;
  onClose: () => void;
  onDownload: (node: HTMLElement) => Promise<void>;
}) {
  const sheetRef = useRef<HTMLElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(() => Math.min(1, Math.max(0.45, (window.innerWidth - 92) / 794)));
  const [sheetHeight, setSheetHeight] = useState(1300);
  const model = toSheet(kind, person);

  useLayoutEffect(() => {
    let observer: ResizeObserver | undefined;
    let frameId = 0;
    let tries = 0;
    const fit = () => {
      const frame = frameRef.current;
      const sheet = sheetRef.current;
      if (!frame || !sheet) {
        if (tries < 30) {
          tries += 1;
          frameId = requestAnimationFrame(fit);
        }
        return;
      }
      const width = sheet.offsetWidth || 794;
      const styles = getComputedStyle(frame);
      const pad = parseFloat(styles.paddingLeft) + parseFloat(styles.paddingRight);
      const raw = (frame.clientWidth - pad) / width;
      const next = Math.min(1, Math.max(0.42, Number.isFinite(raw) ? raw : 1));
      setScale((prev) => (Math.abs(prev - next) < 0.01 ? prev : next));
      const height = sheet.offsetHeight || 1300;
      setSheetHeight((prev) => (Math.abs(prev - height) < 2 ? prev : height));
      if (!observer) {
        observer = new ResizeObserver(fit);
        observer.observe(frame);
      }
    };
    fit();
    return () => {
      cancelAnimationFrame(frameId);
      observer?.disconnect();
    };
  }, []);

  return (
    <Modal open wide onClose={onClose} titleAr="بطاقة التأكيد" titleFr="Fiche de confirmation">
      <div className="sheet-scroll" ref={frameRef}>
        <div className="sheet-fit" style={{ width: 794 * scale, height: sheetHeight * scale }}>
          <div style={{ width: 794, transform: `scale(${scale})`, transformOrigin: "top left" }}>
            <ConfirmDocument ref={sheetRef} model={model} />
          </div>
        </div>
      </div>
      <footer className="form-actions sheet-actions">
        <p>
          <span lang="ar">تُنشأ البطاقة لإرسالها إلى المعني حتى يؤكد معطياته.</span>
          <small lang="fr">La fiche est destinée à l'intéressé, pour vérification.</small>
        </p>
        <button
          type="button"
          className="btn"
          disabled={busy}
          onClick={() => {
            if (sheetRef.current) void onDownload(sheetRef.current);
          }}
        >
          <FileDown size={16} />
          <span>
            <b lang="ar">{busy ? "جارٍ إنشاء الملف…" : "تنزيل PDF"}</b>
            <small lang="fr">{busy ? "Création…" : "Télécharger le PDF"}</small>
          </span>
        </button>
      </footer>
    </Modal>
  );
}

function beneficiaryRow(person: Beneficiary): PersonRow {
  const bank = person.banque.trim();
  const phone = person.telephone.trim();
  return {
    id: person.id,
    numero: person.numero,
    name: person.nom.trim() || "بدون اسم",
    meta: [phone, bank].filter(Boolean).join(" · ") || "—",
    gap: bank ? "" : "البنك غير مُعطى",
    amount: money(personTotal("beneficiaries", person)),
    incomplete: gapsOf("beneficiaries", person).length > 0,
    phone,
    texted: Boolean(person.texted),
  };
}

function trainerRow(person: Trainer): PersonRow {
  return {
    id: person.id,
    numero: person.numero,
    name: person.nom.trim() || "بدون اسم",
    meta: [person.structure.trim(), person.fonction.trim()].filter(Boolean).join(" · ") || "—",
    gap: person.emargement.trim() ? "" : "بدون إمضاء",
    amount: money(personTotal("trainers", person)),
    incomplete: gapsOf("trainers", person).length > 0,
    phone: "",
    texted: Boolean(person.texted),
  };
}

function money(value: number | null) {
  return value == null ? "—" : formatNumber(value);
}

function passStatus(kind: Kind, person: Beneficiary | Trainer, status: string) {
  const incomplete = gapsOf(kind, person).length > 0;
  if (status === "incomplete") return incomplete;
  if (status === "complete") return !incomplete;
  return true;
}

function findPerson(data: Registry, kind: Kind, id: string): Beneficiary | Trainer | null {
  if (kind === "beneficiaries") return data.beneficiaries.find((item) => item.id === id) ?? null;
  return data.trainers.find((item) => item.id === id) ?? null;
}
