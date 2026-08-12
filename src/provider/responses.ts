import type { ProviderConfig } from "./config";

export type DescriptionRequest = {
  image: Blob;
  context?: string;
  signal: AbortSignal;
};

export type DescriptionProvider = {
  describe(request: DescriptionRequest): Promise<string>;
};

export const baseDescriptionPrompt =
  "Provide an image description for the visually impaired that fits into 1300 characters or less.";

export function createDescriptionProvider(
  config: ProviderConfig,
  fetcher: typeof fetch = fetch,
): DescriptionProvider {
  return {
    async describe(request): Promise<string> {
      const imageUrl = await blobToDataUrl(request.image);
      const response = await fetcher(
        `${config.baseUrl.replace(/\/$/, "")}/v1/responses`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model: config.model,
            input: [
              {
                role: "user",
                content: [
                  { type: "input_text", text: baseDescriptionPrompt },
                  { type: "input_image", image_url: imageUrl },
                ],
              },
            ],
          }),
          signal: request.signal,
        },
      );
      const payload = (await response.json()) as ResponsesPayload;
      return extractDescription(payload);
    },
  };
}

type ResponsesPayload = {
  output?: Array<{
    type?: string;
    content?: Array<{ type?: string; text?: string }>;
  }>;
};

function extractDescription(payload: ResponsesPayload): string {
  const text = payload.output
    ?.flatMap((item) => item.content ?? [])
    .find((item) => item.type === "output_text")?.text;
  if (!text) {
    throw new Error("The provider returned no description.");
  }
  return text;
}

async function blobToDataUrl(blob: Blob): Promise<string> {
  const bytes = new Uint8Array(await blob.arrayBuffer());
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return `data:${blob.type || "application/octet-stream"};base64,${btoa(binary)}`;
}
