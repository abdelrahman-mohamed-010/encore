import Link from "next/link";
import { Suspense } from "react";
import type { Metadata } from "next";
import { ArrowUpRight, Megaphone, QrCode, Share2 } from "lucide-react";
import { getOrganizerOverview } from "@/features/dashboard/queries";
import { requireOrganizer } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Divider } from "@/components/ui/surface";
import { Shimmer } from "@/components/ui/skeleton";
import { QuickAction, SectionBlock } from "@/components/dashboard/tiles";
import {
  PaymentBanner,
  RecentEventsSection,
  SalesSection,
  StatsSection,
} from "./overview-sections";

export const metadata: Metadata = { title: "Overview" };

export default async function DashboardOverview({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { organizer } = await requireOrganizer(slug, "scanner");
  const {
    stats: statsPromise,
    series: seriesPromise,
    events: eventsPromise,
    account: accountPromise,
  } = await getOrganizerOverview(organizer.id);

  return (
    <div className="space-y-8">
      {/* The three things an organizer does between sessions — no data dependency, never a skeleton. */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <QuickAction
          icon={Megaphone}
          tone="blue"
          label="Invite guests"
          value="Share the event page"
          href={`/dashboard/${slug}/events`}
        />
        <QuickAction
          icon={QrCode}
          tone="violet"
          label="Check in"
          value="Scan at the door"
          href={`/dashboard/${slug}/scan`}
        />
        <QuickAction
          icon={Share2}
          tone="pink"
          label="Public page"
          value={`/organizers/${organizer.slug}`}
          href={`/organizers/${organizer.slug}`}
        />
      </div>

      <Suspense fallback={null}>
        <PaymentBanner accountPromise={accountPromise} slug={slug} />
      </Suspense>

      <Suspense
        fallback={
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => <Shimmer key={i} className="h-24 rounded-xl" />)}
          </div>
        }
      >
        <StatsSection statsPromise={statsPromise} />
      </Suspense>

      <Divider />

      <SectionBlock title="Sales" description="Gross revenue and tickets issued, last 14 days.">
        <Suspense
          fallback={
            <div className="grid gap-5 lg:grid-cols-2">
              <Shimmer className="h-80 rounded-xl" />
              <Shimmer className="h-80 rounded-xl" />
            </div>
          }
        >
          <SalesSection statsPromise={statsPromise} seriesPromise={seriesPromise} />
        </Suspense>
      </SectionBlock>

      <Divider />

      <SectionBlock
        title="Your events"
        action={
          <Button asChild variant="soft" size="sm">
            <Link href={`/dashboard/${slug}/events`}>
              All events <ArrowUpRight />
            </Link>
          </Button>
        }
      >
        <Suspense
          fallback={
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => <Shimmer key={i} className="h-16 rounded-xl" />)}
            </div>
          }
        >
          <RecentEventsSection eventsPromise={eventsPromise} slug={slug} organizerId={organizer.id} />
        </Suspense>
      </SectionBlock>
    </div>
  );
}
