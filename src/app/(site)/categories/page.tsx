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
    <div className="container-page py-10 md:py-14">
      <SectionHeader
        level={1}
        eyebrow="Explore Genres"
        title="Categories"
        description="Discover events by the kind of night you are after."
      />

      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
        {(categories ?? []).map((category) => {
          const Icon = (Icons[ICON_MAP[category.icon] ?? "Ticket"] ??
            Icons.Ticket) as React.ComponentType<{ className?: string }>;
          const count = (category.events as unknown as { count: number }[])?.[0]?.count ?? 0;

          return (
            <Link
              key={category.id}
              href={`/events?category=${category.slug}`}
              className="group relative flex flex-col justify-between overflow-hidden rounded-2xl bg-card p-4.5 transition-all duration-200 hover:-translate-y-1"
            >
              <div>
                <span
                  className="grid size-11 place-items-center rounded-xl transition-transform duration-200 group-hover:scale-110"
                  style={{ backgroundColor: `${category.color}16`, color: category.color }}
                >
                  <Icon className="size-5 stroke-[2.2]" />
                </span>

                <h2 className="mt-3 text-sm sm:text-base font-semibold text-ink transition-colors group-hover:text-brand-600">
                  {category.name}
                </h2>
                <p className="mt-0.5 text-xs text-ink-3">
                  {pluralize(count, "event")}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
