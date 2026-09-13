"use client";

import { toast } from "sonner";
import { useAction } from "next-safe-action/hooks";
import { disconnectStripe } from "@/features/organizers/actions";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

export function DisconnectStripeButton({ organizerSlug }: { organizerSlug: string }) {
  const disconnect = useAction(disconnectStripe, {
    onSuccess: () => toast.success("Stripe disconnected"),
    onError: ({ error }) =>
      toast.error("Could not disconnect", { description: error.serverError }),
  });

  return (
    <ConfirmDialog
      trigger={
        <Button variant="ghost" size="sm">
          Disconnect
        </Button>
      }
      title="Disconnect Stripe?"
      description={
        <>
          New paid orders will fall back to the sandbox rail until you reconnect. Existing orders
          and payouts in Stripe are unaffected — this only removes the link between your Stripe
          account and this organization.
        </>
      }
      confirmLabel="Disconnect"
      onConfirm={async () => {
        await disconnect.executeAsync({ organizerSlug });
      }}
    />
  );
}
