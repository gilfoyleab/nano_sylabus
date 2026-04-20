import { describe, expect, it } from "vitest";
import { resolveAccess } from "@/lib/access";

describe("resolveAccess", () => {
  it("redirects guests away from protected student routes", () => {
    expect(
      resolveAccess({
        pathname: "/app/chat",
        hasUser: false,
        onboarded: false,
        role: "student",
      }),
    ).toEqual({
      allow: false,
      redirectTo: "/login",
      includeNext: true,
    });
  });

  it("redirects non-onboarded students to onboarding", () => {
    expect(
      resolveAccess({
        pathname: "/app/notes",
        hasUser: true,
        onboarded: false,
        role: "student",
      }),
    ).toEqual({
      allow: false,
      redirectTo: "/onboarding",
      includeNext: false,
    });
  });

  it("blocks non-admin users from admin routes", () => {
    expect(
      resolveAccess({
        pathname: "/admin/payments",
        hasUser: true,
        onboarded: true,
        role: "student",
      }),
    ).toEqual({
      allow: false,
      redirectTo: "/app/chat",
      includeNext: false,
    });
  });

  it("allows admins into admin routes", () => {
    expect(
      resolveAccess({
        pathname: "/admin/payments",
        hasUser: true,
        onboarded: false,
        role: "admin",
      }),
    ).toEqual({ allow: true });
  });
});
