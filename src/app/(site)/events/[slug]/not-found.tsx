import Link from "next/link";
import { Button } from "@/components/ui/button";

import { EmptyState } from "@/components/ui/empty-state";
import { CalendarX } from "lucide-react";

export default function EventNotFound() {
  return (
    <div className="container-narrow py-20">
      <EmptyState
        icon={CalendarX}
        title="We could not find that page"
        description="This event may have been unpublished, cancelled, or the link is out of date."
        action={
          <div className="flex gap-3">
            <Button asChild variant="solid" size="md">
              <Link href="/events">Discover events</Link>
            </Button>
            <Button asChild variant="outline" size="md">
              <Link href="/">Go home</Link>
            </Button>
          </div>
        }
      />
    </div>
  );
}
