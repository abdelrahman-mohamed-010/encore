"use client";

import { useCallback, useState } from "react";
import { Camera, CameraOff, CheckCircle2, KeyRound, XCircle } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { useAsyncAction, useQrScanner } from "@/hooks";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/surface";
import { Field, Input } from "@/components/ui/input";
import { SelectField } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { parseTicketPayload } from "@/lib/qr";
import { formatTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { ScanResult } from "@/lib/types";

type ScanOutcome = {
  result: ScanResult;
  ticket_code: string;
  attendee_name: string | null;
  ticket_type: string | null;
  seat_label: string | null;
  at: number;
};

const COPY: Record<ScanResult, { label: string; tone: "positive" | "caution" | "critical" }> = {
  valid: { label: "Admitted", tone: "positive" },
  already_used: { label: "Already checked in", tone: "caution" },
  void: { label: "Refunded or void", tone: "critical" },
  wrong_event: { label: "Wrong event", tone: "critical" },
  not_found: { label: "Not a valid ticket", tone: "critical" },
};

export function Scanner({ events }: { events: { id: string; title: string }[] }) {
  const [eventId, setEventId] = useState(events[0]?.id ?? "");
  const [manualCode, setManualCode] = useState("");
  const [history, setHistory] = useState<ScanOutcome[]>([]);

  const scan = useAsyncAction(async (payload: string) => {
    const parsed = parseTicketPayload(payload);
    if (!parsed) {
      toast.error("That QR code is not a Tazkarti ticket");
      return;
    }
    if (!eventId) return;

    const supabase = createClient();
    const { data, error } = await supabase.rpc("scan_ticket", {
      p_ticket_code: parsed.ticketCode,
      p_qr_secret: parsed.qrSecret,
      p_event_id: eventId,
      p_device_info: navigator.userAgent.slice(0, 120),
    });

    if (error) {
      toast.error("Scan failed", { description: error.message });
      return;
    }

    const outcome = { ...(data as unknown as Omit<ScanOutcome, "at">), at: Date.now() };
    setHistory((prev) => [outcome, ...prev].slice(0, 25));

    if (outcome.result === "valid") {
      toast.success(`Admitted ${outcome.attendee_name ?? outcome.ticket_code}`);
      navigator.vibrate?.(40);
    } else {
      toast.error(COPY[outcome.result].label, { description: outcome.ticket_code });
      navigator.vibrate?.([40, 60, 40]);
    }
  });

  const submit = scan.run;
  const onDecode = useCallback((payload: string) => void submit(payload), [submit]);
  const {
    videoRef,
    scanning,
    error: cameraError,
    toggle: toggleCamera,
  } = useQrScanner({ onDecode });

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <div className="space-y-5">
        <Card>
          <CardHeader bordered>
            <CardTitle>Scanner</CardTitle>
            <Badge tone={scanning ? "positive" : "neutral"} size="xs">
              {scanning ? "Camera on" : "Camera off"}
            </Badge>
          </CardHeader>

          <CardBody className="space-y-4">
            <Field label="Event" htmlFor="scanEvent">
              <SelectField
                id="scanEvent"
                value={eventId}
                onChange={setEventId}
                placeholder="Choose an event"
                options={events.map((event) => ({ value: event.id, label: event.title }))}
              />
            </Field>

            <div className="relative aspect-video overflow-hidden rounded-xl border border-hairline bg-n-950">
              <video
                ref={videoRef}
                className={cn("size-full object-cover", !scanning && "hidden")}
                muted
                playsInline
              />
              {!scanning && (
                <div className="absolute inset-0 grid place-items-center text-center">
                  <div>
                    <CameraOff className="mx-auto size-6 text-n-500" />
                    <p className="mt-2 text-[13px] text-n-400">
                      {cameraError ?? "Start the camera to scan tickets"}
                    </p>
                  </div>
                </div>
              )}
              {scanning && (
                <div className="pointer-events-none absolute inset-0 grid place-items-center">
                  <div className="size-48 rounded-2xl border-2 border-white/70" />
                </div>
              )}
            </div>

            <Button
              variant={scanning ? "outline" : "solid"}
              size="lg"
              block
              onClick={toggleCamera}
            >
              <Camera />
              {scanning ? "Stop camera" : "Start camera"}
            </Button>
          </CardBody>
        </Card>

        <Card>
          <CardHeader bordered>
            <CardTitle className="flex items-center gap-2">
              <KeyRound className="size-4 text-ink-3" />
              Enter a code manually
            </CardTitle>
          </CardHeader>
          <CardBody>
            <form
              className="flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                // Accept either a full QR payload or a bare ticket code plus secret.
                void submit(manualCode.includes(":") ? manualCode : `TZK1:${manualCode}:`);
                setManualCode("");
              }}
            >
              <Input
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value.toUpperCase())}
                placeholder="TZK1:ABCD…:secret"
                aria-label="Ticket code"
                className="font-mono"
              />
              <Button
                type="submit"
                variant="solid"
                loading={scan.pending}
                disabled={!manualCode.trim()}
              >
                Check in
              </Button>
            </form>
            <p className="mt-2 text-[12px] leading-relaxed text-ink-3">
              A ticket code alone is not enough — the QR payload also carries a secret, so a code
              read off someone&apos;s screenshot will not admit anyone.
            </p>
          </CardBody>
        </Card>
      </div>

      <Card className="lg:sticky lg:top-24 lg:self-start">
        <CardHeader bordered>
          <CardTitle>Recent scans</CardTitle>
        </CardHeader>
        {history.length === 0 ? (
          <CardBody>
            <p className="text-[13px] text-ink-3">Nothing scanned yet.</p>
          </CardBody>
        ) : (
          <div className="max-h-[32rem] overflow-y-auto">
            {history.map((entry, index) => {
              const copy = COPY[entry.result];
              return (
                <div
                  key={`${entry.ticket_code}-${entry.at}-${index}`}
                  className="flex items-start gap-3 border-b border-hairline-soft px-4 py-3 last:border-b-0"
                >
                  {entry.result === "valid" ? (
                    <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-positive" />
                  ) : (
                    <XCircle className="mt-0.5 size-4 shrink-0 text-critical" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-medium text-ink">
                      {entry.attendee_name ?? entry.ticket_code}
                    </p>
                    <p className="truncate text-[12px] text-ink-3">
                      {copy.label}
                      {entry.ticket_type ? ` · ${entry.ticket_type}` : ""}
                    </p>
                  </div>
                  <span className="shrink-0 text-[11.5px] tabular text-ink-3">
                    {formatTime(new Date(entry.at))}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
