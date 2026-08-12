import type { ProviderConfig } from "./config";

export type DescriptionRequest = {
  image: Blob;
  context?: string;
  signal: AbortSignal;
};

export type DescriptionProvider = {
  describe(request: DescriptionRequest): Promise<string>;
};

export class ProviderError extends Error {
  constructor(
    public readonly code: "network" | "http" | "invalid-response",
    message: string,
  ) {
    super(message);
    this.name = "ProviderError";
  }
}

export const baseDescriptionPrompt =
  "Write concise alt text for blind and low-vision readers, using the supplied context to identify what matters. Describe the essential subjects, actions, setting, and relevant visible text. For diagrams or charts, give the main takeaway and describe important labels, values, elements, and relationships. Do not speculate about details that are unclear. Return only the description, in plain language, under 1,300 characters.";

export function createDescriptionProvider(
  config: ProviderConfig,
  fetcher: typeof fetch = fetch,
): DescriptionProvider {
  return {
    async describe(request): Promise<string> {
      const imageUrl = await blobToDataUrl(request.image);
      const headers: HeadersInit = { "Content-Type": "application/json" };
      if (config.authentication === "bearer") {
        headers.Authorization = `Bearer ${config.apiKey}`;
      }
      let response: Response;
      try {
        response = await fetcher(responsesEndpoint(config.baseUrl), {
          method: "POST",
          headers,
          body: JSON.stringify({
            model: config.model,
            input: [
              {
                role: "user",
                content: [
                  { type: "input_text", text: buildPrompt(request.context) },
                  { type: "input_image", image_url: imageUrl },
                ],
              },
            ],
          }),
          signal: request.signal,
        });
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          throw error;
        }
        throw new ProviderError(
          "network",
          "The provider could not be reached.",
        );
      }
      if (!response.ok) {
        throw new ProviderError("http", "The provider rejected the request.");
      }
      let payload: ResponsesPayload;
      try {
        payload = (await response.json()) as ResponsesPayload;
      } catch {
        throw new ProviderError(
          "invalid-response",
          "The provider returned invalid data.",
        );
      }
      return extractDescription(payload);
    },
  };
}

function responsesEndpoint(baseUrl: string): string {
  const normalizedBaseUrl = baseUrl.replace(/\/+$/, "");
  return /\/v1$/i.test(normalizedBaseUrl)
    ? `${normalizedBaseUrl}/responses`
    : `${normalizedBaseUrl}/v1/responses`;
}

export function buildPrompt(context?: string): string {
  const trimmedContext = context?.trim();
  if (!trimmedContext) {
    return baseDescriptionPrompt;
  }
  return `${baseDescriptionPrompt}\n\nThe user provides the following additional context: ${trimmedContext}`;
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
    throw new ProviderError(
      "invalid-response",
      "The provider returned no description.",
    );
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
