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

describe("sidebar request cancellation", () => {
  it("aborts the request, preserves inputs, and allows a retry", async () => {
    let requestSignal: AbortSignal | undefined;
    const provider: DescriptionProvider = {
      describe: vi.fn(
        ({ signal }: { signal: AbortSignal }) =>
          new Promise<string>((_resolve, reject) => {
            requestSignal = signal;
            signal.addEventListener("abort", () => {
              reject(new DOMException("Aborted", "AbortError"));
            });
          }),
      ),
    };
    const { initializeSidebar } = await import("../src/sidebar/sidebar");
    initializeSidebar(provider);
    pasteImage();
    const context =
      document.querySelector<HTMLTextAreaElement>("#manual-context");
    context!.value = "A sunset over the sea.";

    document.querySelector<HTMLButtonElement>("#describe")!.click();
    const cancelButton = document.querySelector<HTMLButtonElement>("#cancel");
    expect(cancelButton).not.toBeNull();
    expect(cancelButton!.hidden).toBe(false);

    cancelButton!.click();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(requestSignal?.aborted).toBe(true);
    expect(document.querySelector<HTMLElement>("#status")?.textContent).toBe(
      "Canceled.",
    );
    expect(
      document.querySelector<HTMLElement>("#preview-section")?.hidden,
    ).toBe(false);
    expect(context?.value).toBe("A sunset over the sea.");
    expect(
      document.querySelector<HTMLButtonElement>("#describe")?.disabled,
    ).toBe(false);
  });

  it("ignores a result that arrives after cancellation", async () => {
    let resolveDescription: (value: string) => void = () => undefined;
    const provider: DescriptionProvider = {
      describe: vi.fn(
        () =>
          new Promise<string>((resolve) => {
            resolveDescription = resolve;
          }),
      ),
    };
    const { initializeSidebar } = await import("../src/sidebar/sidebar");
    initializeSidebar(provider);
    pasteImage();

    document.querySelector<HTMLButtonElement>("#describe")!.click();
    document.querySelector<HTMLButtonElement>("#cancel")!.click();
    resolveDescription("Stale result.");
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(document.querySelector<HTMLElement>("#status")?.textContent).toBe(
      "Canceled.",
    );
    expect(document.querySelector<HTMLElement>("#description")?.hidden).toBe(
      true,
    );
  });
});
