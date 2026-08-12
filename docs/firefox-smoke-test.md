# Firefox smoke-test checklist

Run the automated checks first:

```text
npm test
npm run lint
npm run typecheck
npm run format:check
npm run build
```

Then use a clean Firefox profile or **This Firefox** in `about:debugging`.

## Temporary installation and sidebar

- [ ] Load `build/manifest.json` with **Load Temporary Add-on**.
- [ ] Select the toolbar action and confirm the Image Description sidebar opens.
- [ ] Reload the add-on after a rebuild and confirm the sidebar still opens.
- [ ] Confirm the manifest has no required clipboard, page, tab, history, cookie,
      or broad host permission; its only default host entries are loopback and
      `https://api.openai.com/*`.

## Provider configuration and request

- [ ] Open the extension's **Options** page.
- [ ] Save an OpenAI provider and confirm its predeclared host access works without
      a save-time origin prompt. Save another HTTPS provider and confirm Firefox
      asks for that configured origin only.
- [ ] For local development, save an `http://localhost`, `http://127.0.0.1`, or
      `http://[::1]` provider and confirm it is accepted.
- [ ] Copy an image in a normal Firefox tab, paste it into **Paste an image here**,
      and confirm the preview appears without a clipboard permission prompt.
- [ ] Enter **Additional context**, select **Describe image**, and inspect the
      provider request: it is `POST <base-url>/v1/responses`, includes the selected
      image and the 1300-character prompt, and uses the configured model/auth mode.
- [ ] Confirm the generated description is selectable ordinary text.

## Cancellation, timeout, and copy

- [ ] Start a request to a deliberately slow provider, select **Cancel**, and
      confirm the status is **Canceled.**, the image/context remain, and **Describe
      image** is enabled again.
- [ ] Start a request that never completes, wait 120 seconds (or use a test
      provider/debug build), and confirm **Request timed out.** and an enabled
      **Describe image** action.
- [ ] Select **Copy description** and paste into a text editor; confirm the copied
      text exactly matches the visible description.
- [ ] Deny or block clipboard writing and confirm the sidebar shows **Could not copy
      the description.** without an unhandled error.
- [ ] Reload or close the sidebar and confirm the image, context, and description
      are gone.

## Optional right-click workflow

- [ ] In **Options**, review the access explanation and enable **Describe this
      image** for image context menus.
- [ ] Confirm the extension's install-time permission list contains only the
      context-menu API permission for this feature; when enabling the option,
      Firefox requests only `activeTab` and `scripting`. Deny that request once
      and confirm the checkbox remains off and no menu is created.
- [ ] With permission granted, right-click one image and choose **Describe this
      image**. Confirm the sidebar opens with only that image selected.
- [ ] Confirm the provider request contains the local crop of the selected image,
      with no page text, URL, cookies, or neighboring images.
- [ ] Right-click an image that Firefox cannot capture and confirm the sidebar shows
      **Could not capture the selected image.** without inspecting page content.
- [ ] Disable the option and confirm the menu is removed and the optional
      permissions are released where Firefox permits.

## Failure and permission boundaries

- [ ] Stop or reject the provider request and confirm the failure is inline, does
      not show credentials or image data, and permits an immediate retry.
- [ ] Change the provider origin and confirm the new origin is requested while the
      old origin is released when Firefox permits.
- [ ] Remove the provider and confirm its stored values disappear and its origin
      access is released when Firefox permits.
