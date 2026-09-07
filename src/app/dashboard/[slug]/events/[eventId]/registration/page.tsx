import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Armchair, CreditCard, DoorOpen, Mail, Phone, User, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireOrganizer } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Divider } from "@/components/ui/surface";
import { DashboardBody } from "@/components/dashboard/page-header";
import { PlainCard, QuickAction, SectionBlock } from "@/components/dashboard/tiles";
import { TicketTypeEditor } from "@/components/dashboard/ticket-type-editor";
import { formatNumber } from "@/lib/format";

export const metadata: Metadata = { title: "Registration" };

/** The questions every buyer answers. Fixed today, but shown so the organizer
 *  can see what is collected without buying a ticket to find out. */
const QUESTIONS = [
  { icon: User, label: "Name", value: "Full name" },
  { icon: Mail, label: "Email", value: "Required" },
  { icon: Phone, label: "Phone", value: "Off" },
];

export default async function RegistrationPane({
  params,
}: {
  params: Promise<{ slug: string; eventId: string }>;
}) {
  const { slug, eventId } = await params;
  const { organizer, role } = await requireOrganizer(slug, "scanner");
  const supabase = await createClient();

  const { data: event } = await supabase
    .from("events")
    .select("id, status, seating_type, capacity")
    .eq("id", eventId)
    .eq("organizer_id", organizer.id)
    .maybeSingle();

  if (!event) notFound();

  const [{ data: ticketTypes }, { data: account }] = await Promise.all([
    supabase.from("ticket_types").select("*").eq("event_id", eventId).order("sort_order"),
    supabase
      .from("payment_accounts")
      .select("charges_enabled")
      .eq("organizer_id", organizer.id)
      .maybeSingle(),
  ]);

  const canEdit = role === "owner" || role === "admin" || role === "staff";
  const onSale = event.status === "published";

  return (
    <DashboardBody className="space-y-10">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <QuickAction
          icon={DoorOpen}
          tone={onSale ? "positive" : "caution"}
          label="Registration"
          value={onSale ? "Open" : "Closed — event is not published"}
          href={`/dashboard/${slug}/events/${eventId}/edit`}
        />
        <QuickAction
          icon={Users}
          tone="amber"
          label="Event capacity"
          value={event.capacity ? formatNumber(event.capacity) : "Unlimited"}
          href={`/dashboard/${slug}/events/${eventId}/edit`}
        />
        <QuickAction
          icon={Armchair}
          tone="violet"
          label="Seating"
          value={event.seating_type === "reserved_seating" ? "Reserved seats" : "General admission"}
          href={`/dashboard/${slug}/events/${eventId}/edit`}
        />
      </div>

      {!account?.charges_enabled && (
        <PlainCard
          icon={CreditCard}
          tone="blue"
          title="Start selling"
          action={
            role === "owner" || role === "admin" ? (
              <Button asChild variant="soft" size="sm">
                <Link href={`/dashboard/${slug}/settings/payments`}>Get started</Link>
              </Button>
            ) : undefined
          }
        >
          Collect payments by connecting a Stripe account. Payouts land daily, and setup
          takes a few minutes.
        </PlainCard>
      )}

      {canEdit ? (
        <TicketTypeEditor
          eventId={eventId}
          ticketTypes={ticketTypes ?? []}
          seatingType={event.seating_type}
        />
      ) : (
        <SectionBlock title="Tickets">
          <PlainCard icon={Users} tone="violet" title="View only">
            Ask an admin for staff access to change ticket types.
          </PlainCard>
        </SectionBlock>
      )}

      <Divider />

      <SectionBlock
        title="Registration questions"
        description="What buyers are asked when they check out."
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {QUESTIONS.map((question) => (
            <div
              key={question.label}
              className="flex h-14 items-center gap-3.5 rounded-xl bg-card px-4 shadow-e1"
            >
              <question.icon className="size-[18px] shrink-0 text-ink-3" />
              <span className="flex-1 truncate text-md font-medium text-ink">
                {question.label}
              </span>
              <span className="shrink-0 text-base text-ink-2">{question.value}</span>
            </div>
          ))}
        </div>
      </SectionBlock>
    </DashboardBody>
  );
}
