import Link from "next/link";
import type { Metadata } from "next";
import * as Icons from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { SectionHeader } from "@/components/ui/surface";
import { pluralize } from "@/lib/format";

export const metadata: Metadata = { title: "Categories" };
export const revalidate = 600;

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

export default async function CategoriesPage() {
  const supabase = await createClient();

  const { data: categories } = await supabase
    .from("categories")
    .select("*, events(count)")
    .eq("is_active", true)
    .order("sort_order");

  return (
    <div className="container-page py-10 md:py-12">
      <SectionHeader level={1} title="Categories" description="Browse by the kind of night you are after." />

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {(categories ?? []).map((category) => {
          const Icon = (Icons[ICON_MAP[category.icon] ?? "Ticket"] ??
            Icons.Ticket) as React.ComponentType<{ className?: string }>;
          const count = (category.events as unknown as { count: number }[])?.[0]?.count ?? 0;

          return (
            <Link
              key={category.id}
              href={`/events?category=${category.slug}`}
              className="group rounded-xl border border-hairline bg-card p-5 transition-colors hover:bg-sunken"
            >
              <span
                className="grid size-10 place-items-center rounded-lg"
                style={{ backgroundColor: `${category.color}1f`, color: category.color }}
              >
                <Icon className="size-5" />
              </span>
              <p className="mt-3.5 text-[15px] font-semibold text-ink">{category.name}</p>
              <p className="mt-1 text-[12.5px] text-ink-3">{pluralize(count, "event")}</p>
              {category.description && (
                <p className="mt-2 line-clamp-2 text-[13px] leading-relaxed text-ink-2">
                  {category.description}
                </p>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
