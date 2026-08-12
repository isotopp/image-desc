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
    expect(manifest.host_permissions).toEqual(
      expect.arrayContaining([
        "http://localhost/*",
        "http://127.0.0.1/*",
        "http://[::1]/*",
        "https://api.openai.com/*",
      ]),
    );
    expect(manifest.host_permissions).not.toContain("<all_urls>");
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
    expect(required).toContain("storage");
    expect(optional).toEqual(
      expect.arrayContaining(["activeTab", "scripting", "https://*/*"]),
    );
    expect(optional).not.toContain("menus");
    expect(optional).not.toEqual(
      expect.arrayContaining([
        "http://localhost/*",
        "http://127.0.0.1/*",
        "http://[::1]/*",
        "https://api.openai.com/*",
      ]),
    );
    expect(manifest.optional_host_permissions).toEqual(
      expect.arrayContaining(["https://*/*"]),
    );
    expect(manifest.optional_host_permissions).not.toContain("<all_urls>");
    expect(manifest.optional_host_permissions).not.toEqual(
      expect.arrayContaining([
        "http://localhost/*",
        "http://127.0.0.1/*",
        "http://[::1]/*",
        "https://api.openai.com/*",
      ]),
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
