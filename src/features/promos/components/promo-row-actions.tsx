"use client";

import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import { deletePromo, setPromoActive } from "@/features/promos/actions";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Switch } from "@/components/ui/input";

export function PromoRowActions({
  id,
  code,
  isActive,
  organizerSlug,
}: {
  id: string;
  code: string;
  isActive: boolean;
  organizerSlug: string;
}) {
  const toggle = useAction(setPromoActive, {
    onError: ({ error }) =>
      toast.error("Could not update the code", { description: error.serverError }),
  });

  const remove = useAction(deletePromo, {
    onSuccess: () => toast.success("Promo code deleted"),
    onError: ({ error }) =>
      toast.error("Could not delete the code", { description: error.serverError }),
  });

  return (
    <>
      <Switch
        checked={isActive}
        onCheckedChange={(next) => toggle.execute({ id, isActive: next, organizerSlug })}
        label={`Toggle ${code}`}
      />
      <ConfirmDialog
        trigger={
          <Button variant="ghost" size="icon-sm" aria-label={`Delete ${code}`}>
            <Trash2 />
          </Button>
        }
        title={`Delete ${code}?`}
        description="Buyers will no longer be able to redeem this code. This can't be undone."
        confirmLabel="Delete code"
        onConfirm={async () => {
          await remove.executeAsync({ id, organizerSlug });
        }}
      />
    </>
  );
}
