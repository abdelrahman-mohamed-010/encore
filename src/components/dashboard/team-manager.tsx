"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { UserPlus, X } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, SectionHeader } from "@/components/ui/surface";
import {
  Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Field, Input, Select } from "@/components/ui/input";
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
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<OrgMemberRole>("staff");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [, startTransition] = useTransition();

  const canManageOwners = viewerRole === "owner";

  async function addMember() {
    setError(null);
    const trimmed = email.trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(trimmed)) return setError("Enter a valid email address.");

    setSaving(true);
    const supabase = createClient();

    // Profiles are publicly readable, so we can resolve an existing account by
    // email. There is no invite email in this build — the person must already
    // have signed up.
    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .ilike("email", trimmed)
      .maybeSingle();

    if (!profile) {
      setSaving(false);
      setError("Nobody with that email has a Tazkarti account yet. Ask them to sign up first.");
      return;
    }

    const { error: writeError } = await supabase
      .from("organizer_members")
      .insert({ organizer_id: organizerId, user_id: profile.id, role });

    setSaving(false);

    if (writeError) {
      setError(
        writeError.code === "23505" ? "That person is already on the team." : writeError.message,
      );
      return;
    }

    toast.success("Team member added");
    setOpen(false);
    setEmail("");
    router.refresh();
  }

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
              <p className="truncate text-[14px] font-medium text-ink">
                {member.fullName ?? "Team member"}
              </p>
              <p className="truncate text-[12.5px] text-ink-3">{member.email}</p>
            </div>

            <Select
              value={member.role}
              onChange={(e) => changeRole(member, e.target.value as OrgMemberRole)}
              aria-label={`Role for ${member.email}`}
              className="h-9 w-32 text-[13px]"
              disabled={member.role === "owner" && !canManageOwners}
            >
              {(["owner", "admin", "staff", "scanner"] as OrgMemberRole[])
                .filter((r) => r !== "owner" || canManageOwners || member.role === "owner")
                .map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
            </Select>

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
        <p className="mb-2 text-[13px] font-medium text-ink">What each role can do</p>
        <dl className="space-y-1.5 text-[12.5px]">
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

          <DialogBody className="space-y-4">
            <Field label="Email" htmlFor="memberEmail" required>
              <Input
                id="memberEmail"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="teammate@example.com"
              />
            </Field>

            <Field label="Role" htmlFor="memberRole" hint={ROLE_HELP[role]} error={error}>
              <Select
                id="memberRole"
                value={role}
                onChange={(e) => setRole(e.target.value as OrgMemberRole)}
              >
                <option value="scanner">Scanner</option>
                <option value="staff">Staff</option>
                <option value="admin">Admin</option>
                {canManageOwners && <option value="owner">Owner</option>}
              </Select>
            </Field>
          </DialogBody>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button variant="solid" loading={saving} onClick={addMember}>Add member</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
