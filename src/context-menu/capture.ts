export type ImageBounds = {
  left: number;
  top: number;
  width: number;
  height: number;
  viewportWidth: number;
  viewportHeight: number;
};

export type ImageSize = {
  width: number;
  height: number;
};

export type CropRect = {
  left: number;
  top: number;
  width: number;
  height: number;
};

export type SelectedImage = {
  tabId: number;
  windowId?: number;
  frameId?: number;
  targetElementId: number;
};

type ScriptExecutor = {
  executeScript(details: {
    target: { tabId: number; frameIds: number[] };
    func: (targetElementId: number) => unknown;
    args: [number];
  }): Promise<Array<{ result?: unknown }>>;
};

type TabCapture = {
  captureVisibleTab(
    windowId: number | undefined,
    options: { format: "png" },
  ): Promise<string>;
};

export type CaptureDependencies = {
  scripting: ScriptExecutor;
  tabs: TabCapture;
  cropCapturedImage?: typeof cropCapturedImage;
};

export function computeCropRect(
  bounds: ImageBounds,
  image: ImageSize,
): CropRect {
  const scaleX = image.width / bounds.viewportWidth;
  const scaleY = image.height / bounds.viewportHeight;
  const left = clamp(Math.floor(bounds.left * scaleX), 0, image.width);
  const top = clamp(Math.floor(bounds.top * scaleY), 0, image.height);
  const right = clamp(
    Math.ceil((bounds.left + bounds.width) * scaleX),
    left,
    image.width,
  );
  const bottom = clamp(
    Math.ceil((bounds.top + bounds.height) * scaleY),
    top,
    image.height,
  );
  return {
    left,
    top,
    width: right - left,
    height: bottom - top,
  };
}

export async function resolveSelectedImageBounds(
  selection: SelectedImage,
  scripting: ScriptExecutor,
): Promise<ImageBounds> {
  const results = await scripting.executeScript({
    target: {
      tabId: selection.tabId,
      frameIds: [selection.frameId ?? 0],
    },
    func: getImageBounds,
    args: [selection.targetElementId],
  });
  const bounds = results[0]?.result;
  if (!isImageBounds(bounds)) {
    throw new Error("Firefox could not resolve the selected image.");
  }
  return bounds;
}

export async function captureSelectedImage(
  selection: SelectedImage,
  dependencies: CaptureDependencies,
): Promise<Blob> {
  const bounds = await resolveSelectedImageBounds(
    selection,
    dependencies.scripting,
  );
  const capture = await dependencies.tabs.captureVisibleTab(
    selection.windowId,
    {
      format: "png",
    },
  );
  const crop = dependencies.cropCapturedImage ?? cropCapturedImage;
  return crop(capture, bounds);
}

export async function cropCapturedImage(
  dataUrl: string,
  bounds: ImageBounds,
): Promise<Blob> {
  if (!dataUrl.startsWith("data:image/")) {
    throw new Error("Firefox returned an invalid image capture.");
  }
  const response = await fetch(dataUrl);
  const source = await response.blob();
  const bitmap = await createImageBitmap(source);
  try {
    const rect = computeCropRect(bounds, bitmap);
    if (rect.width === 0 || rect.height === 0) {
      throw new Error("The selected image is not visible in the capture.");
    }
    const canvas = new OffscreenCanvas(rect.width, rect.height);
    const context = canvas.getContext("2d");
    if (!context) {
      throw new Error("Firefox could not crop the selected image.");
    }
    context.drawImage(
      bitmap,
      rect.left,
      rect.top,
      rect.width,
      rect.height,
      0,
      0,
      rect.width,
      rect.height,
    );
    return await canvas.convertToBlob({ type: "image/png" });
  } finally {
    bitmap.close();
  }
}

function isImageBounds(value: unknown): value is ImageBounds {
  if (!value || typeof value !== "object") {
    return false;
  }
  const bounds = value as Record<string, unknown>;
  return [
    "left",
    "top",
    "width",
    "height",
    "viewportWidth",
    "viewportHeight",
  ].every((key) => typeof bounds[key] === "number");
}

function getImageBounds(targetElementId: number): ImageBounds {
  const target = browser.menus.getTargetElement(targetElementId);
  if (!(target instanceof HTMLImageElement)) {
    throw new Error("The selected context-menu target is not an image.");
  }
  const rect = target.getBoundingClientRect();
  let left = rect.left;
  let top = rect.top;
  let frame = window.frameElement;
  while (frame) {
    const frameRect = frame.getBoundingClientRect();
    left += frameRect.left;
    top += frameRect.top;
    frame = frame.ownerDocument.defaultView?.frameElement ?? null;
  }
  return {
    left,
    top,
    width: rect.width,
    height: rect.height,
    viewportWidth: window.top?.innerWidth ?? window.innerWidth,
    viewportHeight: window.top?.innerHeight ?? window.innerHeight,
  };
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(Math.max(value, minimum), maximum);
}
