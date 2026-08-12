import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const buildRoot = resolve("build");

describe("Firefox build output", () => {
  it("contains every extension entry point named by the manifest", () => {
    const manifest = JSON.parse(
      readFileSync(resolve(buildRoot, "manifest.json"), "utf8"),
    ) as {
      background: { scripts: string[] };
      sidebar_action: { default_panel: string };
    };

    expect(manifest.background.scripts).toContain("background.js");
    expect(existsSync(resolve(buildRoot, "background.js"))).toBe(true);
    expect(
      existsSync(resolve(buildRoot, manifest.sidebar_action.default_panel)),
    ).toBe(true);
  });

  it("contains the production identity and extension icons", () => {
    const manifest = JSON.parse(
      readFileSync(resolve(buildRoot, "manifest.json"), "utf8"),
    ) as {
      homepage_url?: string;
      developer?: { name?: string; url?: string };
      icons?: Record<string, string>;
      action?: { default_icon?: Record<string, string> };
      browser_specific_settings?: {
        gecko?: { id?: string; strict_min_version?: string };
        gecko_android?: unknown;
      };
    };

    expect(manifest.homepage_url).toBe("https://github.com/isotopp/image-desc");
    expect(manifest.developer).toEqual({
      name: "Kris Köhntopp",
      url: "https://github.com/isotopp/image-desc",
    });
    expect(manifest.browser_specific_settings?.gecko).toEqual(
      expect.objectContaining({
        id: "kris-imagedescription@koehntopp.de",
        strict_min_version: "142.0",
      }),
    );
    expect(manifest.browser_specific_settings?.gecko_android).toBeUndefined();
    expect(manifest.icons).toEqual({
      "32": "icons/image-description-32.png",
      "48": "icons/image-description-48.png",
      "64": "icons/image-description-64.png",
      "96": "icons/image-description-96.png",
      "128": "icons/image-description-128.png",
    });
    expect(manifest.action?.default_icon).toEqual({
      "16": "icons/image-description-16.png",
      "32": "icons/image-description-32.png",
    });
    for (const iconPath of new Set([
      ...Object.values(manifest.icons ?? {}),
      ...Object.values(manifest.action?.default_icon ?? {}),
    ])) {
      expect(existsSync(resolve(buildRoot, iconPath))).toBe(true);
    }
  });
});
