// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import type { DescriptionProvider } from "../src/provider/responses";

const html = readFileSync("src/sidebar/sidebar.html", "utf8");

beforeEach(() => {
  vi.resetModules();
  vi.useFakeTimers();
  document.body.innerHTML = html.slice(
    html.indexOf("<body>") + 6,
    html.indexOf("</body>"),
  );
  vi.stubGlobal("URL", {
    createObjectURL: vi.fn(() => "blob:image-1"),
    revokeObjectURL: vi.fn(),
  });
});

afterEach(() => {
  vi.useRealTimers();
});

function pasteImage(): void {
  const image = new File(["pixels"], "image.png", { type: "image/png" });
  const event = new Event("paste", { bubbles: true, cancelable: true });
  Object.defineProperty(event, "clipboardData", {
    value: { items: [{ type: "image/png", getAsFile: () => image }] },
  });
  document.querySelector<HTMLElement>("#paste-target")?.dispatchEvent(event);
}

describe("sidebar request timeout", () => {
  it("aborts a stalled request after 120 seconds and remains retryable", async () => {
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

    await vi.advanceTimersByTimeAsync(119_999);
    expect(requestSignal?.aborted).toBe(false);
    expect(document.querySelector<HTMLElement>("#status")?.textContent).toBe(
      "Creating description…",
    );

    await vi.advanceTimersByTimeAsync(1);
    await Promise.resolve();

    expect(requestSignal?.aborted).toBe(true);
    expect(document.querySelector<HTMLElement>("#status")?.textContent).toBe(
      "Request timed out.",
    );
    expect(
      document.querySelector<HTMLElement>("#preview-section")?.hidden,
    ).toBe(false);
    expect(context?.value).toBe("A sunset over the sea.");
    expect(
      document.querySelector<HTMLButtonElement>("#describe")?.disabled,
    ).toBe(false);
  });
});
