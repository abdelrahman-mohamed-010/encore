import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { Avatar, EmptyState } from "@/components/ui/misc";
import { SectionHeader } from "@/components/ui/surface";
import { VerifiedBadge } from "@/components/ui/verified-badge";
import { pluralize } from "@/lib/format";

export const metadata: Metadata = { title: "Organizers" };
export const revalidate = 300;

export default async function OrganizersPage() {
  const supabase = await createClient();

  const { data: organizers } = await supabase
    .from("organizers")
    .select("id, name, slug, description, logo_url, banner_url, verification_status, events(count)")
    .eq("is_suspended", false)
    .order("name");

  return (
    <div className="container-page py-10 md:py-14">
      <SectionHeader
        level={1}
        eyebrow="Community & Hosts"
        title="Organizers"
        description="The promoters, theatres, and creators bringing nights to life."
      />

      {!organizers || organizers.length === 0 ? (
        <EmptyState className="mt-8" title="No organizers yet" />
      ) : (
        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {organizers.map((organizer) => {
            const count = (organizer.events as unknown as { count: number }[])?.[0]?.count ?? 0;

            return (
              <Link
                key={organizer.id}
                href={`/organizers/${organizer.slug}`}
                className="group relative flex flex-col justify-between overflow-hidden rounded-2xl bg-card p-4.5 transition-all duration-200 hover:-translate-y-1"
              >
                <div>
                  <Avatar
                    src={organizer.logo_url}
                    name={organizer.name}
                    size="xl"
                    className="size-12 rounded-xl transition-transform duration-200 group-hover:scale-105"
                  />

                  <div className="mt-3 flex items-center gap-1.5">
                    <h2 className="truncate text-sm sm:text-base font-semibold text-ink transition-colors group-hover:text-brand-600">
                      {organizer.name}
                    </h2>
                    {organizer.verification_status === "verified" && (
                      <VerifiedBadge size="xs" />
                    )}
                  </div>

                  <p className="mt-0.5 text-xs text-ink-3">
                    {pluralize(count, "event")}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
