// @vitest-environment jsdom

import { beforeEach, describe, expect, it, vi } from "vitest";

const createObjectURL = vi.fn();
const revokeObjectURL = vi.fn();

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
  createObjectURL.mockReset();
  revokeObjectURL.mockReset();
  createObjectURL
    .mockReturnValueOnce("blob:image-1")
    .mockReturnValueOnce("blob:image-2");
  vi.stubGlobal("URL", { createObjectURL, revokeObjectURL });
});

function paste(imageName: string): void {
  const event = new Event("paste", { bubbles: true, cancelable: true });
  const image = new File([imageName], imageName, { type: "image/png" });
  Object.defineProperty(event, "clipboardData", {
    value: { items: [{ type: "image/png", getAsFile: () => image }] },
  });
  document.querySelector<HTMLElement>("#paste-target")?.dispatchEvent(event);
}

describe("sidebar image lifecycle", () => {
  it("revokes the old preview URL when an image is replaced", async () => {
    await import("../src/sidebar/sidebar");
    paste("first.png");
    paste("second.png");

    expect(revokeObjectURL).toHaveBeenCalledWith("blob:image-1");
    expect(document.querySelector<HTMLImageElement>("#preview")?.src).toBe(
      "blob:image-2",
    );
  });

  it("revokes the current preview URL and returns to the empty state on removal", async () => {
    await import("../src/sidebar/sidebar");
    paste("first.png");
    document.querySelector<HTMLButtonElement>("#remove-image")?.click();

    expect(revokeObjectURL).toHaveBeenCalledWith("blob:image-1");
    expect(
      document.querySelector<HTMLElement>("#preview-section")?.hidden,
    ).toBe(true);
    expect(document.querySelector("#status")?.textContent).toBe(
      "No image selected.",
    );
  });
});
