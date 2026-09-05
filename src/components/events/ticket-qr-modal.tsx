"use client";

import { useState } from "react";
import { QrCode } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogBody,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export function TicketQrModal({
  qr,
  ticketCode,
  ticketType,
  eventTitle,
  seatLabel,
}: {
  qr: string;
  ticketCode: string;
  ticketType?: string;
  eventTitle: string;
  seatLabel?: string | null;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button
        variant="outline"
        size="sm"
        className="gap-1.5 rounded-lg"
        onClick={() => setOpen(true)}
      >
        <QrCode className="size-3.5" />
        Show QR
      </Button>

      <DialogContent size="sm" className="text-center">
        <DialogHeader className="text-center">
          <DialogTitle className="text-center">{eventTitle}</DialogTitle>
        </DialogHeader>

        <DialogBody className="flex flex-col items-center gap-5 px-6 pb-8 pt-4">
          {/* QR Code */}
          <div className="rounded-2xl border border-hairline bg-white p-4 shadow-sm">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={qr}
              alt={`QR code for ticket ${ticketCode}`}
              className="size-48"
            />
          </div>

          {/* Ticket info */}
          <div className="space-y-2">
            <p className="font-mono text-sm font-semibold tracking-widest text-ink">
              {ticketCode}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2">
              {ticketType && (
                <Badge tone="accent" size="xs">
                  {ticketType}
                </Badge>
              )}
              {seatLabel && (
                <Badge tone="neutral" size="xs">
                  Seat {seatLabel}
                </Badge>
              )}
            </div>
          </div>

          <p className="text-xs leading-relaxed text-ink-3">
            Present this QR code at the door for check-in.
            <br />
            Do not share this code with others.
          </p>
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}
