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

export function providerOriginPattern(baseUrl: URL): string {
  return `${baseUrl.origin}/*`;
}
