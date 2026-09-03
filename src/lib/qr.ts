import QRCode from "qrcode";

/**
 * The QR payload binds the human-readable code to the ticket's server-side
 * secret, so a code copied off a screenshot is useless without the secret and
 * scanning verifies both.
 */
export function ticketPayload(ticketCode: string, qrSecret: string) {
  return `TZK1:${ticketCode}:${qrSecret}`;
}

export function parseTicketPayload(payload: string) {
  const parts = payload.trim().split(":");
  if (parts.length !== 3 || parts[0] !== "TZK1") return null;
  const [, ticketCode, qrSecret] = parts;
  if (!ticketCode || !qrSecret) return null;
  return { ticketCode: ticketCode.toUpperCase(), qrSecret };
}

/** Renders the QR as a data URL; done on the server so the secret never sits in client state longer than the image. */
export async function renderTicketQr(ticketCode: string, qrSecret: string, dark = "#111113") {
  return QRCode.toDataURL(ticketPayload(ticketCode, qrSecret), {
    errorCorrectionLevel: "M",
    margin: 1,
    width: 512,
    color: { dark, light: "#ffffff" },
  });
}
