"use client";

import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { useAsyncAction } from "@/hooks";
import { profileSchema, type ProfileData, type ProfileValues } from "@/lib/validation";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/surface";
import { Form, FormError, FormField } from "@/components/ui/form";
import { Input, Textarea } from "@/components/ui/input";
import { Avatar } from "@/components/ui/misc";
import type { Profile } from "@/lib/types";

export function SettingsForm({ profile }: { profile: Profile }) {
  const router = useRouter();

  const form = useForm<ProfileValues, unknown, ProfileData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: profile.full_name ?? "",
      phone: profile.phone ?? "",
      bio: profile.bio ?? "",
      avatarUrl: profile.avatar_url ?? "",
    },
  });

  const avatarUrl = useWatch({ control: form.control, name: "avatarUrl" });
  const fullName = useWatch({ control: form.control, name: "fullName" });

  const save = useAsyncAction(async (values: ProfileData) => {
    const { error } = await createClient()
      .from("profiles")
      .update({
        full_name: values.fullName || null,
        phone: values.phone || null,
        bio: values.bio || null,
        avatar_url: values.avatarUrl || null,
      })
      .eq("id", profile.id);

    if (error) throw new Error(error.message);
    toast.success("Profile saved");
    router.refresh();
  });

  return (
    <Form form={form} onSubmit={save.run}>
      <Card>
        <CardHeader bordered className="flex-col items-start">
          <CardTitle>Profile</CardTitle>
          <CardDescription>This is what organizers see on your bookings.</CardDescription>
        </CardHeader>

        <CardBody className="space-y-5">
          <div className="flex items-center gap-4">
            <Avatar src={avatarUrl || null} name={fullName || profile.email} size="xl" />
            <FormField<ProfileValues, "avatarUrl"> name="avatarUrl" label="Avatar URL" className="flex-1" hint="Paste a link to an image.">
              {(field) => <Input {...field} placeholder="https://…" />}
            </FormField>
          </div>

          <FormField<ProfileValues, "fullName"> name="fullName" label="Full name">
            {(field) => <Input {...field} />}
          </FormField>

          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-ink-2">Email</span>
            <Input value={profile.email} disabled readOnly />
          </div>

          <FormField<ProfileValues, "phone"> name="phone" label="Phone" hint="Optional. Used only for order support.">
            {(field) => <Input {...field} type="tel" />}
          </FormField>

          <FormField<ProfileValues, "bio"> name="bio" label="Bio">
            {(field) => <Textarea {...field} rows={3} />}
          </FormField>

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
