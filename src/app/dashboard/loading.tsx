import { Shimmer } from "@/components/ui/skeleton";

/**
 * Covers the FIRST entry into `/dashboard/[slug]/**` — the `[slug]` layout
 * itself does a blocking auth + organizer lookup before it can render its
 * header (name, logo, tabs), so nothing below this route can show anything
 * real yet. Next only nests loading.js one level deep automatically for the
 * segment it sits in, but a parent loading.js does wrap nested layouts too,
 * which is what makes this file (not one inside `[slug]/`) the one that
 * actually covers that layout's await. Once the organizer resolves this
 * never shows again for that dashboard until a fresh navigation into it.
 */
export default function DashboardEntryLoading() {
  return (
    <div className="flex min-h-dvh flex-col bg-paper">
      <div className="h-(--size-nav) border-b border-hairline" />

      <div className="page-wash">
        <div className="container-page pt-10 pb-4">
          <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-4">
            <div className="flex min-w-0 items-center gap-4">
              <Shimmer className="size-14 shrink-0 rounded-2xl" />
              <div className="space-y-2">
                <Shimmer className="h-6 w-48" />
                <Shimmer className="h-3.5 w-24" />
              </div>
            </div>
            <div className="flex gap-2">
              <Shimmer className="h-10 w-32 rounded-xl" />
              <Shimmer className="h-10 w-32 rounded-xl" />
            </div>
          </div>
        </div>

        <div className="mt-7 border-b border-hairline">
          <div className="container-page flex gap-6 pb-3">
            {Array.from({ length: 5 }).map((_, i) => <Shimmer key={i} className="h-4 w-16" />)}
          </div>
        </div>
      </div>

      <div className="container-page flex-1 py-8">
        <Shimmer className="h-64 rounded-xl" />
      </div>
    </div>
  );
}
