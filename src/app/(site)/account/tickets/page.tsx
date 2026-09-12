import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { CalendarDays, Clock, MapPin, Ticket as TicketIcon } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";
import { renderTicketQr } from "@/lib/qr";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/misc";
import { TicketQrModal } from "@/components/events/ticket-qr-modal";
import { formatEventStamp } from "@/lib/format";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "My tickets" };
const STATUS_TONE = { valid: "positive", used: "neutral", refunded: "critical", void: "critical" } as const;

export default async function TicketsPage() {
  const user = await requireUser();
  const supabase = await createClient();
  const { data: tickets } = await supabase
    .from("tickets")
    .select(
      `id, ticket_code, qr_secret, status, seat_label, attendee_name, checked_in_at,
       ticket_type:ticket_types(name),
       event:events(id, title, slug, starts_at, ends_at, timezone, cover_image_url, is_online, venue:venues(name, city))`,
    )
    .eq("owner_user_id", user.id)
    .order("issued_at", { ascending: false });

  const rows = tickets ?? [];
  const now = new Date();
  const upcoming = rows.filter((t) => t.event && new Date(t.event.ends_at) >= now);
  const past = rows.filter((t) => t.event && new Date(t.event.ends_at) < now);

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
            <Link href="/events">Discover events</Link>
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-10">
      {upcoming.length > 0 && (
        <section>
          <h2 className="mb-4 text-md font-semibold text-ink">Upcoming</h2>
          <div className="space-y-3">
            {upcoming.map((ticket) => (
              <TicketCard key={ticket.id} ticket={ticket} qr={qrCodes.get(ticket.id)} />
            ))}
          </div>
        </section>
      )}
      {past.length > 0 && (
        <section>
          <h2 className="mb-4 text-md font-semibold text-ink">Past</h2>
          <div className="space-y-3">
            {past.map((ticket) => (
              <TicketCard key={ticket.id} ticket={ticket} past />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

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

function TicketCard({ ticket, qr, past = false }: { ticket: TicketRow; qr?: string; past?: boolean }) {
  const event = ticket.event;
  if (!event) return null;

  const meta = [ticket.ticket_type?.name ?? "General", ticket.seat_label && `Seat ${ticket.seat_label}`]
    .filter(Boolean)
    .join(" · ");

  return (
    <article
      className={cn("overflow-hidden rounded-2xl bg-card", past && "opacity-60")}
    >
      <div className="flex items-center gap-4 p-4 sm:gap-5 sm:p-5">
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1.5 text-sm font-semibold text-amber">
            <CalendarDays className="size-3.5 shrink-0" />
            {formatEventStamp(event.starts_at, event.timezone ?? undefined)}
          </p>
          <Link href={`/events/${event.slug}`}>
            <h3 className="mt-1.5 truncate text-lg font-bold text-ink transition-colors hover:text-ink-2">
              {event.title}
            </h3>
          </Link>
          <p className="mt-1.5 flex items-center gap-1.5 text-sm text-ink-2">
            <MapPin className="size-3.5 shrink-0 text-ink-3" />
            <span className="truncate">
              {event.is_online
                ? "Online event"
                : [event.venue?.name, event.venue?.city].filter(Boolean).join(" · ") || "Venue TBA"}
            </span>
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Badge tone={STATUS_TONE[ticket.status]} size="xs">
              {ticket.status === "used" ? "Checked in" : ticket.status}
            </Badge>
            <span className="text-xs font-medium text-ink-3">{meta}</span>
          </div>
        </div>

        <div className="relative size-20 shrink-0 overflow-hidden rounded-lg bg-sunken sm:size-24">
          {event.cover_image_url ? (
            <Image src={event.cover_image_url} alt="" fill sizes="96px" className="object-cover" />
          ) : (
            <div className="flex size-full items-center justify-center bg-gradient-to-br from-sunken to-sunken-2 text-ink-3">
              <TicketIcon className="size-6 opacity-40" />
            </div>
          )}
        </div>
      </div>

      <div className="perforation h-px w-full" />

      <div className="flex items-center justify-between gap-4 px-4 py-3 sm:px-5">
        <span className="font-mono text-xs font-medium tracking-wide text-ink-3">{ticket.ticket_code}</span>
        <div className="shrink-0">
          {qr && ticket.status === "valid" ? (
            <TicketQrModal
              qr={qr}
              ticketCode={ticket.ticket_code}
              ticketType={ticket.ticket_type?.name}
              eventTitle={event.title}
              seatLabel={ticket.seat_label}
            />
          ) : past ? (
            <span className="flex items-center gap-1 text-xs text-ink-3">
              <Clock className="size-3" />
              Event ended
            </span>
          ) : (
            <span className="text-xs text-ink-3">
              {ticket.status === "used" ? "Checked in" : "Not scannable"}
            </span>
          )}
        </div>
      </div>
    </article>
  );
}
