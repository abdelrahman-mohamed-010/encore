import type { Metadata } from "next";
import { requireOrganizer } from "@/lib/auth";
import { SectionHeader } from "@/components/ui/surface";
import { OrganizerSettingsForm } from "@/components/dashboard/organizer-settings-form";

export const metadata: Metadata = { title: "Settings" };

export default async function OrganizerSettingsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { organizer } = await requireOrganizer(slug, "admin");
  return (
    <div className="max-w-2xl space-y-6">
      <SectionHeader
        level={1}
        title="Settings"
        description="Your organization's public identity."
      />
      <OrganizerSettingsForm organizer={organizer} />
    </div>
  );
}
