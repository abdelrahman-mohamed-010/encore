"use client";

import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { useAsyncAction } from "@/hooks";
import { organizerSchema, slugify, type OrganizerData, type OrganizerValues } from "@/lib/validation";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardFooter } from "@/components/ui/surface";
import { Form, FormError, FormField } from "@/components/ui/form";
import { Input, Textarea } from "@/components/ui/input";

export function NewOrganizerForm() {
  const router = useRouter();

  const form = useForm<OrganizerValues, unknown, OrganizerData>({
    resolver: zodResolver(organizerSchema),
    defaultValues: { name: "", slug: "", description: "", supportEmail: "", website: "", logoUrl: "" },
  });

  const slug = useWatch({ control: form.control, name: "slug" });

  const create = useAsyncAction(async (values: OrganizerData) => {
    const supabase = createClient();
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) throw new Error("Your session expired. Sign in again.");

    const { data, error } = await supabase
      .from("organizers")
      .insert({
        owner_id: auth.user.id,
        name: values.name,
        slug: values.slug,
        description: values.description || null,
        support_email: values.supportEmail || null,
      })
      .select("slug")
      .single();

    if (error) {
      throw new Error(
        error.code === "23505"
          ? "That web address is already taken. Try another."
          : error.message,
      );
    }

    toast.success("Organization created");
    router.push(`/dashboard/${data.slug}`);
    router.refresh();
  });

  return (
    <Form form={form} onSubmit={create.run}>
      <Card>
        <CardBody className="space-y-5">
          <FormField<OrganizerValues, "name"> name="name" label="Organization name" required>
            {(field) => (
              <Input
                {...field}
                placeholder="Cairo Live Nation"
                onChange={(e) => {
                  field.onChange(e);
                  // Suggest a web address until the organiser edits one themselves.
                  if (!form.getFieldState("slug").isDirty) {
                    form.setValue("slug", slugify(e.target.value));
                  }
                }}
              />
            )}
          </FormField>

          <FormField<OrganizerValues, "slug">
            name="slug"
            label="Web address"
            hint={`Your page will be /organizers/${slug || "your-org"}`}
          >
            {(field) => (
              <Input
                {...field}
                placeholder="cairo-live-nation"
                onChange={(e) => field.onChange(slugify(e.target.value))}
              />
            )}
          </FormField>

          <FormField<OrganizerValues, "description"> name="description" label="Description" hint="Optional. Shown on your organizer page.">
            {(field) => <Textarea {...field} rows={3} />}
          </FormField>

          <FormField<OrganizerValues, "supportEmail"> name="supportEmail" label="Support email" hint="Where ticket holders can reach you.">
            {(field) => <Input {...field} type="email" placeholder="hello@example.com" />}
          </FormField>

          <FormError message={create.error} />
        </CardBody>

        <CardFooter className="justify-end">
          <Button type="submit" variant="solid" loading={form.formState.isSubmitting}>
            Create organization
          </Button>
        </CardFooter>
      </Card>
    </Form>
  );
}
