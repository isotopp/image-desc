// @vitest-environment jsdom

import { beforeEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";

beforeEach(() => {
  vi.resetModules();
  const html = readFileSync("src/sidebar/sidebar.html", "utf8");
  document.body.innerHTML = html.slice(
    html.indexOf("<body>") + 6,
    html.indexOf("</body>"),
  );
  vi.stubGlobal("URL", {
    createObjectURL: vi.fn(() => "blob:image-1"),
    revokeObjectURL: vi.fn(),
  });
});

describe("sidebar manual context", () => {
  it("provides a labelled input for optional context", async () => {
    await import("../src/sidebar/sidebar");
    const context =
      document.querySelector<HTMLTextAreaElement>("#manual-context");
    const label = document.querySelector<HTMLLabelElement>(
      "label[for=manual-context]",
    );

    expect(context).not.toBeNull();
    expect(label?.textContent).toBe("Additional context");
  });

  it("starts a fresh sidebar with no image, context, or description state", async () => {
    await import("../src/sidebar/sidebar");
    const context =
      document.querySelector<HTMLTextAreaElement>("#manual-context");
    if (!context) {
      throw new Error("Manual context input is missing.");
    }
    context.value = "This is only for the current description.";

    vi.resetModules();
    const html = readFileSync("src/sidebar/sidebar.html", "utf8");
    document.body.innerHTML = html.slice(
      html.indexOf("<body>") + 6,
      html.indexOf("</body>"),
    );
    await import("../src/sidebar/sidebar");

    expect(
      document.querySelector<HTMLTextAreaElement>("#manual-context")?.value,
    ).toBe("");
    expect(
      document.querySelector<HTMLElement>("#preview-section")?.hidden,
    ).toBe(true);
    expect(document.querySelector<HTMLElement>("#description")?.hidden).toBe(
      true,
    );
  });
});
