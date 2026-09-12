"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { SelectField } from "@/components/ui/select";
import type { OrgMemberRole } from "@/lib/types";

export function TeamRoleSelect({
  organizerId,
  userId,
  email,
  role,
  canManageOwners,
}: {
  organizerId: string;
  userId: string;
  email: string;
  role: OrgMemberRole;
  canManageOwners: boolean;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  return (
    <SelectField
      value={role}
      onChange={(value) =>
        startTransition(async () => {
          const supabase = createClient();
          const { error } = await supabase
            .from("organizer_members")
            .update({ role: value as OrgMemberRole })
            .eq("organizer_id", organizerId)
            .eq("user_id", userId);

          if (error) {
            toast.error("Could not change the role", { description: error.message });
            return;
          }
          toast.success("Role updated");
          router.refresh();
        })
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
  organizerId,
  userId,
  email,
}: {
  organizerId: string;
  userId: string;
  email: string;
}) {
  const router = useRouter();

  async function remove() {
    const supabase = createClient();
    const { error } = await supabase
      .from("organizer_members")
      .delete()
      .eq("organizer_id", organizerId)
      .eq("user_id", userId);

    if (error) {
      toast.error("Could not remove them", { description: error.message });
      return;
    }
    toast.success("Removed from the team");
    router.refresh();
  }

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
      onConfirm={remove}
    />
  );
}
