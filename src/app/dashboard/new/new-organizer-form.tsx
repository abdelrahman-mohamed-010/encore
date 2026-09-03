"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardFooter } from "@/components/ui/surface";
import { Field, Input, Textarea } from "@/components/ui/input";

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export function NewOrganizerForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [description, setDescription] = useState("");
  const [supportEmail, setSupportEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const effectiveSlug = slugTouched ? slug : slugify(name);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    if (name.trim().length < 2) return setError("Give your organization a name.");
    if (effectiveSlug.length < 2) return setError("The web address needs at least 2 characters.");

    setSaving(true);
    const supabase = createClient();
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) {
      setSaving(false);
      return setError("Your session expired. Sign in again.");
    }

    const { data, error } = await supabase
      .from("organizers")
      .insert({
        owner_id: auth.user.id,
        name: name.trim(),
        slug: effectiveSlug,
        description: description.trim() || null,
        support_email: supportEmail.trim() || null,
      })
      .select("slug")
      .single();

    setSaving(false);

    if (error) {
      setError(
        error.code === "23505"
          ? "That web address is already taken. Try another."
          : error.message,
      );
      return;
    }

    toast.success("Organization created");
    router.push(`/dashboard/${data.slug}`);
    router.refresh();
  }

  return (
    <form onSubmit={submit}>
      <Card>
        <CardBody className="space-y-5">
          <Field label="Organization name" htmlFor="name" required>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Cairo Live Nation"
              required
            />
          </Field>

          <Field
            label="Web address"
            htmlFor="slug"
            hint={`Your page will be tazkarti.app/organizers/${effectiveSlug || "your-org"}`}
          >
            <Input
              id="slug"
              value={effectiveSlug}
              onChange={(e) => {
                setSlugTouched(true);
                setSlug(slugify(e.target.value));
              }}
              placeholder="cairo-live-nation"
            />
          </Field>

          <Field label="Description" htmlFor="description" hint="Optional. Shown on your organizer page.">
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </Field>

          <Field label="Support email" htmlFor="supportEmail" hint="Where ticket holders can reach you." error={error}>
            <Input
              id="supportEmail"
              type="email"
              value={supportEmail}
              onChange={(e) => setSupportEmail(e.target.value)}
              placeholder="hello@example.com"
              aria-invalid={Boolean(error)}
            />
          </Field>
        </CardBody>

        <CardFooter className="justify-end">
          <Button type="submit" variant="solid" loading={saving}>
            Create organization
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}
