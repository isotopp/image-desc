"use strict";

const pasteTarget = document.querySelector("#paste-target");
const previewSection = document.querySelector("#preview-section");
const preview = document.querySelector("#preview");
const removeImageButton = document.querySelector("#remove-image");
const status = document.querySelector("#status");
const description = document.querySelector("#description");
const copyDescriptionButton = document.querySelector("#copy-description");

let previewUrl;

pasteTarget.addEventListener("paste", (event) => {
  const imageItem = [...event.clipboardData.items].find((item) =>
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
  await navigator.clipboard.writeText(description.textContent);
  status.textContent = "Description copied to the clipboard.";
});

function showImage(image) {
  revokePreviewUrl();
  previewUrl = URL.createObjectURL(image);
  preview.src = previewUrl;
  previewSection.hidden = false;

  description.hidden = true;
  copyDescriptionButton.hidden = true;
  status.textContent =
    "Image ready. LLM description processing will be added in a later story.";
}

function reset() {
  revokePreviewUrl();
  preview.removeAttribute("src");
  previewSection.hidden = true;
  description.hidden = true;
  description.textContent = "";
  copyDescriptionButton.hidden = true;
  status.textContent = "No image selected.";
  pasteTarget.focus();
}

function revokePreviewUrl() {
  if (previewUrl) {
    URL.revokeObjectURL(previewUrl);
    previewUrl = undefined;
  }
}
