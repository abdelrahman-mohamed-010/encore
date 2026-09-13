"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { Megaphone, QrCode, Share2 } from "lucide-react";
import { Divider } from "@/components/ui/surface";
import { Shimmer } from "@/components/ui/skeleton";
import { QuickAction, SectionBlock } from "@/features/dashboard/components/tiles";

/** See dashboard/[slug]/events/loading.tsx — exists to make this dynamic route prefetchable. */
export default function Loading() {
  const { slug } = useParams<{ slug: string }>();

  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <QuickAction icon={Megaphone} tone="blue" label="Invite guests" value="Share the event page" href={`/dashboard/${slug}/events`} />
        <QuickAction icon={QrCode} tone="violet" label="Check in" value="Scan at the door" href={`/dashboard/${slug}/scan`} />
        <QuickAction icon={Share2} tone="pink" label="Public page" value={`/organizers/${slug}`} href={`/organizers/${slug}`} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => <Shimmer key={i} className="h-24 rounded-xl" />)}
      </div>

      <Divider />

      <SectionBlock title="Sales" description="Gross revenue and tickets issued, last 14 days.">
        <div className="grid gap-5 lg:grid-cols-2">
          <Shimmer className="h-80 rounded-xl" />
          <Shimmer className="h-80 rounded-xl" />
        </div>
      </SectionBlock>

      <Divider />

      <SectionBlock title="Your events">
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => <Shimmer key={i} className="h-16 rounded-xl" />)}
        </div>
      </SectionBlock>
    </div>
  );
}
