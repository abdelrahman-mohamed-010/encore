import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { NewOrganizerForm } from "./new-organizer-form";

export const metadata: Metadata = { title: "Create an organization" };

export default async function NewOrganizerPage() {
  await requireUser();

  return (
    <div className="container-page py-12">
      <div className="mx-auto max-w-lg">
        <Link
          href="/dashboard"
          className="mb-6 inline-flex items-center gap-1.5 text-[13px] text-ink-3 transition-colors hover:text-ink"
        >
          <ArrowLeft className="size-3.5" />
          Dashboard
        </Link>

        <h1 className="display-2 text-ink">Create an organization</h1>
        <p className="mt-2 text-[15px] leading-relaxed text-ink-2">
          This is the brand buyers see on your events. You can connect Stripe and invite your team
          once it exists.
        </p>

        <div className="mt-8">
          <NewOrganizerForm />
        </div>
      </div>
    </div>
  );
}
