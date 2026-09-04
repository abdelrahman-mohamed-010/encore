"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { UserPlus, X } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { useAsyncAction } from "@/hooks";
import { teamMemberSchema, type TeamMemberData, type TeamMemberValues } from "@/lib/validation";
import { Button } from "@/components/ui/button";
import { Card, SectionHeader } from "@/components/ui/surface";
import {
  Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { SelectField } from "@/components/ui/select";
import { Form, FormError, FormField } from "@/components/ui/form";
import { Avatar } from "@/components/ui/misc";
import type { OrgMemberRole } from "@/lib/types";

type Member = {
  userId: string;
  role: OrgMemberRole;
  fullName: string | null;
  email: string;
  avatarUrl: string | null;
};

const ROLE_HELP: Record<OrgMemberRole, string> = {
  owner: "Full control, including billing and deleting the organization.",
  admin: "Manage events, refunds, payouts and the team.",
  staff: "Create and edit events, view orders.",
  scanner: "Check people in at the door. No access to sales.",
};

export function TeamManager({
  organizerId,
  viewerRole,
  members,
}: {
  organizerId: string;
  viewerRole: OrgMemberRole;
  members: Member[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [, startTransition] = useTransition();

  const canManageOwners = viewerRole === "owner";

  const form = useForm<TeamMemberValues, unknown, TeamMemberData>({
    resolver: zodResolver(teamMemberSchema),
    defaultValues: { email: "", role: "staff" },
  });

  const selectedRole = useWatch({ control: form.control, name: "role" });

  const addMember = useAsyncAction(async (values: TeamMemberData) => {
    const supabase = createClient();

    // Profiles are publicly readable, so an existing account can be resolved by
    // email. There is no invite email in this build — the person must already
    // have signed up.
    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .ilike("email", values.email)
      .maybeSingle();

    if (!profile) {
      throw new Error(
        "Nobody with that email has a Tazkarti account yet. Ask them to sign up first.",
      );
    }

    const { error } = await supabase
      .from("organizer_members")
      .insert({ organizer_id: organizerId, user_id: profile.id, role: values.role });

    if (error) {
      throw new Error(
        error.code === "23505" ? "That person is already on the team." : error.message,
      );
    }

    toast.success("Team member added");
    setOpen(false);
    form.reset();
    router.refresh();
  });

  function changeRole(member: Member, next: OrgMemberRole) {
    startTransition(async () => {
      const supabase = createClient();
      const { error } = await supabase
        .from("organizer_members")
        .update({ role: next })
        .eq("organizer_id", organizerId)
        .eq("user_id", member.userId);

      if (error) {
        toast.error("Could not change the role", { description: error.message });
        return;
      }
      toast.success("Role updated");
      router.refresh();
    });
  }

  function removeMember(member: Member) {
    startTransition(async () => {
      const supabase = createClient();
      const { error } = await supabase
        .from("organizer_members")
        .delete()
        .eq("organizer_id", organizerId)
        .eq("user_id", member.userId);

      if (error) {
        toast.error("Could not remove them", { description: error.message });
        return;
      }
      toast.success("Removed from the team");
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <SectionHeader
        level={1}
        title="Team"
        description="Who can manage this organization, and what they can do."
        action={
          <Button variant="solid" size="md" onClick={() => setOpen(true)}>
            <UserPlus /> Add member
          </Button>
        }
      />

      <Card className="overflow-hidden">
        {members.map((member) => (
          <div
            key={member.userId}
            className="flex items-center gap-3.5 border-b border-hairline-soft px-4 py-3.5 last:border-b-0"
          >
            <Avatar src={member.avatarUrl} name={member.fullName ?? member.email} size="md" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-base font-medium text-ink">
                {member.fullName ?? "Team member"}
              </p>
              <p className="truncate text-xs text-ink-3">{member.email}</p>
            </div>

            <SelectField
              value={member.role}
              onChange={(value) => changeRole(member, value as OrgMemberRole)}
              aria-label={`Role for ${member.email}`}
              size="sm"
              className="w-32"
              disabled={member.role === "owner" && !canManageOwners}
              options={(["owner", "admin", "staff", "scanner"] as OrgMemberRole[])
                .filter((r) => r !== "owner" || canManageOwners || member.role === "owner")
                .map((r) => ({ value: r, label: r[0].toUpperCase() + r.slice(1) }))}
            />

            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={`Remove ${member.email}`}
              onClick={() => removeMember(member)}
            >
              <X />
            </Button>
          </div>
        ))}
      </Card>

      <Card inset className="p-4">
        <p className="mb-2 text-sm font-medium text-ink">What each role can do</p>
        <dl className="space-y-1.5 text-xs">
          {(Object.keys(ROLE_HELP) as OrgMemberRole[]).map((r) => (
            <div key={r} className="flex gap-2">
              <dt className="w-16 shrink-0 font-medium capitalize text-ink-2">{r}</dt>
              <dd className="text-ink-3">{ROLE_HELP[r]}</dd>
            </div>
          ))}
        </dl>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent size="sm">
          <DialogHeader>
            <DialogTitle>Add a team member</DialogTitle>
            <DialogDescription>
              They need a Tazkarti account already — adding them grants access immediately.
            </DialogDescription>
          </DialogHeader>

          <Form form={form} onSubmit={addMember.run}>
            <DialogBody className="space-y-4">
              <FormField<TeamMemberValues, "email"> name="email" label="Email" required>
                {(field) => <Input {...field} type="email" placeholder="teammate@example.com" />}
              </FormField>

              <FormField<TeamMemberValues, "role"> name="role" label="Role" hint={ROLE_HELP[selectedRole]}>
                {({ value, onChange, ...field }) => (
                  <SelectField
                    {...field}
                    value={value ?? "scanner"}
                    onChange={onChange}
                    options={[
                      { value: "scanner", label: "Scanner" },
                      { value: "staff", label: "Staff" },
                      { value: "admin", label: "Admin" },
                      ...(canManageOwners ? [{ value: "owner", label: "Owner" }] : []),
                    ]}
                  />
                )}
              </FormField>

              <FormError message={addMember.error} />
            </DialogBody>

            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" variant="solid" loading={form.formState.isSubmitting}>
                Add member
              </Button>
            </DialogFooter>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
