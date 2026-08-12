const contextMenuId = "describe-image";
const contextMenuPermissions = ["menus", "activeTab", "scripting"];

export async function enableImageContextMenu(): Promise<boolean> {
  try {
    const granted = await browser.permissions.request({
      permissions: contextMenuPermissions,
    });
    if (!granted) {
      return false;
    }
    return createImageContextMenu();
  } catch {
    return false;
  }
}

export async function createImageContextMenu(): Promise<boolean> {
  try {
    await browser.contextMenus.create({
      id: contextMenuId,
      title: "Describe this image",
      contexts: ["image"],
    });
    return true;
  } catch {
    return false;
  }
}

export async function disableImageContextMenu(): Promise<boolean> {
  let menuRemoved = true;
  try {
    await browser.contextMenus.remove(contextMenuId);
  } catch {
    menuRemoved = false;
  }

  let permissionsRemoved: boolean;
  try {
    permissionsRemoved = await browser.permissions.remove({
      permissions: contextMenuPermissions,
    });
  } catch {
    permissionsRemoved = false;
  }
  return menuRemoved && permissionsRemoved;
}
