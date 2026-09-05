import type { Metadata } from "next";
import { requireOrganizer } from "@/lib/auth";
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
    <div className="mx-auto max-w-2xl">
      <OrganizerSettingsForm organizer={organizer} />
    </div>
  );
}
