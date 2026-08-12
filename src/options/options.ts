import { emptyProviderConfig, type ProviderConfig } from "../provider/config";
import {
  requestProviderOriginAccess,
  revokeProviderOriginAccess,
} from "../provider/permissions";
import { validateProviderUrl } from "../provider/url";

const form = requiredElement<HTMLFormElement>("#provider-form");
const baseUrl = requiredElement<HTMLInputElement>("#base-url");
const model = requiredElement<HTMLInputElement>("#model");
const authentication = requiredElement<HTMLSelectElement>("#authentication");
const apiKey = requiredElement<HTMLInputElement>("#api-key");
const removeProviderButton =
  requiredElement<HTMLButtonElement>("#remove-provider");
const status = requiredElement<HTMLElement>("#status");
let activeProviderConfig: ProviderConfig | undefined;

void loadConfiguration();

form.addEventListener("submit", (event) => {
  event.preventDefault();
  void saveConfiguration();
});

removeProviderButton.addEventListener("click", () => {
  void removeProvider();
});

async function loadConfiguration(): Promise<void> {
  const stored = await browser.storage.local.get(["providerConfig"]);
  const config = isProviderConfig(stored.providerConfig)
    ? stored.providerConfig
    : emptyProviderConfig;
  activeProviderConfig = config.baseUrl && config.model ? config : undefined;
  applyConfiguration(config);
}

async function saveConfiguration(): Promise<void> {
  const urlValidation = validateProviderUrl(baseUrl.value.trim());
  if (!urlValidation.valid) {
    status.textContent = urlValidation.message;
    return;
  }

  const originGranted = await requestProviderOriginAccess(urlValidation.url);
  if (!originGranted) {
    status.textContent = "Provider access was not granted.";
    return;
  }

  const config: ProviderConfig = {
    baseUrl: baseUrl.value.trim(),
    model: model.value.trim(),
    authentication: authentication.value === "bearer" ? "bearer" : "none",
    apiKey: apiKey.value,
  };
  await browser.storage.local.set({ providerConfig: config });
  const previousConfig = activeProviderConfig;
  activeProviderConfig = config;
  const oldOrigin = previousConfig && providerUrl(previousConfig);
  const newOrigin = providerUrl(config);
  if (oldOrigin && newOrigin && oldOrigin.origin !== newOrigin.origin) {
    const revoked = await revokeProviderOriginAccess(oldOrigin);
    if (!revoked) {
      status.textContent =
        "Provider settings saved; previous origin access could not be revoked.";
      return;
    }
  }
  status.textContent = "Provider settings saved.";
}

async function removeProvider(): Promise<void> {
  const previousConfig = activeProviderConfig;
  await browser.storage.local.remove(["providerConfig"]);
  activeProviderConfig = undefined;
  applyConfiguration(emptyProviderConfig);
  const oldOrigin = previousConfig && providerUrl(previousConfig);
  if (oldOrigin) {
    const revoked = await revokeProviderOriginAccess(oldOrigin);
    if (!revoked) {
      status.textContent =
        "Provider removed; previous origin access could not be revoked.";
      return;
    }
  }
  status.textContent = "Provider removed.";
}

function providerUrl(config: ProviderConfig): URL | undefined {
  const validation = validateProviderUrl(config.baseUrl);
  return validation.valid ? validation.url : undefined;
}

function applyConfiguration(config: ProviderConfig): void {
  baseUrl.value = config.baseUrl;
  model.value = config.model;
  authentication.value = config.authentication;
  apiKey.value = config.apiKey;
}

function isProviderConfig(value: unknown): value is ProviderConfig {
  if (!value || typeof value !== "object") {
    return false;
  }
  const config = value as Record<string, unknown>;
  return (
    typeof config.baseUrl === "string" &&
    typeof config.model === "string" &&
    (config.authentication === "none" || config.authentication === "bearer") &&
    typeof config.apiKey === "string"
  );
}

function requiredElement<T extends Element>(selector: string): T {
  const element = document.querySelector<T>(selector);
  if (!element) {
    throw new Error(`Options markup is missing ${selector}.`);
  }
  return element;
}
