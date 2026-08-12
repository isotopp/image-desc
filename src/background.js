"use strict";

browser.action.onClicked.addListener(async () => {
  await browser.sidebarAction.open();
});
