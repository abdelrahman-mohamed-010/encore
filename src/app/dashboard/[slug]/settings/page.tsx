import type { Metadata } from "next";
import { requireOrganizer } from "@/lib/auth";

import { OrganizerSettingsForm } from "@/components/dashboard/organizer-settings-form";
import { DashboardBody, DashboardHeader } from "@/components/dashboard/page-header";

export const metadata: Metadata = { title: "Settings" };

export default async function OrganizerSettingsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { organizer } = await requireOrganizer(slug, "admin");
  return (
    <>
      <DashboardHeader
        title="Settings"
        description="Your organization's public identity."
      />

      <DashboardBody className="max-w-2xl space-y-6">
      <OrganizerSettingsForm organizer={organizer} />
      </DashboardBody>
    </>
);
}
