"use client";

import * as React from "react";
import { Building2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

import { EmptyState } from "@/components/ui/empty-state";
import { NewOrganizationModal } from "@/features/organizers/components/new-organization-modal";

export function DashboardEmptyState({ autoOpen = false }: { autoOpen?: boolean }) {
  const [open, setOpen] = React.useState(autoOpen);

  return (
    <div className="container-page py-16">
      <div className="mx-auto max-w-xl text-center">
        <EmptyState
          icon={Building2}
          title="You are not part of an organization yet"
          description="Create an organization to start publishing events, customizing your venue seat plans, and selling tickets."
          action={
            <Button variant="solid" size="md" onClick={() => setOpen(true)}>
              <Plus /> Create an organization
            </Button>
          }
        />
      </div>

      <NewOrganizationModal open={open} onOpenChange={setOpen} />
    </div>
  );
}
