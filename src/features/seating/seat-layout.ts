/**
 * Authoring a seat map, as the mirror of `seat-plan.ts`, which draws one.
 *
 * A section is described the way a venue manager thinks about it — so many
 * rows, so many seats across — and turned into the normalised 0..1 coordinates
 * `venue_seats` stores. Keeping the arithmetic here means the generator and the
 * renderer cannot drift, and it can be tested without a database.
 */

export type SectionSpec = {
  name: string;
  color: string;
  rows: number;
  seatsPerRow: number;
  priceCents: number;
};

export type GeneratedSeat = {
  rowLabel: string;
  seatNumber: string;
  posX: number;
  posY: number;
};

/** Spreadsheet-style row names, so a venue can outgrow a single letter. */
export function rowLabel(index: number) {
  let label = "";
  let n = index;
  do {
    label = String.fromCharCode(65 + (n % 26)) + label;
    n = Math.floor(n / 26) - 1;
  } while (n >= 0);
  return label;
}

/** Coordinates are numeric(6,4) in the database, so round to match. */
function coord(value: number) {
  return Math.round(value * 10_000) / 10_000;
}

/**
 * Seats are centred in their share of the axis — seat i of n sits at
 * (i + 0.5) / n — so a row is inset from both edges by half a seat instead of
 * being flush against them, and rows of different lengths stay centred on each
 * other. Rows are numbered across the whole venue so the sections stack in
 * the order given, front to back.
 */
export function generateSeats(sections: SectionSpec[]) {
  const totalRows = sections.reduce((sum, section) => sum + section.rows, 0);
  if (totalRows === 0) return [];

  let rowsDone = 0;

  return sections.map((section) => {
    const seats: GeneratedSeat[] = [];

    for (let row = 0; row < section.rows; row += 1) {
      for (let seat = 0; seat < section.seatsPerRow; seat += 1) {
        seats.push({
          rowLabel: rowLabel(rowsDone + row),
          seatNumber: String(seat + 1),
          posX: coord((seat + 0.5) / section.seatsPerRow),
          posY: coord((rowsDone + row + 0.5) / totalRows),
        });
      }
    }

    rowsDone += section.rows;
    return { section, seats };
  });
}

/** A stable, readable section code from its name: "Front Stalls" -> "FRO". */
export function sectionCode(name: string, index: number) {
  const letters = name.toUpperCase().replace(/[^A-Z0-9]/g, "");
  return letters.slice(0, 3) || `S${index + 1}`;
}
