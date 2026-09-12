"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

export function DisconnectStripeButton({ organizerId }: { organizerId: string }) {
  const router = useRouter();

  async function disconnect() {
    const supabase = createClient();
    const { error } = await supabase
      .from("payment_accounts")
      .delete()
      .eq("organizer_id", organizerId);

    if (error) {
      toast.error("Could not disconnect", { description: error.message });
      return;
    }

    toast.success("Stripe disconnected");
    router.refresh();
  }

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
      onConfirm={disconnect}
    />
  );
}
