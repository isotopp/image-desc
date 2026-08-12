export type ProviderUrlValidation =
  { valid: true; url: URL } | { valid: false; message: string };

export function validateProviderUrl(value: string): ProviderUrlValidation {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return { valid: false, message: "Enter a valid provider URL." };
  }

  if (url.protocol === "https:") {
    return { valid: true, url };
  }

  if (url.protocol === "http:" && isLoopbackHostname(url.hostname)) {
    return { valid: true, url };
  }

  return {
    valid: false,
    message: "Use HTTPS unless the provider runs on localhost.",
  };
}

function isLoopbackHostname(hostname: string): boolean {
  return (
    hostname === "localhost" || hostname === "127.0.0.1" || hostname === "[::1]"
  );
}
