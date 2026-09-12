"use client";

import { toast } from "sonner";
import { useAction } from "next-safe-action/hooks";
import { updateUser } from "@/features/admin/actions";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { SelectField } from "@/components/ui/select";
import type { UserRole } from "@/lib/types";

function useUpdateUser(successMessage: (input: { isBanned?: boolean }) => string) {
  return useAction(updateUser, {
    onSuccess: ({ input }) => toast.success(successMessage(input)),
    onError: ({ error }) =>
      toast.error("Could not update the user", { description: error.serverError }),
  });
}

export function RoleSelect({ id, email, role }: { id: string; email: string; role: UserRole }) {
  const update = useUpdateUser(() => "Role updated");

  return (
    <SelectField
      value={role}
      aria-label={`Role for ${email}`}
      size="sm"
      className="w-32"
      onChange={(value) => update.execute({ id, role: value as "attendee" | "organizer" | "admin" })}
      options={[
        { value: "attendee", label: "Attendee" },
        { value: "organizer", label: "Organizer" },
        { value: "admin", label: "Admin" },
      ]}
    />
  );
}

export function BanToggleButton({ id, isBanned }: { id: string; isBanned: boolean }) {
  const update = useUpdateUser((input) => (input.isBanned ? "User banned" : "User unbanned"));

  // Unbanning is restorative, not destructive — only banning needs a gate.
  if (isBanned) {
    return (
      <Button variant="ghost" size="xs" onClick={() => update.execute({ id, isBanned: false })}>
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
      onConfirm={async () => {
        await update.executeAsync({ id, isBanned: true });
      }}
    />
  );
}
