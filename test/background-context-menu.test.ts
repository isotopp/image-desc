import { beforeEach, describe, expect, it, vi } from "vitest";

beforeEach(() => {
  vi.resetModules();
});

describe("background context-menu wiring", () => {
  it("registers a listener for image menu selections and pending-image reads", async () => {
    const actionAddListener = vi.fn();
    const contextMenuAddListener = vi.fn();
    const messageAddListener = vi.fn();
    vi.stubGlobal("browser", {
      action: { onClicked: { addListener: actionAddListener } },
      sidebarAction: { open: vi.fn(async () => undefined) },
      contextMenus: {
        onClicked: { addListener: contextMenuAddListener },
      },
      runtime: { onMessage: { addListener: messageAddListener } },
    });

    await import("../src/background");

    expect(actionAddListener).toHaveBeenCalledOnce();
    expect(contextMenuAddListener).toHaveBeenCalledOnce();
    expect(messageAddListener).toHaveBeenCalledOnce();
  });
});
