import Image from "next/image";
import { CalendarDays, ExternalLink, MapPin, UserCheck, Video } from "lucide-react";
import { Avatar } from "@/components/ui/misc";
import { CopyButton } from "@/components/dashboard/copy-button";
import { formatDate, formatTime } from "@/lib/format";

/**
 * A scaled-down rendering of the public event page, shown inside the manage
 * screen.
 *
 * This is the reference's signature piece and it earns its place: the single
 * question an organizer has before publishing is "what will people actually
 * see?", and a thumbnail of the real page answers it without a round trip to
 * a new tab. It is deliberately *not* an iframe of the live page — an iframe
 * would drag the whole route's data fetching and JS into a decorative
 * element, and would break the moment the public page changes its padding.
 *
 * Everything here is a static rendering of props, so it costs one image.
 */
export function EventPreview({
  title,
  coverUrl,
  hostName,
  hostLogoUrl,
  startsAt,
  endsAt,
  timezone,
  venueName,
  city,
  isOnline,
  requiresApproval,
  publicUrl,
}: {
  title: string;
  coverUrl: string | null;
  hostName: string;
  hostLogoUrl: string | null;
  startsAt: string;
  endsAt: string;
  timezone?: string;
  venueName?: string | null;
  city?: string | null;
  isOnline: boolean;
  requiresApproval: boolean;
  publicUrl: string;
}) {
  const start = new Date(startsAt);
  const month = new Intl.DateTimeFormat("en-US", { month: "short", timeZone: timezone })
    .format(start)
    .toUpperCase();
  const day = new Intl.DateTimeFormat("en-US", { day: "numeric", timeZone: timezone }).format(start);

  return (
    <div className="relative overflow-hidden rounded-xl bg-sunken-2 p-4 pb-12">
      <div className="grid grid-cols-[7.5rem_minmax(0,1fr)] gap-3.5">
        <div>
          <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-n-1000">
            {coverUrl && (
              <Image src={coverUrl} alt="" fill sizes="120px" className="object-cover" />
            )}
          </div>

          <p className="mt-4 border-b border-line-2 pb-1.5 text-2xs text-ink-2">Hosted by</p>
          <div className="mt-2 flex items-center gap-1.5">
            <Avatar src={hostLogoUrl} name={hostName} size="xs" />
            <span className="truncate text-xs text-ink">{hostName}</span>
          </div>
        </div>

        <div className="min-w-0">
          <p className="font-flourish text-xl leading-tight text-ink">{title}</p>

          <div className="mt-3 flex items-center gap-2.5">
            <span className="grid size-7 shrink-0 place-content-center rounded-md bg-card text-center">
              <span className="block bg-sunken-2 text-[6px] font-bold uppercase leading-[9px] text-ink-2">
                {month}
              </span>
              <span className="block text-xs font-semibold leading-[17px] text-ink">{day}</span>
            </span>
            <div className="min-w-0">
              <p className="truncate text-xs font-bold text-ink">
                {formatDate(startsAt, "medium", timezone)}
              </p>
              <p className="truncate text-2xs text-ink-2">
                {formatTime(startsAt, timezone)} – {formatTime(endsAt, timezone)}
              </p>
            </div>
          </div>

          <div className="mt-2.5 flex items-center gap-2.5">
            <span className="grid size-7 shrink-0 place-items-center rounded-md bg-card text-ink-2">
              {isOnline ? <Video className="size-3" /> : <MapPin className="size-3" />}
            </span>
            <p className="truncate text-xs font-bold text-ink">
              {isOnline
                ? "Online event"
                : venueName ?? "Register to see address"}
              {!isOnline && city ? (
                <span className="block text-2xs font-normal text-ink-2">{city}</span>
              ) : null}
            </p>
          </div>

          <div className="mt-3.5 overflow-hidden rounded-lg border border-line-2 bg-card">
            <p className="bg-sunken px-3 py-1 text-2xs text-ink-2">Registration</p>
            <div className="flex gap-2.5 border-b border-hairline px-3 py-2.5">
              {requiresApproval ? (
                <UserCheck className="mt-0.5 size-3.5 shrink-0 text-ink-2" />
              ) : (
                <CalendarDays className="mt-0.5 size-3.5 shrink-0 text-ink-2" />
              )}
              <div className="min-w-0">
                <p className="text-xs font-bold text-ink">
                  {requiresApproval ? "Approval required" : "Open to everyone"}
                </p>
                <p className="text-2xs leading-snug text-ink-2">
                  {requiresApproval
                    ? "Your registration is subject to host approval."
                    : "Pick a ticket and check out in seconds."}
                </p>
              </div>
            </div>
            <p className="px-3 py-2.5 text-xs leading-relaxed text-ink">
              Welcome! To join the event, please register below.
            </p>
          </div>
        </div>
      </div>

      {/* The address bar, anchored to the bottom the way the reference draws it. */}
      <div className="absolute inset-x-2.5 bottom-0 flex h-9 items-center justify-between gap-3 rounded-t-lg bg-n-700/90 pl-3.5 pr-2 text-on-solid">
        <span className="flex min-w-0 items-center gap-1.5">
          <span className="truncate text-xs">{publicUrl}</span>
          <ExternalLink className="size-3 shrink-0 opacity-80" />
        </span>
        <CopyButton value={publicUrl} />
      </div>
    </div>
  );
}
