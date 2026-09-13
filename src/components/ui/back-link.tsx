import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

/** The "← somewhere" link that opens a detail page. */
export function BackLink({
  href,
  children,
  className,
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center gap-1.5 text-sm text-ink-3 transition-colors hover:text-ink",
        className,
      )}
    >
      <ArrowLeft className="size-3.5" />
      {children}
    </Link>
  );
}
