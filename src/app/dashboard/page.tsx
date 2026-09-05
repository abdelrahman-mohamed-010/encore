import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getMyOrganizers, requireUser } from "@/lib/auth";
import { DashboardEmptyState } from "@/components/dashboard/dashboard-empty-state";

export const metadata: Metadata = { title: "Dashboard" };

type Props = {
  searchParams: Promise<{ new?: string; newOrg?: string }>;
};

export default async function DashboardIndex({ searchParams }: Props) {
  await requireUser();
  const [memberships, params] = await Promise.all([getMyOrganizers(), searchParams]);

  // If user has any organization, redirect directly into it.
  // There is no separate organization list page.
  if (memberships.length >= 1) {
    const query = params.new === "true" || params.newOrg === "true" ? "?newOrg=true" : "";
    redirect(`/dashboard/${memberships[0].organizer.slug}${query}`);
  }

  return (
    <DashboardEmptyState
      autoOpen={params.new === "true" || params.newOrg === "true"}
    />
  );
}
