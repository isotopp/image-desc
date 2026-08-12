import {
  consumePendingSelection,
  handleContextMenuClick,
  type ContextMenuClickInfo,
} from "./context-menu/handler";
import { createImageContextMenu } from "./context-menu/feature";

browser.action.onClicked.addListener(() => browser.sidebarAction.open());

browser.contextMenus.onClicked.addListener((info, tab) => {
  void handleContextMenuClick(
    { ...(info as ContextMenuClickInfo), tab: tab ?? undefined },
    {
      scripting: browser.scripting,
      tabs: browser.tabs,
      sidebarAction: browser.sidebarAction,
    },
  );
});

browser.runtime.onMessage.addListener((message) => {
  if (
    typeof message === "object" &&
    message !== null &&
    "type" in message &&
    message.type === "get-pending-image"
  ) {
    return consumePendingSelection() ?? {};
  }
  return undefined;
});

void restoreStoredContextMenu();

async function restoreStoredContextMenu(): Promise<void> {
  try {
    const stored = await browser.storage.local.get(["contextMenuEnabled"]);
    if (stored.contextMenuEnabled === true) {
      await createImageContextMenu();
    }
  } catch {
    // Optional context-menu permissions may not be granted.
  }
}
