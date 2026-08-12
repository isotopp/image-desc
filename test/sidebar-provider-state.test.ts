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

describe("sidebar provider state", () => {
  it("enables Describe after restoring a saved provider configuration", async () => {
    const get = vi.fn(async () => ({
      providerConfig: {
        baseUrl: "http://127.0.0.1:1234",
        model: "local-vision",
        authentication: "none",
        apiKey: "",
      },
    }));
    vi.stubGlobal("browser", {
      storage: { local: { get } },
      runtime: { sendMessage: vi.fn(async () => ({})) },
    });

    await import("../src/sidebar/sidebar");
    await new Promise((resolve) => setTimeout(resolve, 0));
    pasteImage();

    expect(
      document.querySelector<HTMLButtonElement>("#describe")?.disabled,
    ).toBe(false);
  });
});
