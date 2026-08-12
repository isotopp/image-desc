// @vitest-environment jsdom

import { beforeEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";

const html = readFileSync("src/sidebar/sidebar.html", "utf8");

beforeEach(() => {
  vi.resetModules();
  document.body.innerHTML = html.slice(
    html.indexOf("<body>") + 6,
    html.indexOf("</body>"),
  );
  vi.stubGlobal("URL", {
    createObjectURL: vi.fn(() => "blob:captured-image"),
    revokeObjectURL: vi.fn(),
  });
});

describe("sidebar pending context-menu image", () => {
  it("requests the transient selected image and reuses the paste preview path", async () => {
    const image = new Blob(["captured image"], { type: "image/png" });
    const sendMessage = vi.fn(async () => ({ image }));
    vi.stubGlobal("browser", {
      runtime: { sendMessage },
      storage: { local: { get: vi.fn(async () => ({})) } },
    });

    await import("../src/sidebar/sidebar");
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(sendMessage).toHaveBeenCalledWith({ type: "get-pending-image" });
    expect(
      document.querySelector<HTMLElement>("#preview-section")?.hidden,
    ).toBe(false);
    expect(document.querySelector<HTMLImageElement>("#preview")?.src).toBe(
      "blob:captured-image",
    );
  });

  it("shows a capture failure without inspecting page content", async () => {
    const sendMessage = vi.fn(async () => ({
      error: "Could not capture the selected image.",
    }));
    vi.stubGlobal("browser", {
      runtime: { sendMessage },
      storage: { local: { get: vi.fn(async () => ({})) } },
    });

    await import("../src/sidebar/sidebar");
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(document.querySelector("#status")?.textContent).toBe(
      "Could not capture the selected image.",
    );
    expect(
      document.querySelector<HTMLElement>("#preview-section")?.hidden,
    ).toBe(true);
  });
});
