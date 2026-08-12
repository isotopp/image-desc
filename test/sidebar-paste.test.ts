// @vitest-environment jsdom

import { beforeEach, describe, expect, it, vi } from "vitest";

function sidebarMarkup(): string {
  return `
    <div id="paste-target" contenteditable="true"></div>
    <section id="preview-section" hidden>
      <img id="preview" />
      <button id="remove-image">Remove image</button>
    </section>
    <p id="status"></p>
    <div id="description" hidden></div>
    <button id="copy-description" hidden>Copy description</button>
  `;
}

describe("sidebar image paste", () => {
  beforeEach(() => {
    document.body.innerHTML = sidebarMarkup();
    vi.stubGlobal("URL", {
      createObjectURL: vi.fn(() => "blob:image-1"),
      revokeObjectURL: vi.fn(),
    });
  });

  it("shows a preview after the user pastes an image", async () => {
    await import("../src/sidebar/sidebar");
    const pasteTarget = document.querySelector<HTMLElement>("#paste-target");
    const previewSection =
      document.querySelector<HTMLElement>("#preview-section");
    const preview = document.querySelector<HTMLImageElement>("#preview");
    const image = new File(["pixels"], "image.png", { type: "image/png" });
    const event = new Event("paste", { bubbles: true, cancelable: true });

    Object.defineProperty(event, "clipboardData", {
      value: {
        items: [{ type: "image/png", getAsFile: () => image }],
      },
    });
    pasteTarget?.dispatchEvent(event);

    expect(previewSection?.hidden).toBe(false);
    expect(preview?.src).toBe("blob:image-1");
  });
});
