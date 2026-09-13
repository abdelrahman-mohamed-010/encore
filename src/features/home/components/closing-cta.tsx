import Link from "next/link";

/**
 * The closing panel. The dot field is drawn entirely in CSS — two offset
 * radial-gradient tiles, masked down to a handful of soft blobs so it reads as
 * scattered confetti rather than a uniform screen.
 */
export function ClosingCta() {
  return (
    <section className="relative overflow-hidden py-28 text-center md:py-36">
      <div aria-hidden className="dot-field pointer-events-none absolute inset-0" />

      <div className="container-page relative">
        <h2 className="display-2 text-brand">
          Your next unforgettable
          <br />
          memory awaits.
        </h2>

        <div className="mt-12 flex flex-wrap justify-center gap-3.5 max-sm:flex-col max-sm:items-stretch">
          <Link
            href="/events"
            className="inline-flex h-12 items-center justify-center rounded-full bg-card px-5 text-md font-medium text-ink shadow-e1 transition-colors hover:bg-sunken"
          >
            Discover events
          </Link>
          <Link
            href="/dashboard/new"
            className="inline-flex h-12 items-center justify-center rounded-full bg-btn px-5 text-md font-medium text-ink-2 transition-colors hover:bg-btn-h hover:text-ink"
          >
            Start selling tickets
          </Link>
        </div>
      </div>
    </section>
  );
}
