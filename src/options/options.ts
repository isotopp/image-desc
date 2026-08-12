import { emptyProviderConfig, type ProviderConfig } from "../provider/config";
import { validateProviderUrl } from "../provider/url";

const form = requiredElement<HTMLFormElement>("#provider-form");
const baseUrl = requiredElement<HTMLInputElement>("#base-url");
const model = requiredElement<HTMLInputElement>("#model");
const authentication = requiredElement<HTMLSelectElement>("#authentication");
const apiKey = requiredElement<HTMLInputElement>("#api-key");
const status = requiredElement<HTMLElement>("#status");

void loadConfiguration();

form.addEventListener("submit", (event) => {
  event.preventDefault();
  void saveConfiguration();
});

async function loadConfiguration(): Promise<void> {
  const stored = await browser.storage.local.get(["providerConfig"]);
  const config = isProviderConfig(stored.providerConfig)
    ? stored.providerConfig
    : emptyProviderConfig;
  applyConfiguration(config);
}

async function saveConfiguration(): Promise<void> {
  const urlValidation = validateProviderUrl(baseUrl.value.trim());
  if (!urlValidation.valid) {
    status.textContent = urlValidation.message;
    return;
  }

  const config: ProviderConfig = {
    baseUrl: baseUrl.value.trim(),
    model: model.value.trim(),
    authentication: authentication.value === "bearer" ? "bearer" : "none",
    apiKey: apiKey.value,
  };
  await browser.storage.local.set({ providerConfig: config });
  status.textContent = "Provider settings saved.";
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
