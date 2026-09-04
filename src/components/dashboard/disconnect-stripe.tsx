"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";

export function DisconnectStripeButton({ organizerId }: { organizerId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [working, setWorking] = useState(false);

  async function disconnect() {
    setWorking(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("payment_accounts")
      .delete()
      .eq("organizer_id", organizerId);
    setWorking(false);

    if (error) {
      toast.error("Could not disconnect", { description: error.message });
      return;
    }

    toast.success("Stripe disconnected");
    setOpen(false);
    router.refresh();
  }

  return (
    <>
      <Button variant="ghost" size="sm" onClick={() => setOpen(true)}>
        Disconnect
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent size="sm">
          <DialogHeader>
            <DialogTitle>Disconnect Stripe?</DialogTitle>
            <DialogDescription>
              New paid orders will fall back to the sandbox rail until you reconnect.
            </DialogDescription>
          </DialogHeader>
          <DialogBody>
            <p className="text-sm leading-relaxed text-ink-2">
              Existing orders and payouts in Stripe are unaffected — this only removes the link
              between your Stripe account and this organization.
            </p>
          </DialogBody>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>Keep connected</Button>
            <Button variant="danger" loading={working} onClick={disconnect}>Disconnect</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
