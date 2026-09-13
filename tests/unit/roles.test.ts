import { describe, expect, it } from "vitest";
import { hasOrgRole } from "@/lib/roles";
import type { OrgMemberRole } from "@/lib/types";

const ROLES: OrgMemberRole[] = ["scanner", "staff", "admin", "owner"];

describe("hasOrgRole", () => {
  it("lets every role satisfy its own minimum", () => {
    for (const role of ROLES) {
      expect(hasOrgRole(role, role)).toBe(true);
    }
  });

  it("orders the ladder scanner < staff < admin < owner", () => {
    ROLES.forEach((role, index) => {
      ROLES.slice(0, index).forEach((lower) => expect(hasOrgRole(role, lower)).toBe(true));
      ROLES.slice(index + 1).forEach((higher) => expect(hasOrgRole(role, higher)).toBe(false));
    });
  });

  it("refuses a scanner everything above scanning", () => {
    expect(hasOrgRole("scanner", "staff")).toBe(false);
    expect(hasOrgRole("scanner", "admin")).toBe(false);
    expect(hasOrgRole("scanner", "owner")).toBe(false);
  });

  it("lets an owner do anything", () => {
    for (const minimum of ROLES) {
      expect(hasOrgRole("owner", minimum)).toBe(true);
    }
  });

  it("does not let an admin act as an owner", () => {
    expect(hasOrgRole("admin", "owner")).toBe(false);
  });
});
