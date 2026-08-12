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
    expect(existsSync(resolve(buildRoot, manifest.sidebar_action.default_panel))).toBe(
      true,
    );
  });
});
