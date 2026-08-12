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

describe("sidebar request concurrency", () => {
  it("disables Describe and prevents a second active request", async () => {
    let resolveDescription: (value: string) => void = () => undefined;
    const provider: DescriptionProvider = {
      describe: vi.fn(
        () => new Promise<string>((resolve) => (resolveDescription = resolve)),
      ),
    };
    const { initializeSidebar } = await import("../src/sidebar/sidebar");
    initializeSidebar(provider);
    pasteImage();

    const describeButton =
      document.querySelector<HTMLButtonElement>("#describe");
    describeButton?.click();
    describeButton?.click();

    expect(describeButton?.disabled).toBe(true);
    expect(provider.describe).toHaveBeenCalledOnce();

    resolveDescription("Done.");
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(describeButton?.disabled).toBe(false);
  });
});
