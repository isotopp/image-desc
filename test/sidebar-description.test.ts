// @vitest-environment jsdom

import { beforeEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import type { DescriptionProvider } from "../src/provider/responses";

const html = readFileSync("src/sidebar/sidebar.html", "utf8");

beforeEach(() => {
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

describe("sidebar description flow", () => {
  it("shows progress and the provider description", async () => {
    const provider: DescriptionProvider = {
      describe: vi.fn(async () => "A person celebrating a birthday."),
    };
    const { initializeSidebar } = await import("../src/sidebar/sidebar");
    initializeSidebar(provider);
    pasteImage();

    const describeButton =
      document.querySelector<HTMLButtonElement>("#describe");
    describeButton?.click();
    expect(document.querySelector("#status")?.textContent).toBe(
      "Creating description…",
    );

    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(document.querySelector("#description")?.textContent).toBe(
      "A person celebrating a birthday.",
    );
  });
});
