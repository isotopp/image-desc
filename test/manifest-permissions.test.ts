import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

type Manifest = {
  permissions?: string[];
  host_permissions?: string[];
  optional_permissions?: string[];
  optional_host_permissions?: string[];
  browser_specific_settings?: {
    gecko?: {
      data_collection_permissions?: { required?: string[] };
    };
  };
};

describe("extension permission budget", () => {
  it("keeps broad and sensitive access out of required permissions", () => {
    const manifest = JSON.parse(
      readFileSync("build/manifest.json", "utf8"),
    ) as Manifest;
    const required = manifest.permissions ?? [];

    expect(required).not.toEqual(
      expect.arrayContaining([
        "clipboardRead",
        "clipboardWrite",
        "tabs",
        "history",
        "cookies",
      ]),
    );
    expect(manifest.host_permissions).toBeUndefined();
    expect(
      required.some((permission) => permission.includes("<all_urls>")),
    ).toBe(false);
  });

  it("keeps the context-menu API permission required but tab access optional", () => {
    const manifest = JSON.parse(
      readFileSync("build/manifest.json", "utf8"),
    ) as Manifest;
    const required = manifest.permissions ?? [];
    const optional = manifest.optional_permissions ?? [];

    expect(required).toContain("contextMenus");
    expect(optional).toEqual(
      expect.arrayContaining(["activeTab", "scripting"]),
    );
    expect(optional).not.toContain("menus");
    expect(manifest.optional_host_permissions ?? []).not.toContain(
      "<all_urls>",
    );
  });

  it("declares the current data-collection behavior", () => {
    const manifest = JSON.parse(
      readFileSync("build/manifest.json", "utf8"),
    ) as Manifest;
    expect(
      manifest.browser_specific_settings?.gecko?.data_collection_permissions
        ?.required,
    ).toEqual(["none"]);
  });
});
