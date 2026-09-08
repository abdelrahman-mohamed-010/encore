import Link from "next/link";
import { cn } from "@/lib/utils";
import ticketIcon from "@/assets/brand/ticket-icon.png";

/**
 * The mark is a flat black glyph recolored via CSS mask so it always reads as
 * the theme's ink color (grey), never a hardcoded black square — same trick
 * works in dark mode with zero extra assets.
 */
export function Logo({
  className,
  href = "/",
  showWordmark = false,
}: {
  className?: string;
  href?: string;
  showWordmark?: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn("group inline-flex items-center gap-2.5", className)}
      aria-label="Encore home"
    >
      <span
        className="inline-block size-6 shrink-0 bg-ink-2 transition-colors group-hover:bg-ink"
        style={{
          WebkitMask: `url(${ticketIcon.src}) center / contain no-repeat`,
          mask: `url(${ticketIcon.src}) center / contain no-repeat`,
        }}
        aria-hidden
      />
      {showWordmark && (
        <span className="text-lg font-semibold tracking-[-0.03em] text-ink">Encore</span>
      )}
    </Link>
  );
}
