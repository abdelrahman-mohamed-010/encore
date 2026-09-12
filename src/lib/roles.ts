import type { OrgMemberRole } from "@/lib/types";

const ROLE_RANK: Record<OrgMemberRole, number> = {
  scanner: 0,
  staff: 1,
  admin: 2,
  owner: 3,
};

export function hasOrgRole(role: OrgMemberRole, minimum: OrgMemberRole) {
  return ROLE_RANK[role] >= ROLE_RANK[minimum];
}
