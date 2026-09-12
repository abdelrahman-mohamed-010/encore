"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { SelectField } from "@/components/ui/select";
import type { UserRole } from "@/lib/types";

function update(id: string, patch: { role?: UserRole; is_banned?: boolean }) {
  return createClient().from("profiles").update(patch).eq("id", id);
}

export function RoleSelect({ id, email, role }: { id: string; email: string; role: UserRole }) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  return (
    <SelectField
      value={role}
      aria-label={`Role for ${email}`}
      size="sm"
      className="w-32"
      onChange={(value) =>
        startTransition(async () => {
          const { error } = await update(id, { role: value as UserRole });
          if (error) {
            toast.error("Could not update the user", { description: error.message });
            return;
          }
          toast.success("Role updated");
          router.refresh();
        })
      }
      options={[
        { value: "attendee", label: "Attendee" },
        { value: "organizer", label: "Organizer" },
        { value: "admin", label: "Admin" },
      ]}
    />
  );
}

export function BanToggleButton({ id, isBanned }: { id: string; isBanned: boolean }) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  async function toggle() {
    const { error } = await update(id, { is_banned: !isBanned });
    if (error) {
      toast.error("Could not update the user", { description: error.message });
      return;
    }
    toast.success(isBanned ? "User unbanned" : "User banned");
    router.refresh();
  }

  // Unbanning is restorative, not destructive — only banning needs a gate.
  if (isBanned) {
    return (
      <Button variant="ghost" size="xs" onClick={() => startTransition(toggle)}>
        Unban
      </Button>
    );
  }

  return (
    <ConfirmDialog
      trigger={
        <Button variant="ghost" size="xs">
          Ban
        </Button>
      }
      title="Ban this user?"
      description="They immediately lose the ability to sign in and use the app."
      confirmLabel="Ban user"
      onConfirm={toggle}
    />
  );
}
