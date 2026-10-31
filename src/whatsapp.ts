export function toWhatsAppPhone(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");
  if (!digits) return null;
  if (digits.startsWith("222") && digits.length >= 11) return digits;
  if (digits.length === 8) return `222${digits}`;
  if (digits.length >= 9) return digits;
  return null;
}

export function whatsappMessage(name: string): string {
  const who = name.trim() || "حضرة المعني";
  return [
    `السلام عليكم ${who}،`,
    "هذه بطاقة تأكيد معطياتكم البنكية.",
    "يرجى مراجعة الملف المرفق (PDF) والتأكد من الاسم والرقم الوطني والبنك ورقم الحساب.",
    "",
    `Bonjour ${who},`,
    "Voici votre fiche de confirmation bancaire.",
    "Merci de vérifier le fichier PDF joint (nom, NNI, banque, n° de compte).",
  ].join("\n");
}

export function whatsappChatUrl(phone: string, text: string): string {
  return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
}
