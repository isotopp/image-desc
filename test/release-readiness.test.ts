import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("release documentation", () => {
  it("documents the privacy boundary in user-facing language", () => {
    const policy = readFileSync("PRIVACY.md", "utf8");

    expect(policy).toMatch(/does not collect/i);
    expect(policy).toMatch(/configured provider/i);
    expect(policy).toContain("browser.storage.local");
    expect(policy).toMatch(/analytics, telemetry, advertising/i);
    expect(policy).toContain("kris-imagedescription@koehntopp.de");
  });

  it("is distributed under the MIT license", () => {
    const license = readFileSync("LICENSE", "utf8");

    expect(license).toContain("MIT License");
    expect(license).toContain("Copyright (c) 2026 Kris Köhntopp");
    expect(license).toContain("Permission is hereby granted, free of charge");
  });
});

describe("AMO listing metadata", () => {
  it("provides the required first-submission fields and support contact", () => {
    const metadata = JSON.parse(readFileSync("amo-metadata.json", "utf8")) as {
      summary?: Record<string, string>;
      categories?: string[];
      homepage?: Record<string, string>;
      support_email?: Record<string, string>;
      requires_payment?: boolean;
      version?: { license?: string };
    };

    expect(metadata.summary?.["en-US"]).toMatch(/image description/i);
    expect(metadata.categories).toEqual(["photos-music-videos"]);
    expect(metadata.homepage?.["en-US"]).toBe(
      "https://github.com/isotopp/image-desc",
    );
    expect(metadata.support_email?.["en-US"]).toBe(
      "kris-imagedescription@koehntopp.de",
    );
    expect(metadata.requires_payment).toBe(false);
    expect(metadata.version?.license).toBe("MIT");
  });
});

describe("reproducible source submission", () => {
  it("ships a documented source-package command for Mozilla reviewers", () => {
    const packageJson = JSON.parse(readFileSync("package.json", "utf8")) as {
      scripts?: Record<string, string>;
    };
    const instructions = readFileSync("SOURCE_BUILD.md", "utf8");
    const packager = readFileSync("scripts/package-source.sh", "utf8");
    const gitignore = readFileSync(".gitignore", "utf8");

    expect(packageJson.scripts?.["source-package"]).toContain(
      "scripts/package-source.sh",
    );
    expect(instructions).toContain("Ubuntu 24.04.4 LTS");
    expect(instructions).toContain("Node.js 24.14.0");
    expect(instructions).toContain("npm ci");
    expect(instructions).toContain("npm run build");
    expect(packager).toContain("package-lock.json");
    expect(packager).toContain("git archive");
    expect(packager).toContain("git ls-files --others --exclude-standard");
    expect(gitignore).toContain("source-artifacts/");
  });
});
