"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/surface";
import { Field, Input, Textarea } from "@/components/ui/input";
import { Avatar } from "@/components/ui/misc";
import type { Organizer } from "@/lib/types";

export function OrganizerSettingsForm({ organizer }: { organizer: Organizer }) {
  const router = useRouter();
  const [name, setName] = useState(organizer.name);
  const [description, setDescription] = useState(organizer.description ?? "");
  const [logoUrl, setLogoUrl] = useState(organizer.logo_url ?? "");
  const [website, setWebsite] = useState(organizer.website ?? "");
  const [supportEmail, setSupportEmail] = useState(organizer.support_email ?? "");
  const [saving, setSaving] = useState(false);

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);

    const supabase = createClient();
    const { error } = await supabase
      .from("organizers")
      .update({
        name: name.trim(),
        description: description.trim() || null,
        logo_url: logoUrl.trim() || null,
        website: website.trim() || null,
        support_email: supportEmail.trim() || null,
      })
      .eq("id", organizer.id);

    setSaving(false);

    if (error) {
      toast.error("Could not save", { description: error.message });
      return;
    }

    toast.success("Settings saved");
    router.refresh();
  }

  return (
    <form onSubmit={save}>
      <Card>
        <CardHeader bordered className="flex-col items-start">
          <CardTitle>Organization</CardTitle>
          <CardDescription>How your brand appears to ticket buyers.</CardDescription>
        </CardHeader>

        <CardBody className="space-y-5">
          <div className="flex items-center gap-4">
            <Avatar src={logoUrl || null} name={name} size="xl" />
            <Field label="Logo URL" htmlFor="logoUrl" className="flex-1">
              <Input id="logoUrl" value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} placeholder="https://…" />
            </Field>
          </div>

          <Field label="Name" htmlFor="orgName" required>
            <Input id="orgName" value={name} onChange={(e) => setName(e.target.value)} required />
          </Field>

          <Field label="Web address" htmlFor="orgSlug" hint="Changing this would break existing links, so it is fixed.">
            <Input id="orgSlug" value={organizer.slug} disabled />
          </Field>

          <Field label="Description" htmlFor="orgDescription">
            <Textarea id="orgDescription" rows={4} value={description} onChange={(e) => setDescription(e.target.value)} />
          </Field>

          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Website" htmlFor="orgWebsite">
              <Input id="orgWebsite" type="url" value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://…" />
            </Field>
            <Field label="Support email" htmlFor="orgSupport">
              <Input id="orgSupport" type="email" value={supportEmail} onChange={(e) => setSupportEmail(e.target.value)} />
            </Field>
          </div>
        </CardBody>

        <CardFooter className="justify-end">
          <Button type="submit" variant="solid" loading={saving}>Save changes</Button>
        </CardFooter>
      </Card>
    </form>
  );
}
