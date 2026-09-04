import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * The floating poster collage behind the hero.
 *
 * Every card is a printed poster drawn in CSS (see `.art-*` in globals.css):
 * no image requests, no layout shift, and it looks the same before any data
 * arrives. The whole collage is decorative — `aria-hidden`, not focusable —
 * because the real catalogue is listed in full further down the page and a
 * screen reader should not have to wade through the wallpaper first.
 *
 * Positions follow the reference: a large card sits behind the headline and
 * the rest fan outward, with the smallest ones dropping away on narrow
 * screens so the hero stays calm on a phone.
 */

type Card = {
  art: React.ReactNode;
  className: string;
  /** Percentage of the hero width. */
  left: number;
  /** Pixels from the top of the hero. */
  top: number;
  width: number;
  height: number;
  /** Shown from this breakpoint up. Undefined means always. */
  from?: "sm" | "md" | "lg" | "xl";
};

const CARDS: Card[] = [
  {
    className: "art-retro",
    left: 20, top: 86, width: 188, height: 188, from: "md",
    art: <div className="w">RETRO<br />NIGHT</div>,
  },
  {
    className: "art-book",
    left: 69, top: 34, width: 206, height: 206, from: "sm",
    art: (
      <>
        <div className="circle" />
        <div className="w">BOOK<br />NIGHT</div>
      </>
    ),
  },
  {
    className: "art-makers",
    left: 8, top: 268, width: 146, height: 146, from: "xl",
    art: (
      <>
        <div className="w">MAKERS +<br />MENTORS</div>
        <div className="hands">🤝</div>
        <div className="w">OPEN NIGHT</div>
      </>
    ),
  },
  {
    className: "art-bday",
    left: 82, top: 252, width: 178, height: 178, from: "lg",
    art: (
      <div className="w">
        birthday
        <br />
        bash
        <small>Let&rsquo;s celebrate!</small>
      </div>
    ),
  },
  {
    className: "art-pasta",
    left: 12, top: 428, width: 224, height: 224, from: "lg",
    art: <div className="badge">PASTA<br />NIGHT</div>,
  },
  {
    className: "art-cocktail",
    left: 67, top: 438, width: 172, height: 172, from: "md",
    art: (
      <>
        <div className="w">Happy Hour</div>
        <div className="glass" />
        <small>JOIN US THURSDAY</small>
      </>
    ),
  },
  {
    className: "art-hack",
    left: 76, top: 592, width: 196, height: 196, from: "xl",
    art: (
      <>
        <div className="t">Cairo AI Hackathon</div>
        <div className="w">&lt;/&gt;</div>
        <small>27 – 28 September</small>
      </>
    ),
  },
  {
    className: "art-bbq",
    left: 1, top: 660, width: 186, height: 224, from: "xl",
    art: (
      <>
        <div className="w">GRILL<br />DAY</div>
        <div className="flame">🔥</div>
      </>
    ),
  },
];

const VISIBILITY: Record<NonNullable<Card["from"]>, string> = {
  sm: "hidden sm:block",
  md: "hidden md:block",
  lg: "hidden lg:block",
  xl: "hidden xl:block",
};

export function HeroCollage() {
  return (
    <section className="relative -mt-(--size-nav) pt-(--size-nav) min-h-[720px] overflow-x-clip overflow-y-visible bg-paper">
      {CARDS.map((card, index) => (
        <div
          key={card.className}
          aria-hidden
          className={cn("fcard-wrapper pointer-events-none", card.from && VISIBILITY[card.from])}
          style={{
            left: `${card.left}%`,
            top: card.top,
            width: card.width,
            height: card.height,
            animationDuration: `${3.8 + (index % 5) * 0.6}s`,
            animationDelay: `${(index * 0.4) % 2.4}s`,
          }}
        >
          <div className="fcard">
            <div className={cn("art", card.className)}>{card.art}</div>
          </div>
        </div>
      ))}

      <div className="container-page relative z-10 pt-[184px] text-center">
        <h1 className="display-1 text-ink">
          Find your next
          <br />
          <span className="text-brand">night out.</span>
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
