// @vitest-environment jsdom

import { beforeEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import type { DescriptionProvider } from "../src/provider/responses";

const html = readFileSync("src/sidebar/sidebar.html", "utf8");

beforeEach(() => {
  vi.resetModules();
  document.body.innerHTML = html.slice(
    html.indexOf("<body>") + 6,
    html.indexOf("</body>"),
  );
  vi.stubGlobal("URL", {
    createObjectURL: vi.fn(() => "blob:image-1"),
    revokeObjectURL: vi.fn(),
  });
});

function pasteImage(): void {
  const image = new File(["pixels"], "image.png", { type: "image/png" });
  const event = new Event("paste", { bubbles: true, cancelable: true });
  Object.defineProperty(event, "clipboardData", {
    value: { items: [{ type: "image/png", getAsFile: () => image }] },
  });
  document.querySelector<HTMLElement>("#paste-target")?.dispatchEvent(event);
}

async function finishRequest(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 0));
}

describe("sidebar description copy", () => {
  it("copies exactly the visible description and reports success", async () => {
    const writeText = vi.fn(async () => undefined);
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });
    const provider: DescriptionProvider = {
      describe: vi.fn(async () => "A person celebrating a birthday."),
    };
    const { initializeSidebar } = await import("../src/sidebar/sidebar");
    initializeSidebar(provider);
    pasteImage();

    document.querySelector<HTMLButtonElement>("#describe")!.click();
    await finishRequest();
    document.querySelector<HTMLButtonElement>("#copy-description")!.click();
    await finishRequest();

    expect(writeText).toHaveBeenCalledWith("A person celebrating a birthday.");
    expect(document.querySelector<HTMLElement>("#status")?.textContent).toBe(
      "Description copied to the clipboard.",
    );
  });

  it("reports a concise status when the clipboard write is rejected", async () => {
    const writeText = vi.fn(async () => {
      throw new Error("clipboard denied");
    });
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });
    const provider: DescriptionProvider = {
      describe: vi.fn(async () => "A person celebrating a birthday."),
    };
    const { initializeSidebar } = await import("../src/sidebar/sidebar");
    initializeSidebar(provider);
    pasteImage();

    document.querySelector<HTMLButtonElement>("#describe")!.click();
    await finishRequest();
    document.querySelector<HTMLButtonElement>("#copy-description")!.click();
    await finishRequest();

    expect(document.querySelector<HTMLElement>("#status")?.textContent).toBe(
      "Could not copy the description.",
    );
  });
});
