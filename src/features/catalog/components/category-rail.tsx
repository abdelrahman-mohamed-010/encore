import Link from "next/link";
import * as Icons from "lucide-react";
import { cn } from "@/lib/utils";
import type { Category } from "@/lib/types";

const ICON_MAP: Record<string, keyof typeof Icons> = {
  music: "Music",
  drama: "Drama",
  trophy: "Trophy",
  presentation: "Presentation",
  laugh: "Laugh",
  clapperboard: "Clapperboard",
  utensils: "Utensils",
  palette: "Palette",
  ticket: "Ticket",
};

export function CategoryRail({
  categories,
  activeSlug,
  className,
}: {
  categories: Category[];
  activeSlug?: string;
  className?: string;
}) {
  return (
    <div className={cn("flex gap-2 overflow-x-auto pb-1 no-scrollbar", className)}>
      <CategoryChip href="/events" label="All" active={!activeSlug} iconName="LayoutGrid" />
      {categories.map((category) => (
        <CategoryChip
          key={category.id}
          href={`/events?category=${category.slug}`}
          label={category.name}
          active={activeSlug === category.slug}
          iconName={ICON_MAP[category.icon] ?? "Ticket"}
        />
      ))}
    </div>
  );
}

function CategoryChip({
  href,
  label,
  active,
  iconName,
}: {
  href: string;
  label: string;
  active?: boolean;
  iconName: keyof typeof Icons;
}) {
  const Icon = (Icons[iconName] ?? Icons.Ticket) as React.ComponentType<{ className?: string }>;
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex h-(--size-btn) shrink-0 items-center gap-2 rounded-full px-4 text-base font-medium transition-colors",
        active
          ? "bg-solid text-on-solid"
          : "bg-btn text-ink-2 hover:bg-btn-h hover:text-ink",
      )}
    >
      <Icon className="size-4" />
      {label}
    </Link>
  );
}
