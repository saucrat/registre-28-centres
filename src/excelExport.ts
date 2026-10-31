import { ATELIER_TITLE, PERDIEM_TITLE, PROJECT_TITLE } from "./catalog";
import { frenchOuguiyas } from "./money";
import { personTotal } from "./model";
import type { Registry } from "./types";

const INK = "FF1C2420";
const GREEN = "FF143D32";
const IVORY = "FFF7F3EC";
const GOLD = "FFE7D7B8";
const LINE = "FFD9D0C1";
const WHITE = "FFFFFFFF";
const SOFT = "FFFBF8F3";

type Worksheet = import("exceljs").Worksheet;
type Cell = import("exceljs").Cell;

function paint(cell: Cell, fill: string) {
  cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: fill } };
}

function border(cell: Cell) {
  const edge = { style: "thin" as const, color: { argb: LINE } };
  cell.border = { top: edge, left: edge, bottom: edge, right: edge };
}

function styleHeader(cell: Cell) {
  cell.font = { name: "Calibri", bold: true, size: 11, color: { argb: IVORY } };
  cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
  paint(cell, GREEN);
  border(cell);
}

function styleData(cell: Cell, alt: boolean) {
  cell.font = { name: "Calibri", size: 11, color: { argb: INK } };
  cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
  paint(cell, alt ? SOFT : WHITE);
  border(cell);
}

export async function createWorkbookBuffer(data: Registry): Promise<ArrayBuffer> {
  const excel = await import("exceljs");
  const ExcelJS = excel.default ?? excel;
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Registre 28 centres";
  workbook.created = new Date();
  workbook.modified = new Date();
  fillPerdiems(workbook.addWorksheet("Perdiems+Transp"), data);
  workbook.addWorksheet("Feuil1");
  fillTrainers(workbook.addWorksheet("Honoraraire formateur R"), data);
  const buffer = await workbook.xlsx.writeBuffer();
  return buffer as ArrayBuffer;
}

