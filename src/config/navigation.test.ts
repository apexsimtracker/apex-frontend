import { describe, expect, it } from "vitest";
import {
  footerCompanyLinks,
  getAccountMenuItemsForUser,
  getFooterLegalLinks,
  getFooterProductLinks,
  getLogSessionMenuItems,
  getPrimaryNavItems,
} from "./navigation";

describe("getPrimaryNavItems", () => {
  it("hides authenticated-only links for guests", () => {
    const paths = getPrimaryNavItems(false).map((item) => item.to);
    expect(paths).not.toContain("/sessions");
    expect(paths).toContain("/pricing");
  });

  it("includes authenticated-only links when signed in", () => {
    expect(getPrimaryNavItems(true).map((item) => item.to)).toContain(
      "/sessions",
    );
  });
});

describe("company and legal links (mobile drawer sections)", () => {
  it("exposes the public company pages", () => {
    expect(footerCompanyLinks.map((link) => link.to)).toEqual([
      "/about",
      "/faq",
      "/contact",
    ]);
  });

  it("includes EULA on web and in the native shell", () => {
    expect(getFooterLegalLinks(false).map((link) => link.to)).toContain(
      "/eula",
    );
    expect(getFooterLegalLinks(true).map((link) => link.to)).toContain("/eula");
  });

  it("hides the desktop agent download in the native shell", () => {
    expect(getFooterProductLinks(true).map((link) => link.to)).not.toContain(
      "/agent",
    );
  });
});

describe("getAccountMenuItemsForUser", () => {
  it("hides admin and agent in the native shell", () => {
    const paths = getAccountMenuItemsForUser(true, true).map((item) => item.to);
    expect(paths).not.toContain("/admin");
    expect(paths).not.toContain("/agent");
  });

  it("shows admin on web for admins", () => {
    expect(getAccountMenuItemsForUser(true, false).map((item) => item.to)).toContain(
      "/admin",
    );
  });
});

describe("getLogSessionMenuItems", () => {
  it("hides Auto-track (agent download) in the native shell", () => {
    const paths = getLogSessionMenuItems(true).map((item) => item.to);
    expect(paths).not.toContain("/agent");
    expect(paths).toEqual(["/manual", "/upload"]);
  });
});
