export function MissingMark({ dense = false }: { dense?: boolean }) {
  return (
    <span className={dense ? "mark mark-dense" : "mark"} role="status">
      <span className="mark-icon" aria-hidden="true">
        <svg viewBox="0 0 16 16">
          <circle cx="8" cy="8" r="6.2" fill="none" stroke="currentColor" strokeWidth="1.4" />
          <path d="M8 4.4v4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          <circle cx="8" cy="11.15" r="0.7" fill="currentColor" />
        </svg>
      </span>
      <span className="mark-copy">
        <strong lang="ar">غير مُعطى</strong>
        <small lang="fr">Non renseigné</small>
      </span>
    </span>
  );
}

export function TextValue({
  value,
  note,
  numeric = false,
}: {
  value: string;
  note?: string;
  numeric?: boolean;
}) {
  if (!value.trim()) return <MissingMark />;
  return (
    <span className="text-value">
      <span className={numeric ? "latin num" : "latin"}>{value}</span>
      {note ? <small>{note}</small> : null}
    </span>
  );
}
