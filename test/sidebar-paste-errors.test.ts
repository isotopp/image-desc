// @vitest-environment jsdom

import { beforeEach, describe, expect, it, vi } from "vitest";

beforeEach(() => {
  vi.resetModules();
  document.body.innerHTML = `
    <div id="paste-target" contenteditable="true"></div>
    <section id="preview-section" hidden>
      <img id="preview" />
      <button id="remove-image">Remove image</button>
    </section>
    <p id="status"></p>
    <div id="description" hidden></div>
    <button id="copy-description" hidden>Copy description</button>
  `;
  vi.stubGlobal("URL", {
    createObjectURL: vi.fn(() => "blob:image-1"),
    revokeObjectURL: vi.fn(),
  });
});

function paste(
  items: Array<{ type: string; getAsFile: () => File | null }>,
): void {
  const event = new Event("paste", { bubbles: true, cancelable: true });
  Object.defineProperty(event, "clipboardData", { value: { items } });
  document.querySelector<HTMLElement>("#paste-target")?.dispatchEvent(event);
}

describe("sidebar clipboard rejection", () => {
  it("shows an inline error when the clipboard has no image", async () => {
    await import("../src/sidebar/sidebar");
    paste([{ type: "text/plain", getAsFile: () => null }]);

    expect(document.querySelector("#status")?.textContent).toBe(
      "The clipboard does not contain an image.",
    );
  });

  it("preserves the accepted preview when a later paste has no image", async () => {
    await import("../src/sidebar/sidebar");
    const image = new File(["pixels"], "image.png", { type: "image/png" });
    paste([{ type: "image/png", getAsFile: () => image }]);
    const preview = document.querySelector<HTMLImageElement>("#preview");
    const previewUrl = preview?.src;

    paste([{ type: "text/plain", getAsFile: () => null }]);

    expect(preview?.src).toBe(previewUrl);
    expect(
      document.querySelector<HTMLElement>("#preview-section")?.hidden,
    ).toBe(false);
  });
});
