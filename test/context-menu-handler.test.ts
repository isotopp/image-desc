import { describe, expect, it, vi } from "vitest";
import type { ImageBounds } from "../src/context-menu/capture";
import {
  consumePendingSelection,
  handleContextMenuClick,
} from "../src/context-menu/handler";

const bounds: ImageBounds = {
  left: 0,
  top: 0,
  width: 100,
  height: 100,
  viewportWidth: 100,
  viewportHeight: 100,
};

describe("selected image context-menu handler", () => {
  it("captures the selected tab image, stores it transiently, and opens the sidebar", async () => {
    const image = new Blob(["cropped image"], { type: "image/png" });
    const open = vi.fn(async () => undefined);
    const captureVisibleTab = vi.fn(
      async () => "data:image/png;base64,capture",
    );
    const executeScript = async () => [{ result: bounds }];

    await handleContextMenuClick(
      {
        menuItemId: "describe-image",
        targetElementId: 99,
        frameId: 2,
        tab: { id: 7, windowId: 3 },
      },
      {
        scripting: { executeScript },
        tabs: { captureVisibleTab },
        cropCapturedImage: async () => image,
        sidebarAction: { open },
      },
    );

    expect(captureVisibleTab).toHaveBeenCalledWith(3, { format: "png" });
    expect(open).toHaveBeenCalledOnce();
    expect(consumePendingSelection()).toEqual({ image });
  });

  it("opens the sidebar with an inline capture failure", async () => {
    const open = vi.fn(async () => undefined);

    await handleContextMenuClick(
      {
        menuItemId: "describe-image",
        tab: { id: 7, windowId: 3 },
      },
      {
        scripting: {
          executeScript: vi.fn(async () => []),
        },
        tabs: {
          captureVisibleTab: vi.fn(async () => "never used"),
        },
        sidebarAction: { open },
      },
    );

    expect(open).toHaveBeenCalledOnce();
    expect(consumePendingSelection()).toEqual({
      error: "Could not capture the selected image.",
    });
  });
});
