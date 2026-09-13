"use client";

import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import { removeTeamMember, setTeamMemberRole } from "@/features/team/actions";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { SelectField } from "@/components/ui/select";
import type { OrgMemberRole } from "@/lib/types";

export function TeamRoleSelect({
  organizerSlug,
  userId,
  email,
  role,
  canManageOwners,
}: {
  organizerSlug: string;
  userId: string;
  email: string;
  role: OrgMemberRole;
  canManageOwners: boolean;
}) {
  const change = useAction(setTeamMemberRole, {
    onSuccess: () => toast.success("Role updated"),
    onError: ({ error }) =>
      toast.error("Could not change the role", { description: error.serverError }),
  });

  return (
    <SelectField
      value={role}
      onChange={(value) =>
        change.execute({ organizerSlug, userId, role: value as OrgMemberRole })
      }
      aria-label={`Role for ${email}`}
      size="sm"
      className="w-32"
      disabled={role === "owner" && !canManageOwners}
      options={(["owner", "admin", "staff", "scanner"] as OrgMemberRole[])
        .filter((r) => r !== "owner" || canManageOwners || role === "owner")
        .map((r) => ({ value: r, label: r[0].toUpperCase() + r.slice(1) }))}
    />
  );
}

export function TeamRemoveButton({
  organizerSlug,
  userId,
  email,
}: {
  organizerSlug: string;
  userId: string;
  email: string;
}) {
  const remove = useAction(removeTeamMember, {
    onSuccess: () => toast.success("Removed from the team"),
    onError: ({ error }) =>
      toast.error("Could not remove them", { description: error.serverError }),
  });

  return (
    <ConfirmDialog
      trigger={
        <Button variant="ghost" size="icon-sm" aria-label={`Remove ${email}`}>
          <Trash2 className="size-4 text-ink-3 hover:text-critical" />
        </Button>
      }
      title={`Remove ${email}?`}
      description="They'll lose access to this organizer's dashboard immediately."
      confirmLabel="Remove"
      onConfirm={async () => {
        await remove.executeAsync({ organizerSlug, userId });
      }}
    />
  );
}
