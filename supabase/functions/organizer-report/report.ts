import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";

/**
 * The sales report, drawn rather than rendered.
 *
 * Supabase Edge Functions run on Deno and cannot start a headless browser, so
 * there is no HTML to convert. pdf-lib composes the page directly, which suits
 * a report: the layout is deterministic, the file is a few kilobytes, and it
 * needs no third-party rendering service.
 *
 * The visual language follows the product — near-black ink on white, hairline
 * rules instead of boxes, generous margins, figures right-aligned so columns of
 * numbers line up on the decimal.
 */

const A4: [number, number] = [595.28, 841.89];
const MARGIN = 56;
const INK = rgb(0.09, 0.09, 0.11);
const INK_SOFT = rgb(0.45, 0.45, 0.5);
const HAIRLINE = rgb(0.88, 0.88, 0.9);

export type ReportInput = {
  organizerName: string;
  generatedAt: Date;
  currency: string;
  summary: { label: string; value: string }[];
  events: { title: string; date: string; status: string; sold: number; attended: number }[];
};

/** Cents to a display string, without pulling in a formatting library. */
export function money(cents: number, currency: string) {
  const symbol = currency === "USD" ? "$" : currency === "EUR" ? "€" : "";
  const value = (cents / 100).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return symbol ? `${symbol}${value}` : `${value} ${currency}`;
}

class Cursor {
  y: number;
  constructor(public page: PDFPage, public doc: PDFDocument, public fonts: { regular: PDFFont; bold: PDFFont }) {
    this.y = A4[1] - MARGIN;
  }

  /** Start a new page when the next block would not fit. */
  ensure(space: number) {
    if (this.y - space > MARGIN) return;
    this.page = this.doc.addPage(A4);
    this.y = A4[1] - MARGIN;
  }

  text(value: string, opts: { size?: number; bold?: boolean; color?: typeof INK; x?: number } = {}) {
    const size = opts.size ?? 10;
    this.page.drawText(value, {
      x: opts.x ?? MARGIN,
      y: this.y,
      size,
      font: opts.bold ? this.fonts.bold : this.fonts.regular,
      color: opts.color ?? INK,
    });
  }

  /** Right-aligned, so money and counts align on their last digit. */
  textRight(value: string, right: number, opts: { size?: number; bold?: boolean; color?: typeof INK } = {}) {
    const size = opts.size ?? 10;
    const font = opts.bold ? this.fonts.bold : this.fonts.regular;
    this.page.drawText(value, {
      x: right - font.widthOfTextAtSize(value, size),
      y: this.y,
      size,
      font,
      color: opts.color ?? INK,
    });
  }

  rule() {
    this.page.drawLine({
      start: { x: MARGIN, y: this.y },
      end: { x: A4[0] - MARGIN, y: this.y },
      thickness: 0.5,
      color: HAIRLINE,
    });
  }

  down(by: number) {
    this.y -= by;
  }
}

export async function buildReport(input: ReportInput): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  doc.setTitle(`${input.organizerName} — sales report`);
  doc.setProducer("Tazkarti");

  const fonts = {
    regular: await doc.embedFont(StandardFonts.Helvetica),
    bold: await doc.embedFont(StandardFonts.HelveticaBold),
  };

  const page = doc.addPage(A4);
  const c = new Cursor(page, doc, fonts);
  const right = A4[0] - MARGIN;

  // ---- Masthead ----------------------------------------------------------
  c.text("SALES REPORT", { size: 8, bold: true, color: INK_SOFT });
  c.down(24);
  c.text(input.organizerName, { size: 20, bold: true });
  c.down(16);
  c.text(
    input.generatedAt.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }),
    { size: 9, color: INK_SOFT },
  );
  c.down(18);
  c.rule();
  c.down(28);

  // ---- Summary: two columns of label/value pairs -------------------------
  const half = (A4[0] - MARGIN * 2) / 2;
  for (let i = 0; i < input.summary.length; i += 2) {
    c.ensure(46);
    const pair = input.summary.slice(i, i + 2);

    pair.forEach((item, column) => {
      const x = MARGIN + column * half;
      c.text(item.label.toUpperCase(), { size: 7.5, color: INK_SOFT, x });
    });
    c.down(15);
    pair.forEach((item, column) => {
      const x = MARGIN + column * half;
      c.text(item.value, { size: 15, bold: true, x });
    });
    c.down(26);
  }

  c.down(4);
  c.rule();
  c.down(26);

  // ---- Per-event table ---------------------------------------------------
  c.text("EVENTS", { size: 8, bold: true, color: INK_SOFT });
  c.down(18);

  const colSold = right - 150;
  const colAttended = right - 75;

  c.text("Event", { size: 8, color: INK_SOFT });
  c.textRight("Sold", colSold, { size: 8, color: INK_SOFT });
  c.textRight("Attended", colAttended, { size: 8, color: INK_SOFT });
  c.textRight("Status", right, { size: 8, color: INK_SOFT });
  c.down(8);
  c.rule();
  c.down(18);

  if (input.events.length === 0) {
    c.text("No events yet.", { size: 10, color: INK_SOFT });
    c.down(18);
  }

  for (const event of input.events) {
    c.ensure(34);

    // Trim rather than wrap: one row per event keeps the table scannable.
    let title = event.title;
    const maxWidth = colSold - MARGIN - 90;
    while (fonts.regular.widthOfTextAtSize(title, 10) > maxWidth && title.length > 4) {
      title = title.slice(0, -2);
    }
    if (title !== event.title) title = `${title}…`;

    c.text(title, { size: 10 });
    c.textRight(String(event.sold), colSold, { size: 10 });
    c.textRight(String(event.attended), colAttended, { size: 10 });
    c.textRight(event.status.replace("_", " "), right, { size: 9, color: INK_SOFT });
    c.down(13);
    c.text(event.date, { size: 8.5, color: INK_SOFT });
    c.down(12);
    c.rule();
    c.down(16);
  }

  // ---- Footer on every page ---------------------------------------------
  for (const [index, p] of doc.getPages().entries()) {
    p.drawText(`Tazkarti · ${input.organizerName}`, {
      x: MARGIN,
      y: MARGIN - 22,
      size: 8,
      font: fonts.regular,
      color: INK_SOFT,
    });
    const label = `${index + 1} / ${doc.getPageCount()}`;
    p.drawText(label, {
      x: right - fonts.regular.widthOfTextAtSize(label, 8),
      y: MARGIN - 22,
      size: 8,
      font: fonts.regular,
      color: INK_SOFT,
    });
  }

  return await doc.save();
}
