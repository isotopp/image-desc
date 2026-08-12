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
});
