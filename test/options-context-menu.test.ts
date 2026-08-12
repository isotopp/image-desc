// @vitest-environment jsdom

import { beforeEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";

const storage = {
  get: vi.fn(async () => ({})),
  set: vi.fn(async () => undefined),
};
const request = vi.fn(async () => true);
const remove = vi.fn(async () => true);
const create = vi.fn(async () => "describe-image");
const removeMenu = vi.fn(async () => undefined);

beforeEach(() => {
  vi.resetModules();
  storage.get.mockReset().mockResolvedValue({});
  storage.set.mockReset().mockResolvedValue(undefined);
  request.mockReset().mockResolvedValue(true);
  remove.mockReset().mockResolvedValue(true);
  create.mockReset().mockResolvedValue("describe-image");
  removeMenu.mockReset().mockResolvedValue(undefined);
  vi.stubGlobal("browser", {
    storage: { local: storage },
    permissions: { request, remove },
    contextMenus: { create, remove: removeMenu },
  });
  const html = readFileSync("src/options/options.html", "utf8");
  document.body.innerHTML = html.slice(
    html.indexOf("<body>") + 6,
    html.indexOf("</body>"),
  );
});

async function loadOptions(): Promise<HTMLInputElement> {
  await import("../src/options/options");
  const checkbox = document.querySelector<HTMLInputElement>(
    "#enable-context-menu",
  );
  if (!checkbox) {
    throw new Error("Context-menu option markup is incomplete.");
  }
  return checkbox;
}

async function settle(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 0));
}

describe("optional image context menu", () => {
  it("requests the minimum permissions and creates an image menu when enabled", async () => {
    const checkbox = await loadOptions();

    checkbox.click();
    await settle();

    expect(request).toHaveBeenCalledWith({
      permissions: ["activeTab", "scripting"],
    });
    expect(create).toHaveBeenCalledWith({
      id: "describe-image",
      title: "Describe this image",
      contexts: ["image"],
    });
    expect(checkbox.checked).toBe(true);
    expect(document.querySelector("#status")?.textContent).toBe(
      "Image context menu enabled.",
    );
    expect(storage.set).toHaveBeenCalledWith({ contextMenuEnabled: true });
  });

  it("leaves the option disabled when permission is denied", async () => {
    request.mockResolvedValue(false);
    const checkbox = await loadOptions();

    checkbox.click();
    await settle();

    expect(checkbox.checked).toBe(false);
    expect(create).not.toHaveBeenCalled();
    expect(document.querySelector("#status")?.textContent).toBe(
      "Image context menu permission was not granted.",
    );
    expect(storage.set).toHaveBeenCalledWith({ contextMenuEnabled: false });
  });

  it("removes the menu and releases optional permissions when disabled", async () => {
    const checkbox = await loadOptions();

    checkbox.click();
    await settle();
    checkbox.click();
    await settle();

    expect(removeMenu).toHaveBeenCalledWith("describe-image");
    expect(remove).toHaveBeenCalledWith({
      permissions: ["activeTab", "scripting"],
    });
    expect(checkbox.checked).toBe(false);
    expect(document.querySelector("#status")?.textContent).toBe(
      "Image context menu disabled.",
    );
    expect(storage.set).toHaveBeenLastCalledWith({ contextMenuEnabled: false });
  });

  it("still attempts permission release when the menu is already absent", async () => {
    storage.get.mockResolvedValue({ contextMenuEnabled: true });
    removeMenu.mockRejectedValue(new Error("menu already absent"));
    const checkbox = await loadOptions();

    checkbox.checked = false;
    checkbox.dispatchEvent(new Event("change"));
    await settle();

    expect(remove).toHaveBeenCalledWith({
      permissions: ["activeTab", "scripting"],
    });
    expect(document.querySelector("#status")?.textContent).toBe(
      "Could not disable the image context menu.",
    );
  });
});
