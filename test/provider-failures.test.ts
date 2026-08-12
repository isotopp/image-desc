import { describe, expect, it, vi } from "vitest";
import { createDescriptionProvider } from "../src/provider/responses";

const config = {
  baseUrl: "https://api.example.test",
  model: "vision-model",
  authentication: "bearer" as const,
  apiKey: "secret-key",
};

describe("Responses API provider failures", () => {
  it("converts a network failure into a provider error without secrets", async () => {
    const provider = createDescriptionProvider(
      config,
      vi.fn(async () => {
        throw new TypeError("network failed secret-key");
      }),
    );

    const result = provider.describe({
      image: new Blob(["pixels"], { type: "image/png" }),
      signal: new AbortController().signal,
    });
    await expect(result).rejects.toMatchObject({ code: "network" });
    await expect(result).rejects.not.toThrow("secret-key");
  });

  it("converts a non-success response into a safe HTTP provider error", async () => {
    const provider = createDescriptionProvider(
      config,
      vi.fn(async () => new Response("secret-key", { status: 401 })),
    );

    await expect(
      provider.describe({
        image: new Blob(["pixels"], { type: "image/png" }),
        signal: new AbortController().signal,
      }),
    ).rejects.toMatchObject({
      code: "http",
      message: "The provider rejected the request.",
    });
  });

  it("rejects a successful response without usable description text", async () => {
    const provider = createDescriptionProvider(
      config,
      vi.fn(
        async () =>
          new Response(JSON.stringify({ output: [] }), { status: 200 }),
      ),
    );

    await expect(
      provider.describe({
        image: new Blob(["pixels"], { type: "image/png" }),
        signal: new AbortController().signal,
      }),
    ).rejects.toMatchObject({ code: "invalid-response" });
  });
});
