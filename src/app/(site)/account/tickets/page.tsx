import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { CalendarDays, MapPin, Ticket as TicketIcon } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";
import { renderTicketQr } from "@/lib/qr";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/misc";
import { formatEventStamp } from "@/lib/format";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "My tickets" };

const STATUS_TONE = {
  valid: "positive",
  used: "neutral",
  refunded: "critical",
  void: "critical",
} as const;

export default async function TicketsPage() {
  const user = await requireUser();
  const supabase = await createClient();

  const { data: tickets } = await supabase
    .from("tickets")
    .select(
      `id, ticket_code, qr_secret, status, seat_label, attendee_name, checked_in_at,
       ticket_type:ticket_types(name),
       event:events(id, title, slug, starts_at, ends_at, timezone, cover_image_url, is_online,
         venue:venues(name, city))`,
    )
    .eq("owner_user_id", user.id)
    .order("issued_at", { ascending: false });

  const rows = tickets ?? [];
  const now = new Date();
  const upcoming = rows.filter((t) => t.event && new Date(t.event.ends_at) >= now);
  const past = rows.filter((t) => t.event && new Date(t.event.ends_at) < now);

  // QR codes are generated on the server so the secret is never held in client state.
  const qrCodes = new Map<string, string>();
  await Promise.all(
    upcoming
      .filter((t) => t.status === "valid")
      .map(async (t) => {
        qrCodes.set(t.id, await renderTicketQr(t.ticket_code, t.qr_secret));
      }),
  );

  if (rows.length === 0) {
    return (
      <EmptyState
        icon={TicketIcon}
        title="No tickets yet"
        description="When you book an event, your tickets appear here with a QR code for the door."
        action={
          <Button asChild variant="solid" size="md">
            <Link href="/events">Browse events</Link>
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-10">
      {upcoming.length > 0 && (
        <section>
          <h2 className="mb-4 text-[15px] font-semibold text-ink">Upcoming</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {upcoming.map((ticket) => (
              <TicketCard key={ticket.id} ticket={ticket} qr={qrCodes.get(ticket.id)} />
            ))}
          </div>
        </section>
      )}

      {past.length > 0 && (
        <section>
          <h2 className="mb-4 text-[15px] font-semibold text-ink">Past</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {past.map((ticket) => (
              <TicketCard key={ticket.id} ticket={ticket} past />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

/** Shape of the ticket rows this page selects. */
type TicketRow = {
  id: string;
  ticket_code: string;
  status: keyof typeof STATUS_TONE;
  seat_label: string | null;
  attendee_name: string | null;
  checked_in_at: string | null;
  ticket_type: { name: string } | null;
  event: {
    id: string;
    title: string;
    slug: string;
    starts_at: string;
    ends_at: string;
    timezone: string | null;
    cover_image_url: string | null;
    is_online: boolean;
    venue: { name: string; city: string } | null;
  } | null;
};

function TicketCard({
  ticket,
  qr,
  past = false,
}: {
  ticket: TicketRow;
  qr?: string;
  past?: boolean;
}) {
  const event = ticket.event;
  if (!event) return null;

  return (
    <article
      className={cn(
        "overflow-hidden rounded-xl border border-hairline bg-card",
        past && "opacity-70",
      )}
    >
      <div className="flex gap-4 p-4">
        <div className="relative size-16 shrink-0 overflow-hidden rounded-lg bg-sunken">
          {event.cover_image_url && (
            <Image src={event.cover_image_url} alt="" fill sizes="64px" className="object-cover" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <Link href={`/events/${event.slug}`} className="min-w-0">
              <h3 className="truncate text-[15px] font-semibold text-ink hover:underline">
                {event.title}
              </h3>
            </Link>
            <Badge tone={STATUS_TONE[ticket.status]} size="xs">
              {ticket.status === "used" ? "Checked in" : ticket.status}
            </Badge>
          </div>

          <p className="mt-1.5 flex items-center gap-1.5 text-[12.5px] text-ink-3">
            <CalendarDays className="size-3.5 shrink-0" />
            {formatEventStamp(event.starts_at, event.timezone ?? undefined)}
          </p>
          <p className="mt-0.5 flex items-center gap-1.5 text-[12.5px] text-ink-3">
            <MapPin className="size-3.5 shrink-0" />
            <span className="truncate">
              {event.is_online ? "Online event" : [event.venue?.name, event.venue?.city].filter(Boolean).join(" · ")}
            </span>
          </p>
        </div>
      </div>

      <div className="perforation h-px w-full" />

      <div className="flex items-center gap-4 p-4">
        {qr ? (
          <div className="shrink-0 rounded-lg border border-hairline bg-white p-1.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qr} alt={`QR code for ticket ${ticket.ticket_code}`} className="size-24" />
          </div>
        ) : (
          <div className="grid size-[6.75rem] shrink-0 place-items-center rounded-lg border border-dashed border-hairline text-[11px] text-ink-3">
            {ticket.status === "used" ? "Checked in" : "Not scannable"}
          </div>
        )}

        <dl className="min-w-0 flex-1 space-y-2 text-[12.5px]">
          <div>
            <dt className="text-ink-3">Ticket</dt>
            <dd className="font-medium text-ink">{ticket.ticket_type?.name ?? "General"}</dd>
          </div>
          {ticket.seat_label && (
            <div>
              <dt className="text-ink-3">Seat</dt>
              <dd className="font-medium text-ink">{ticket.seat_label}</dd>
            </div>
          )}
          <div>
            <dt className="text-ink-3">Code</dt>
            <dd className="font-mono text-[12px] font-medium tracking-wide text-ink">
              {ticket.ticket_code}
            </dd>
          </div>
        </dl>
      </div>
    </article>
  );
}
