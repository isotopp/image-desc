import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("contributor tooling contract", () => {
  it("exposes the documented quality and packaging commands", () => {
    const packageJson = JSON.parse(readFileSync("package.json", "utf8")) as {
      scripts?: Record<string, string>;
    };

    expect(packageJson.scripts).toEqual(
      expect.objectContaining({
        build: expect.any(String),
        test: expect.any(String),
        lint: expect.any(String),
        format: expect.any(String),
        "format:check": expect.any(String),
        typecheck: expect.any(String),
        package: expect.any(String),
      }),
    );
  });

  it("ends AGENTS.md with the agent guardrails section", () => {
    const agents = readFileSync("AGENTS.md", "utf8").trim();
    const headings = agents.match(/^## .+$/gm) ?? [];
    expect(headings.at(-1)).toBe("## Agent guardrails");
  });

  it("keeps one authoritative source manifest", () => {
    expect(existsSync("src/manifest.json")).toBe(true);
    expect(existsSync("manifest.json")).toBe(false);
  });
});
