"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Switch } from "@/components/ui/input";

export function PromoRowActions({
  id,
  code,
  isActive,
}: {
  id: string;
  code: string;
  isActive: boolean;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  function toggleActive() {
    startTransition(async () => {
      const supabase = createClient();
      const { error } = await supabase.from("promo_codes").update({ is_active: !isActive }).eq("id", id);
      if (error) {
        toast.error("Could not update the code", { description: error.message });
        return;
      }
      router.refresh();
    });
  }

  async function remove() {
    const supabase = createClient();
    const { error } = await supabase.from("promo_codes").delete().eq("id", id);
    if (error) {
      toast.error("Could not delete the code", { description: error.message });
      return;
    }
    toast.success("Promo code deleted");
    router.refresh();
  }

  return (
    <>
      <Switch checked={isActive} onCheckedChange={toggleActive} label={`Toggle ${code}`} />
      <ConfirmDialog
        trigger={
          <Button variant="ghost" size="icon-sm" aria-label={`Delete ${code}`}>
            <Trash2 />
          </Button>
        }
        title={`Delete ${code}?`}
        description="Buyers will no longer be able to redeem this code. This can't be undone."
        confirmLabel="Delete code"
        onConfirm={remove}
      />
    </>
  );
}
