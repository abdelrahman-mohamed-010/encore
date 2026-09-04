import Link from "next/link";
import type { Metadata } from "next";
import { ShieldCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Avatar, EmptyState } from "@/components/ui/misc";
import { SectionHeader } from "@/components/ui/surface";
import { pluralize } from "@/lib/format";

export const metadata: Metadata = { title: "Organizers" };
export const revalidate = 300;

export default async function OrganizersPage() {
  const supabase = await createClient();

  const { data: organizers } = await supabase
    .from("organizers")
    .select("id, name, slug, description, logo_url, verification_status, events(count)")
    .eq("is_suspended", false)
    .order("name");

  return (
    <div className="container-page py-10 md:py-12">
      <SectionHeader
        level={1}
        title="Organizers"
        description="The promoters, theatres and communities putting on events."
      />

      {!organizers || organizers.length === 0 ? (
        <EmptyState className="mt-8" title="No organizers yet" />
      ) : (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {organizers.map((organizer) => {
            const count = (organizer.events as unknown as { count: number }[])?.[0]?.count ?? 0;
            return (
              <Link
                key={organizer.id}
                href={`/organizers/${organizer.slug}`}
                className="rounded-xl bg-card shadow-e1 p-5 transition-colors hover:bg-sunken"
              >
                <Avatar src={organizer.logo_url} name={organizer.name} size="lg" />
                <p className="mt-3 flex items-center gap-1.5 text-md font-semibold text-ink">
                  {organizer.name}
                  {organizer.verification_status === "verified" && (
                    <ShieldCheck className="size-3.5 text-info" />
                  )}
                </p>
                <p className="mt-1 text-xs text-ink-3">{pluralize(count, "event")}</p>
                {organizer.description && (
                  <p className="mt-2.5 line-clamp-2 text-sm leading-relaxed text-ink-2">
                    {organizer.description}
                  </p>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
