import type { DescriptionProvider } from "../provider/responses";

type SidebarState = {
  provider?: DescriptionProvider;
  image?: File;
  previewUrl?: string;
  active: boolean;
};

let state: SidebarState | undefined;
let updateAvailability: () => void = () => undefined;

export function initializeSidebar(provider?: DescriptionProvider): void {
  if (state) {
    state.provider = provider;
    updateAvailability();
    return;
  }

  const pasteTarget = requiredElement<HTMLDivElement>("#paste-target");
  const previewSection = requiredElement<HTMLElement>("#preview-section");
  const preview = requiredElement<HTMLImageElement>("#preview");
  const removeImageButton = requiredElement<HTMLButtonElement>("#remove-image");
  const status = requiredElement<HTMLParagraphElement>("#status");
  const description = requiredElement<HTMLDivElement>("#description");
  const copyDescriptionButton =
    requiredElement<HTMLButtonElement>("#copy-description");
  const describeButton = document.querySelector<HTMLButtonElement>("#describe");
  const context =
    document.querySelector<HTMLTextAreaElement>("#manual-context");

  state = { provider, active: false };

  pasteTarget.addEventListener("paste", (event: ClipboardEvent) => {
    const clipboardData = event.clipboardData;
    if (!clipboardData) {
      status.textContent = "Firefox did not provide clipboard data.";
      return;
    }

    const imageItem = [...clipboardData.items].find((item) =>
      item.type.startsWith("image/"),
    );
    event.preventDefault();
    pasteTarget.textContent = "Paste an image here";

    if (!imageItem) {
      status.textContent = "The clipboard does not contain an image.";
      return;
    }

    const image = imageItem.getAsFile();
    if (!image) {
      status.textContent = "Firefox could not read the pasted image.";
      return;
    }

    showImage(image);
  });

  pasteTarget.addEventListener("input", () => {
    pasteTarget.textContent = "Paste an image here";
  });

  removeImageButton.addEventListener("click", reset);

  copyDescriptionButton.addEventListener("click", async () => {
    await navigator.clipboard.writeText(description.textContent ?? "");
    status.textContent = "Description copied to the clipboard.";
  });

  describeButton?.addEventListener("click", () => {
    void describeImage();
  });

  function showImage(image: File): void {
    revokePreviewUrl();
    state!.image = image;
    state!.previewUrl = URL.createObjectURL(image);
    preview.src = state!.previewUrl;
    previewSection.hidden = false;
    description.hidden = true;
    copyDescriptionButton.hidden = true;
    status.textContent = "Image ready.";
    updateDescribeAvailability();
  }

  function reset(): void {
    revokePreviewUrl();
    state!.image = undefined;
    preview.removeAttribute("src");
    previewSection.hidden = true;
    description.hidden = true;
    description.textContent = "";
    copyDescriptionButton.hidden = true;
    status.textContent = "No image selected.";
    if (context) {
      context.value = "";
    }
    pasteTarget.focus();
    updateDescribeAvailability();
  }

  async function describeImage(): Promise<void> {
    if (!state?.provider || !state.image || state.active) {
      return;
    }
    state.active = true;
    describeButton!.disabled = true;
    status.textContent = "Creating description…";
    description.hidden = true;
    copyDescriptionButton.hidden = true;

    try {
      const result = await state.provider.describe({
        image: state.image,
        context: context?.value,
        signal: new AbortController().signal,
      });
      description.textContent = result;
      description.hidden = false;
      copyDescriptionButton.hidden = false;
      status.textContent = "Description ready.";
    } catch {
      status.textContent = "Could not create a description.";
    } finally {
      state.active = false;
      updateDescribeAvailability();
    }
  }

  function revokePreviewUrl(): void {
    if (state?.previewUrl) {
      URL.revokeObjectURL(state.previewUrl);
      state.previewUrl = undefined;
    }
  }

  function updateDescribeAvailability(): void {
    if (describeButton) {
      describeButton.disabled =
        !state?.provider || !state.image || state.active;
    }
  }

  updateAvailability = updateDescribeAvailability;
  updateDescribeAvailability();
}

function requiredElement<T extends Element>(selector: string): T {
  const element = document.querySelector<T>(selector);
  if (!element) {
    throw new Error(`Image description sidebar markup is missing ${selector}.`);
  }
  return element;
}

if (
  typeof document !== "undefined" &&
  document.querySelector("#paste-target")
) {
  initializeSidebar();
}
