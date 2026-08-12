// @vitest-environment jsdom

import { beforeEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";

const storage = {
  get: vi.fn(async () => ({})),
  remove: vi.fn(async () => undefined),
  set: vi.fn(async () => undefined),
};
const request = vi.fn(async () => true);
const remove = vi.fn(async () => true);

beforeEach(() => {
  vi.resetModules();
  storage.get.mockReset().mockResolvedValue({});
  storage.remove.mockReset().mockResolvedValue(undefined);
  storage.set.mockReset().mockResolvedValue(undefined);
  request.mockReset().mockResolvedValue(true);
  remove.mockReset().mockResolvedValue(true);
  vi.stubGlobal("browser", {
    storage: { local: storage },
    permissions: { request, remove },
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

  it("uses Firefox's host pattern when the provider URL includes a port", async () => {
    await import("../src/options/options");
    const form = document.querySelector<HTMLFormElement>("#provider-form");
    const baseUrl = document.querySelector<HTMLInputElement>("#base-url");
    const model = document.querySelector<HTMLInputElement>("#model");

    if (!form || !baseUrl || !model) {
      throw new Error("Provider options markup is incomplete.");
    }

    baseUrl.value = "http://localhost:1234/v1";
    model.value = "local-vision";
    form.dispatchEvent(
      new Event("submit", { bubbles: true, cancelable: true }),
    );
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(request).toHaveBeenCalledWith({
      origins: ["http://localhost/*"],
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
      "Provider access was not granted for https://api.example.test. Open the extension's Permissions settings in about:addons, allow this origin, and save again.",
    );
  });

  it("revokes the old origin after a replacement is activated", async () => {
    storage.get.mockResolvedValue({
      providerConfig: {
        baseUrl: "https://old.example.test",
        model: "old-model",
        authentication: "none",
        apiKey: "",
      },
    });

    await import("../src/options/options");
    await new Promise((resolve) => setTimeout(resolve, 0));
    const form = document.querySelector<HTMLFormElement>("#provider-form");
    const baseUrl = document.querySelector<HTMLInputElement>("#base-url");
    const model = document.querySelector<HTMLInputElement>("#model");

    if (!form || !baseUrl || !model) {
      throw new Error("Provider options markup is incomplete.");
    }

    baseUrl.value = "https://new.example.test";
    model.value = "new-model";
    form.dispatchEvent(
      new Event("submit", { bubbles: true, cancelable: true }),
    );
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(remove).toHaveBeenCalledWith({
      origins: ["https://old.example.test/*"],
    });
  });

  it("removes the active provider and requests its origin revocation", async () => {
    storage.get.mockResolvedValue({
      providerConfig: {
        baseUrl: "https://old.example.test",
        model: "old-model",
        authentication: "none",
        apiKey: "",
      },
    });

    await import("../src/options/options");
    await new Promise((resolve) => setTimeout(resolve, 0));
    document.querySelector<HTMLButtonElement>("#remove-provider")?.click();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(storage.remove).toHaveBeenCalledWith(["providerConfig"]);
    expect(remove).toHaveBeenCalledWith({
      origins: ["https://old.example.test/*"],
    });
    expect(document.querySelector("#status")?.textContent).toBe(
      "Provider removed.",
    );
  });
});
