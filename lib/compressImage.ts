/**
 * Client-side image compression for faster uploads.
 * Resizes to max 1600px on the longest side and compresses to JPEG (~0.8 quality).
 * PDFs and unsupported formats (e.g. HEIC in some browsers) are returned unchanged.
 */

const MAX_DIMENSION = 1600;
const JPEG_QUALITY = 0.82;

function isCompressibleImage(file: File): boolean {
  if (file.type === "application/pdf") return false;
  const ext = (file.name.split(".").pop() || "").toLowerCase();
  if (ext === "heic") return false; // Canvas often can't decode HEIC
  return file.type.startsWith("image/") || ["jpg", "jpeg", "png", "gif", "webp"].includes(ext);
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not load image"));
    };
    img.src = url;
  });
}

function scaleDimensions(width: number, height: number): { width: number; height: number } {
  if (width <= MAX_DIMENSION && height <= MAX_DIMENSION) {
    return { width, height };
  }
  const scale = MAX_DIMENSION / Math.max(width, height);
  return {
    width: Math.round(width * scale),
    height: Math.round(height * scale),
  };
}

/**
 * Compress an image file for upload. Returns a new File (JPEG) or the original if not compressible.
 * Runs in the browser (uses Canvas).
 */
export async function compressImageForUpload(file: File): Promise<File> {
  if (typeof document === "undefined" || typeof window === "undefined") {
    return file;
  }
  if (!isCompressibleImage(file)) {
    return file;
  }
  if (file.size <= 300 * 1024) {
    return file;
  }

  try {
    const img = await loadImage(file);
    const { width, height } = scaleDimensions(img.naturalWidth, img.naturalHeight);

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;

    ctx.drawImage(img, 0, 0, width, height);

    const baseName = file.name.replace(/\.[^/.]+$/, "") || "document";
    const outputName = `${baseName}.jpg`;

    return new Promise((resolve) => {
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            resolve(file);
            return;
          }
          resolve(new File([blob], outputName, { type: "image/jpeg" }));
        },
        "image/jpeg",
        JPEG_QUALITY
      );
    });
  } catch {
    return file;
  }
}
