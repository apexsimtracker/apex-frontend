import { describe, expect, it } from "vitest";
import { urlToInAppPath } from "./nativeDeepLinks";

describe("urlToInAppPath", () => {
  it("maps production session, discussion, and challenge URLs", () => {
    expect(urlToInAppPath("https://apexsimtracker.com/sessions/abc")).toBe(
      "/sessions/abc",
    );
    expect(urlToInAppPath("https://www.apexsimtracker.com/discussion/d1")).toBe(
      "/discussion/d1",
    );
    expect(
      urlToInAppPath("https://apexsimtracker.com/challenge/c1?tab=lb#top"),
    ).toBe("/challenge/c1?tab=lb#top");
    expect(urlToInAppPath("https://apexsimtracker.com/sessions")).toBe(
      "/sessions",
    );
    expect(urlToInAppPath("https://apexsimtracker.com/challenges")).toBe(
      "/challenges",
    );
  });

  it("rejects non-https, unknown hosts, and unclaimed paths", () => {
    expect(urlToInAppPath("http://apexsimtracker.com/sessions/abc")).toBeNull();
    expect(
      urlToInAppPath("https://checkout.stripe.com/sessions/abc"),
    ).toBeNull();
    expect(urlToInAppPath("https://apexsimtracker.com/pricing")).toBeNull();
    expect(urlToInAppPath("https://apexsimtracker.com/session/abc")).toBeNull();
    expect(urlToInAppPath("not-a-url")).toBeNull();
  });
});
