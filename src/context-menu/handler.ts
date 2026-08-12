import {
  captureSelectedImage,
  type CaptureDependencies,
  type SelectedImage,
} from "./capture";

export type ContextMenuClickInfo = {
  menuItemId: string | number;
  targetElementId?: number;
  frameId?: number;
  tab?: {
    id?: number;
    windowId?: number;
  };
};

export type PendingSelection = {
  image?: Blob;
  error?: string;
};

type HandlerDependencies = CaptureDependencies & {
  sidebarAction: {
    open(): Promise<void>;
  };
};

let pendingSelection: PendingSelection | undefined;

export async function handleContextMenuClick(
  info: ContextMenuClickInfo,
  dependencies: HandlerDependencies,
): Promise<void> {
  if (info.menuItemId !== "describe-image") {
    return;
  }

  let selection: SelectedImage | undefined;
  if (info.tab?.id !== undefined && info.targetElementId !== undefined) {
    selection = {
      tabId: info.tab.id,
      windowId: info.tab.windowId,
      frameId: info.frameId,
      targetElementId: info.targetElementId,
    };
  }

  if (!selection) {
    pendingSelection = { error: "Could not capture the selected image." };
  } else {
    try {
      pendingSelection = {
        image: await captureSelectedImage(selection, dependencies),
      };
    } catch {
      pendingSelection = { error: "Could not capture the selected image." };
    }
  }
  await dependencies.sidebarAction.open();
}

export function consumePendingSelection(): PendingSelection | undefined {
  const selection = pendingSelection;
  pendingSelection = undefined;
  return selection;
}
