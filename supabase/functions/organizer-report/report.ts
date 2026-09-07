import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";

/**
 * The sales report, drawn rather than rendered.
 *
 * Supabase Edge Functions run on Deno and cannot start a headless browser, so
 * there is no HTML to convert. pdf-lib composes the page directly.
 *
 * The document mirrors the dashboard so a printed report and the screen agree:
 * the same four figures with the same sub-lines, then the same fourteen-day
 * revenue and tickets charts, then the events behind them. Colour follows the
 * product's own token — one brand violet across both charts, as on screen.
 * Each chart is a single series, so its title names it and no legend is needed.
 */

const A4: [number, number] = [595.28, 841.89];
const MARGIN = 48;
const CONTENT = A4[0] - MARGIN * 2;

const INK = rgb(0.09, 0.09, 0.11);
const INK_2 = rgb(0.35, 0.35, 0.4);
const INK_3 = rgb(0.55, 0.55, 0.6);
const HAIRLINE = rgb(0.89, 0.89, 0.91);
const SUNKEN = rgb(0.968, 0.968, 0.975);
/** --series-1 from the app's chart tokens. */
const SERIES = rgb(0.482, 0.310, 0.878);

export type SeriesPoint = { day: string; grossCents: number; tickets: number };

export type ReportInput = {
  organizerName: string;
  generatedAt: Date;
  currency: string;
  tiles: { label: string; value: string; sub: string }[];
  series: SeriesPoint[];
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

type Fonts = { regular: PDFFont; bold: PDFFont };

function text(
  page: PDFPage,
  fonts: Fonts,
  value: string,
  x: number,
  y: number,
  opts: { size?: number; bold?: boolean; color?: typeof INK } = {},
) {
  page.drawText(value, {
    x,
    y,
    size: opts.size ?? 10,
    font: opts.bold ? fonts.bold : fonts.regular,
    color: opts.color ?? INK,
  });
}

function textRight(
  page: PDFPage,
  fonts: Fonts,
  value: string,
  right: number,
  y: number,
  opts: { size?: number; bold?: boolean; color?: typeof INK } = {},
) {
  const size = opts.size ?? 10;
  const font = opts.bold ? fonts.bold : fonts.regular;
  text(page, fonts, value, right - font.widthOfTextAtSize(value, size), y, opts);
}

function rule(page: PDFPage, y: number, from = MARGIN, to = A4[0] - MARGIN) {
  page.drawLine({ start: { x: from, y }, end: { x: to, y }, thickness: 0.5, color: HAIRLINE });
}

/**
 * One chart: a titled panel with its headline figure and fourteen bars.
 *
 * Bars sit on a recessive baseline with a gap between them, and only the first
 * and last day are labelled — a number on every bar is noise at this size.
 */
function barChart(
  page: PDFPage,
  fonts: Fonts,
  opts: {
    x: number;
    y: number;
    width: number;
    height: number;
    title: string;
    subtitle: string;
    headline: string;
    values: number[];
    labels: string[];
  },
) {
  const { x, y, width, height, title, subtitle, headline, values, labels } = opts;

  page.drawRectangle({ x, y: y - height, width, height, color: SUNKEN });

  text(page, fonts, title, x + 14, y - 20, { size: 9.5, bold: true });
  text(page, fonts, subtitle, x + 14, y - 32, { size: 7.5, color: INK_3 });
  text(page, fonts, headline, x + 14, y - 54, { size: 15, bold: true });

  const plotLeft = x + 14;
  const plotBottom = y - height + 26;
  const plotWidth = width - 28;
  const plotHeight = height - 92;

  const peak = Math.max(...values, 1);
  const gap = 2;
  const barWidth = (plotWidth - gap * (values.length - 1)) / values.length;

  values.forEach((value, i) => {
    // A zero day still shows a sliver, so the axis reads as fourteen days.
    const barHeight = Math.max((value / peak) * plotHeight, value > 0 ? 2 : 1);
    page.drawRectangle({
      x: plotLeft + i * (barWidth + gap),
      y: plotBottom,
      width: barWidth,
      height: barHeight,
      color: value > 0 ? SERIES : HAIRLINE,
    });
  });

  rule(page, plotBottom - 4, plotLeft, plotLeft + plotWidth);

  if (labels.length > 0) {
    text(page, fonts, labels[0], plotLeft, plotBottom - 15, { size: 7, color: INK_3 });
    textRight(page, fonts, labels[labels.length - 1], plotLeft + plotWidth, plotBottom - 15, {
      size: 7,
      color: INK_3,
    });
  }
}

export async function buildReport(input: ReportInput): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  doc.setTitle(`${input.organizerName} — sales report`);
  doc.setProducer("Tazkarti");

  const fonts: Fonts = {
    regular: await doc.embedFont(StandardFonts.Helvetica),
    bold: await doc.embedFont(StandardFonts.HelveticaBold),
  };

  let page = doc.addPage(A4);
  let y = A4[1] - MARGIN;
  const right = A4[0] - MARGIN;

  // ---- Masthead ----------------------------------------------------------
  text(page, fonts, "SALES REPORT", MARGIN, y, { size: 7.5, bold: true, color: INK_3 });
  y -= 26;
  text(page, fonts, input.organizerName, MARGIN, y, { size: 22, bold: true });
  y -= 17;
  text(
    page,
    fonts,
    input.generatedAt.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }),
    MARGIN,
    y,
    { size: 9, color: INK_3 },
  );
  y -= 16;
  rule(page, y);
  y -= 22;

  // ---- Four figures, two by two, as on the dashboard ---------------------
  const tileWidth = (CONTENT - 12) / 2;
  const tileHeight = 62;

  input.tiles.forEach((tile, i) => {
    const column = i % 2;
    const row = Math.floor(i / 2);
    const tx = MARGIN + column * (tileWidth + 12);
    const ty = y - row * (tileHeight + 12);

    page.drawRectangle({ x: tx, y: ty - tileHeight, width: tileWidth, height: tileHeight, color: SUNKEN });
    text(page, fonts, tile.label.toUpperCase(), tx + 14, ty - 18, { size: 7, color: INK_3 });
    text(page, fonts, tile.value, tx + 14, ty - 40, { size: 17, bold: true });
    text(page, fonts, tile.sub, tx + 14, ty - 53, { size: 8, color: INK_2 });
  });

  y -= Math.ceil(input.tiles.length / 2) * (tileHeight + 12) + 14;

  // ---- Sales ------------------------------------------------------------
  text(page, fonts, "Sales", MARGIN, y, { size: 12, bold: true });
  y -= 13;
  text(page, fonts, "Gross revenue and tickets issued, last 14 days.", MARGIN, y, {
    size: 8.5,
    color: INK_2,
  });
  y -= 14;

  const chartWidth = (CONTENT - 12) / 2;
  const chartHeight = 168;
  const labels = input.series.map((point) =>
    new Date(point.day).toLocaleDateString("en-GB", { day: "numeric", month: "short" }),
  );

  barChart(page, fonts, {
    x: MARGIN,
    y,
    width: chartWidth,
    height: chartHeight,
    title: "Revenue",
    subtitle: "Gross, last 14 days",
    headline: money(
      input.series.reduce((sum, point) => sum + point.grossCents, 0),
      input.currency,
    ),
    values: input.series.map((point) => point.grossCents),
    labels,
  });

  barChart(page, fonts, {
    x: MARGIN + chartWidth + 12,
    y,
    width: chartWidth,
    height: chartHeight,
    title: "Tickets issued",
    subtitle: "Per day, last 14 days",
    headline: String(input.series.reduce((sum, point) => sum + point.tickets, 0)),
    values: input.series.map((point) => point.tickets),
    labels,
  });

  y -= chartHeight + 26;

  // ---- Events ------------------------------------------------------------
  text(page, fonts, "Events", MARGIN, y, { size: 12, bold: true });
  y -= 18;

  const colSold = right - 150;
  const colAttended = right - 78;

  /** Drawn again at the top of every continuation page. */
  const columnHeader = (p: PDFPage, top: number) => {
    text(p, fonts, "Event", MARGIN, top, { size: 7.5, color: INK_3 });
    textRight(p, fonts, "SOLD", colSold, top, { size: 7.5, color: INK_3 });
    textRight(p, fonts, "ATTENDED", colAttended, top, { size: 7.5, color: INK_3 });
    textRight(p, fonts, "STATUS", right, top, { size: 7.5, color: INK_3 });
    rule(p, top - 7);
    return top - 24;
  };

  y = columnHeader(page, y);

  if (input.events.length === 0) {
    text(page, fonts, "No events yet.", MARGIN, y, { size: 10, color: INK_3 });
  }

  for (const event of input.events) {
    // Leave room for the row itself plus the footer strip.
    if (y < MARGIN + 46) {
      page = doc.addPage(A4);
      y = columnHeader(page, A4[1] - MARGIN);
    }

    // Trimmed rather than wrapped: one row per event keeps the table scannable.
    let title = event.title;
    const maxWidth = colSold - MARGIN - 80;
    while (fonts.regular.widthOfTextAtSize(title, 10) > maxWidth && title.length > 4) {
      title = title.slice(0, -2);
    }
    if (title !== event.title) title = `${title}…`;

    text(page, fonts, title, MARGIN, y, { size: 10 });
    textRight(page, fonts, String(event.sold), colSold, y, { size: 10 });
    textRight(page, fonts, String(event.attended), colAttended, y, { size: 10 });
    textRight(page, fonts, event.status.replace("_", " "), right, y, { size: 8.5, color: INK_3 });
    y -= 12;
    text(page, fonts, event.date, MARGIN, y, { size: 8, color: INK_3 });
    y -= 11;
    rule(page, y);
    y -= 16;
  }

  // ---- Footer on every page ---------------------------------------------
  for (const [index, p] of doc.getPages().entries()) {
    text(p, fonts, `Tazkarti · ${input.organizerName}`, MARGIN, MARGIN - 20, {
      size: 7.5,
      color: INK_3,
    });
    textRight(p, fonts, `${index + 1} / ${doc.getPageCount()}`, right, MARGIN - 20, {
      size: 7.5,
      color: INK_3,
    });
  }

  return await doc.save();
}
