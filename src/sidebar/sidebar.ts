export {};

function requiredElement<T extends Element>(selector: string): T {
  const element = document.querySelector<T>(selector);
  if (!element) {
    throw new Error(`Image description sidebar markup is missing ${selector}.`);
  }
  return element;
}

const pasteTarget = requiredElement<HTMLDivElement>("#paste-target");
const previewSection = requiredElement<HTMLElement>("#preview-section");
const preview = requiredElement<HTMLImageElement>("#preview");
const removeImageButton = requiredElement<HTMLButtonElement>("#remove-image");
const status = requiredElement<HTMLParagraphElement>("#status");
const description = requiredElement<HTMLDivElement>("#description");
const copyDescriptionButton = requiredElement<HTMLButtonElement>(
  "#copy-description",
);

let previewUrl: string | undefined;

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

function showImage(image: File): void {
  revokePreviewUrl();
  previewUrl = URL.createObjectURL(image);
  preview.src = previewUrl;
  previewSection.hidden = false;

  description.hidden = true;
  copyDescriptionButton.hidden = true;
  status.textContent =
    "Image ready. LLM description processing will be added in a later story.";
}

function reset(): void {
  revokePreviewUrl();
  preview.removeAttribute("src");
  previewSection.hidden = true;
  description.hidden = true;
  description.textContent = "";
  copyDescriptionButton.hidden = true;
  status.textContent = "No image selected.";
  pasteTarget.focus();
}

function revokePreviewUrl(): void {
  if (previewUrl) {
    URL.revokeObjectURL(previewUrl);
    previewUrl = undefined;
  }
}
