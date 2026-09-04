"use client";

import { createContext, useContext, useMemo } from "react";
import type { MembershipWithOrganizer } from "@/lib/auth";
import type { OrgMemberRole, Profile } from "@/lib/types";

type SessionValue = {
  profile: Profile | null;
  memberships: MembershipWithOrganizer[];
  isSignedIn: boolean;
  isAdmin: boolean;
  /** The caller's role in a given tenant, or null when they are not a member. */
  roleIn: (organizerSlug: string) => OrgMemberRole | null;
  /** Whether they hold at least `minimum` in that tenant. */
  canIn: (organizerSlug: string, minimum: OrgMemberRole) => boolean;
};

const RANK: Record<OrgMemberRole, number> = { scanner: 0, staff: 1, admin: 2, owner: 3 };

const SessionContext = createContext<SessionValue>({
  profile: null,
  memberships: [],
  isSignedIn: false,
  isAdmin: false,
  roleIn: () => null,
  canIn: () => false,
});

/**
 * The signed-in user, resolved once on the server and shared with every client
 * component below it. Before this, each island that needed the profile or the
 * caller's tenant role fetched it again on mount.
 */
export function SessionProvider({
  profile,
  memberships,
  children,
}: {
  profile: Profile | null;
  memberships: MembershipWithOrganizer[];
  children: React.ReactNode;
}) {
  const value = useMemo<SessionValue>(() => {
    const bySlug = new Map(memberships.map((m) => [m.organizer.slug, m.role]));
    const roleIn = (slug: string) => bySlug.get(slug) ?? null;

    return {
      profile,
      memberships,
      isSignedIn: Boolean(profile),
      isAdmin: profile?.role === "admin",
      roleIn,
      canIn: (slug, minimum) => {
        const role = roleIn(slug);
        return role !== null && RANK[role] >= RANK[minimum];
      },
    };
  }, [profile, memberships]);

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export const useSession = () => useContext(SessionContext);
