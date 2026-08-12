export async function requestProviderOriginAccess(
  baseUrl: URL,
): Promise<boolean> {
  try {
    return await browser.permissions.request({
      origins: [providerOriginPattern(baseUrl)],
    });
  } catch {
    return false;
  }
}

export async function revokeProviderOriginAccess(
  baseUrl: URL,
): Promise<boolean> {
  try {
    return await browser.permissions.remove({
      origins: [providerOriginPattern(baseUrl)],
    });
  } catch {
    return false;
  }
}

export function providerOriginPattern(baseUrl: URL): string {
  // Firefox match patterns do not support ports. The permission therefore
  // covers the host, while the provider request itself still uses baseUrl.port.
  return `${baseUrl.protocol}//${baseUrl.hostname}/*`;
}
