# Image Description

Image Description is a Firefox extension that creates a short description of an
image for visually impaired readers. You choose the image, choose when to send
it, and choose which image-description service receives it.

This guide is for people installing and using the extension. Developers should
read [AGENTS.md](AGENTS.md) for the architecture, source checkout, build, test,
formatting, packaging, TDD, and contribution instructions.

## Before you begin

You need:

- Firefox.
- Either a packaged extension archive supplied by the project, or a copy of the
  built extension folder.
- Access to an OpenAI-compatible image-capable service, such as a local LM Studio
  server or a hosted service. The service must support `POST /v1/responses`.

There are two ways to install the extension:

- **Temporary installation** is useful for trying a local build. Firefox removes
  it when Firefox restarts, so you load it again after each restart.
- **Permanent installation** requires a package signed by Mozilla in normal Firefox
  Release builds. A local unsigned package can be installed permanently only in a
  suitable development Firefox such as Developer Edition or Nightly.

For more background, see Mozilla's [temporary installation
guide](https://extensionworkshop.com/documentation/develop/temporary-installation-in-firefox/)
and [add-on signing information](https://support.mozilla.org/en-US/kb/add-signing-firefox).

## Temporary installation from a local file

Use this method when you have a project build folder or an unsigned package.

1. Start Firefox.
2. Open `about:debugging` in a new tab. You can type it into the address bar and
   press Enter.
3. Select **This Firefox** in the left-hand navigation.
4. Select **Load Temporary Add-on…**.
5. In the file chooser, select one of the following:
   - `build/manifest.json` if you were given the complete built `build` folder.
   - A packaged `.zip` or `.xpi` file if you were given an extension archive.
6. Confirm the extension appears in the temporary extensions list.
7. Select the Image Description toolbar button to open its sidebar. If the button
   is not visible, open Firefox's Extensions menu, find Image Description, and pin
   it to the toolbar.

The temporary extension remains available until Firefox closes or you remove it
from `about:debugging`. After a Firefox restart, repeat these steps. If the files
were rebuilt while Firefox was running, return to `about:debugging` and select
**Reload** for Image Description.

If you downloaded only the source files and there is no `build/manifest.json` or
packaged archive, the source is not directly installable. Ask for a built package;
developer build instructions belong in [AGENTS.md](AGENTS.md).

## Permanent installation in normal Firefox

Normal Firefox Release builds do not permanently install unsigned extensions. A
package produced locally from this project is unsigned. For a permanent install,
use a signed `.xpi` supplied by the project or downloaded from a trusted Mozilla
Add-ons distribution.

1. Obtain the signed `.xpi` file. Do not install an extension from an untrusted
   source.
2. Open Firefox's Add-ons Manager by entering `about:addons` in the address bar,
   or by opening the Firefox menu and selecting **Add-ons and themes**.
3. Select **Extensions** in the left-hand navigation.
4. Select the gear button near the top of the Extensions page.
5. Select **Install Add-on from file…**.
6. Choose the signed `.xpi` file and select **Open**.
7. Review the permissions Firefox displays, then select **Add** if you trust the
   package.
8. Pin Image Description to the toolbar if you want one-click sidebar access.

Mozilla also documents [installing an add-on from a
file](https://support.mozilla.org/en-US/kb/find-and-install-add-ons-add-features-to-firefox).

## Permanent installation for personal testing

If you own the computer and accept the security trade-off, Firefox Developer
Edition or Nightly can be configured to install an unsigned local package. This
is not recommended for a normal browsing profile, and the setting weakens a
Firefox installation's protection against unverified extensions.

1. Install Firefox Developer Edition or Firefox Nightly from Mozilla.
2. In that Firefox, open `about:config`.
3. Acknowledge the warning about changing advanced preferences.
4. Search for `xpinstall.signatures.required`.
5. Set the preference to `false`.
6. Open `about:addons`, select **Extensions**, select the gear button, and choose
   **Install Add-on from file…**.
7. Select the local `.xpi` package and confirm the installation.
8. Keep this development browser/profile separate from the Firefox profile used
   for ordinary browsing.

If Firefox reports that the package is unverified or corrupt, use a Mozilla-signed
`.xpi` in a normal Firefox Release build, or repeat the unsigned-install steps in
Developer Edition/Nightly. Do not disable signature checking in a profile that
needs normal browser security.

## Configure the image-description service

Configure the service after installing the extension and before selecting
**Describe image**.

1. Open `about:addons`.
2. Select **Extensions**.
3. Select **Image Description**.
4. Select the extension's **Options** or **Preferences** link. Firefox may show
   this link in the extension's details panel or in a gear menu.
5. In **Provider base URL**, enter the service's base address. Examples:
   - `http://localhost:1234` for a local service listening on port 1234.
   - `http://127.0.0.1:1234` for the same service through IPv4 loopback.
   - `https://provider.example` for a hosted HTTPS service.
6. In **Model identifier**, enter the exact vision-capable model name configured by
   your service.
7. In **Authentication mode**, select **No authentication** or **Bearer token**.
8. If you selected **Bearer token**, enter the API key in **API key**. The key is
   stored in Firefox's extension storage and is not shown in status messages.
9. Select **Save provider**.
10. Firefox asks for access to the provider origin. Review the origin and select
    **Allow** only if it is the service you intend to use.
11. Return to the sidebar.

The extension sends requests to `<provider base URL>/v1/responses` using the model
you entered. It asks for a description that fits within 1300 characters. A local
LM Studio server may accept no key or any key value, depending on its settings.
Plain HTTP is accepted only for `localhost`, `127.0.0.1`, and `[::1]`; other
providers must use HTTPS. The extension does not search the local network for a
service.

To change providers, return to **Options**, edit the fields, and select **Save
provider** again. Firefox may ask for the new origin. To remove the saved provider
and its stored key, select **Remove provider**.

## Create and copy a description

### Paste workflow

1. In a Firefox tab, copy an image using the website's normal context menu or
   another method you trust.
2. Select the Image Description toolbar button to open the sidebar.
3. Click **Paste an image here** so the paste target has focus.
4. Paste with `Ctrl`+`V` on Windows/Linux or `Command`+`V` on macOS.
5. Check that the **Selected image** preview is the image you intended to use.
6. If useful, enter information in **Additional context**, such as a person's
   name or the purpose of the image.
7. Select **Describe image**. The status changes to **Creating description…**.
8. While the request is running, select **Cancel** if you no longer want to wait.
   A request that runs for 120 seconds ends with a timeout automatically.
9. Read or select the generated text in the **Description** section.
10. Select **Copy description** when you want to place exactly that text on the
    clipboard. Copying never happens automatically.

The extension reads an image only from the paste gesture you make in its sidebar.
It does not read the clipboard in the background. If the clipboard does not
contain an image, paste the image again using the website's copy command.

### Optional right-click workflow

The paste workflow does not require extra page permissions. If you prefer a
right-click shortcut:

1. Open the extension's **Options** page.
2. Find **Optional right-click convenience**.
3. Read the explanation of the additional Firefox permissions.
4. Turn on **Enable “Describe this image” in image context menus**.
5. Review Firefox's request for `menus`, `activeTab`, and `scripting`, then select
   **Allow** if you accept the temporary access.
6. In a Firefox tab, right-click the image you want to describe.
7. Select **Describe this image**.
8. The sidebar opens with a local crop of that selected image. Add context if you
   want, then select **Describe image**.

The right-click action uses only the selected image and tab. It does not send the
page URL, surrounding text, cookies, or other images. Turn the option off in
**Options** to remove the menu and release the optional permissions where Firefox
permits.

## Data and permissions

- The image is sent to the configured provider only after you select **Describe
  image**.
- The pasted or captured image, manual context, and generated description stay in
  extension memory and are discarded when the sidebar is reloaded or closed.
- Provider settings, including a user-supplied API key, are stored in Firefox's
  extension storage so you do not have to re-enter them each time.
- The extension does not request persistent clipboard-read or clipboard-write
  permissions. Clipboard access occurs only through your paste or copy gesture.
- Provider access is limited to the origin you explicitly save. The optional
  right-click feature is disabled unless you enable it and grant its additional
  permissions.

## Troubleshooting

- **Describe image is disabled:** save a provider, return to the sidebar, and paste
  an image. The action is disabled until both are available.
- **Firefox says provider access was not granted:** open Options, save the provider
  again, and allow the exact origin shown by Firefox.
- **The provider URL is rejected:** use HTTPS, except for the three loopback HTTP
  addresses listed above.
- **The sidebar says it could not create a description:** check that the provider
  is running, the model identifier is correct, and the authentication mode matches
  the service. Then try **Describe image** again.
- **Copy fails:** Firefox or another extension may be blocking clipboard writes.
  Select the description text and use Firefox's normal Copy command instead.
- **The temporary extension disappeared:** temporary extensions last only until
  Firefox restarts. Load it again from `about:debugging`.
- **A permanent install is blocked as unverified:** use a Mozilla-signed `.xpi` in
  normal Firefox, or use the separate Developer Edition/Nightly testing profile
  described above.

## Developer information

All development work is documented in [AGENTS.md](AGENTS.md). This includes source
checkout setup, npm commands, architecture, TDD expectations, permission rules,
formatting, packaging, and contribution guardrails.
