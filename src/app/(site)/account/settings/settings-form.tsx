"use client";

import * as React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowUp, Globe, Lock } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { useAsyncAction } from "@/hooks";
import { profileSchema, type ProfileData, type ProfileValues } from "@/lib/validation";
import { Button } from "@/components/ui/button";
import { Form, FormError, FormField } from "@/components/ui/form";
import { Input, Textarea, PrefixInput, Label } from "@/components/ui/input";
import type { Profile } from "@/lib/types";

function InstagramIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

function XIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width="1em" height="1em" fill="currentColor" {...props}>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function YoutubeIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width="1em" height="1em" fill="currentColor" {...props}>
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  );
}

function LinkedinIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width="1em" height="1em" fill="currentColor" {...props}>
      <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 8.76a1.68 1.68 0 1 0-.02-3.36 1.68 1.68 0 0 0 .02 3.36m1.39 9.74v-8.37H5.07v8.37h2.78z" />
    </svg>
  );
}

export function SettingsForm({ profile }: { profile: Profile }) {
  const router = useRouter();

  // Parse first and last names from profile.full_name
  const initialNameParts = (profile.full_name ?? "").trim().split(" ");
  const [firstName, setFirstName] = React.useState(initialNameParts[0] ?? "");
  const [lastName, setLastName] = React.useState(initialNameParts.slice(1).join(" ") ?? "");
  const [resettingPassword, setResettingPassword] = React.useState(false);

  const form = useForm<ProfileValues, unknown, ProfileData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: profile.full_name ?? "",
      phone: profile.phone ?? "",
      bio: profile.bio ?? "",
      avatarUrl: profile.avatar_url ?? "",
      website: profile.website ?? "",
      instagram: profile.instagram ?? "",
      twitter: profile.twitter ?? "",
      youtube: profile.youtube ?? "",
      linkedin: profile.linkedin ?? "",
    },
  });

  const avatarUrl = useWatch({ control: form.control, name: "avatarUrl" });

  const save = useAsyncAction(async (values: ProfileData) => {
    const combinedName = `${firstName} ${lastName}`.trim() || values.fullName || null;

    const { error } = await createClient()
      .from("profiles")
      .update({
        full_name: combinedName,
        phone: values.phone || null,
        bio: values.bio || null,
        avatar_url: values.avatarUrl || null,
        website: values.website || null,
        instagram: values.instagram || null,
        twitter: values.twitter || null,
        youtube: values.youtube || null,
        linkedin: values.linkedin || null,
      })
      .eq("id", profile.id);

    if (error) throw new Error(error.message);
    toast.success("Profile saved");
    router.refresh();
  });

  const handleSendPasswordReset = async () => {
    if (!profile.email) return;
    setResettingPassword(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.resetPasswordForEmail(profile.email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });
      if (error) throw error;
      toast.success(`Password reset link sent to ${profile.email}`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to send reset email";
      toast.error(message);
    } finally {
      setResettingPassword(false);
    }
  };

  return (
    <div className="space-y-12">
      <Form form={form} onSubmit={save.run} className="space-y-8">
        {/* Open Luma Profile Section - No Boxed Card */}
        <section className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-ink">Your Profile</h2>
            <p className="mt-1 text-sm text-ink-3">Manage your public information and presence on Tazkarti.</p>
          </div>

          <div className="grid gap-8 md:grid-cols-[1fr_auto]">
            {/* Form Inputs on the left */}
            <div className="space-y-5">
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="first-name">First Name</Label>
                  <Input
                    id="first-name"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="First name"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="last-name">Last Name</Label>
                  <Input
                    id="last-name"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Last name"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="profile-email">Email</Label>
                <Input
                  id="profile-email"
                  value={profile.email}
                  disabled
                  readOnly
                  className="cursor-not-allowed bg-sunken/40 text-ink-2"
                />
              </div>

              <FormField<ProfileValues, "phone">
                name="phone"
                label="Phone Number"
                hint="Used for event support and ticket updates."
              >
                {(field) => <Input {...field} type="tel" placeholder="+20 10 1234 5678" />}
              </FormField>

              <FormField<ProfileValues, "bio"> name="bio" label="Bio">
                {(field) => (
                  <Textarea
                    {...field}
                    rows={3}
                    placeholder="Share a little about your background and interests."
                  />
                )}
              </FormField>
            </div>

            {/* Profile Picture on the right */}
            <div className="flex flex-col items-center gap-3 sm:items-start md:pl-6">
              <Label>Profile Picture</Label>
              <AvatarUpload
                value={avatarUrl ?? ""}
                onChange={(url) => form.setValue("avatarUrl", url)}
                ownerId={profile.id}
                name={profile.full_name ?? profile.email}
              />
            </div>
          </div>

          {/* Social Links Grid with PrefixInputs */}
          <div className="space-y-3 pt-3">
            <Label>Social Links</Label>
            <div className="grid gap-3.5 sm:grid-cols-2">
              <PrefixInput
                icon={<InstagramIcon className="size-4" />}
                prefixText="instagram.com/"
                placeholder="username"
                {...form.register("instagram")}
              />
              <PrefixInput
                icon={<XIcon className="size-4" />}
                prefixText="x.com/"
                placeholder="username"
                {...form.register("twitter")}
              />
              <PrefixInput
                icon={<YoutubeIcon className="size-4" />}
                prefixText="youtube.com/@"
                placeholder="username"
                {...form.register("youtube")}
              />
              <PrefixInput
                icon={<LinkedinIcon className="size-4" />}
                prefixText="linkedin.com/in/"
                placeholder="handle"
                {...form.register("linkedin")}
              />
              <PrefixInput
                icon={<Globe className="size-4" />}
                placeholder="https://yourwebsite.com"
                className="sm:col-span-2"
                {...form.register("website")}
              />
            </div>
          </div>

          <FormError message={save.error} />

          {/* Luma Pill Save Button */}
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

      {/* Account Security - Open & Clean */}
      <section className="space-y-4 border-t border-hairline/80 pt-8">
        <div>
          <h3 className="text-xl font-bold tracking-tight text-ink">Security</h3>
          <p className="mt-1 text-sm text-ink-3">Manage your password and authentication.</p>
        </div>

        <div className="flex flex-col justify-between gap-4 rounded-2xl border border-hairline/70 bg-card/60 p-4.5 sm:flex-row sm:items-center">
          <div className="flex items-start gap-3.5">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-sunken text-ink-2">
              <Lock className="size-5" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-ink">Account Password</h4>
              <p className="text-xs text-ink-3">
                Send a secure reset link to <span className="font-medium text-ink">{profile.email}</span>
              </p>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleSendPasswordReset}
            disabled={resettingPassword}
            className="rounded-xl shrink-0"
          >
            {resettingPassword ? "Sending..." : "Reset Password"}
          </Button>
        </div>
      </section>
    </div>
  );
}

/** Circular avatar with upload badge */
function AvatarUpload({
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
      const path = `avatars/${ownerId}/${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("media").upload(path, file, {
        cacheControl: "31536000",
        upsert: false,
      });
      if (error) throw error;
      const { data } = supabase.storage.from("media").getPublicUrl(path);
      onChange(data.publicUrl);
      toast.success("Avatar uploaded");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to upload image";
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
      <div className="relative size-24 overflow-hidden rounded-full bg-gradient-to-tr from-[#a855f7] to-[#ec4899] shadow-e2 ring-4 ring-card md:size-28">
        {value ? (
          <Image src={value} alt="" fill className="object-cover" />
        ) : (
          <div className="flex size-full items-center justify-center text-3xl font-bold text-white">
            {name ? name.charAt(0).toUpperCase() : "U"}
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
        className="absolute bottom-0 right-0 grid size-8 place-items-center rounded-full bg-solid text-on-solid shadow-pop transition-transform group-hover:scale-110"
        title="Upload profile picture"
      >
        <ArrowUp className="size-4" />
      </button>
    </div>
  );
}

