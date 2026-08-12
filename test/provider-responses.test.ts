import { describe, expect, it, vi } from "vitest";
import { createDescriptionProvider } from "../src/provider/responses";

const expectedBasePrompt =
  "Write concise alt text for blind and low-vision readers, using the supplied context to identify what matters. Describe the essential subjects, actions, setting, and relevant visible text. For diagrams or charts, give the main takeaway and describe important labels, values, elements, and relationships. Do not speculate about details that are unclear. Return only the description, in plain language, under 1,300 characters.";

describe("Responses API description provider", () => {
  it("sends one image request and returns the response text", async () => {
    const fetcher = responseFetcher("A clear description.");
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
    const [input, init] = fetcher.mock.calls[0];
    expect(input).toBe("https://api.example.test/v1/responses");
    const body = JSON.parse(String(init?.body));
    expect(body.model).toBe("vision-model");
    expect(body.input[0].content).toEqual([
      {
        type: "input_text",
        text: expectedBasePrompt,
      },
      {
        type: "input_image",
        image_url: "data:image/png;base64,cGl4ZWxz",
      },
    ]);
  });

  it("does not duplicate a /v1 path when it is included in the base URL", async () => {
    const fetcher = vi.fn(async (input: RequestInfo | URL) => {
      expect(input).toBe("http://localhost:1234/v1/responses");
      return new Response(
        JSON.stringify({
          output: [{ content: [{ type: "output_text", text: "Done." }] }],
        }),
        { status: 200 },
      );
    });
    const provider = createDescriptionProvider(
      {
        baseUrl: "http://localhost:1234/v1",
        model: "vision-model",
        authentication: "none",
        apiKey: "",
      },
      fetcher,
    );

    await provider.describe({
      image: new Blob(["pixels"], { type: "image/png" }),
      signal: new AbortController().signal,
    });
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
    const fetcher = responseFetcher("Done.");
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

    const body = requestBody(fetcher.mock.calls[0]?.[1]);
    expect(body.input[0].content[0].text).toMatch(
      /\n\nThe user provides the following additional context: A birthday post\.$/,
    );
  });

  it("keeps the base prompt when manual context is whitespace only", async () => {
    const fetcher = responseFetcher("Done.");
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

    const body = requestBody(fetcher.mock.calls[0]?.[1]);
    expect(body.input[0].content[0].text).not.toContain(
      "The user provides the following additional context:",
    );
  });
});

function descriptionResponse(text: string): Response {
  return new Response(
    JSON.stringify({
      output: [{ content: [{ type: "output_text", text }] }],
    }),
    { status: 200 },
  );
}

function responseFetcher(text: string) {
  return vi.fn<typeof fetch>(async () => descriptionResponse(text));
}

type ProviderRequestBody = {
  input: Array<{ content: Array<{ text: string }> }>;
};

function requestBody(init?: RequestInit): ProviderRequestBody {
  return JSON.parse(String(init?.body));
}
