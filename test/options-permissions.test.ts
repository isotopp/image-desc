// @vitest-environment jsdom

import { beforeEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";

const storage = {
  get: vi.fn(async () => ({})),
  set: vi.fn(async () => undefined),
};
const request = vi.fn(async () => true);

beforeEach(() => {
  vi.resetModules();
  storage.get.mockReset().mockResolvedValue({});
  storage.set.mockReset().mockResolvedValue(undefined);
  request.mockReset().mockResolvedValue(true);
  vi.stubGlobal("browser", {
    storage: { local: storage },
    permissions: { request },
  });
  const html = readFileSync("src/options/options.html", "utf8");
  document.body.innerHTML = html.slice(
    html.indexOf("<body>") + 6,
    html.indexOf("</body>"),
  );
});

describe("provider origin access", () => {
  it("requests the configured origin when the user saves a provider", async () => {
    await import("../src/options/options");
    const form = document.querySelector<HTMLFormElement>("#provider-form");
    const baseUrl = document.querySelector<HTMLInputElement>("#base-url");
    const model = document.querySelector<HTMLInputElement>("#model");

    if (!form || !baseUrl || !model) {
      throw new Error("Provider options markup is incomplete.");
    }

    baseUrl.value = "https://api.example.test/v1";
    model.value = "vision-model";
    form.dispatchEvent(
      new Event("submit", { bubbles: true, cancelable: true }),
    );
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(request).toHaveBeenCalledWith({
      origins: ["https://api.example.test/*"],
    });
    expect(storage.set).toHaveBeenCalled();
  });

  it("does not activate a provider when the origin request is denied", async () => {
    request.mockResolvedValue(false);
    await import("../src/options/options");
    const form = document.querySelector<HTMLFormElement>("#provider-form");
    const baseUrl = document.querySelector<HTMLInputElement>("#base-url");
    const model = document.querySelector<HTMLInputElement>("#model");

    if (!form || !baseUrl || !model) {
      throw new Error("Provider options markup is incomplete.");
    }

    baseUrl.value = "https://api.example.test";
    model.value = "vision-model";
    form.dispatchEvent(
      new Event("submit", { bubbles: true, cancelable: true }),
    );
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(storage.set).not.toHaveBeenCalled();
    expect(document.querySelector("#status")?.textContent).toBe(
      "Provider access was not granted.",
    );
  });
});
