import { describe, expect, it } from "vitest";
import { validateProviderUrl } from "../src/provider/url";

describe("provider URL policy", () => {
  it("accepts an HTTPS provider URL", () => {
    expect(validateProviderUrl("https://api.example.test/v1")).toEqual({
      valid: true,
      url: new URL("https://api.example.test/v1"),
    });
  });

  it.each(["localhost", "127.0.0.1", "[::1]"])(
    "accepts HTTP for loopback host %s",
    (host) => {
      expect(validateProviderUrl(`http://${host}:1234`)).toEqual({
        valid: true,
        url: new URL(`http://${host}:1234`),
      });
    },
  );

  it("rejects plain HTTP for a non-loopback host", () => {
    expect(validateProviderUrl("http://insecure.example.test")).toEqual({
      valid: false,
      message: "Use HTTPS unless the provider runs on localhost.",
    });
  });
});
