import { SettingsRow } from "@/components/ui/settings-row";
import { Lock } from "lucide-react";
import { Label } from "@/components/ui/input";
import { Shimmer } from "@/components/ui/skeleton";

/** Mirrors settings-form.tsx exactly — labels/headings are static, so only the
 *  data-dependent controls (inputs, avatar, the reset-password row) shimmer. */
export default function Loading() {
  return (
    <div className="max-w-2xl space-y-12">
      <div className="space-y-8">
        <section className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-ink">Your Profile</h2>
            <p className="mt-1 text-sm text-ink-3">Manage your public information and presence on Encore.</p>
          </div>

          <div className="grid gap-8 md:grid-cols-[1fr_auto]">
            <div className="space-y-5">
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <Label>First Name</Label>
                  <Shimmer className="h-(--size-field) rounded-md" />
                </div>
                <div className="flex flex-col gap-2">
                  <Label>Last Name</Label>
                  <Shimmer className="h-(--size-field) rounded-md" />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <Label>Email</Label>
                <Shimmer className="h-(--size-field) rounded-md" />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label>Phone Number</Label>
                <Shimmer className="h-(--size-field) rounded-md" />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label>Bio</Label>
                <Shimmer className="h-20 rounded-md" />
              </div>
            </div>

            <div className="flex flex-col items-center gap-3 sm:items-start md:pl-6">
              <Label>Profile Picture</Label>
              <Shimmer className="size-24 rounded-full md:size-28" />
            </div>
          </div>

          <div className="flex flex-col gap-2.5 pt-3">
            <Label className="block">Social Links</Label>
            <div className="grid gap-3.5 sm:grid-cols-2">
              <Shimmer className="h-(--size-field) rounded-md" />
              <Shimmer className="h-(--size-field) rounded-md" />
              <Shimmer className="h-(--size-field) rounded-md" />
              <Shimmer className="h-(--size-field) rounded-md" />
              <Shimmer className="h-(--size-field) rounded-md sm:col-span-2" />
            </div>
          </div>

          <div className="pt-2">
            <Shimmer className="h-12 w-36 rounded-xl" />
          </div>
        </section>
      </div>

      <section className="space-y-4 border-t border-hairline/80 pt-8">
        <div>
          <h3 className="text-xl font-bold tracking-tight text-ink">Security</h3>
          <p className="mt-1 text-sm text-ink-3">Manage your password and authentication.</p>
        </div>

        <SettingsRow
          icon={Lock}
          title="Account Password"
          description={<Shimmer className="h-4 w-48 rounded" />}
          action={<Shimmer className="h-8 w-32 shrink-0 rounded-xl" />}
        />
      </section>
    </div>
  );
}
