"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Info, Search, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { addTeamMember } from "@/features/team/actions";
import { useAsyncAction, useDebouncedSearchParam } from "@/hooks";
import { teamMemberSchema, type TeamMemberData, type TeamMemberValues } from "@/lib/validation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/surface";
import {
  Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { SelectField } from "@/components/ui/select";
import { Form, FormError, FormField } from "@/components/ui/form";
import { TableRowsSkeleton } from "@/components/ui/table";
import type { OrgMemberRole } from "@/lib/types";

const ROLES: { role: OrgMemberRole; label: string; desc: string }[] = [
  {
    role: "owner",
    label: "Owner",
    desc: "Full control, including billing, payouts, deleting the organization, and managing owners.",
  },
  {
    role: "admin",
    label: "Admin",
    desc: "Manage events, refunds, payouts, promo codes, and the team.",
  },
  {
    role: "staff",
    label: "Staff",
    desc: "Create and edit events, view orders and attendee lists.",
  },
  {
    role: "scanner",
    label: "Scanner",
    desc: "Check people in at the door. No access to sales or financial reports.",
  },
];

const ROLE_HELP: Record<OrgMemberRole, string> = {
  owner: "Full control, including billing and deleting the organization.",
  admin: "Manage events, refunds, payouts and the team.",
  staff: "Create and edit events, view orders.",
  scanner: "Check people in at the door. No access to sales.",
};

// Matches team-rows.tsx's column count — kept as a literal so this client
// shell never pulls in that server-only component's module graph.
const TEAM_COLUMN_COUNT = 4;

/** Static shell: search, role filter, "Role info" / "Add member". Server-driven — never a skeleton itself. */
export function TeamShell({
  organizerSlug,
  viewerRole,
  children,
}: {
  organizerSlug: string;
  viewerRole: OrgMemberRole;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [open, setOpen] = React.useState(searchParams.get("new") === "1");
  const [roleInfoOpen, setRoleInfoOpen] = React.useState(false);
  const { value: query, onChange: setQuery } = useDebouncedSearchParam("q");
  const roleFilter = searchParams.get("role") ?? "all";

  const canManageOwners = viewerRole === "owner";

  function setRoleFilter(next: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (next === "all") params.delete("role");
    else params.set("role", next);
    params.delete("page");
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }

  const form = useForm<TeamMemberValues, unknown, TeamMemberData>({
    resolver: zodResolver(teamMemberSchema),
    defaultValues: { email: "", role: "staff" },
  });

  const selectedRole = useWatch({ control: form.control, name: "role" });

  const addMember = useAsyncAction(async (values: TeamMemberData) => {
    const result = await addTeamMember({ ...values, organizerSlug });
    if (result?.serverError) throw new Error(result.serverError);

    toast.success("Team member added");
    setOpen(false);
    form.reset();
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-wrap items-center gap-3">
          <div className="relative min-w-56 max-w-sm flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-3" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name or email..."
              className="pl-9"
              aria-label="Search team members"
            />
          </div>

          <SelectField
            value={roleFilter}
            onChange={setRoleFilter}
            aria-label="Filter by role"
            className="w-36"
            options={[
              { value: "all", label: "All roles" },
              { value: "owner", label: "Owner" },
              { value: "admin", label: "Admin" },
              { value: "staff", label: "Staff" },
              { value: "scanner", label: "Scanner" },
            ]}
          />
        </div>

        <div className="flex items-center gap-2.5">
          <Button variant="outline" size="md" onClick={() => setRoleInfoOpen(true)}>
            <Info className="size-4" /> Role info
          </Button>
          <Button variant="solid" size="md" onClick={() => setOpen(true)}>
            <UserPlus /> Add member
          </Button>
        </div>
      </div>

      <Card className="overflow-x-auto">
        <table className="table-stack w-full text-left text-sm sm:min-w-[44rem]">
          <thead>
            <tr className="border-b border-hairline text-2xs uppercase tracking-[0.06em] text-ink-3">
              <th scope="col" className="px-5 py-3.5 font-semibold">Member</th>
              <th scope="col" className="px-5 py-3.5 font-semibold">Email</th>
              <th scope="col" className="px-5 py-3.5 font-semibold">Role</th>
              <th scope="col" className="px-5 py-3.5 text-right" />
            </tr>
          </thead>
          <React.Suspense
            key={searchParams.toString()}
            fallback={<TableRowsSkeleton rows={5} columns={TEAM_COLUMN_COUNT} />}
          >
            {children}
          </React.Suspense>
        </table>
      </Card>

      {/* Role Info Modal */}
      <Dialog open={roleInfoOpen} onOpenChange={setRoleInfoOpen}>
        <DialogContent size="md">
          <DialogHeader>
            <DialogTitle>Team Roles & Permissions</DialogTitle>
            <DialogDescription>
              Understand what each role is permitted to view and manage in this organization.
            </DialogDescription>
          </DialogHeader>

          <DialogBody className="space-y-3">
            {ROLES.map(({ role, label, desc }) => (
              <div key={role} className="rounded-xl border border-hairline/80 bg-sunken/40 p-3.5">
                <h4 className="text-sm font-semibold text-ink">{label}</h4>
                <p className="mt-1 text-xs leading-relaxed text-ink-3">{desc}</p>
              </div>
            ))}
          </DialogBody>

          <DialogFooter>
            <Button variant="solid" size="md" onClick={() => setRoleInfoOpen(false)}>
              Got it
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Member Modal */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent size="sm">
          <DialogHeader>
            <DialogTitle>Add a team member</DialogTitle>
            <DialogDescription>
              They need an Encore account already — adding them grants access immediately.
            </DialogDescription>
          </DialogHeader>

          <Form form={form} onSubmit={addMember.run}>
            <DialogBody className="space-y-4">
              <FormField<TeamMemberValues, "email"> name="email" label="Email" required>
                {(field) => <Input {...field} type="email" placeholder="teammate@example.com" />}
              </FormField>

              <FormField<TeamMemberValues, "role"> name="role" label="Role" hint={ROLE_HELP[selectedRole]}>
                {({ value, onChange, ...field }) => (
                  <SelectField
                    {...field}
                    value={value ?? "scanner"}
                    onChange={onChange}
                    options={[
                      { value: "scanner", label: "Scanner" },
                      { value: "staff", label: "Staff" },
                      { value: "admin", label: "Admin" },
                      ...(canManageOwners ? [{ value: "owner", label: "Owner" }] : []),
                    ]}
                  />
                )}
              </FormField>

              <FormError message={addMember.error} />
            </DialogBody>

            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" variant="solid" loading={form.formState.isSubmitting}>
                Add member
              </Button>
            </DialogFooter>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
