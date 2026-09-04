"use client";

import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { useAsyncAction } from "@/hooks";
import { organizerSchema, type OrganizerData, type OrganizerValues } from "@/lib/validation";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/surface";
import { Form, FormError, FormField } from "@/components/ui/form";
import { Input, Textarea } from "@/components/ui/input";
import { Avatar } from "@/components/ui/misc";
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
  const name = useWatch({ control: form.control, name: "name" });

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
    toast.success("Settings saved");
    router.refresh();
  });

  return (
    <Form form={form} onSubmit={save.run}>
      <Card>
        <CardHeader bordered className="flex-col items-start">
          <CardTitle>Organization</CardTitle>
          <CardDescription>How your brand appears to ticket buyers.</CardDescription>
        </CardHeader>

        <CardBody className="space-y-5">
          <div className="flex items-center gap-4">
            <Avatar src={logoUrl || null} name={name} size="xl" />
            <FormField<OrganizerValues, "logoUrl"> name="logoUrl" label="Logo URL" className="flex-1">
              {(field) => <Input {...field} placeholder="https://…" />}
            </FormField>
          </div>

          <FormField<OrganizerValues, "name"> name="name" label="Name" required>
            {(field) => <Input {...field} />}
          </FormField>

          <div className="flex flex-col gap-1.5">
            <span className="text-[13px] font-medium text-ink-2">Web address</span>
            <Input value={organizer.slug} disabled readOnly />
            <p className="text-[12px] text-ink-3">
              Fixed — changing it would break every existing link to your events.
            </p>
          </div>

          <FormField<OrganizerValues, "description"> name="description" label="Description">
            {(field) => <Textarea {...field} rows={4} />}
          </FormField>

          <div className="grid gap-5 sm:grid-cols-2">
            <FormField<OrganizerValues, "website"> name="website" label="Website">
              {(field) => <Input {...field} type="url" placeholder="https://…" />}
            </FormField>
            <FormField<OrganizerValues, "supportEmail"> name="supportEmail" label="Support email">
              {(field) => <Input {...field} type="email" />}
            </FormField>
          </div>

          <FormError message={save.error} />
        </CardBody>

        <CardFooter className="justify-end">
          <Button type="submit" variant="solid" loading={form.formState.isSubmitting}>
            Save changes
          </Button>
        </CardFooter>
      </Card>
    </Form>
  );
}
