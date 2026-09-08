import type { Metadata } from "next";
import { requireProfile } from "@/lib/auth";
import { SettingsForm } from "./settings-form";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const profile = await requireProfile();
  return (
    <div className="max-w-2xl">
      <SettingsForm profile={profile} />
    </div>
  );
}
