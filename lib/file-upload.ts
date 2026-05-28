export function fileNames(files: FileList | null) {
  return Array.from(files ?? []).map((file) => file.name);
}

export function readImageFile(file: File, onLoad: (value: string) => void) {
  if (!file.type.startsWith("image/")) return;
  const reader = new FileReader();
  reader.onload = () => {
    if (typeof reader.result === "string") {
      onLoad(reader.result);
    }
  };
  reader.readAsDataURL(file);
}

export function isImageValue(value?: string) {
  return Boolean(value && (/^data:image\//.test(value) || /^https?:\/\//.test(value)));
}
