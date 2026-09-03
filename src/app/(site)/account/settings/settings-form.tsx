"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/surface";
import { Field, Input, Textarea } from "@/components/ui/input";
import { Avatar } from "@/components/ui/misc";
import type { Profile } from "@/lib/types";

export function SettingsForm({ profile }: { profile: Profile }) {
  const router = useRouter();
  const [fullName, setFullName] = useState(profile.full_name ?? "");
  const [phone, setPhone] = useState(profile.phone ?? "");
  const [bio, setBio] = useState(profile.bio ?? "");
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url ?? "");
  const [saving, setSaving] = useState(false);

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);

    const supabase = createClient();
    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: fullName.trim() || null,
        phone: phone.trim() || null,
        bio: bio.trim() || null,
        avatar_url: avatarUrl.trim() || null,
      })
      .eq("id", profile.id);

    setSaving(false);

    if (error) {
      toast.error("Could not save your profile", { description: error.message });
      return;
    }

    toast.success("Profile saved");
    router.refresh();
  }

  return (
    <form onSubmit={save}>
      <Card>
        <CardHeader bordered className="flex-col items-start">
          <CardTitle>Profile</CardTitle>
          <CardDescription>This is what organizers see on your bookings.</CardDescription>
        </CardHeader>

        <CardBody className="space-y-5">
          <div className="flex items-center gap-4">
            <Avatar src={avatarUrl || null} name={fullName || profile.email} size="xl" />
            <Field label="Avatar URL" htmlFor="avatarUrl" className="flex-1" hint="Paste a link to an image.">
              <Input
                id="avatarUrl"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                placeholder="https://…"
              />
            </Field>
          </div>

          <Field label="Full name" htmlFor="fullName">
            <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </Field>

          <Field label="Email" htmlFor="email" hint="Change your email from the security section of Supabase Auth.">
            <Input id="email" value={profile.email} disabled />
          </Field>

          <Field label="Phone" htmlFor="phone" hint="Optional. Used only for order support.">
            <Input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </Field>

          <Field label="Bio" htmlFor="bio">
            <Textarea id="bio" value={bio} onChange={(e) => setBio(e.target.value)} rows={3} />
          </Field>
        </CardBody>

        <CardFooter className="justify-end">
          <Button type="submit" variant="solid" loading={saving}>
            Save changes
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}
