"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Heart } from "lucide-react";
import { toast } from "sonner";
import { setEventFavorited } from "@/features/account/actions";
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
      const result = await setEventFavorited({ eventId, favorited: next });
      if (result?.serverError) {
        setFavorited(!next);
        toast.error("Could not update saved events", { description: result.serverError });
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
