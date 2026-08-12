// @vitest-environment jsdom

import { beforeEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";

const storage = {
  get: vi.fn(async () => ({})),
  set: vi.fn(async () => undefined),
};

beforeEach(() => {
  vi.resetModules();
  storage.get.mockReset().mockResolvedValue({});
  storage.set.mockReset().mockResolvedValue(undefined);
  vi.stubGlobal("browser", { storage: { local: storage } });
  const html = readFileSync("src/options/options.html", "utf8");
  document.body.innerHTML = html.slice(
    html.indexOf("<body>") + 6,
    html.indexOf("</body>"),
  );
});

describe("provider configuration", () => {
  it("saves endpoint, model, authentication mode, and API key", async () => {
    await import("../src/options/options");
    const form = document.querySelector<HTMLFormElement>("#provider-form");
    const baseUrl = document.querySelector<HTMLInputElement>("#base-url");
    const model = document.querySelector<HTMLInputElement>("#model");
    const authentication =
      document.querySelector<HTMLSelectElement>("#authentication");
    const apiKey = document.querySelector<HTMLInputElement>("#api-key");

    if (!form || !baseUrl || !model || !authentication || !apiKey) {
      throw new Error("Provider options markup is incomplete.");
    }

    baseUrl.value = "https://api.example.test";
    model.value = "vision-model";
    authentication.value = "bearer";
    apiKey.value = "user-key";
    form.requestSubmit();
    await Promise.resolve();

    expect(storage.set).toHaveBeenCalledWith({
      providerConfig: {
        baseUrl: "https://api.example.test",
        model: "vision-model",
        authentication: "bearer",
        apiKey: "user-key",
      },
    });
  });

  it("restores a saved configuration in a fresh options page", async () => {
    storage.get.mockResolvedValue({
      providerConfig: {
        baseUrl: "http://127.0.0.1:1234",
        model: "local-vision",
        authentication: "none",
        apiKey: "placeholder",
      },
    });

    await import("../src/options/options");
    await Promise.resolve();

    expect(document.querySelector<HTMLInputElement>("#base-url")?.value).toBe(
      "http://127.0.0.1:1234",
    );
    expect(document.querySelector<HTMLInputElement>("#model")?.value).toBe(
      "local-vision",
    );
    expect(
      document.querySelector<HTMLSelectElement>("#authentication")?.value,
    ).toBe("none");
    expect(document.querySelector<HTMLInputElement>("#api-key")?.value).toBe(
      "placeholder",
    );
  });
});
