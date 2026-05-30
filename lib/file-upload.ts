export function fileNames(files: FileList | null) {
  return Array.from(files ?? []).map((file) => file.name);
}

export async function uploadFile(file: File, options: { bucket: "public-assets" | "private-verifications"; folder: string }) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("bucket", options.bucket);
  formData.append("folder", options.folder);

  const response = await fetch("/api/upload", {
    method: "POST",
    body: formData
  });

  if (!response.ok) {
    return null;
  }

  const parsed = (await response.json()) as { ok: boolean; data?: { url: string; path: string } };
  return parsed.ok ? parsed.data ?? null : null;
}

export async function uploadOrPreviewImage(file: File, folder: string, onLoad: (value: string) => void) {
  const uploaded = await uploadFile(file, { bucket: "public-assets", folder });
  if (uploaded?.url) {
    onLoad(uploaded.url);
    return;
  }
  readImageFile(file, onLoad);
}

export async function uploadCredentialFiles(files: FileList | null, folder: string) {
  const result: string[] = [];
  for (const file of Array.from(files ?? [])) {
    const uploaded = await uploadFile(file, { bucket: "private-verifications", folder });
    result.push(uploaded?.path || file.name);
  }
  return result;
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
