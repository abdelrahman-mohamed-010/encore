import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Globe, Mail } from "lucide-react";
import { getOrganizerBySlug, getOrganizerPublicPage } from "@/features/organizers/queries";

import { Avatar } from "@/components/ui/avatar";import { NearbyEvents } from "@/features/map/components/nearby-events";
import { VerifiedBadge } from "@/components/ui/verified-badge";
import { EventTimeline } from "@/features/organizers/components/event-timeline";

export const revalidate = 120;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const organizer = await getOrganizerBySlug(slug);
  if (!organizer) return { title: "Organizer not found" };
  const description = organizer.description ?? `Events by ${organizer.name} on Encore.`;
  return {
    title: organizer.name,
    description,
    openGraph: {
      title: organizer.name,
      description,
      type: "profile",
      images: organizer.logo_url ? [organizer.logo_url] : undefined,
    },
  };
}

export default async function OrganizerPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const organizer = await getOrganizerBySlug(slug);
  if (!organizer) notFound();

  const { events: rows, owner } = await getOrganizerPublicPage(slug, organizer.owner_id);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: organizer.name,
    description: organizer.description ?? undefined,
    logo: organizer.logo_url ?? undefined,
    url: `${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/organizers/${slug}`,
    sameAs: organizer.website ? [organizer.website] : undefined,
  };

  return (
    <>
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* Banner */}
      <div className="relative h-44 bg-sunken md:h-64">
        {organizer.banner_url ? (
          <Image src={organizer.banner_url} alt="" fill sizes="100vw" className="object-cover" priority />
        ) : (
          <div className="size-full bg-gradient-to-r from-sunken via-sunken-2 to-sunken" />
        )}
      </div>

      <div className="container-page pb-16">
        {/* Organizer Identity Bar */}
        <div className="relative -mt-12 flex flex-wrap items-end justify-between gap-6 pb-6 border-b border-hairline md:-mt-16">
          <div className="flex flex-wrap items-end gap-5">
            <Avatar
              src={organizer.logo_url}
              name={organizer.name}
              size="xl"
              className="size-24 rounded-2xl border-4 border-paper shadow-md md:size-28"
            />
            <div className="min-w-0 pb-1">
              <h1 className="display-2 flex flex-wrap items-center gap-2.5 text-ink">
                {organizer.name}
                {organizer.verification_status === "verified" && (
                  <VerifiedBadge size="md" showLabel />
                )}
              </h1>
              {owner?.full_name && (
                <p className="mt-1 text-sm text-ink-3">
                  Hosted by{" "}
                  <Link href={`/u/${organizer.owner_id}`} className="font-medium text-ink-2 hover:underline">
                    {owner.full_name}
                  </Link>
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {organizer.website && (
              <a
                href={organizer.website}
                target="_blank"
                rel="noreferrer noopener"
                className="inline-flex items-center gap-1.5 rounded-xl border border-hairline bg-card px-3.5 py-2 text-xs font-semibold text-ink-2 shadow-xs transition-colors hover:bg-sunken hover:text-ink"
              >
                <Globe className="size-3.5" />
                {organizer.website.replace(/^https?:\/\//, "")}
              </a>
            )}
            {organizer.support_email && (
              <a
                href={`mailto:${organizer.support_email}`}
                className="inline-flex items-center gap-1.5 rounded-xl border border-hairline bg-card px-3.5 py-2 text-xs font-semibold text-ink-2 shadow-xs transition-colors hover:bg-sunken hover:text-ink"
              >
                <Mail className="size-3.5" />
                Contact
              </a>
            )}
          </div>
        </div>

        {organizer.description && (
          <p className="mt-6 max-w-3xl text-md leading-relaxed text-ink-2">
            {organizer.description}
          </p>
        )}

        {/* Events schedule + calendar filter */}
        <div className="mt-12">
          <EventTimeline events={rows} organizerName={organizer.name} />
        </div>

        {/* Nearby Events */}
        <NearbyEvents organizerSlug={slug} organizerName={organizer.name} />
      </div>
    </>
  );
}
