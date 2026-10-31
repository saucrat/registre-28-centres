import * as Select from "@radix-ui/react-select";
import { Check, ChevronDown } from "lucide-react";
import { useId, useState } from "react";
import type { Option } from "../types";

type Mode = "empty" | "other" | "list";

export function SelectField({
  labelAr,
  labelFr,
  value,
  onChange,
  options,
  allowOther = false,
  allowEmpty = true,
  dense = false,
  hideLabel = false,
}: {
  labelAr: string;
  labelFr: string;
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  allowOther?: boolean;
  allowEmpty?: boolean;
  dense?: boolean;
  hideLabel?: boolean;
}) {
  const labelId = useId();
  const [mode, setMode] = useState<Mode>(() => {
    if (!value) return allowEmpty ? "empty" : "list";
    if (options.some((item) => item.value === value) || !allowOther) return "list";
    return "other";
  });
  const [otherText, setOtherText] = useState(mode === "other" ? value : "");

  const listed =
    mode === "list" && value && !options.some((item) => item.value === value)
      ? [...options, { value, ar: value, fr: "Valeur enregistrée" }]
      : options;

  const radixValue = mode === "empty" ? "__empty__" : mode === "other" ? "__other__" : value;

  return (
    <div className={dense ? "form-field dense" : "form-field"}>
      {hideLabel ? (
        <span className="sr" id={labelId}>
          {labelAr} {labelFr}
        </span>
      ) : (
        <span className="field-label" id={labelId}>
          <span lang="ar">{labelAr}</span>
          <small lang="fr">{labelFr}</small>
        </span>
      )}
      <Select.Root
        dir="rtl"
        value={radixValue}
        onValueChange={(next) => {
          if (next === "__empty__") {
            setMode("empty");
            setOtherText("");
            onChange("");
            return;
          }
          if (next === "__other__") {
            setMode("other");
            setOtherText("");
            onChange("");
            return;
          }
          setMode("list");
          onChange(next);
        }}
      >
        <Select.Trigger
          className={mode === "empty" || value === "__missing__" ? "select-trigger is-empty" : "select-trigger"}
          aria-labelledby={labelId}
        >
          <Select.Value />
          <Select.Icon className="select-chevron">
            <ChevronDown size={16} />
          </Select.Icon>
        </Select.Trigger>
        <Select.Portal>
          <Select.Content className="select-content" position="popper" sideOffset={6} collisionPadding={12}>
            <Select.Viewport className="select-viewport">
              {allowEmpty ? (
                <OptionRow
                  value="__empty__"
                  ar="غير مُعطى"
                  fr="Non renseigné"
                  missing
                />
              ) : null}
              {listed.map((item) => (
                <OptionRow
                  key={item.value}
                  value={item.value}
                  ar={item.ar}
                  fr={item.fr}
                  missing={item.value === "__missing__"}
                />
              ))}
              {allowOther ? (
                <>
                  <Select.Separator className="select-sep" />
                  <OptionRow value="__other__" ar="أخرى" fr="Autre — saisie libre" />
                </>
              ) : null}
            </Select.Viewport>
          </Select.Content>
        </Select.Portal>
      </Select.Root>
      {allowOther && mode === "other" ? (
        <input
          className={otherText.trim() ? "input" : "input input-empty"}
          dir="auto"
          value={otherText}
          placeholder="غير مُعطى · Non renseigné"
          onChange={(event) => {
            setOtherText(event.target.value);
            onChange(event.target.value);
          }}
        />
      ) : null}
    </div>
  );
}

function OptionRow({
  value,
  ar,
  fr,
  missing = false,
}: {
  value: string;
  ar: string;
  fr: string;
  missing?: boolean;
}) {
  const showFr = fr && fr !== ar;
  return (
    <Select.Item value={value} className={missing ? "select-item is-missing" : "select-item"}>
      <Select.ItemText>
        <span className="opt">
          <span className="opt-ar" lang="ar">
            {ar}
          </span>
          {showFr ? (
            <span className="opt-fr" lang="fr">
              {fr}
            </span>
          ) : null}
        </span>
      </Select.ItemText>
      <Select.ItemIndicator className="select-check">
        <Check size={15} strokeWidth={2.4} />
      </Select.ItemIndicator>
    </Select.Item>
  );
}
