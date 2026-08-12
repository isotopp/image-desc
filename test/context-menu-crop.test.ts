import { describe, expect, it, vi } from "vitest";
import {
  captureSelectedImage,
  computeCropRect,
  resolveSelectedImageBounds,
  type ImageBounds,
} from "../src/context-menu/capture";

describe("context-menu image crop", () => {
  it("converts CSS bounds to capture pixels using the capture scale", () => {
    const bounds: ImageBounds = {
      left: 100,
      top: 50,
      width: 400,
      height: 300,
      viewportWidth: 1200,
      viewportHeight: 800,
    };

    expect(computeCropRect(bounds, { width: 2400, height: 1600 })).toEqual({
      left: 200,
      top: 100,
      width: 800,
      height: 600,
    });
  });

  it("clamps a partially visible target to the captured viewport", () => {
    const bounds: ImageBounds = {
      left: -20,
      top: 700,
      width: 200,
      height: 200,
      viewportWidth: 1200,
      viewportHeight: 800,
    };

    expect(computeCropRect(bounds, { width: 1200, height: 800 })).toEqual({
      left: 0,
      top: 700,
      width: 180,
      height: 100,
    });
  });

  it("resolves the target in only the selected frame", async () => {
    const bounds: ImageBounds = {
      left: 10,
      top: 20,
      width: 30,
      height: 40,
      viewportWidth: 100,
      viewportHeight: 100,
    };
    const executeScript = async (details: unknown) => {
      expect(details).toMatchObject({
        target: { tabId: 7, frameIds: [2] },
        args: [99],
      });
      return [{ result: bounds }];
    };

    await expect(
      resolveSelectedImageBounds(
        { tabId: 7, frameId: 2, targetElementId: 99 },
        { executeScript },
      ),
    ).resolves.toEqual(bounds);
  });

  it("captures only the selected tab and crops the visible capture locally", async () => {
    const bounds: ImageBounds = {
      left: 10,
      top: 20,
      width: 30,
      height: 40,
      viewportWidth: 100,
      viewportHeight: 100,
    };
    const captureVisibleTab = vi.fn(
      async () => "data:image/png;base64,capture",
    );
    const cropCapturedImage = vi.fn(
      async (dataUrl: string, resolvedBounds: ImageBounds) => {
        expect(dataUrl).toBe("data:image/png;base64,capture");
        expect(resolvedBounds).toEqual(bounds);
        return new Blob(["cropped"], { type: "image/png" });
      },
    );
    const executeScript = async () => [{ result: bounds }];

    const image = await captureSelectedImage(
      { tabId: 7, windowId: 3, frameId: 2, targetElementId: 99 },
      {
        scripting: { executeScript },
        tabs: { captureVisibleTab },
        cropCapturedImage,
      },
    );

    expect(captureVisibleTab).toHaveBeenCalledWith(3, { format: "png" });
    expect(await image.text()).toBe("cropped");
  });
});
