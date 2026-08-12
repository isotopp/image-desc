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

describe("sidebar provider failure recovery", () => {
  it("preserves inputs, clears stale results, and allows an immediate retry", async () => {
    let attempt = 0;
    const provider: DescriptionProvider = {
      describe: vi.fn(async () => {
        attempt += 1;
        if (attempt === 1) {
          return "The first description.";
        }
        throw new Error("provider secret and image bytes must not be shown");
      }),
    };
    const { initializeSidebar } = await import("../src/sidebar/sidebar");
    initializeSidebar(provider);
    pasteImage();
    const context =
      document.querySelector<HTMLTextAreaElement>("#manual-context");
    context!.value = "A sunset over the sea.";
    const describeButton =
      document.querySelector<HTMLButtonElement>("#describe")!;

    describeButton.click();
    await finishRequest();
    expect(
      document.querySelector<HTMLElement>("#description")?.textContent,
    ).toBe("The first description.");

    describeButton.click();
    await finishRequest();

    expect(document.querySelector<HTMLElement>("#status")?.textContent).toBe(
      "Could not create a description.",
    );
    expect(document.querySelector<HTMLElement>("#description")?.hidden).toBe(
      true,
    );
    expect(
      document.querySelector<HTMLElement>("#description")?.textContent,
    ).toBe("");
    expect(
      document.querySelector<HTMLElement>("#preview-section")?.hidden,
    ).toBe(false);
    expect(context?.value).toBe("A sunset over the sea.");
    expect(describeButton.disabled).toBe(false);
  });
});
