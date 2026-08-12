import { describe, expect, it, vi } from "vitest";
import { createDescriptionProvider } from "../src/provider/responses";

describe("Responses API description provider", () => {
  it("sends one image request and returns the response text", async () => {
    const fetcher = vi.fn(
      async (input: RequestInfo | URL, init?: RequestInit) => {
        expect(input).toBe("https://api.example.test/v1/responses");
        const body = JSON.parse(String(init?.body));
        expect(body.model).toBe("vision-model");
        expect(body.input[0].content).toEqual([
          {
            type: "input_text",
            text: "Provide an image description for the visually impaired that fits into 1300 characters or less.",
          },
          {
            type: "input_image",
            image_url: "data:image/png;base64,cGl4ZWxz",
          },
        ]);
        return new Response(
          JSON.stringify({
            output: [
              {
                type: "message",
                content: [
                  { type: "output_text", text: "A clear description." },
                ],
              },
            ],
          }),
          { status: 200 },
        );
      },
    );
    const provider = createDescriptionProvider(
      {
        baseUrl: "https://api.example.test",
        model: "vision-model",
        authentication: "none",
        apiKey: "",
      },
      fetcher,
    );

    await expect(
      provider.describe({
        image: new Blob(["pixels"], { type: "image/png" }),
        signal: new AbortController().signal,
      }),
    ).resolves.toBe("A clear description.");
    expect(fetcher).toHaveBeenCalledOnce();
  });

  it("sends a bearer token when bearer authentication is configured", async () => {
    const fetcher = vi.fn(
      async (_input: RequestInfo | URL, init?: RequestInit) => {
        expect(new Headers(init?.headers).get("Authorization")).toBe(
          "Bearer user-key",
        );
        return new Response(
          JSON.stringify({
            output: [{ content: [{ type: "output_text", text: "Done." }] }],
          }),
          { status: 200 },
        );
      },
    );
    const provider = createDescriptionProvider(
      {
        baseUrl: "https://api.example.test",
        model: "vision-model",
        authentication: "bearer",
        apiKey: "user-key",
      },
      fetcher,
    );

    await provider.describe({
      image: new Blob(["pixels"], { type: "image/png" }),
      signal: new AbortController().signal,
    });
  });

  it("omits authorization when authentication is disabled", async () => {
    const fetcher = vi.fn(
      async (_input: RequestInfo | URL, init?: RequestInit) => {
        expect(new Headers(init?.headers).has("Authorization")).toBe(false);
        return new Response(
          JSON.stringify({
            output: [{ content: [{ type: "output_text", text: "Done." }] }],
          }),
          { status: 200 },
        );
      },
    );
    const provider = createDescriptionProvider(
      {
        baseUrl: "https://api.example.test",
        model: "vision-model",
        authentication: "none",
        apiKey: "ignored-key",
      },
      fetcher,
    );

    await provider.describe({
      image: new Blob(["pixels"], { type: "image/png" }),
      signal: new AbortController().signal,
    });
  });

  it("appends trimmed non-empty manual context to the input prompt", async () => {
    const fetcher = vi.fn(
      async (_input: RequestInfo | URL, init?: RequestInit) => {
        const body = JSON.parse(String(init?.body));
        expect(body.input[0].content[0].text).toBe(
          "Provide an image description for the visually impaired that fits into 1300 characters or less.\n\nThe user provides the following additional context: A birthday post.",
        );
        return new Response(
          JSON.stringify({
            output: [{ content: [{ type: "output_text", text: "Done." }] }],
          }),
          { status: 200 },
        );
      },
    );
    const provider = createDescriptionProvider(
      {
        baseUrl: "https://api.example.test",
        model: "vision-model",
        authentication: "none",
        apiKey: "",
      },
      fetcher,
    );

    await provider.describe({
      image: new Blob(["pixels"], { type: "image/png" }),
      context: "  A birthday post.  ",
      signal: new AbortController().signal,
    });
  });

  it("keeps the base prompt when manual context is whitespace only", async () => {
    const fetcher = vi.fn(
      async (_input: RequestInfo | URL, init?: RequestInit) => {
        const body = JSON.parse(String(init?.body));
        expect(body.input[0].content[0].text).toBe(
          "Provide an image description for the visually impaired that fits into 1300 characters or less.",
        );
        return new Response(
          JSON.stringify({
            output: [{ content: [{ type: "output_text", text: "Done." }] }],
          }),
          { status: 200 },
        );
      },
    );
    const provider = createDescriptionProvider(
      {
        baseUrl: "https://api.example.test",
        model: "vision-model",
        authentication: "none",
        apiKey: "",
      },
      fetcher,
    );

    await provider.describe({
      image: new Blob(["pixels"], { type: "image/png" }),
      context: " \n\t ",
      signal: new AbortController().signal,
    });
  });
});
