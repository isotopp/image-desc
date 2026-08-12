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

async function loadWithProvider(baseUrl: string): Promise<void> {
  vi.stubGlobal("browser", {
    storage: {
      local: {
        get: vi.fn(async () => ({
          providerConfig: {
            baseUrl,
            model: "vision-model",
            authentication: "none",
            apiKey: "",
          },
        })),
      },
    },
    runtime: { sendMessage: vi.fn(async () => ({})) },
  });
  await import("../src/sidebar/sidebar");
  await new Promise((resolve) => setTimeout(resolve, 0));
}

describe("sidebar provider status", () => {
  it("links to provider configuration when no provider is configured", async () => {
    vi.stubGlobal("browser", {
      storage: { local: { get: vi.fn(async () => ({})) } },
      runtime: { sendMessage: vi.fn(async () => ({})) },
    });
    await import("../src/sidebar/sidebar");

    const link =
      document.querySelector<HTMLAnchorElement>("#provider-status a");
    expect(link?.textContent).toBe("No provider configured");
    expect(link?.getAttribute("href")).toBe("../options/options.html");
  });

  it("identifies an OpenAI provider", async () => {
    await loadWithProvider("https://api.openai.com");

    expect(document.querySelector("#provider-status")?.textContent).toBe(
      "Using OpenAI",
    );
    expect(document.querySelector("#provider-status a")).toBeNull();
  });

  it("identifies a non-OpenAI provider as a local provider", async () => {
    await loadWithProvider("http://127.0.0.1:1234");

    expect(document.querySelector("#provider-status")?.textContent).toBe(
      "Using Local Provider",
    );
  });
});
