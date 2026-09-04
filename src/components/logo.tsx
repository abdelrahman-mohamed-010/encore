import Link from "next/link";
import { cn } from "@/lib/utils";

export function Logo({
  className,
  href = "/",
  showWordmark = true,
}: {
  className?: string;
  href?: string;
  showWordmark?: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn("group inline-flex items-center gap-2.5", className)}
      aria-label="Tazkarti home"
    >
      {/* The brand gradient lives here and nowhere else — one saturated mark is
          what makes the rest of the interface able to stay quiet. */}
      <span className="grid size-7 place-items-center rounded-lg bg-linear-to-br from-brand-500 to-brand-700 text-white shadow-e1 transition-transform duration-200 group-hover:-rotate-6">
        <svg viewBox="0 0 20 20" className="size-4" fill="none" aria-hidden>
          <path
            d="M2.5 7.6V5.9A1.4 1.4 0 0 1 3.9 4.5h12.2a1.4 1.4 0 0 1 1.4 1.4v1.7a2.4 2.4 0 0 0 0 4.8v1.7a1.4 1.4 0 0 1-1.4 1.4H3.9a1.4 1.4 0 0 1-1.4-1.4v-1.7a2.4 2.4 0 0 0 0-4.8Z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          <path d="M12.2 4.9v10.2" stroke="currentColor" strokeWidth="1.5" strokeDasharray="1.6 2" strokeLinecap="round" />
        </svg>
      </span>
      {showWordmark && (
        <span className="text-[17px] font-semibold tracking-[-0.03em] text-ink">Tazkarti</span>
      )}
    </Link>
  );
}
