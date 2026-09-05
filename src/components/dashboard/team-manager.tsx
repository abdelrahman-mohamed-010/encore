"use client";

import { useState, useTransition, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Info, Search, Trash2, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { useAsyncAction } from "@/hooks";
import { teamMemberSchema, type TeamMemberData, type TeamMemberValues } from "@/lib/validation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/surface";
import {
  Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { SelectField } from "@/components/ui/select";
import { Form, FormError, FormField } from "@/components/ui/form";
import { Avatar, EmptyState } from "@/components/ui/misc";
import { TablePagination, useTablePagination } from "@/components/ui/table";
import type { OrgMemberRole } from "@/lib/types";

type Member = {
  userId: string;
  role: OrgMemberRole;
  fullName: string | null;
  email: string;
  avatarUrl: string | null;
};

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

export function TeamManager({
  organizerId,
  viewerRole,
  members,
}: {
  organizerId: string;
  viewerRole: OrgMemberRole;
  members: Member[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [roleInfoOpen, setRoleInfoOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [, startTransition] = useTransition();

  const canManageOwners = viewerRole === "owner";

  const form = useForm<TeamMemberValues, unknown, TeamMemberData>({
    resolver: zodResolver(teamMemberSchema),
    defaultValues: { email: "", role: "staff" },
  });

  const selectedRole = useWatch({ control: form.control, name: "role" });

  const filteredMembers = useMemo(() => {
    return members.filter((m) => {
      const q = query.toLowerCase().trim();
      const matchesQuery =
        !q ||
        (m.fullName && m.fullName.toLowerCase().includes(q)) ||
        m.email.toLowerCase().includes(q);
      const matchesRole = roleFilter === "all" || m.role === roleFilter;
      return matchesQuery && matchesRole;
    });
  }, [members, query, roleFilter]);

  const {
    paginatedItems,
    currentPage,
    totalPages,
    totalItems,
    pageSize,
    setPage,
    setPageSize,
  } = useTablePagination(filteredMembers, 10);

  const addMember = useAsyncAction(async (values: TeamMemberData) => {
    const supabase = createClient();

    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .ilike("email", values.email)
      .maybeSingle();

    if (!profile) {
      throw new Error(
        "Nobody with that email has a Tazkarti account yet. Ask them to sign up first.",
      );
    }

    const { error } = await supabase
      .from("organizer_members")
      .insert({ organizer_id: organizerId, user_id: profile.id, role: values.role });

    if (error) {
      throw new Error(
        error.code === "23505" ? "That person is already on the team." : error.message,
      );
    }

    toast.success("Team member added");
    setOpen(false);
    form.reset();
    router.refresh();
  });

  function changeRole(member: Member, next: OrgMemberRole) {
    startTransition(async () => {
      const supabase = createClient();
      const { error } = await supabase
        .from("organizer_members")
        .update({ role: next })
        .eq("organizer_id", organizerId)
        .eq("user_id", member.userId);

      if (error) {
        toast.error("Could not change the role", { description: error.message });
        return;
      }
      toast.success("Role updated");
      router.refresh();
    });
  }

  function removeMember(member: Member) {
    startTransition(async () => {
      const supabase = createClient();
      const { error } = await supabase
        .from("organizer_members")
        .delete()
        .eq("organizer_id", organizerId)
        .eq("user_id", member.userId);

      if (error) {
        toast.error("Could not remove them", { description: error.message });
        return;
      }
      toast.success("Removed from the team");
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      {/* Controls Bar matching Events, Orders, and Attendees */}
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

      {filteredMembers.length === 0 ? (
        <EmptyState
          icon={Search}
          title="No team members found"
          description={
            members.length === 0
              ? "Invite collaborators to help manage events, scan tickets, or view sales."
              : "Try adjusting your search or role filter."
          }
          action={
            members.length === 0 ? (
              <Button variant="solid" size="md" onClick={() => setOpen(true)}>
                <UserPlus /> Add member
              </Button>
            ) : undefined
          }
        />
      ) : (
        <Card className="overflow-x-auto">
          <table className="w-full min-w-[44rem] text-left text-sm">
            <thead>
              <tr className="border-b border-hairline text-2xs uppercase tracking-[0.06em] text-ink-3">
                <th scope="col" className="px-4 py-3 font-semibold">Member</th>
                <th scope="col" className="px-4 py-3 font-semibold">Email</th>
                <th scope="col" className="px-4 py-3 font-semibold">Role</th>
                <th scope="col" className="px-4 py-3 text-right" />
              </tr>
            </thead>
            <tbody>
              {paginatedItems.map((member) => (
                <tr
                  key={member.userId}
                  className="border-b border-hairline-soft transition-colors hover:bg-sunken/60 last:border-b-0"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar
                        src={member.avatarUrl}
                        name={member.fullName ?? member.email}
                        size="md"
                      />
                      <span className="font-medium text-ink">
                        {member.fullName ?? "Team member"}
                      </span>
                    </div>
                  </td>

                  <td className="whitespace-nowrap px-4 py-3 text-ink-2">
                    {member.email}
                  </td>

                  <td className="px-4 py-3">
                    <SelectField
                      value={member.role}
                      onChange={(value) => changeRole(member, value as OrgMemberRole)}
                      aria-label={`Role for ${member.email}`}
                      size="sm"
                      className="w-32"
                      disabled={member.role === "owner" && !canManageOwners}
                      options={(["owner", "admin", "staff", "scanner"] as OrgMemberRole[])
                        .filter((r) => r !== "owner" || canManageOwners || member.role === "owner")
                        .map((r) => ({ value: r, label: r[0].toUpperCase() + r.slice(1) }))}
                    />
                  </td>

                  <td className="px-4 py-3 text-right">
                    {!(member.role === "owner" && !canManageOwners) && (
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`Remove ${member.email}`}
                        onClick={() => removeMember(member)}
                      >
                        <Trash2 className="size-4 text-ink-3 hover:text-critical" />
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Table Pagination */}
          <TablePagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
          />
        </Card>
      )}

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
              <div
                key={role}
                className="rounded-xl border border-hairline/80 bg-sunken/40 p-3.5"
              >
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
              They need a Tazkarti account already — adding them grants access immediately.
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
