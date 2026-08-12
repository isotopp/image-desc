export type ProviderConfig = {
  baseUrl: string;
  model: string;
  authentication: "none" | "bearer";
  apiKey: string;
};

export const emptyProviderConfig: ProviderConfig = {
  baseUrl: "",
  model: "",
  authentication: "none",
  apiKey: "",
};
