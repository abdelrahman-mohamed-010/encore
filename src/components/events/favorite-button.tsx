"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Heart } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function FavoriteButton({
  eventId,
  initialFavorited,
  signedIn,
}: {
  eventId: string;
  initialFavorited: boolean;
  signedIn: boolean;
}) {
  const router = useRouter();
  const [favorited, setFavorited] = useState(initialFavorited);
  const [pending, startTransition] = useTransition();

  function toggle() {
    if (!signedIn) {
      router.push("/auth/login");
      return;
    }

    // Optimistic: flip immediately, roll back if the write fails.
    const next = !favorited;
    setFavorited(next);

    startTransition(async () => {
      const supabase = createClient();
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) return;

      const { error } = next
        ? await supabase.from("favorites").insert({ event_id: eventId, user_id: auth.user.id })
        : await supabase.from("favorites").delete().eq("event_id", eventId).eq("user_id", auth.user.id);

      if (error) {
        setFavorited(!next);
        toast.error("Could not update saved events", { description: error.message });
      }
    });
  }

  return (
    <Button
      variant="outline"
      size="md"
      className="flex-1"
      onClick={toggle}
      disabled={pending}
      aria-pressed={favorited}
    >
      <Heart className={cn(favorited && "fill-critical text-critical")} />
      {favorited ? "Saved" : "Save"}
    </Button>
  );
}
