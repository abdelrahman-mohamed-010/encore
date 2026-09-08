import Link from "next/link";

/**
 * The hero. A `dot-field` background (the same scattered-confetti pattern as
 * the closing panel) keeps the section from reading as bare, without the
 * upkeep of hand-placed decorative cards.
 */
export function HeroCollage() {
  return (
    <section className="relative -mt-(--size-nav) overflow-hidden pt-(--size-nav)">
      <div aria-hidden className="dot-field pointer-events-none absolute inset-0" />

      <div className="container-page relative z-10 py-28 text-center md:py-36">
        <h1 className="display-1 text-ink">
          Find your next
          <span className="text-brand"> night out.</span>
        </h1>

        <p className="mx-auto mt-7 max-w-lg text-lg leading-relaxed text-ink-2">
          Concerts, theatre, conferences and festivals — booked in seconds, with your
          tickets waiting in your pocket.
        </p>

        <div className="mt-10 flex flex-col items-center gap-6">
          <Link
            href="/events"
            className="relative z-10 inline-flex h-14 items-center rounded-full bg-solid px-7 text-lg font-medium text-on-solid transition-colors hover:bg-solid-hover"
          >
            Discover events
          </Link>
          <Link href="/dashboard/new" className="text-md text-ink-3 transition-colors hover:text-ink">
            or host your own event
          </Link>
        </div>
      </div>
    </section>
  );
}
