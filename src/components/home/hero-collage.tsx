import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import type { EventSearchResult } from "@/lib/types";

/**
 * The floating poster collage behind the hero.
 *
 * The reference fills this space with invented posters. Ours uses the real
 * events on sale, so the collage is the product rather than a picture of it —
 * and it stays interesting as the catalogue changes instead of ageing into a
 * lie. Each slot has a tint fallback so a missing cover still reads as a
 * poster rather than a hole.
 *
 * Everything here is decorative: the cards are `aria-hidden` and not
 * focusable, because the same events are listed in full further down the page
 * and a screen reader should not have to wade through the wallpaper first.
 */

type Slot = {
  /** Percentage of the container width. */
  left: number;
  /** Pixels from the top of the collage. */
  top: number;
  size: number;
  rotate: number;
  tint: string;
  /** Hidden below this breakpoint, so small screens get a calmer hero. */
  from?: "md" | "lg";
};

const SLOTS: Slot[] = [
  { left: -1, top: 44, size: 176, rotate: -3, tint: "from-tint-purple to-tint-pink" },
  { left: 86, top: 20, size: 196, rotate: 2, tint: "from-tint-orange to-tint-pink" },
  { left: 6, top: 322, size: 152, rotate: 2.5, tint: "from-tint-blue to-tint-purple", from: "lg" },
  { left: 89, top: 318, size: 164, rotate: -2, tint: "from-tint-green to-tint-blue", from: "lg" },
  { left: 12, top: 546, size: 140, rotate: -1.5, tint: "from-tint-pink to-tint-orange", from: "lg" },
  { left: 81, top: 542, size: 148, rotate: 3, tint: "from-tint-purple to-tint-blue", from: "md" },
];

function FloatingCard({ slot, event }: { slot: Slot; event?: EventSearchResult }) {
  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none absolute hidden rounded-2xl bg-card p-2 shadow-e2 sm:block",
        slot.from === "md" && "hidden md:block",
        slot.from === "lg" && "hidden lg:block",
      )}
      style={{
        left: `${slot.left}%`,
        top: slot.top,
        width: slot.size,
        height: slot.size,
        transform: `rotate(${slot.rotate}deg)`,
      }}
    >
      <div className="relative size-full overflow-hidden rounded-xl bg-sunken">
        {event?.cover_image_url ? (
          <Image
            src={event.cover_image_url}
            alt=""
            fill
            sizes="200px"
            className="object-cover"
          />
        ) : (
          <div className={cn("size-full bg-gradient-to-br", slot.tint)} />
        )}
      </div>
    </div>
  );
}

export function HeroCollage({
  events,
  totalEvents,
}: {
  events: EventSearchResult[];
  /** Pre-formatted for display — the page already has the locale-aware value. */
  totalEvents: string;
}) {
  // The collage is positioned against the section, not the content column, so
  // the cards spread to the viewport edges the way the reference does. Inside
  // `container-page` they would bunch into the middle 1184px and leave the
  // margins conspicuously empty on a wide screen.
  return (
    <section className="relative min-h-[36rem] overflow-hidden py-20 md:min-h-[44rem] md:py-28">
      {SLOTS.map((slot, i) => (
        <FloatingCard key={slot.left} slot={slot} event={events[i]} />
      ))}

      {/*
        The collage sits behind a soft veil so the headline keeps its contrast
        over whatever covers happen to be on sale today.
      */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_46%_44%_at_50%_45%,var(--color-paper)_42%,transparent_100%)]"
      />

      <div className="container-page relative">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-md font-medium text-ink-3">
            {totalEvents} events on sale right now
          </p>

          <h1 className="display-1 mt-5 text-ink">
            Find your next
            <br />
            <span className="text-brand">night out.</span>
          </h1>

          <p className="mx-auto mt-6 max-w-lg text-lg leading-relaxed text-ink-2">
            Concerts, theatre, conferences and festivals — booked in seconds, with your
            tickets waiting in your pocket.
          </p>

          <div className="mt-9 flex flex-col items-center gap-5">
            <Link
              href="/events"
              className="inline-flex h-14 items-center rounded-full bg-solid px-7 text-lg font-medium text-on-solid transition-colors hover:bg-solid-hover"
            >
              Discover events
            </Link>
            <Link
              href="/dashboard/new"
              className="text-md text-ink-3 transition-colors hover:text-ink"
            >
              or host your own event
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

