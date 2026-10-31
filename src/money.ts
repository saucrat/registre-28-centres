const FR_ONES = [
  "",
  "un",
  "deux",
  "trois",
  "quatre",
  "cinq",
  "six",
  "sept",
  "huit",
  "neuf",
  "dix",
  "onze",
  "douze",
  "treize",
  "quatorze",
  "quinze",
  "seize",
  "dix-sept",
  "dix-huit",
  "dix-neuf",
];

function frenchUnder100(n: number): string {
  if (n < 20) return FR_ONES[n];
  if (n < 70) {
    const ten = Math.floor(n / 10);
    const unit = n % 10;
    const tens = ["", "dix", "vingt", "trente", "quarante", "cinquante", "soixante"];
    if (unit === 0) return tens[ten];
    if (unit === 1) return `${tens[ten]} et un`;
    return `${tens[ten]}-${FR_ONES[unit]}`;
  }
  if (n < 80) {
    if (n === 71) return "soixante et onze";
    return `soixante-${FR_ONES[n - 60]}`;
  }
  const unit = n - 80;
  if (unit === 0) return "quatre-vingts";
  return `quatre-vingt-${FR_ONES[unit]}`;
}

function frenchUnder1000(n: number, pluralHundred: boolean): string {
  if (n < 100) return frenchUnder100(n);
  const hundred = Math.floor(n / 100);
  const rest = n % 100;
  let head = hundred === 1 ? "cent" : `${frenchUnder100(hundred)} cent`;
  if (pluralHundred && hundred > 1 && rest === 0) head += "s";
  if (rest === 0) return head;
  return `${head} ${frenchUnder100(rest)}`;
}

export function frenchNumber(value: number): string {
  const n = Math.round(Math.abs(value));
  if (n === 0) return "zéro";
  const millions = Math.floor(n / 1_000_000);
  const thousands = Math.floor((n % 1_000_000) / 1000);
  const rest = n % 1000;
  const parts: string[] = [];
  if (millions) {
    parts.push(millions === 1 ? "un million" : `${frenchUnder1000(millions, true)} millions`);
  }
  if (thousands) {
    parts.push(thousands === 1 ? "mille" : `${frenchUnder1000(thousands, false)} mille`);
  }
  if (rest) parts.push(frenchUnder1000(rest, true));
  return parts.join(" ");
}

export function frenchOuguiyas(value: number): string {
  const rounded = Math.round(value);
  const words = frenchNumber(rounded);
  const titled = words.charAt(0).toUpperCase() + words.slice(1);
  return `${titled} ${rounded === 1 ? "ouguiya" : "ouguiyas"}`;
}

const AR_ONES = [
  "",
  "واحد",
  "اثنان",
  "ثلاثة",
  "أربعة",
  "خمسة",
  "ستة",
  "سبعة",
  "ثمانية",
  "تسعة",
  "عشرة",
  "أحد عشر",
  "اثنا عشر",
  "ثلاثة عشر",
  "أربعة عشر",
  "خمسة عشر",
  "ستة عشر",
  "سبعة عشر",
  "ثمانية عشر",
  "تسعة عشر",
];

const AR_TENS = ["", "عشرة", "عشرون", "ثلاثون", "أربعون", "خمسون", "ستون", "سبعون", "ثمانون", "تسعون"];

const AR_HUNDREDS = [
  "",
  "مائة",
  "مائتان",
  "ثلاثمائة",
  "أربعمائة",
  "خمسمائة",
  "ستمائة",
  "سبعمائة",
  "ثمانمائة",
  "تسعمائة",
];

function arabicUnder100(n: number): string {
  if (n < 20) return AR_ONES[n];
  const ten = Math.floor(n / 10);
  const unit = n % 10;
  if (unit === 0) return AR_TENS[ten];
  return `${AR_ONES[unit]} و${AR_TENS[ten]}`;
}

function arabicUnder1000(n: number): string {
  if (n < 100) return arabicUnder100(n);
  const hundred = Math.floor(n / 100);
  const rest = n % 100;
  if (rest === 0) return AR_HUNDREDS[hundred];
  return `${AR_HUNDREDS[hundred]} و${arabicUnder100(rest)}`;
}

export function arabicAmount(value: number): string {
  const n = Math.round(Math.abs(value));
  if (n === 0) return "صفر";
  const thousands = Math.floor(n / 1000);
  const rest = n % 1000;
  const parts: string[] = [];
  if (thousands === 1) parts.push("ألف");
  else if (thousands === 2) parts.push("ألفان");
  else if (thousands >= 3 && thousands <= 10) parts.push(`${arabicUnder100(thousands)} آلاف`);
  else if (thousands > 10) parts.push(`${arabicUnder1000(thousands)} ألفاً`);
  if (rest) parts.push(arabicUnder1000(rest));
  return parts.join(" و");
}

export function arabicOuguiyas(value: number): string {
  return `فقط ${arabicAmount(value)} أوقية لا غير`;
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 2 }).format(value);
}

export function formatIssued(date: Date): { ar: string; fr: string } {
  return {
    ar: new Intl.DateTimeFormat("ar", {
      day: "numeric",
      month: "long",
      year: "numeric",
      numberingSystem: "latn",
    }).format(date),
    fr: new Intl.DateTimeFormat("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(date),
  };
}
