"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowUp, CreditCard } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { useAsyncAction } from "@/hooks";
import { organizerSchema, type OrganizerData, type OrganizerValues } from "@/lib/validation";
import { Button } from "@/components/ui/button";
import { Form, FormError, FormField } from "@/components/ui/form";
import { Input, Textarea, Label } from "@/components/ui/input";
import type { Organizer } from "@/lib/types";

export function OrganizerSettingsForm({ organizer }: { organizer: Organizer }) {
  const router = useRouter();

  const form = useForm<OrganizerValues, unknown, OrganizerData>({
    resolver: zodResolver(organizerSchema),
    defaultValues: {
      name: organizer.name,
      slug: organizer.slug,
      description: organizer.description ?? "",
      supportEmail: organizer.support_email ?? "",
      website: organizer.website ?? "",
      logoUrl: organizer.logo_url ?? "",
    },
  });

  const logoUrl = useWatch({ control: form.control, name: "logoUrl" });

  const save = useAsyncAction(async (values: OrganizerData) => {
    const { error } = await createClient()
      .from("organizers")
      .update({
        name: values.name,
        description: values.description || null,
        logo_url: values.logoUrl || null,
        website: values.website || null,
        support_email: values.supportEmail || null,
      })
      .eq("id", organizer.id);

    if (error) throw new Error(error.message);
    toast.success("Organization settings saved");
    router.refresh();
  });

  return (
    <div className="space-y-12">
      <Form form={form} onSubmit={save.run} className="space-y-8">
        {/* Unboxed Organization Profile Section matching Account Settings */}
        <section className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-ink">Organization Profile</h2>
            <p className="mt-1 text-sm text-ink-3">
              Manage your organization&apos;s public branding, contact info, and presence.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-[1fr_auto]">
            {/* Form Inputs on the left */}
            <div className="space-y-5">
              <FormField<OrganizerValues, "name"> name="name" label="Organization Name" required>
                {(field) => <Input {...field} placeholder="e.g. Cairo Live Nation" />}
              </FormField>

              <div className="flex flex-col gap-2">
                <Label htmlFor="web-address">Web Address</Label>
                <Input
                  id="web-address"
                  value={`/organizers/${organizer.slug}`}
                  disabled
                  readOnly
                  className="cursor-not-allowed bg-sunken/40 text-ink-2"
                />
                <p className="text-xs text-ink-3">
                  Fixed web address to ensure existing event links and QR codes remain permanent.
                </p>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <FormField<OrganizerValues, "supportEmail">
                  name="supportEmail"
                  label="Support Email"
                  hint="Where ticket buyers reach you."
                >
                  {(field) => <Input {...field} type="email" placeholder="support@example.com" />}
                </FormField>

                <FormField<OrganizerValues, "website">
                  name="website"
                  label="Official Website"
                >
                  {(field) => <Input {...field} type="url" placeholder="https://example.com" />}
                </FormField>
              </div>

              <FormField<OrganizerValues, "description">
                name="description"
                label="About & Bio"
                hint="Shown on your public profile."
              >
                {(field) => (
                  <Textarea
                    {...field}
                    rows={4}
                    placeholder="Tell attendees about your promoter brand, venue, or upcoming series..."
                  />
                )}
              </FormField>
            </div>

            {/* Logo upload on the right */}
            <div className="flex flex-col items-center gap-3 sm:items-start md:pl-6">
              <Label>Organization Logo</Label>
              <LogoUpload
                value={logoUrl ?? ""}
                onChange={(url) => form.setValue("logoUrl", url)}
                ownerId={organizer.id}
                name={organizer.name}
              />
            </div>
          </div>

          <FormError message={save.error} />

          <div className="pt-2">
            <Button
              type="submit"
              variant="solid"
              size="lg"
              loading={form.formState.isSubmitting}
              className="rounded-xl px-8 font-medium shadow-xs hover:opacity-90"
            >
              Save Changes
            </Button>
          </div>
        </section>
      </Form>

      {/* Payouts Section matching Account Security card style */}
      <section className="space-y-4 border-t border-hairline/80 pt-8">
        <div>
          <h3 className="text-xl font-bold tracking-tight text-ink">Payouts & Stripe</h3>
          <p className="mt-1 text-sm text-ink-3">Manage bank account connections and payout schedules.</p>
        </div>

        <div className="flex flex-col justify-between gap-4 rounded-2xl border border-hairline/70 bg-card/60 p-4.5 sm:flex-row sm:items-center">
          <div className="flex items-start gap-3.5">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-sunken text-ink-2">
              <CreditCard className="size-5" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-ink">Stripe Connect</h4>
              <p className="text-xs text-ink-3">
                Securely process ticket credit cards and receive automatic payouts directly to your bank account.
              </p>
            </div>
          </div>

          <Button asChild variant="outline" size="sm" className="rounded-xl shrink-0">
            <Link href={`/dashboard/${organizer.slug}/settings/payments`}>
              Configure Payouts
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}

function LogoUpload({
  value,
  onChange,
  ownerId,
  name,
}: {
  value: string;
  onChange: (url: string) => void;
  ownerId: string;
  name: string;
}) {
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = React.useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5MB");
      return;
    }
    setUploading(true);
    try {
      const supabase = createClient();
      const ext = file.name.split(".").pop() ?? "jpg";
      const path = `organizers/${ownerId}/${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("media").upload(path, file, {
        cacheControl: "31536000",
        upsert: false,
      });
      if (error) throw error;
      const { data } = supabase.storage.from("media").getPublicUrl(path);
      onChange(data.publicUrl);
      toast.success("Logo uploaded");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to upload logo";
      toast.error(message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="group relative cursor-pointer" onClick={() => fileInputRef.current?.click()}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
        disabled={uploading}
      />
      <div className="relative size-24 overflow-hidden rounded-2xl border border-hairline bg-sunken shadow-e1 md:size-28">
        {value ? (
          <Image src={value} alt="" fill className="object-cover" />
        ) : (
          <div className="flex size-full items-center justify-center text-3xl font-bold text-ink-3">
            {name ? name.charAt(0).toUpperCase() : "O"}
          </div>
        )}
        {uploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 text-xs font-semibold text-white">
            Uploading...
          </div>
        )}
      </div>
      <button
        type="button"
        className="absolute -bottom-1 -right-1 grid size-8 place-items-center rounded-full bg-solid text-on-solid shadow-pop transition-transform group-hover:scale-110"
        title="Upload organization logo"
      >
        <ArrowUp className="size-4" />
      </button>
    </div>
  );
}
