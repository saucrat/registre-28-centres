export async function downloadConfirmation(node: HTMLElement, filename: string) {
  await downloadNodeAsPdf(node, filename, "fit");
}

/** Multi-page PDF for tall reports (e.g. unreachable WhatsApp numbers). */
export async function downloadReportPdf(node: HTMLElement, filename: string) {
  await downloadNodeAsPdf(node, filename, "pages");
}

async function downloadNodeAsPdf(
  node: HTMLElement,
  filename: string,
  mode: "fit" | "pages",
) {
  const { toPng } = await import("html-to-image");
  const { jsPDF } = await import("jspdf");
  const width = node.offsetWidth;
  const height = node.offsetHeight;
  const dataUrl = await toPng(node, {
    pixelRatio: 2,
    backgroundColor: "#ffffff",
    cacheBust: true,
    width,
    height,
    canvasWidth: width * 2,
    canvasHeight: height * 2,
  });

  const image = await loadImage(dataUrl);
  const pdf = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait", compress: true });
  const pageW = 210;
  const pageH = 297;

  if (mode === "fit") {
    const ratio = image.width / image.height;
    let drawW = pageW;
    let drawH = drawW / ratio;
    if (drawH > pageH) {
      drawH = pageH;
      drawW = drawH * ratio;
    }
    const x = (pageW - drawW) / 2;
    const y = (pageH - drawH) / 2;
    pdf.addImage(dataUrl, "PNG", x, y, drawW, drawH, undefined, "FAST");
  } else {
    const margin = 8;
    const usableW = pageW - margin * 2;
    const usableH = pageH - margin * 2;
    const drawW = usableW;
    const drawH = (image.height / image.width) * drawW;
    const pageCount = Math.max(1, Math.ceil(drawH / usableH));
    for (let page = 0; page < pageCount; page += 1) {
      if (page > 0) pdf.addPage();
      const offsetY = margin - page * usableH;
      pdf.addImage(dataUrl, "PNG", margin, offsetY, drawW, drawH, undefined, "FAST");
    }
  }

  pdf.save(filename);
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("image"));
    image.src = src;
  });
}