export async function downloadRegistry(data: Registry) {
  const buffer = await createWorkbookBuffer(data);
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "28_centre_ameliore.xlsx";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function fillPerdiems(sheet: Worksheet, data: Registry) {
  sheet.pageSetup = {
    orientation: "landscape",
    paperSize: 9,
    fitToPage: true,
    fitToWidth: 1,
    fitToHeight: 1,
    horizontalCentered: true,
  };
  sheet.views = [{ state: "frozen", ySplit: 3, rightToLeft: false }];
  sheet.columns = [
    { width: 8 },
    { width: 34 },
    { width: 14 },
    { width: 18 },
    { width: 16 },
    { width: 28 },
    { width: 16 },
    { width: 18 },
    { width: 12 },
    { width: 16 },
  ];

  sheet.mergeCells("A1:J1");
  const title = sheet.getCell("A1");
  title.value = PERDIEM_TITLE;
  title.font = { name: "Calibri", bold: true, size: 14, color: { argb: GREEN } };
  title.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
  paint(title, IVORY);
  sheet.getRow(1).height = 46;
  sheet.getRow(2).height = 10;

  const headers = [
    "N°",
    "Nom et prénom",
    "Fonction",
    "NNI",
    "Téléphone",
    "N° de compte",
    "Banque",
    "Transport (MRU)",
    "Jours",
    "TOTAL (MRU)",
  ];
  headers.forEach((label, index) => {
    const cell = sheet.getCell(3, index + 1);
    cell.value = label;
    styleHeader(cell);
  });
  sheet.getRow(3).height = 24;

  data.beneficiaries.forEach((person, index) => {
    const rowNumber = 4 + index;
    const row = sheet.getRow(rowNumber);
    row.height = 20;
    const total = personTotal("beneficiaries", person);
    const values: Array<string | number | null> = [
      person.numero,
      person.nom,
      person.fonction,
      person.nni,
      person.telephone,
      person.compte,
      person.banque,
      person.transport,
      person.jours,
      total,
    ];
    values.forEach((value, column) => {
      const cell = sheet.getCell(rowNumber, column + 1);
      const textual = column >= 2 && column <= 6;
      cell.value = value == null || value === "" ? null : textual ? String(value) : value;
      if (textual) cell.numFmt = "@";
      if (column >= 7 || column === 0) cell.numFmt = "#,##0";
      styleData(cell, index % 2 === 1);
      if (column === 1) cell.alignment = { vertical: "middle", horizontal: "left" };
    });
  });

  const totalRow = 4 + data.beneficiaries.length;
  sheet.mergeCells(totalRow, 1, totalRow, 9);
  const label = sheet.getCell(totalRow, 1);
  label.value = "TOTAL";
  label.font = { name: "Calibri", bold: true, size: 12, color: { argb: GREEN } };
  label.alignment = { vertical: "middle", horizontal: "center" };
  paint(label, GOLD);
  border(label);
  for (let column = 2; column <= 9; column += 1) {
    const cell = sheet.getCell(totalRow, column);
    paint(cell, GOLD);
    border(cell);
  }
  const sum = sheet.getCell(totalRow, 10);
  const lastData = totalRow - 1;
  const grand = data.beneficiaries.reduce(
    (acc, person) => acc + (personTotal("beneficiaries", person) ?? 0),
    0,
  );
  sum.value =
    data.beneficiaries.length > 0
      ? { formula: `SUM(J4:J${lastData})`, result: grand }
      : 0;
  sum.numFmt = "#,##0";
  sum.font = { name: "Calibri", bold: true, size: 12, color: { argb: GREEN } };
  sum.alignment = { vertical: "middle", horizontal: "center" };
  paint(sum, GOLD);
  border(sum);
  sheet.getRow(totalRow).height = 24;
}

function fillTrainers(sheet: Worksheet, data: Registry) {
  sheet.pageSetup = {
    orientation: "landscape",
    paperSize: 9,
    fitToPage: true,
    fitToWidth: 1,
    fitToHeight: 1,
  };
  sheet.columns = [
    { width: 14 },
    { width: 36 },
    { width: 16 },
    { width: 18 },
    { width: 16 },
    { width: 18 },
    { width: 18 },
    { width: 18 },
  ];

  sheet.mergeCells("A1:H1");
  const project = sheet.getCell("A1");
  project.value = PROJECT_TITLE;
  project.font = { name: "Calibri", bold: true, size: 14, color: { argb: GREEN } };
  project.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
  sheet.getRow(1).height = 24;

  sheet.mergeCells("A3:H3");
  const atelier = sheet.getCell("A3");
  atelier.value = ATELIER_TITLE;
  atelier.font = { name: "Calibri", size: 12, color: { argb: INK } };
  atelier.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
  sheet.getRow(3).height = 32;

  const heading = sheet.getCell("B6");
  heading.value = "Etats de payement Honoraire formateurs Regional";
  heading.font = { name: "Calibri", bold: true, size: 13, color: { argb: GREEN } };

  const headers = [
    "N°",
    "Nom et prenom",
    "Structure ",
    "Fonction",
    "Montant/jour",
    "Nbres de jours",
    "Montant Total",
    "Emargement",
  ];
  headers.forEach((label, index) => {
    const cell = sheet.getCell(7, index + 1);
    cell.value = label;
    styleHeader(cell);
  });
  sheet.getRow(7).height = 22;

  data.trainers.forEach((person, index) => {
    const rowNumber = 8 + index;
    const total = personTotal("trainers", person);
    const values: Array<string | number | null> = [
      person.numero,
      person.nom,
      person.structure,
      person.fonction,
      person.montantJour,
      person.jours,
      total,
      person.emargement,
    ];
    values.forEach((value, column) => {
      const cell = sheet.getCell(rowNumber, column + 1);
      const textual = column === 1 || column === 2 || column === 3 || column === 7;
      cell.value = value == null || value === "" ? null : textual ? String(value) : value;
      if (textual) cell.numFmt = "@";
      if (!textual) cell.numFmt = "#,##0";
      styleData(cell, index % 2 === 1);
      if (column === 1) cell.alignment = { vertical: "middle", horizontal: "left" };
    });
    sheet.getRow(rowNumber).height = 20;
  });

  const totalRow = 8 + data.trainers.length;
  const totalLabel = sheet.getCell(totalRow, 1);
  totalLabel.value = "Total";
  const grand = data.trainers.reduce((acc, person) => acc + (personTotal("trainers", person) ?? 0), 0);
  const totalCell = sheet.getCell(totalRow, 7);
  const lastData = totalRow - 1;
  totalCell.value =
    data.trainers.length > 0
      ? { formula: `SUM(G8:G${lastData})`, result: grand }
      : 0;
  totalCell.numFmt = "#,##0";
  for (let column = 1; column <= 8; column += 1) {
    const cell = sheet.getCell(totalRow, column);
    cell.font = { name: "Calibri", bold: true, size: 12, color: { argb: GREEN } };
    cell.alignment = { vertical: "middle", horizontal: "center" };
    paint(cell, GOLD);
    border(cell);
  }
  sheet.getRow(totalRow).height = 22;

  const sentenceRow = totalRow + 2;
  sheet.mergeCells(sentenceRow, 2, sentenceRow, 8);
  const sentence = sheet.getCell(sentenceRow, 2);
  sentence.value = `Arrêté en état de paiement à la somme de : ${frenchOuguiyas(grand)}`;
  sentence.font = { name: "Calibri", italic: true, size: 12, color: { argb: INK } };
  sentence.alignment = { vertical: "middle", horizontal: "left", wrapText: true };
  sheet.getRow(sentenceRow).height = 22;

  const sign = sentenceRow + 3;
  const signTitle = sheet.getCell(sign, 2);
  signTitle.value = "DRS  Dr Mohamed Salem Dhoueib";
  signTitle.font = { name: "Calibri", bold: true, size: 12 };

  const raf = sheet.getCell(sign + 1, 1);
  raf.value = "RAF";
  raf.font = { name: "Calibri", bold: true, size: 12 };
  const coord = sheet.getCell(sign + 1, 7);
  coord.value = "Coordinateur";
  coord.font = { name: "Calibri", bold: true, size: 12 };

  const rafName = sheet.getCell(sign + 2, 1);
  rafName.value = "Abdellahi Barhim";
  rafName.font = { name: "Calibri", size: 12 };
  const coordName = sheet.getCell(sign + 2, 7);
  coordName.value = "Dr Sidi Mohamed Abdel Aziz";
  coordName.font = { name: "Calibri", size: 12 };
}
